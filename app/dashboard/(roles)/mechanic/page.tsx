'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Wrench, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LoadingPage } from '@/components/ui/loading';

interface MaintenanceJob {
  id: string;
  description: string;
  totalCost: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  completedDate?: string;
  car: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    owner: {
      name: string;
    };
  };
  invoice?: {
    mechanicShare: number;
  };
}

export default function MechanicDashboard() {
  const { data: session } = useSession();
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceHistory = async () => {
      try {
        const response = await fetch('/api/mechanic/maintenance/history');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceHistory(data.maintenanceHistory);
        }
      } catch (error) {
        console.error('Error fetching maintenance history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.role === 'MECHANIC') {
      fetchMaintenanceHistory();
    }
  }, [session]);

  if (loading) {
    return <LoadingPage />;
  }

  const recentJobs = maintenanceHistory.slice(0, 5);
  const completedJobs = maintenanceHistory.filter(job => job.status === 'COMPLETED').length;
  const inProgressJobs = maintenanceHistory.filter(job => job.status === 'IN_PROGRESS').length;
  const totalEarnings = maintenanceHistory
    .filter(job => job.status === 'COMPLETED')
    .reduce((sum, job) => sum + (job.invoice?.mechanicShare || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-heading">
          Bienvenido, {session?.user.name}
        </h1>
        <p className="text-muted-foreground text-xs">
          Puedes comenzar a escanear un vehículo para comenzar un mantenimiento
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              <QrCode className="h-5 w-5" />
              Escanear Vehículo
            </CardTitle>
            <CardDescription className="text-xs">
              Escanea el código QR de un vehículo para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/mechanic/scanner">Abrir Escáner QR</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              <Wrench className="h-5 w-5" />
              Historial de Trabajos
            </CardTitle>
            <CardDescription>Ver todos tus trabajos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/dashboard/mechanic/history">Ver Historial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Trabajos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{completedJobs}</div>
            <p className="text-xs text-muted-foreground">Total de reparaciones finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{inProgressJobs}</div>
            <p className="text-xs text-muted-foreground">Trabajos activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ganancias Totales</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">60% de trabajos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-heading">
            Trabajos Recientes
          </CardTitle>
          <CardDescription className="text-xs">Tus últimos 5 trabajos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-xs">
                      {job.car.brand} {job.car.model} ({job.car.year})
                    </h4>
                    <p className="text-xs text-muted-foreground">{job.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Propietario: {job.car.owner.name} • ${job.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {job.status === 'COMPLETED' ? 'Completado' : 'En Progreso'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground h-32 flex items-center justify-center">
              No tienes trabajos registrados aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
