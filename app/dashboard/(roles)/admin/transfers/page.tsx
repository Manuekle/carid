'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Car,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

interface Transfer {
  id: string;
  status: string;
  salePrice: number;
  transferDate: string;
  completionDate?: string;
  notes?: string;
  adminNotes?: string;
  sellerId: string;
  buyerId: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  sellerProfile: {
    documentType: string;
    documentNumber: string;
    city: string;
    department: string;
  };
  buyerProfile: {
    documentType: string;
    documentNumber: string;
    city: string;
    department: string;
  };
  documents: Array<{
    id: string;
    documentType: string;
    isVerified: boolean;
  }>;
  _count: {
    documents: number;
  };
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

const STATUS_CONFIG = {
  PENDING_SELLER_DOCUMENTS: {
    label: 'Documentos del Vendedor Pendientes',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  PENDING_BUYER_ACCEPTANCE: {
    label: 'Esperando Aceptación del Comprador',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
  },
  PENDING_ADMIN_APPROVAL: {
    label: 'Esperando Aprobación',
    color: 'bg-purple-100 text-purple-800',
    icon: AlertCircle,
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

export default function AdminTransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/admin/transfers');
      const data = await response.json();

      if (response.ok) {
        setTransfers(data.transfers);
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al cargar los traspasos');
    } finally {
      setLoading(false);
    }
  };

  const filterTransfers = (status?: string) => {
    if (!status || status === 'all') return transfers;
    if (status === 'pending') {
      return transfers.filter(t =>
        ['PENDING_SELLER_DOCUMENTS', 'PENDING_BUYER_ACCEPTANCE', 'PENDING_ADMIN_APPROVAL'].includes(
          t.status
        )
      );
    }
    return transfers.filter(t => t.status === status.toUpperCase());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Lista de Traspasos</h1>
          <p className="text-muted-foreground text-xs">
            Lista de todos los traspasos pendientes y completados
          </p>
        </div>
      </div>

      {error && toast.error(error)}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers List */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
              <TabsTrigger value="completed">Completados ({stats.completed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados ({stats.cancelled})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filterTransfers(activeTab).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay traspasos en esta categoría
                </div>
              ) : (
                <div className="space-y-4">
                  {filterTransfers(activeTab).map(transfer => {
                    const statusConfig =
                      STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={transfer.id}
                        className="flex flex-col cursor-pointer gap-3 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm"
                        onClick={() => router.push(`/dashboard/admin/transfers/${transfer.id}`)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="text-xl font-semibold tracking-heading">
                                {transfer.car.brand} {transfer.car.model} {transfer.car.year}
                              </h3>
                              <p className="text-xs text-gray-600">
                                Placa: {transfer.car.licensePlate} • VIN:{' '}
                                {transfer.car.vin.slice(-8)}
                              </p>
                            </div>
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                          <div>
                            <p className="text-gray-600 mb-1">Vendedor</p>
                            <p className="font-medium text-xs">{transfer.seller.name}</p>
                            <p className="text-gray-500 text-xs">
                              {transfer.sellerProfile.documentType}{' '}
                              {transfer.sellerProfile.documentNumber}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {transfer.sellerProfile.city}, {transfer.sellerProfile.department}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Comprador</p>
                            <p className="font-medium text-xs">{transfer.buyer.name}</p>
                            <p className="text-gray-500 text-xs">
                              {transfer.buyerProfile.documentType}{' '}
                              {transfer.buyerProfile.documentNumber}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {transfer.buyerProfile.city}, {transfer.buyerProfile.department}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Precio</p>
                            <p className="font-medium text-xs">{formatPrice(transfer.salePrice)}</p>
                            <p className="text-gray-500 text-xs">
                              Fecha: {formatDate(transfer.transferDate)}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-600 mb-1">Documentos</p>
                            <p className="font-medium text-xs">
                              {transfer._count.documents} subidos
                            </p>
                            <p className="text-gray-500 text-xs">
                              {transfer.documents.filter(d => d.isVerified).length} verificados
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
