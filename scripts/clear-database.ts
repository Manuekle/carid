import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🚀 Starting database cleanup...');

    // Delete all chat messages
    await prisma.chatMessage.deleteMany({});
    console.log('✅ Deleted all chat messages');

    // Delete all user chat sessions
    await prisma.userChatSession.deleteMany({});
    console.log('✅ Deleted all user chat sessions');

    // Delete all chat sessions
    await prisma.chatSession.deleteMany({});
    console.log('✅ Deleted all chat sessions');

    // Delete all documents
    await prisma.document.deleteMany({});
    console.log('✅ Deleted all documents');

    // Delete all invoices
    await prisma.invoice.deleteMany({});
    console.log('✅ Deleted all invoices');

    // Delete all used parts
    await prisma.usedPart.deleteMany({});
    console.log('✅ Deleted all used parts');

    // Delete all parts
    await prisma.part.deleteMany({});

    // Delete all maintenance logs
    await prisma.maintenanceLog.deleteMany({});
    console.log('✅ Deleted all maintenance logs');

    // Delete all cars
    await prisma.car.deleteMany({});
    console.log('✅ Deleted all cars');

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('⚠️  Users table was not cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
