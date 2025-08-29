const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // This script will create the necessary indexes for our auth collections
  console.log('Creating indexes for auth collections...');

  try {
    // Create indexes for AuthLog collection
    await prisma.$runCommandRaw({
      createIndexes: 'AuthLog',
      indexes: [
        {
          key: { email: 1 },
          name: 'email_idx',
        },
        {
          key: { createdAt: -1 },
          name: 'createdAt_idx',
          expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days TTL
        },
      ],
    });

    // Create indexes for LoginAttempt collection
    await prisma.$runCommandRaw({
      createIndexes: 'LoginAttempt',
      indexes: [
        {
          key: { email: 1 },
          name: 'email_idx',
          unique: true,
        },
        {
          key: { lockedUntil: 1 },
          name: 'lockedUntil_idx',
          expireAfterSeconds: 0, // TTL index
        },
      ],
    });

    // Create indexes for Session collection
    await prisma.$runCommandRaw({
      createIndexes: 'Session',
      indexes: [
        {
          key: { sessionToken: 1 },
          name: 'sessionToken_idx',
          unique: true,
        },
        {
          key: { expires: 1 },
          name: 'expires_idx',
          expireAfterSeconds: 0, // TTL index
        },
        {
          key: { userId: 1 },
          name: 'userId_idx',
        },
      ],
    });

    console.log('Successfully created auth collection indexes');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
