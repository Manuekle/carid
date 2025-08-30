import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Maintenance {
  id: string;
  status: string;
  startDate: Date | null;
  completedDate: Date | null;
  totalCost?: number | null;
  laborCost?: number | null;
  car: {
    owner: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  invoice?: {
    id: string;
    totalCost: number;
    mechanicShare: number;
  } | null;
  usedParts: Array<{
    part: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
}

interface ClientStat {
  name: string | null;
  email: string | null;
  phone: string | null;
  totalJobs: number;
  completedJobs: number;
  totalSpent: number;
}

interface PartUsage {
  [key: string]: {
    name: string;
    totalQuantity: number;
    totalValue: number;
    timesUsed: number;
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const mechanic = await prisma.user.findUnique({
      where: {
        id,
        role: 'MECHANIC',
      },
      include: {
        managedMaintenances: {
          include: {
            car: {
              include: {
                owner: true,
              },
            },
            invoice: true,
            usedParts: {
              include: {
                part: true,
              },
            },
          },
        },
      },
    });

    if (!mechanic) {
      return NextResponse.json({ error: 'Mecánico no encontrado' }, { status: 404 });
    }

    const maintenances: Maintenance[] = mechanic.managedMaintenances as unknown as Maintenance[];

    // Estadísticas básicas
    const totalMaintenances = maintenances.length;
    const completedMaintenances = maintenances.filter(
      (m: Maintenance) => m.status === 'COMPLETED'
    ).length;
    const inProgressMaintenances = maintenances.filter(
      (m: Maintenance) => m.status === 'IN_PROGRESS'
    ).length;
    const cancelledMaintenances = maintenances.filter(
      (m: Maintenance) => m.status === 'CANCELLED'
    ).length;

    // Estadísticas financieras
    const completedJobs = maintenances.filter((m: Maintenance) => m.status === 'COMPLETED');
    const totalRevenue = completedJobs.reduce(
      (sum: number, m: Maintenance) => sum + (m.invoice?.totalCost || m.totalCost || 0),
      0
    );
    const totalEarnings = completedJobs.reduce(
      (sum: number, m: Maintenance) => sum + (m.invoice?.mechanicShare || m.laborCost || 0),
      0
    );
    const averageJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
    const averageEarningsPerJob =
      completedJobs.length > 0 ? totalEarnings / completedJobs.length : 0;

    // Estadísticas temporales
    const completedMaintenancesWithTime = completedJobs.filter(m => m.startDate && m.completedDate);

    const averageCompletionTime =
      completedMaintenancesWithTime.length > 0
        ? completedMaintenancesWithTime.reduce((sum, m) => {
            const startTime = m.startDate ? new Date(m.startDate).getTime() : 0;
            const endTime = m.completedDate ? new Date(m.completedDate).getTime() : 0;
            return sum + (endTime - startTime);
          }, 0) / completedMaintenancesWithTime.length
        : 0;

    // Estadísticas por mes (últimos 6 meses)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthMaintenances = maintenances.filter((m: Maintenance) => {
        if (!m.startDate) return false;
        const startDate = new Date(m.startDate);
        return startDate >= date && startDate < nextMonth;
      });

      const monthCompleted = monthMaintenances.filter((m: Maintenance) => m.status === 'COMPLETED');
      const monthRevenue = monthCompleted.reduce(
        (sum: number, m: Maintenance) => sum + (m.invoice?.totalCost || m.totalCost || 0),
        0
      );
      const monthEarnings = monthCompleted.reduce(
        (sum: number, m: Maintenance) => sum + (m.invoice?.mechanicShare || m.laborCost || 0),
        0
      );

      monthlyStats.push({
        month: date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' }),
        totalJobs: monthMaintenances.length,
        completedJobs: monthCompleted.length,
        revenue: monthRevenue,
        earnings: monthEarnings,
      });
    }

    // Top clientes (propietarios con más trabajos)
    const clientStats: Record<string, ClientStat> = {};
    maintenances.forEach(m => {
      const ownerName = m.car?.owner?.name || 'Sin nombre';
      const ownerId = m.car?.owner?.id || 'unknown';

      if (!clientStats[ownerId]) {
        clientStats[ownerId] = {
          name: m.car?.owner?.name || 'Sin nombre',
          email: m.car?.owner?.email || null,
          phone: m.car?.owner?.phone || null,
          totalJobs: 0,
          completedJobs: 0,
          totalSpent: 0,
        };
      }

      clientStats[ownerId].totalJobs++;
      if (m.status === 'COMPLETED') {
        clientStats[ownerId].completedJobs++;
        const cost = m.invoice?.totalCost || m.totalCost || 0;
        clientStats[ownerId].totalSpent += Number(cost) || 0;
      }
    });

    const topClients = Object.values(clientStats)
      .sort((a, b) => b.totalJobs - a.totalJobs)
      .slice(0, 5);

    // Partes más utilizadas
    const partUsage: PartUsage = {};
    maintenances.forEach(m => {
      m.usedParts.forEach(up => {
        const partName = up.part.name;
        if (!partUsage[partName]) {
          partUsage[partName] = {
            name: up.part.name,
            totalQuantity: 0,
            totalValue: 0,
            timesUsed: 0,
          };
        }
        partUsage[partName].totalQuantity += up.quantity;
        partUsage[partName].totalValue += up.quantity * up.unitPrice;
        partUsage[partName].timesUsed++;
      });
    });

    const topParts = Object.values(partUsage)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Rendimiento reciente (últimas 4 semanas)
    const weeklyPerformance = [];
    for (let i = 3; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i * 7);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      const weekJobs = maintenances.filter((m: Maintenance) => {
        if (!m.startDate) return false;
        const startJobDate = new Date(m.startDate);
        return startJobDate >= startDate && startJobDate < endDate;
      });

      weeklyPerformance.push({
        week: `Semana ${4 - i}`,
        jobsStarted: weekJobs.length,
        jobsCompleted: weekJobs.filter((m: Maintenance) => m.status === 'COMPLETED').length,
        earnings: weekJobs
          .filter((m: Maintenance) => m.status === 'COMPLETED')
          .reduce(
            (sum: number, m: Maintenance) => sum + (m.invoice?.mechanicShare || m.laborCost || 0),
            0
          ),
      });
    }

    const response = {
      mechanic: {
        ...mechanic,
        managedMaintenances: undefined, // No incluir en respuesta para reducir tamaño
      },
      statistics: {
        totalMaintenances,
        completedMaintenances,
        inProgressMaintenances,
        cancelledMaintenances,
        completionRate:
          totalMaintenances > 0 ? (completedMaintenances / totalMaintenances) * 100 : 0,
        totalRevenue,
        totalEarnings,
        averageJobValue,
        averageEarningsPerJob,
        averageCompletionTime: averageCompletionTime / (1000 * 60 * 60 * 24), // en días
      },
      monthlyStats,
      topClients,
      topParts,
      weeklyPerformance,
      recentJobs: maintenances.slice(0, 10), // Últimos 10 trabajos
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching mechanic details:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
