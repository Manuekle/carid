import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Create a custom type that includes the phone field
type UserWithPhone = Prisma.UserCreateInput & {
  phone?: string;
};

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users data
  const users = [
    {
      email: 'admin@carid.com',
      name: 'Administrador CarID',
      phone: '+573001234567',
      role: 'ADMIN' as const,
      password: 'admin123',
    },
    {
      email: 'mechanic@carid.com',
      name: 'Juan Pérez',
      phone: '+573012345678',
      role: 'MECHANIC' as const,
      password: 'mechanic123',
    },
    {
      email: 'owner@carid.com',
      name: 'María García',
      phone: '+573023456789',
      role: 'OWNER' as const,
      password: 'owner123',
    },
  ];

  // Create or update users
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const { password, ...userWithoutPassword } = userData;

    const userDataWithHashedPassword: UserWithPhone = {
      ...userWithoutPassword,
      password: hashedPassword,
      isApproved: true,
    };

    await prisma.user.upsert({
      where: { email: userData.email },
      update: userDataWithHashedPassword,
      create: userDataWithHashedPassword,
    });
  }

  console.log('✅ Users seeded successfully!');
  console.log('👤 Admin: admin@carid.com / admin123');
  console.log('🔧 Mechanic: mechanic@carid.com / mechanic123');
  console.log('🚗 Owner: owner@carid.com / owner123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
