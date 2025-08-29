import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to get date range based on period
function getDateRange(period: 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'week':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    default:
      return { start, end: now };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'day' | 'week' | 'month' | 'year') || 'day';

    const { start, end } = getDateRange(period);

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get completed maintenances for today
    const [todayMaintenances, allMaintenances, activeUsers, vehicles, parts] = await Promise.all([
      // Today's completed maintenances
      prisma.maintenanceLog.findMany({
        where: {
          completedDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          invoice: true,
        },
      }),

      // All maintenances for the period
      prisma.maintenanceLog.findMany({
        where: {
          completedDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          invoice: true,
        },
      }),

      // Active users (created within last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total registered vehicles
      prisma.car.count(),

      // Parts inventory stats
      prisma.part.findMany({
        select: {
          id: true,
          stock: true,
        },
      }),
    ]);

    // Define maintenance type for better type safety
    type MaintenanceWithInvoice = {
      completedDate: Date | null;
      invoice: {
        adminShare: number;
        totalCost: number;
      } | null;
    };

    // Calculate today's revenue (admin share)
    const todayRevenue = (todayMaintenances as MaintenanceWithInvoice[]).reduce(
      (sum, maintenance) => sum + (maintenance.invoice?.adminShare || 0),
      0
    );

    // Calculate total revenue for the period (not used in current implementation)
    // const totalRevenue = (allMaintenances as MaintenanceWithInvoice[]).reduce(
    //   (sum, maintenance) => sum + (maintenance.invoice?.totalCost || 0),
    //   0
    // );

    // Calculate admin's total share for the period
    const adminShare = (allMaintenances as MaintenanceWithInvoice[]).reduce(
      (sum, maintenance) => sum + (maintenance.invoice?.adminShare || 0),
      0
    );

    // Get low stock parts (less than 10 in stock)
    const lowStockParts = parts.filter((part: { stock: number }) => part.stock < 10).length;

    const stats = {
      // Dashboard KPIs
      dailyRevenue: todayRevenue,
      totalRevenue: adminShare, // Only admin's share
      todayRepairs: todayMaintenances.length,
      activeUsers,
      registeredVehicles: vehicles,
      completedRepairs: allMaintenances.length,
      lowStockParts,

      // Additional data for charts
      revenueData: {
        labels: Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('es-MX', { weekday: 'short' });
        }),
        values: Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);

          const dayMaintenances = (allMaintenances as MaintenanceWithInvoice[]).filter(
            m => m.completedDate && m.completedDate >= dayStart && m.completedDate <= dayEnd
          );

          return dayMaintenances.reduce((sum, m) => sum + (m.invoice?.adminShare || 0), 0);
        }),
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
