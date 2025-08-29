// app/api/vehicles/[id]/route.ts
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

    return NextResponse.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if the vehicle exists and belongs to the user
    const existingCar = await prisma.car.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!existingCar) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Check permissions (only owner can update their own vehicles)
    if (session.user.role === 'OWNER' && existingCar.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Validate and parse request body
    const body = await request.json();
    const { brand, model, year, color, licensePlate, vin } = body;

    // Basic validation
    if (!brand || !model || !year || !color || !licensePlate || !vin) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Update the vehicle
    const updatedCar = await prisma.car.update({
      where: { id },
      data: {
        brand,
        model,
        year: parseInt(year),
        color,
        licensePlate,
        vin,
      },
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
            uploadedAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    
    // Handle Prisma validation errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const prismaError = error as { meta?: { target?: string[] } };
      const field = prismaError.meta?.target?.[0];
      const message = field 
        ? `Ya existe un vehículo con este ${field === 'licensePlate' ? 'número de placa' : 'VIN'}`
        : 'El vehículo ya existe';
      
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar el vehículo' },
      { status: 500 }
    );
  }
}
