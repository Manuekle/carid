import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const mechanics = await prisma.user.findMany({
      where: {
        role: 'MECHANIC',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        managedMaintenances: {
          select: {
            id: true,
            status: true,
            laborCost: true,
            totalCost: true,
            startDate: true,
            completedDate: true,
            car: {
              select: {
                brand: true,
                model: true,
                licensePlate: true,
                owner: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            invoice: {
              select: {
                mechanicShare: true,
                totalCost: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estadísticas para cada mecánico
    const mechanicsWithStats = mechanics.map(mechanic => {
      const maintenances = mechanic.managedMaintenances;

      // Estadísticas básicas
      const totalMaintenances = maintenances.length;
      const completedMaintenances = maintenances.filter(m => m.status === 'COMPLETED').length;
      const inProgressMaintenances = maintenances.filter(m => m.status === 'IN_PROGRESS').length;

      // Cálculos financieros
      const totalRevenue = maintenances
        .filter(m => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.invoice?.totalCost || m.totalCost || 0), 0);

      const totalEarnings = maintenances
        .filter(m => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.invoice?.mechanicShare || m.laborCost || 0), 0);

      const averageJobValue = completedMaintenances > 0 ? totalRevenue / completedMaintenances : 0;

      // Rendimiento temporal
      const completedMaintenancesWithTime = maintenances.filter(
        m => m.status === 'COMPLETED' && m.startDate && m.completedDate
      );

      const averageCompletionTime =
        completedMaintenancesWithTime.length > 0
          ? completedMaintenancesWithTime.reduce((sum, m) => {
              const startTime = new Date(m.startDate).getTime();
              const endTime = new Date(m.completedDate!).getTime();
              return sum + (endTime - startTime);
            }, 0) / completedMaintenancesWithTime.length
          : 0;

      // Estadísticas de este mes
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const thisMonthMaintenances = maintenances.filter(m => new Date(m.startDate) >= currentMonth);

      const thisMonthCompleted = thisMonthMaintenances.filter(m => m.status === 'COMPLETED').length;

      const thisMonthEarnings = thisMonthMaintenances
        .filter(m => m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.invoice?.mechanicShare || m.laborCost || 0), 0);

      // Último trabajo realizado
      const lastCompletedJob = maintenances
        .filter(m => m.status === 'COMPLETED')
        .sort(
          (a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime()
        )[0];

      return {
        ...mechanic,
        statistics: {
          totalMaintenances,
          completedMaintenances,
          inProgressMaintenances,
          completionRate:
            totalMaintenances > 0 ? (completedMaintenances / totalMaintenances) * 100 : 0,
          totalRevenue,
          totalEarnings,
          averageJobValue,
          averageCompletionTime: averageCompletionTime / (1000 * 60 * 60 * 24), // en días
          thisMonth: {
            completedJobs: thisMonthCompleted,
            earnings: thisMonthEarnings,
            totalJobs: thisMonthMaintenances.length,
          },
          lastJob: lastCompletedJob
            ? {
                date: lastCompletedJob.completedDate,
                car: `${lastCompletedJob.car.brand} ${lastCompletedJob.car.model}`,
                licensePlate: lastCompletedJob.car.licensePlate,
                owner: lastCompletedJob.car.owner.name,
                earnings: lastCompletedJob.invoice?.mechanicShare || lastCompletedJob.laborCost,
              }
            : null,
        },
        // No incluir los mantenimientos completos en la respuesta para reducir el tamaño
        managedMaintenances: undefined,
      };
    });

    return NextResponse.json({
      mechanics: mechanicsWithStats,
      summary: {
        totalMechanics: mechanicsWithStats.length,
        approvedMechanics: mechanicsWithStats.filter(m => m.isApproved).length,
        pendingApproval: mechanicsWithStats.filter(m => !m.isApproved).length,
        activeMechanics: mechanicsWithStats.filter(m => m.statistics.thisMonth.totalJobs > 0)
          .length,
        totalRevenue: mechanicsWithStats.reduce((sum, m) => sum + m.statistics.totalRevenue, 0),
        totalEarnings: mechanicsWithStats.reduce((sum, m) => sum + m.statistics.totalEarnings, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching mechanics data:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
