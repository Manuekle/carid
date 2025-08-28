import type { LucideIcon } from 'lucide-react';

// Tipos de roles basados en tu schema de Prisma
export type Role = 'ADMIN' | 'MECHANIC' | 'OWNER';

export interface NavLinkBase {
  href: string;
  label: string;
  roles: Role[];
  description?: string;
}

export interface NavLink extends NavLinkBase {
  icon: LucideIcon;
  badge?: string | number;
  subLinks?: NavSubLink[];
  isSubLink?: boolean;
  parentHref?: string;
}

export interface NavSubLink extends NavLinkBase {
  icon?: LucideIcon;
  isSubLink: true;
  parentHref: string;
}

export interface NavLinkGroup {
  title: string;
  roles?: Role[];
  links: NavLink[];
  icon?: LucideIcon;
}

// Tipo de usuario basado en tu schema
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ValidRole = Role;
