import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
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
  await prisma.user.upsert({
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
  await prisma.user.upsert({
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

  console.log('✅ Users seeded successfully!');
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
