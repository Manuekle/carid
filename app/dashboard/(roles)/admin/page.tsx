'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Wrench, Users, TrendingUp } from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';
import { useSession } from 'next-auth/react';

interface DailyStats {
  completedMaintenances: number;
  totalRevenue: number;
  adminShare: number;
  mechanicShare: number;
}

interface PendingMechanic {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [pendingMechanics, setPendingMechanics] = useState<PendingMechanic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch daily stats
        const statsResponse = await fetch('/api/admin/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDailyStats(statsData.stats);
        }

        // Fetch pending mechanics
        const mechanicsResponse = await fetch('/api/mechanic/requests');
        if (mechanicsResponse.ok) {
          const mechanicsData = await mechanicsResponse.json();
          setPendingMechanics(mechanicsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-card">Bienvenido, {session?.user.name}</h1>
        <p className="text-muted-foreground text-xs">
          Resumen de actividades y estadísticas del día
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ingresos del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${dailyStats?.totalRevenue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tu parte: ${dailyStats?.adminShare.toLocaleString() || 0} (40%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Reparaciones Completadas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{dailyStats?.completedMaintenances || 0}</div>
            <p className="text-xs text-muted-foreground">Trabajos finalizados hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Mecánicos Pendientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingMechanics.length}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ganancia Mecánicos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${dailyStats?.mechanicShare.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">60% de ingresos totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Mechanics */}
      {pendingMechanics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mecánicos Pendientes de Aprobación</CardTitle>
            <CardDescription>
              Revisa y aprueba las solicitudes de registro de mecánicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMechanics.map(mechanic => (
                <div
                  key={mechanic.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{mechanic.name}</h4>
                    <p className="text-xs text-muted-foreground">{mechanic.email}</p>
                    <p className="text-xs text-muted-foreground">{mechanic.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <p>• Gestionar inventario de repuestos</p>
              <p>• Aprobar nuevos mecánicos</p>
              <p>• Ver reportes detallados</p>
              <p>• Configurar precios y comisiones</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Resumen del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs">
              <p>• Sistema de códigos QR activo</p>
              <p>• Inventario sincronizado</p>
              <p>• Facturación automática</p>
              <p>• Chat en tiempo real</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
