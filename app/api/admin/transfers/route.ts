import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const transfers = await prisma.vehicleTransfer.findMany({
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
            vin: true,
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
            isVerified: true,
          },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Pending first
        { createdAt: 'desc' },
      ],
    });

    // Calcular estadísticas
    const stats = {
      total: transfers.length,
      pending: transfers.filter(t =>
        ['PENDING_SELLER_DOCUMENTS', 'PENDING_BUYER_ACCEPTANCE', 'PENDING_ADMIN_APPROVAL'].includes(
          t.status
        )
      ).length,
      completed: transfers.filter(t => t.status === 'COMPLETED').length,
      cancelled: transfers.filter(t => ['CANCELLED', 'REJECTED'].includes(t.status)).length,
    };

    return NextResponse.json({
      transfers,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin transfers:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
