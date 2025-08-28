import type { UserRole } from '@prisma/client';

// Export the Car interface so it can be imported elsewhere
export interface Car {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  // Add any other properties that might be returned by your API
}

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
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    isApproved: boolean;
    car: Car;
  }
}
