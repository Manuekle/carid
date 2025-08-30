import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';
import { TransferStatus } from '@prisma/client';

// Helper type for the route context
type RouteContext = {
  params: Promise<{ id: string }>;
};

// Helper type for the update data
type TransferUpdateData = {
  status: TransferStatus;
  adminNotes?: string | null;
  updatedAt: Date;
  completionDate?: Date;
  approvedByAdminId?: string;
  rejectedAt?: Date;
  rejectedById?: string;
  cancelledAt?: Date;
  cancelledById?: string;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const { action, notes } = await request.json();

    // Validate action
    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Start a transaction
    const result = await prisma.$transaction(async tx => {
      // Get the transfer with related data
      const transfer = await tx.vehicleTransfer.findUnique({
        where: { id },
        include: {
          car: {
            select: {
              id: true,
              ownerId: true,
              brand: true,
              model: true,
              year: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          documents: {
            include: {
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!transfer) {
        throw new Error('Transfer not found');
      }

      // Validate status transition
      if (
        transfer.status === 'COMPLETED' ||
        transfer.status === 'CANCELLED' ||
        transfer.status === 'REJECTED'
      ) {
        throw new Error('No se puede modificar un traspaso finalizado');
      }

      const updateData: TransferUpdateData = {
        status: transfer.status, // Default to current status
        adminNotes: notes || null,
        updatedAt: new Date(),
      };

      switch (action) {
        case 'approve':
          updateData.status = 'COMPLETED';
          updateData.completionDate = new Date();
          updateData.approvedByAdminId = session.user.id;

          // Update car ownership
          await tx.car.update({
            where: { id: transfer.car.id },
            data: {
              ownerId: transfer.buyerId,
              updatedAt: new Date(),
            },
          });
          break;

        case 'reject':
          updateData.status = 'REJECTED';
          updateData.rejectedAt = new Date();
          updateData.rejectedById = session.user.id;
          break;

        case 'cancel':
          updateData.status = 'CANCELLED';
          updateData.cancelledAt = new Date();
          updateData.cancelledById = session.user.id;
          break;
      }

      // Update transfer status with proper typing for relations
      const updatedTransfer = (await tx.vehicleTransfer.update({
        where: { id },
        data: updateData,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          car: true,
          documents: true,
        },
      })) as any; // Type assertion to include the relations

      return { transfer: updatedTransfer };
    });

    // Send email notifications
    try {
      const { transfer: updatedTransfer } = result;
      if (updatedTransfer.status === 'COMPLETED') {
        // Notify both parties
        await Promise.all([
          sendEmail({
            to: updatedTransfer.seller.email,
            ...emailTemplates.transferApproved(updatedTransfer.seller.name, id),
          }),
          sendEmail({
            to: updatedTransfer.buyer.email,
            ...emailTemplates.transferApproved(updatedTransfer.buyer.name, id),
          }),
        ]);
      } else {
        // Notify about rejection/cancellation
        const recipient = updatedTransfer.seller;
        const template =
          updatedTransfer.status === 'REJECTED'
            ? emailTemplates.transferRejected(recipient.name, notes)
            : emailTemplates.transferUpdate(recipient.name, 'Cancelado', id);

        await sendEmail({
          to: recipient.email,
          ...template,
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({ transfer: result.transfer });
  } catch (error: any) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: error.message === 'Transfer not found' ? 404 : 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
    }

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id },
      include: {
        car: {
          include: {
            documents: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            verifier: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Traspaso no encontrado' }, { status: 404 });
    }

    // Only allow admin or involved parties to view
    if (
      session.user.role !== 'ADMIN' &&
      session.user.id !== transfer.sellerId &&
      session.user.id !== transfer.buyerId
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
