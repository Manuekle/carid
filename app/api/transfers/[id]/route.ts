import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let whereClause: any = { id };

    // Solo admin puede ver todos los traspasos
    if (session.user.role !== 'ADMIN') {
      whereClause = {
        id,
        OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }],
      };
    }

    const transfer = await prisma.vehicleTransfer.findFirst({
      where: whereClause,
      include: {
        car: {
          include: {
            documents: {
              where: {
                docType: {
                  in: ['SOAT', 'TECNOMECANICO', 'TARJETA_PROPIEDAD'],
                },
              },
              orderBy: { uploadedAt: 'desc' },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        sellerProfile: true,
        buyerProfile: true,
        documents: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
              },
            },
            verifier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        approvedByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Traspaso no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action, adminNotes } = await request.json();

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id },
      include: {
        car: true,
        seller: true,
        buyer: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Traspaso no encontrado' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'buyer_accept':
        // Solo el comprador puede aceptar
        if (session.user.id !== transfer.buyerId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
        if (transfer.status !== 'PENDING_BUYER_ACCEPTANCE') {
          return NextResponse.json(
            {
              error: 'El traspaso no está en estado de aceptación del comprador',
            },
            { status: 400 }
          );
        }
        updateData = {
          status: 'PENDING_ADMIN_APPROVAL',
        };
        break;

      case 'admin_approve':
        // Solo admin puede aprobar
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
        if (transfer.status !== 'PENDING_ADMIN_APPROVAL') {
          return NextResponse.json(
            {
              error: 'El traspaso no está listo para aprobación administrativa',
            },
            { status: 400 }
          );
        }

        // Cambiar ownership del vehículo
        await prisma.car.update({
          where: { id: transfer.carId },
          data: { ownerId: transfer.buyerId },
        });

        updateData = {
          status: 'COMPLETED',
          completionDate: new Date(),
          approvedByAdminId: session.user.id,
          adminNotes,
        };
        break;

      case 'admin_reject':
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
        updateData = {
          status: 'REJECTED',
          adminNotes,
        };
        break;

      case 'cancel':
        // Solo el vendedor puede cancelar
        if (session.user.id !== transfer.sellerId && session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }
        updateData = {
          status: 'CANCELLED',
          adminNotes: adminNotes || 'Cancelado por el vendedor',
        };
        break;

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const updatedTransfer = await prisma.vehicleTransfer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Traspaso actualizado exitosamente',
      transfer: updatedTransfer,
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
