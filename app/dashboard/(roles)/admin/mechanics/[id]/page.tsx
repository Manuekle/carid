'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Package,
  Star,
  Phone,
  Mail,
  UserCheck,
  UserX,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Loading, LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface MechanicDetail {
  mechanic: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
  };
  statistics: {
    totalMaintenances: number;
    completedMaintenances: number;
    inProgressMaintenances: number;
    cancelledMaintenances: number;
    completionRate: number;
    totalRevenue: number;
    totalEarnings: number;
    averageJobValue: number;
    averageEarningsPerJob: number;
    averageCompletionTime: number;
  };
  monthlyStats: Array<{
    month: string;
    totalJobs: number;
    completedJobs: number;
    revenue: number;
    earnings: number;
  }>;
  topClients: Array<{
    name: string;
    email: string;
    phone: string;
    totalJobs: number;
    completedJobs: number;
    totalSpent: number;
  }>;
  topParts: Array<{
    name: string;
    totalQuantity: number;
    totalValue: number;
    timesUsed: number;
  }>;
  weeklyPerformance: Array<{
    week: string;
    jobsStarted: number;
    jobsCompleted: number;
    earnings: number;
  }>;
  recentJobs: Array<{
    id: string;
    description: string;
    status: string;
    startDate: string;
    completedDate: string | null;
    laborCost: number;
    totalCost: number;
    car: {
      brand: string;
      model: string;
      licensePlate: string;
      owner: {
        name: string;
        email: string;
        phone: string;
      };
    };
    invoice: {
      mechanicShare: number;
      totalCost: number;
    } | null;
  }>;
}

