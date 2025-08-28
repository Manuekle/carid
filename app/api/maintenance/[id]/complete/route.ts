import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MECHANIC') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const maintenance = await prisma.maintenanceLog.findUnique({
      where: { id },
    });

    if (!maintenance) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 });
    }

    if (maintenance.mechanicId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para completar este mantenimiento' },
        { status: 403 }
      );
    }

    if (maintenance.status === 'COMPLETED') {
      return NextResponse.json({ error: 'El mantenimiento ya está completado' }, { status: 400 });
    }

    const updatedMaintenance = await prisma.maintenanceLog.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Mantenimiento completado exitosamente',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    console.error('Error completing maintenance:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
