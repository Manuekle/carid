import type { UserRole } from '@prisma/client';

// Base user interface that matches NextAuth's User type
export interface BaseUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  isApproved: boolean;
  phone?: string | null;
}

// Extended interfaces for the application
export interface Car {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  owner: BaseUser;
  maintenanceLogs?: MaintenanceLog[];
  documents?: Document[];
}

export interface MaintenanceLog {
  id: string;
  carId: string;
  mechanicId: string;
  description: string;
  laborCost: number;
  totalCost: number;
  status: string;
  startDate: Date;
  estimatedTime?: number;
  completedDate?: Date | null;
  car?: Car;
  mechanic?: BaseUser;
  usedParts?: UsedPart[];
  invoice?: Invoice;
}

export interface UsedPart {
  id: string;
  maintenanceLogId: string;
  partId: string;
  quantity: number;
  unitPrice: number;
  part: Part;
}

export interface Part {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  photoUrl?: string | null;
}

export interface Invoice {
  id: string;
  maintenanceLogId: string;
  subtotal: number;
  laborCost: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

// This file only contains type exports, no module augmentation
// All NextAuth type extensions are in next-auth.d.ts
