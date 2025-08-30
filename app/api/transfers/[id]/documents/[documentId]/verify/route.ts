import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  id: string;
  documentId: string;
}

export async function PATCH(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id: transferId, documentId } = await params;
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { isVerified } = await request.json();

    // Verify the transfer exists and is accessible
    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id: transferId },
      select: { id: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Traspaso no encontrado' }, { status: 404 });
    }

    // Update the document verification status
    const updatedDocument = await prisma.transferDocument.update({
      where: {
        id: documentId,
        transferId: transferId,
      },
      data: {
        isVerified,
        verifiedBy: isVerified ? session.user.id : null,
      },
      select: {
        id: true,
        isVerified: true,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document verification:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la verificación del documento' },
      { status: 500 }
    );
  }
}
