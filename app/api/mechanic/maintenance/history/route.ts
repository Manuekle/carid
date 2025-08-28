import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MECHANIC') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const maintenanceHistory = await prisma.maintenanceLog.findMany({
      where: { mechanicId: session.user.id },
      include: {
        car: {
          include: {
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
        usedParts: {
          include: {
            part: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ maintenanceHistory });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
