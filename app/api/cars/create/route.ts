import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCarQR } from '@/lib/qr-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { vin, brand, model, year, color, licensePlate } = await request.json();

    // Validate required fields
    if (!vin || !brand || !model || !year || !color || !licensePlate) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Check if VIN or license plate already exists
    const existingCar = await prisma.car.findFirst({
      where: {
        OR: [{ vin }, { licensePlate }],
      },
    });

    if (existingCar) {
      return NextResponse.json(
        { error: 'Ya existe un vehículo con este VIN o placa' },
        { status: 400 }
      );
    }

    // Create car
    const car = await prisma.car.create({
      data: {
        vin,
        brand,
        model,
        year,
        color,
        licensePlate,
        ownerId: session.user.id,
        qrCode: `CAR_${vin}_${Date.now()}`, // Temporary QR code
      },
    });

    // Generate QR code
    const qrCodeUrl = await generateCarQR(car.id, car.vin);

    // Update car with proper QR code
    await prisma.car.update({
      where: { id: car.id },
      data: {
        qrCode: JSON.stringify({
          type: 'CAR_ID',
          carId: car.id,
          vin: car.vin,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      message: 'Vehículo registrado exitosamente',
      car: {
        id: car.id,
        vin: car.vin,
        brand: car.brand,
        model: car.model,
        year: car.year,
        color: car.color,
        licensePlate: car.licensePlate,
      },
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
