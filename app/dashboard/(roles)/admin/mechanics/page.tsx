'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { Loading } from '@/components/ui/loading';
import {
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MoreVertical,
  Search,
  UserCheck,
  UserX,
  Wrench,
  X,
  Users,
  TrendingUp,
  Calendar,
  Eye,
} from 'lucide-react';

interface Mechanic {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  statistics?: MechanicStats;
}

interface MechanicStats {
  totalMaintenances: number;
  completedMaintenances: number;
  inProgressMaintenances: number;
  completionRate: number;
  totalRevenue: number;
  totalEarnings: number;
  averageJobValue: number;
  averageCompletionTime: number;
  thisMonth: {
    completedJobs: number;
    earnings: number;
    totalJobs: number;
  };
  lastJob: {
    date: string;
    car: string;
    licensePlate: string;
    owner: string;
    earnings: number;
  } | null;
}

interface MechanicsData {
  mechanics: Mechanic[];
  summary: {
    totalMechanics: number;
    approvedMechanics: number;
    pendingApproval: number;
    activeMechanics: number;
    totalRevenue: number;
    totalEarnings: number;
  };
}

export default function MechanicsPage() {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<
    Record<string, 'approving' | 'rejecting' | null>
  >({});
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [overviewData, setOverviewData] = useState<MechanicsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'earnings' | 'jobs' | 'rating'>('name');

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await fetch('/api/mechanic/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch mechanics');
        }
        const data = await response.json();
        setMechanics(data);
      } catch (error) {
        console.error('Error fetching mechanics:', error);
        toast.error('Error al cargar los mecánicos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await fetch('/api/admin/mechanics');
        if (!response.ok) throw new Error('Failed to fetch mechanics overview');
        const data = await response.json();
        setOverviewData(data);
      } catch (error) {
        console.error('Error fetching mechanics overview:', error);
        toast.error('Error al cargar el resumen de mecánicos');
      }
    };

    fetchOverviewData();
  }, []);

  const handleStatusUpdate = async (mechanicId: string, action: 'approve' | 'reject') => {
    try {
      setLoadingStates(prev => ({
        ...prev,
        [mechanicId]: action === 'approve' ? 'approving' : 'rejecting',
      }));

      const endpoint = action === 'approve' ? '/api/mechanic/approved' : '/api/mechanic/rejected';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mechanicId }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} mechanic`);

      setMechanics(prev => prev.filter(m => m.id !== mechanicId));
      toast.success(`Mecánico ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);

      // Refresh overview data after status update
      const overviewResponse = await fetch('/api/admin/mechanics/overview');
      if (overviewResponse.ok) {
        setOverviewData(await overviewResponse.json());
      }

      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing mechanic:`, error);
      toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el mecánico`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [mechanicId]: null }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredMechanics =
    overviewData?.mechanics
      .filter(mechanic => {
        const matchesSearch =
          mechanic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mechanic.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'approved' && mechanic.isApproved) ||
          (statusFilter === 'pending' && !mechanic.isApproved);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (!a.statistics || !b.statistics) return 0;
        switch (sortBy) {
          case 'earnings':
            return (b.statistics?.totalEarnings || 0) - (a.statistics?.totalEarnings || 0);
          case 'jobs':
            return (
              (b.statistics?.completedMaintenances || 0) -
              (a.statistics?.completedMaintenances || 0)
            );
          case 'rating':
            return (b.statistics?.completionRate || 0) - (a.statistics?.completionRate || 0);
          default:
            return (a.name || '').localeCompare(b.name || '');
        }
      }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Gestión de Mecánicos</h1>
          <p className="text-muted-foreground text-xs">
            Administra y supervisa a los mecánicos del sistema
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Mecánicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overviewData?.summary.totalMechanics || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.summary.approvedMechanics || 0} aprobados,{' '}
              {overviewData?.summary.pendingApproval || 0} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Mecánicos Activos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {overviewData?.summary.activeMechanics || 0}
            </div>
            <p className="text-xs text-muted-foreground">Trabajaron este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(overviewData?.summary.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Generados por mecánicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Ganancias Mecánicos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(overviewData?.summary.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total pagado a mecánicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="earnings">Ganancias</SelectItem>
            <SelectItem value="jobs">Trabajos completados</SelectItem>
            <SelectItem value="rating">Tasa de finalización</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Approvals */}
      {mechanics.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Mecánicos Pendientes</CardTitle>
                <CardDescription className="text-sm">
                  {mechanics.length} solicitud(es) esperando revisión
                </CardDescription>
              </div>
              <Badge variant="outline" className="uppercase">
                {mechanics.length} Pendientes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mechanics.map(mechanic => (
                <div
                  key={mechanic.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 mb-3 sm:mb-0">
                    <h4 className="font-medium">{mechanic.name}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm">
                      <span className="text-muted-foreground">{mechanic.email}</span>
                      {mechanic.phone && (
                        <span className="text-muted-foreground">{mechanic.phone}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Registrado: {new Date(mechanic.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleStatusUpdate(mechanic.id, 'reject')}
                      disabled={!!loadingStates[mechanic.id]}
                    >
                      {loadingStates[mechanic.id] === 'rejecting' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span>Rechazar</span>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleStatusUpdate(mechanic.id, 'approve')}
                      disabled={!!loadingStates[mechanic.id]}
                    >
                      {loadingStates[mechanic.id] === 'approving' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Aprobar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mechanics List */}
      <div className="grid gap-4">
        {filteredMechanics.map(mechanic => (
          <Card key={mechanic.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl tracking-heading font-semibold">
                    {mechanic.name || 'Sin nombre'}
                  </CardTitle>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm text-muted-foreground">{mechanic.email}</span>
                    {mechanic.phone && (
                      <span className="text-sm text-muted-foreground">{mechanic.phone}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={mechanic.isApproved ? 'default' : 'secondary'}
                    className="uppercase text-xs"
                  >
                    {mechanic.isApproved ? 'Aprobado' : 'Pendiente'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/admin/mechanics/${mechanic.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      {!mechanic.isApproved ? (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(mechanic.id, 'approve')}
                          className="cursor-pointer"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Aprobar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(mechanic.id, 'reject')}
                          className="cursor-pointer text-destructive"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Suspender
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {mechanic.statistics && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <StatCard
                    value={mechanic.statistics.completedMaintenances}
                    label="Trabajos"
                    icon={<Wrench className="h-4 w-4" />}
                  />
                  <StatCard
                    value={formatCurrency(mechanic.statistics.totalEarnings)}
                    label="Ganancias"
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <StatCard
                    value={`${mechanic.statistics.completionRate.toFixed(1)}%`}
                    label="Tasa de éxito"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <StatCard
                    value={`${mechanic.statistics.averageCompletionTime.toFixed(1)} días`}
                    label="Tiempo promedio"
                    icon={<Clock className="h-4 w-4" />}
                  />
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Este mes
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-medium">
                          {mechanic.statistics.thisMonth.completedJobs}
                        </div>
                        <div className="text-xs text-muted-foreground">Completados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-medium">
                          {mechanic.statistics.thisMonth.totalJobs}
                        </div>
                        <div className="text-xs text-muted-foreground">Total trabajos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium">
                          {formatCurrency(mechanic.statistics.thisMonth.earnings)}
                        </div>
                        <div className="text-xs text-muted-foreground">Ganancias</div>
                      </div>
                    </div>
                  </div>

                  {mechanic.statistics.lastJob && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-sm mb-2">Último trabajo</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{mechanic.statistics.lastJob.car}</span>
                          <Badge className="font-mono text-sm">
                            {mechanic.statistics.lastJob.licensePlate}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>{mechanic.statistics.lastJob.owner}</span>
                          <span>
                            {new Date(mechanic.statistics.lastJob.date).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredMechanics.length === 0 && mechanics.length === 0 && (
        <Card>
          <CardContent className="text-center h-56 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground">
              No se encontraron mecánicos con los filtros aplicados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
