import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { generateCarQR } from '@/lib/qr-generator';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vin, licensePlate, brand, model, year, color } = await request.json();

    // Validate input
    if (!vin || !licensePlate || !brand || !model || !year || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is an owner
    if (session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only vehicle owners can add cars' }, { status: 403 });
    }

    // Check if VIN already exists
    const existingCar = await prisma.car.findUnique({
      where: { vin },
    });

    if (existingCar) {
      return NextResponse.json({ error: 'A car with this VIN already exists' }, { status: 400 });
    }

    // Generate QR code with the car's ID and VIN
    const qrCodeDataURL = await generateCarQR(crypto.randomUUID(), vin);

    // Create the car with the QR code
    const car = await prisma.car.create({
      data: {
        vin,
        licensePlate,
        brand,
        model,
        year: parseInt(year, 10),
        color,
        qrCode: qrCodeDataURL,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const updatedCar = car;

    return NextResponse.json(updatedCar, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
