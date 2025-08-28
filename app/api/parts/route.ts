import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const parts = await prisma.part.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ parts });
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    let photoUrl: string | null = null;

    // Upload photo if provided
    if (photo && photo.size > 0) {
      try {
        const blob = await put(`parts/${Date.now()}-${photo.name}`, photo, {
          access: 'public',
        });
        photoUrl = blob.url;
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        // Continue without photo if upload fails
      }
    }

    const part = await prisma.part.create({
      data: {
        name,
        description: description || null,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        photoUrl,
      },
    });

    return NextResponse.json({
      message: 'Repuesto agregado exitosamente',
      part,
    });
  } catch (error) {
    console.error('Error creating part:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
