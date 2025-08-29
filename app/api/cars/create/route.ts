// app/api/cars/create/route.ts
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

    // Create car with initial QR code
    const car = await prisma.car.create({
      data: {
        vin,
        brand,
        model,
        year: parseInt(year),
        color,
        licensePlate,
        owner: { connect: { id: session.user.id } },
        qrCode: `temp_${Date.now()}`, // Temporary value
      },
    });

    // Generate QR token using the actual car ID
    const qrToken = generateCarQR(car.id, car.vin);

    // Update car with the final QR token
    const updatedCar = await prisma.car.update({
      where: { id: car.id },
      data: {
        qrCode: qrToken,
      },
    });

    return NextResponse.json({
      message: 'Vehículo registrado exitosamente',
      car: {
        id: updatedCar.id,
        vin: updatedCar.vin,
        brand: updatedCar.brand,
        model: updatedCar.model,
        year: updatedCar.year,
        color: updatedCar.color,
        licensePlate: updatedCar.licensePlate,
        qrCode: updatedCar.qrCode, // Esto ahora es el token
      },
    });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
