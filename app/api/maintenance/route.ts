import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MECHANIC') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { carId, description, laborCost, estimatedTime, parts } = await request.json();

    if (!carId || !description || !laborCost) {
      return NextResponse.json(
        { error: 'Campos requeridos: carId, description, laborCost' },
        { status: 400 }
      );
    }

    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Calculate parts cost and verify stock
    let partsCost = 0;
    const partsToUpdate: Array<{ id: string; newStock: number }> = [];

    if (parts && parts.length > 0) {
      for (const partData of parts) {
        const part = await prisma.part.findUnique({
          where: { id: partData.partId },
        });

        if (!part) {
          return NextResponse.json(
            { error: `Repuesto no encontrado: ${partData.partId}` },
            { status: 404 }
          );
        }

        if (part.stock < partData.quantity) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${part.name}. Disponible: ${part.stock}, Requerido: ${partData.quantity}`,
            },
            { status: 400 }
          );
        }

        partsCost += partData.unitPrice * partData.quantity;
        partsToUpdate.push({
          id: part.id,
          newStock: part.stock - partData.quantity,
        });
      }
    }

    const totalCost = partsCost + laborCost;
    const mechanicShare = totalCost * 0.6;
    const adminShare = totalCost * 0.4;

    // Create maintenance log with transaction
    const result = await prisma.$transaction(async tx => {
      // Create maintenance log
      const maintenance = await tx.maintenanceLog.create({
        data: {
          carId,
          mechanicId: session.user.id,
          description,
          laborCost,
          totalCost,
          estimatedTime,
          status: 'IN_PROGRESS',
        },
      });

      // Create used parts records and update stock
      if (parts && parts.length > 0) {
        for (const partData of parts) {
          await tx.usedPart.create({
            data: {
              maintenanceLogId: maintenance.id,
              partId: partData.partId,
              quantity: partData.quantity,
              unitPrice: partData.unitPrice,
            },
          });
        }

        // Update parts stock
        for (const partUpdate of partsToUpdate) {
          await tx.part.update({
            where: { id: partUpdate.id },
            data: { stock: partUpdate.newStock },
          });
        }
      }

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          maintenanceLogId: maintenance.id,
          subtotal: partsCost,
          laborCost,
          totalCost,
          mechanicShare,
          adminShare,
        },
      });

      return { maintenance, invoice };
    });

    return NextResponse.json({
      message: 'Mantenimiento creado exitosamente',
      maintenance: result.maintenance,
      invoice: result.invoice,
    });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
