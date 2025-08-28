import type { NavLinkGroup } from '@/types/navigation';
import {
  Car,
  BarChart3,
  Users,
  Wrench,
  Package,
  FileText,
  MessageSquare,
  QrCode,
  Settings,
  User,
} from 'lucide-react';

export const navLinkGroups: NavLinkGroup[] = [
  {
    title: 'Administración',
    roles: ['ADMIN'],
    icon: Settings,
    links: [
      {
        href: '/dashboard/admin',
        icon: BarChart3,
        label: 'Dashboard',
        roles: ['ADMIN'],
        description: 'Panel de control administrativo',
      },
      {
        href: '/dashboard/admin/mechanics',
        icon: Users,
        label: 'Mecánicos',
        roles: ['ADMIN'],
        description: 'Gestión de mecánicos',
      },
      {
        href: '/dashboard/admin/inventory',
        icon: Package,
        label: 'Inventario',
        roles: ['ADMIN'],
        description: 'Gestión de repuestos',
      },
    ],
  },
  {
    title: 'Área de Mecánico',
    roles: ['MECHANIC'],
    icon: Wrench,
    links: [
      {
        href: '/dashboard/mechanic',
        icon: BarChart3,
        label: 'Dashboard',
        roles: ['MECHANIC'],
        description: 'Panel de control del mecánico',
      },
      {
        href: '/dashboard/mechanic/scanner',
        icon: QrCode,
        label: 'Escanear QR',
        roles: ['MECHANIC'],
        description: 'Escanear código QR del vehículo',
      },
      {
        href: '/dashboard/mechanic/history',
        icon: Wrench,
        label: 'Historial',
        roles: ['MECHANIC'],
        description: 'Historial de mantenimientos',
      },
    ],
  },
  {
    title: 'Área del Propietario',
    roles: ['OWNER'],
    icon: Car,
    links: [
      {
        href: '/dashboard/owner/vehicles',
        icon: Car,
        label: 'Mis Vehículos',
        roles: ['OWNER'],
        description: 'Gestión de vehículos',
        subLinks: [
          {
            href: '/dashboard/owner/vehicles/[id]',
            label: 'Detalle del Vehículo',
            description: 'Ver detalles completos del vehículo',
            roles: ['OWNER'],
            isSubLink: true,
            parentHref: '/dashboard/owner/vehicles',
            icon: Car,
          },
          {
            href: '/dashboard/owner/vehicles/[id]/qr',
            label: 'Código QR',
            description: 'Ver código QR del vehículo',
            roles: ['OWNER'],
            isSubLink: true,
            parentHref: '/dashboard/owner/vehicles',
            icon: QrCode,
          },
        ],
      },
      {
        href: '/dashboard/owner/documents',
        icon: FileText,
        label: 'Documentos',
        roles: ['OWNER'],
        description: 'Gestión de documentos vehiculares',
      },
      {
        href: '/dashboard/owner/chat',
        icon: MessageSquare,
        label: 'Chat',
        roles: ['OWNER'],
        description: 'Comunicación con mecánicos',
      },
    ],
  },
];
