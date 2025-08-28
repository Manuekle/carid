import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cars = await prisma.car.findMany({
      where: { ownerId: session.user.id },
      include: {
        maintenanceLogs: {
          include: {
            mechanic: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({ cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
