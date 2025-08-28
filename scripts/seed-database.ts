import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carid.com' },
    update: {},
    create: {
      email: 'admin@carid.com',
      name: 'Administrador CarID',
      phone: '+57 300 123 4567',
      role: 'ADMIN',
      isApproved: true,
      password: adminPassword,
    },
  });

  // Create approved mechanic
  const mechanicPassword = await bcrypt.hash('mechanic123', 10);
  const mechanic = await prisma.user.upsert({
    where: { email: 'mechanic@carid.com' },
    update: {},
    create: {
      email: 'mechanic@carid.com',
      name: 'Juan Pérez',
      phone: '+57 301 234 5678',
      role: 'MECHANIC',
      isApproved: true,
      password: mechanicPassword,
    },
  });

  // Create car owner
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@carid.com' },
    update: {},
    create: {
      email: 'owner@carid.com',
      name: 'María García',
      phone: '+57 302 345 6789',
      role: 'OWNER',
      isApproved: true,
      password: ownerPassword,
    },
  });

  // Create sample car
  const car = await prisma.car.upsert({
    where: { vin: '1HGBH41JXMN109186' },
    update: {},
    create: {
      vin: '1HGBH41JXMN109186',
      qrCode: 'CAR_QR_001',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Blanco',
      licensePlate: 'ABC123',
      ownerId: owner.id,
    },
  });

  // Create sample parts inventory
  const parts = [
    {
      name: 'Filtro de Aceite',
      description: 'Filtro de aceite para motor Toyota',
      price: 25000,
      stock: 50,
    },
    {
      name: 'Pastillas de Freno',
      description: 'Pastillas de freno delanteras',
      price: 120000,
      stock: 30,
    },
    {
      name: 'Aceite Motor 5W-30',
      description: 'Aceite sintético para motor',
      price: 45000,
      stock: 25,
    },
    {
      name: 'Bujías',
      description: 'Juego de 4 bujías',
      price: 80000,
      stock: 40,
    },
  ];

  for (const partData of parts) {
    // First, try to find if the part exists
    const existingPart = await prisma.part.findFirst({
      where: { name: partData.name },
    });

    if (existingPart) {
      // Update existing part
      await prisma.part.update({
        where: { id: existingPart.id },
        data: partData,
      });
    } else {
      // Create new part if it doesn't exist
      await prisma.part.create({
        data: partData,
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: admin@carid.com / admin123');
  console.log('🔧 Mechanic: mechanic@carid.com / mechanic123');
  console.log('🚗 Owner: owner@carid.com / owner123');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
