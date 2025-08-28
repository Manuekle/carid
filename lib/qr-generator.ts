import QRCode from 'qrcode';
import { prisma } from './prisma';

export async function generateCarQR(carId: string, vin: string): Promise<string> {
  const qrData = {
    type: 'CAR_ID',
    carId,
    vin,
    timestamp: new Date().toISOString(),
  };

  const qrString = JSON.stringify(qrData);

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function parseCarQR(qrString: string) {
  try {
    // Asegurarnos de que sea JSON
    const qrData = JSON.parse(qrString);

    if (qrData.type !== 'CAR_ID') {
      throw new Error('Invalid QR code type');
    }

    return {
      carId: qrData.carId,
      vin: qrData.vin,
      timestamp: qrData.timestamp,
    };
  } catch (error) {
    console.error('Error parsing QR code:', error);

    // Si no es JSON, avisamos en vez de romper
    if (
      typeof qrString === 'string' &&
      (qrString.startsWith('http://') || qrString.startsWith('https://'))
    ) {
      throw new Error('QR code contains a URL, not a CAR_ID');
    }

    throw new Error('Invalid QR code format');
  }
}

export async function generateQRCode(carId: string): Promise<string> {
  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { vin: true },
    });

    if (!car) {
      throw new Error('Car not found');
    }

    return await generateCarQR(carId, car.vin);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
