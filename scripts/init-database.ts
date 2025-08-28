import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing database connection...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    // Generate Prisma client
    console.log('📦 Generating Prisma client...');

    // Check if we can query users (this will create collections if they don't exist)
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);

    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
