import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Extend the PrismaClient to include our custom models
declare module '@prisma/client' {
  const prisma: PrismaClient;

  interface PrismaClient {
    authLog: {
      create: (args: any) => Promise<any>;
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any>;
      deleteMany: (args?: any) => Promise<any>;
    };

    loginAttempt: {
      findUnique: (args: any) => Promise<any>;
      upsert: (args: any) => Promise<any>;
      deleteMany: (args?: any) => Promise<any>;
    };

    session: {
      deleteMany: (args: any) => Promise<any>;
    };
  }
}

export {};
