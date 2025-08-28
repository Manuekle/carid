import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      isApproved: boolean;
    };
    car: Car;
  }

  interface User {
    role: UserRole;
    isApproved: boolean;
  }

  interface Car {
    id: string;
    vin: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    // Add any other properties that might be returned by your API
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    isApproved: boolean;
    car: Car;
  }
}
