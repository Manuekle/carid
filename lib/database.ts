import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

// User utilities
export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      ownedCars: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function getPendingMechanics() {
  return await prisma.user.findMany({
    where: {
      role: UserRole.MECHANIC,
      isApproved: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Car utilities
export async function getCarByQR(qrCode: string) {
  return await prisma.car.findUnique({
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
}

export async function getCarsByOwner(ownerId: string) {
  return await prisma.car.findMany({
    where: { ownerId },
    include: {
      maintenanceLogs: {
        include: {
          mechanic: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3, // Last 3 maintenance records
      },
      documents: {
        orderBy: {
          uploadedAt: 'desc',
        },
      },
    },
  });
}

// Maintenance utilities
export async function getMaintenanceHistory(carId: string) {
  return await prisma.maintenanceLog.findMany({
    where: { carId },
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
      invoice: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getMechanicMaintenanceHistory(mechanicId: string) {
  return await prisma.maintenanceLog.findMany({
    where: { mechanicId },
    include: {
      car: {
        include: {
          owner: {
            select: {
              name: true,
            },
          },
        },
      },
      usedParts: {
        include: {
          part: true,
        },
      },
      invoice: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Parts inventory utilities
export async function getAllParts() {
  return await prisma.part.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getPartsLowStock(threshold = 10) {
  return await prisma.part.findMany({
    where: {
      stock: {
        lte: threshold,
      },
    },
    orderBy: {
      stock: 'asc',
    },
  });
}

// Admin statistics utilities
export async function getDailyStats(date: Date) {
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

  return {
    completedMaintenances: completedMaintenances.length,
    totalRevenue,
    adminShare,
    mechanicShare: totalRevenue - adminShare,
  };
}
