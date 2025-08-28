import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vehicle = await prisma.car.findUnique({
      where: {
        id: params.id,
        ownerId: session.user.id, // Ensure the user owns this vehicle
      },
      include: {
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
                part: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
