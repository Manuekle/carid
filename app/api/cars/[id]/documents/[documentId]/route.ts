// app/api/cars/[id]/documents/[documentId]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

interface DocumentRouteParams {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: DocumentRouteParams) {
  try {
    const { id: carId, documentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify car ownership and document exists
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        ownerId: session.user.id,
      },
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        carId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    try {
      // Delete file from blob storage
      await del(document.fileUrl);
    } catch (deleteError) {
      console.error('Error deleting file from blob:', deleteError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
