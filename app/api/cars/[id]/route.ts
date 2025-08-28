import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        maintenanceLogs: {
          include: {
            mechanic: {
              select: {
                name: true,
                email: true,
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
        },
        documents: {
          orderBy: {
            // Corregido: usar el nombre correcto del campo
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!car) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === 'OWNER' && car.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ car });
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
