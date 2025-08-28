import SidebarLayout from '@/components/layout/sidebar-layout';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard - CarID',
  description: 'Panel de control para gestionar tus datos',
  keywords: 'dashboard, panel de control, CarID',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarLayout>
      <div className="font-sans">{children}</div>
    </SidebarLayout>
  );
}
