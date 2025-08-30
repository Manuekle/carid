'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Wrench, Users, Car, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/loading';
import { RevenueChart } from '@/components/revenue-chart';
import { useSession } from 'next-auth/react';

type DashboardStats = {
  dailyRevenue: number;
  totalRevenue: number;
  todayRepairs: number;
  activeUsers: number;
  registeredVehicles: number;
  completedRepairs: number;
  lowStockParts: number;
  revenueData: {
    labels: string[];
    values: number[];
  };
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/stats?period=${selectedPeriod}`);
        if (!response.ok) {
          throw new Error('Error al cargar las estadísticas');
        }

        const { stats: data } = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('No se pudieron cargar las estadísticas. Por favor, intente de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  const chartData =
    stats?.revenueData?.labels?.map((label, index) => ({
      name: label,
      Ingresos: stats.revenueData.values[index] || 0,
    })) || [];

  if (isLoading || !session) {
    return <LoadingPage />;
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (typeof window !== 'undefined') {
            toast.error('${(error || 'No se pudieron cargar los datos').replace(/'/g, "\\'")}');
          }
        `,
          }}
        />
        <p className="text-lg font-medium">Error al cargar el panel</p>
        <p className="text-muted-foreground text-xs">
          {error || 'No se pudieron cargar los datos'}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">
            Bienvenido, {session?.user?.name || 'Administrador'}
          </h1>
          <p className="text-muted-foreground text-xs">
            Resumen general de la operación del negocio
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
          >
            Semana
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
          >
            Mes
          </Button>
          <Button
            variant={selectedPeriod === 'year' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('year')}
          >
            Año
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ingresos del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(stats.dailyRevenue)}</div>
            <p className="text-xs text-muted-foreground">40% de las facturas del día</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Reparaciones Hoy</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.todayRepairs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayRepairs > 0 ? 'En progreso' : 'Sin reparaciones hoy'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers > 0 ? 'Conectados recientemente' : 'Sin usuarios activos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Vehículos Registrados</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.registeredVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedRepairs} reparaciones completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="col-span-4">
        <RevenueChart
          title="Ingresos Acumulados"
          description={
            selectedPeriod === 'week'
              ? 'Ingresos de los últimos 7 días'
              : selectedPeriod === 'month'
                ? 'Ingresos de este mes'
                : 'Ingresos de este año'
          }
          data={chartData.map(item => ({
            date: item.name,
            revenue: item.Ingresos,
          }))}
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockParts > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium">¡Atención! Repuestos con bajo inventario</h3>
              <p className="text-xs text-muted-foreground">
                Tienes {stats.lowStockParts} {stats.lowStockParts === 1 ? 'repuesto' : 'repuestos'}{' '}
                con stock bajo.
                <a href="/dashboard/admin/inventory" className="text-primary hover:underline ml-1">
                  Revisar inventario
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
