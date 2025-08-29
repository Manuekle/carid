// app/api/cars/verify-qr/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidQRToken, extractCarIdFragment } from '@/lib/qr-generator';

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

    // Validar formato del token QR
    if (!isValidQRToken(qrCode)) {
      return NextResponse.json({ error: 'Formato de código QR inválido' }, { status: 400 });
    }

    try {
      // Buscar el vehículo directamente por el token QR
      let car = await prisma.car.findUnique({
        where: { qrCode },
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
                  id: true,
                  name: true,
                },
              },
              usedParts: {
                include: {
                  part: true,
                },
              },
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

      // Si no se encuentra por token exacto, intentar buscar por fragmento de ID
      if (!car) {
        const carIdFragment = extractCarIdFragment(qrCode);
        if (carIdFragment) {
          car = await prisma.car.findFirst({
            where: {
              id: {
                contains: carIdFragment,
              },
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
                      id: true,
                      name: true,
                    },
                  },
                  usedParts: {
                    include: {
                      part: true,
                    },
                  },
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
        }
      }

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
          qrCode: car.qrCode, // Incluir el token para referencia
        },
      });
    } catch (parseError) {
      console.error('Error parsing QR code:', parseError);
      return NextResponse.json({ error: 'Error al procesar código QR' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