export default function MechanicDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<MechanicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMechanicDetail();
  }, []);

  const fetchMechanicDetail = async () => {
    try {
      const response = await fetch(`/api/admin/mechanics/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch mechanic details');
      }
      const mechanicData = await response.json();
      setData(mechanicData);
    } catch (error) {
      console.error('Error fetching mechanic details:', error);
      toast.error('Error al cargar los detalles del mecánico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (action: 'approve' | 'reject') => {
    try {
      const endpoint = action === 'approve' ? '/api/mechanic/approved' : '/api/mechanic/rejected';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: params.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} mechanic`);
      }

      toast.success(`Mecánico ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);
      fetchMechanicDetail(); // Recargar datos
    } catch (error) {
      console.error(`Error ${action}ing mechanic:`, error);
      toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el mecánico`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  type MaintenanceStatus = 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED' | 'PENDING';

  const getStatusBadge = (status: string) => {
    type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined;

    const statusConfig = {
      COMPLETED: {
        variant: 'default' as const,
        color: 'bg-green-100 text-green-800',
        label: 'Completado',
      },
      PENDING: {
        variant: 'outline' as const,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pendiente',
      },
      IN_PROGRESS: {
        variant: 'secondary' as const,
        color: 'bg-blue-100 text-blue-800',
        label: 'En Progreso',
      },
      CANCELLED: {
        variant: 'destructive' as const,
        color: 'bg-red-100 text-red-800',
        label: 'Cancelado',
      },
    } satisfies Record<MaintenanceStatus, { variant: BadgeVariant; color: string; label: string }>;

    const config = (
      statusConfig as Record<string, { variant: BadgeVariant; color: string; label: string }>
    )[status] || {
      variant: 'secondary' as const,
      color: 'bg-gray-100 text-gray-800',
      label: 'Desconocido',
    };

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Error al cargar los detalles del mecánico</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">
              {data.mechanic.name || 'Sin nombre'}
            </h1>
            <p className="text-muted-foreground text-xs">Detalles completos del mecánico</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!data.mechanic.isApproved ? (
            <Button
              onClick={() => handleStatusUpdate('approve')}
              className="bg-green-600 hover:bg-green-700"
            >
              Aprobar
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => handleStatusUpdate('reject')}>
              Suspender
            </Button>
          )}
        </div>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{data.mechanic.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{data.mechanic.phone || 'No registrado'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">
                Registrado: {new Date(data.mechanic.createdAt).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Trabajos Completados</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold ">{data.statistics.completedMaintenances}</div>
            <p className="text-xs text-muted-foreground">
              {data.statistics.completionRate.toFixed(1)}% tasa de finalización
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ganancias Totales</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(data.statistics.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(data.statistics.averageEarningsPerJob)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ingresos Generados</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(data.statistics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor promedio: {formatCurrency(data.statistics.averageJobValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {data.statistics.averageCompletionTime.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">días para completar trabajos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rendimiento mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Rendimiento Mensual
            </CardTitle>
            <CardDescription>Trabajos completados por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="aspect-auto h-[250px] w-full"
              config={{
                completedJobs: {
                  label: 'Trabajos Completados',
                  color: 'var(--chart-1)',
                },
              }}
            >
              <BarChart
                accessibilityLayer
                data={data.monthlyStats}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-background border border-border rounded-lg shadow-lg p-3 [&_.value]:text-base [&_.value]:font-semibold"
                      labelClassName="text-sm font-medium text-muted-foreground"
                      hideLabel
                    />
                  }
                  formatter={(value: string | number | (string | number)[], name: string) => [
                    name === 'completedJobs' ? (
                      <span className="text-foreground">{value} trabajos</span>
                    ) : (
                      <span className="text-foreground">{formatCurrency(Number(value))}</span>
                    ),
                    <span className="text-muted-foreground">
                      {name === 'completedJobs' ? 'Trabajos completados' : 'Ganancias'}
                    </span>,
                  ]}
                />
                <Bar dataKey="completedJobs" fill="#000" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="completedJobs"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value: React.ReactNode) => `${value} trabajos`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tendencia de ganancias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Tendencia de Ganancias
            </CardTitle>
            <CardDescription>Ganancias por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="aspect-auto h-[250px] w-full"
              config={{
                earnings: {
                  label: 'Ganancias',
                  color: 'var(--chart-1)',
                },
              }}
            >
              <LineChart
                accessibilityLayer
                data={data.monthlyStats}
                margin={{
                  top: 20,
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      className="bg-background border border-border rounded-lg shadow-lg p-3 [&_.value]:text-base [&_.value]:font-semibold"
                      labelClassName="text-sm font-medium text-muted-foreground"
                    />
                  }
                  formatter={(value: string | number, name: string) => [
                    <span key="value" className="text-foreground">
                      {formatCurrency(Number(value))}
                    </span>,
                    <span key="label" className="text-muted-foreground">
                      Ganancias totales
                    </span>,
                  ]}
                  labelFormatter={label => (
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  )}
                />
                <Line
                  dataKey="earnings"
                  type="natural"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{
                    fill: '#000',
                  }}
                  activeDot={{
                    r: 6,
                  }}
                >
                  <LabelList
                    dataKey="earnings"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value: React.ReactNode) => formatCurrency(Number(value))}
                  />
                </Line>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top clientes y partes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Principales Clientes
            </CardTitle>
            <CardDescription>Propietarios con más trabajos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topClients.map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-xs font-medium">{client.name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {client.completedJobs} {client.completedJobs === 1 ? 'trabajo' : 'trabajos'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(client.totalSpent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top partes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Partes Más Utilizadas
            </CardTitle>
            <CardDescription>Repuestos más frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topParts.slice(0, 5).map((part, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-xs font-medium">{part.name}</p>
                    <p className="text-xs text-muted-foreground">Usado {part.timesUsed} veces</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-600">
                      {part.totalQuantity} unidades
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(part.totalValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trabajos recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-heading">
            Trabajos Recientes
          </CardTitle>
          <CardDescription>Últimos mantenimientos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentJobs.slice(0, 5).map((job, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium">
                      {job.car.brand} {job.car.model}
                    </p>
                    <Badge variant="outline">{job.car.licensePlate}</Badge>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{job.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Propietario: {job.car.owner.name} • Iniciado:{' '}
                    {new Date(job.startDate).toLocaleDateString('es-CO')}
                    {job.completedDate && (
                      <> • Completado: {new Date(job.completedDate).toLocaleDateString('es-CO')}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium ">
                    {formatCurrency(job.invoice?.mechanicShare || job.laborCost)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: {formatCurrency(job.invoice?.totalCost || job.totalCost)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
