import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCarByQR } from '@/lib/database';
import { parseCarQR } from '@/lib/qr-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MECHANIC') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { qrCode } = await request.json();

    if (!qrCode) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 });
    }

    // Parse and validate QR code format
    try {
      const qrData = parseCarQR(qrCode);

      // Find car by QR code
      const car = await getCarByQR(qrData.carId);

      if (!car) {
        return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
      }

      // Return car information (without sensitive data)
      return NextResponse.json({
        car: {
          id: car.id,
          vin: car.vin,
          brand: car.brand,
          model: car.model,
          year: car.year,
          color: car.color,
          licensePlate: car.licensePlate,
          owner: car.owner,
        },
      });
    } catch (parseError) {
      return NextResponse.json({ error: 'Formato de código QR inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
