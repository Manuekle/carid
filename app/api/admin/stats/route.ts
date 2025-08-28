import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const completedMaintenances = await prisma.maintenanceLog.findMany({
      where: {
        completedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        invoice: true,
      },
    });

    const totalRevenue = completedMaintenances.reduce(
      (sum, maintenance) => sum + (maintenance.invoice?.totalCost || 0),
      0
    );

    const adminShare = completedMaintenances.reduce(
      (sum, maintenance) => sum + (maintenance.invoice?.adminShare || 0),
      0
    );

    const stats = {
      completedMaintenances: completedMaintenances.length,
      totalRevenue,
      adminShare,
      mechanicShare: totalRevenue - adminShare,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
