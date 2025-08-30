import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let whereClause;

    if (session.user.role === 'ADMIN') {
      whereClause = {};
    } else {
      whereClause = {
        OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }],
      };
    }

    const transfers = await prisma.vehicleTransfer.findMany({
      where: whereClause,
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sellerProfile: {
          select: {
            documentType: true,
            documentNumber: true,
            city: true,
            department: true,
          },
        },
        buyerProfile: {
          select: {
            documentType: true,
            documentNumber: true,
            city: true,
            department: true,
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            isVerified: true,
            uploadedAt: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
