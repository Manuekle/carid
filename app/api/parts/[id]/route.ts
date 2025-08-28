import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const stock = formData.get('stock') as string;
    const photo = formData.get('photo') as File | null;

    if (!name || !price || !stock) {
      return NextResponse.json({ error: 'Nombre, precio y stock son requeridos' }, { status: 400 });
    }

    // Get current part to check for existing photo
    const currentPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!currentPart) {
      return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 });
    }

    let photoUrl = currentPart.photoUrl;

    // Upload new photo if provided
    if (photo && photo.size > 0) {
      try {
        // Delete old photo if exists
        if (currentPart.photoUrl) {
          try {
            await del(currentPart.photoUrl);
          } catch (deleteError) {
            console.error('Error deleting old photo:', deleteError);
          }
        }

        // Upload new photo
        const blob = await put(`parts/${Date.now()}-${photo.name}`, photo, {
          access: 'public',
        });
        photoUrl = blob.url;
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        // Keep existing photo if upload fails
      }
    }

    const part = await prisma.part.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        photoUrl,
      },
    });

    return NextResponse.json({
      message: 'Repuesto actualizado exitosamente',
      part,
    });
  } catch (error) {
    console.error('Error updating part:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get part to check for photo
    const part = await prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 });
    }

    // Check if part is used in any maintenance logs
    const usedParts = await prisma.usedPart.findFirst({
      where: { partId: id },
    });

    if (usedParts) {
      return NextResponse.json(
        { error: 'No se puede eliminar un repuesto que ha sido usado en reparaciones' },
        { status: 400 }
      );
    }

    // Delete photo if exists
    if (part.photoUrl) {
      try {
        await del(part.photoUrl);
      } catch (deleteError) {
        console.error('Error deleting photo:', deleteError);
      }
    }

    // Delete part
    await prisma.part.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Repuesto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
