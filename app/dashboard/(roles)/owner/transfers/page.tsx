'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowRight,
  Car,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

interface Transfer {
  id: string;
  status: string;
  salePrice: number;
  transferDate: string;
  completionDate?: string;
  notes?: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  sellerProfile: {
    city: string;
    department: string;
    documentType: string;
  };
  buyerProfile: {
    city: string;
    department: string;
    documentType: string;
  };
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    isVerified: boolean;
    uploadedAt: string;
  }>;
  _count: {
    documents: number;
  };
}

const STATUS_CONFIG = {
  PENDING_SELLER_DOCUMENTS: {
    label: 'Documentos del Vendedor Pendientes',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  PENDING_BUYER_ACCEPTANCE: {
    label: 'Esperando Aceptación del Comprador',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
  },
  PENDING_ADMIN_APPROVAL: {
    label: 'Esperando Aprobación Administrativa',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Clock,
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
};

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers');
      const data = await response.json();

      if (response.ok) {
        setTransfers(data.transfers);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al cargar los traspasos');
    } finally {
      setLoading(false);
    }
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">Traspaso de Vehículos</h1>
            <p className="text-muted-foreground text-xs">
              Gestiona las transferencias de propiedad de tus vehículos
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/dashboard/owner/vehicles')}>Mis Vehículos</Button>
      </div>

      {error && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (typeof window !== 'undefined') {
            toast.error('${error.replace(/'/g, "\\'")}');
          }
        `,
          }}
        />
      )}

      {transfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-56">
            <h3 className="text-xs">No tienes traspasos registrados</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Cuando inicies un proceso de traspaso aparecerá aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {transfers.map(transfer => {
            const statusConfig = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={transfer.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div>
                        <CardTitle className="text-xl font-semibold tracking-heading">
                          {transfer.car.brand} {transfer.car.model} {transfer.car.year}
                        </CardTitle>
                        <p className="text-xs">Placa: {transfer.car.licensePlate}</p>
                      </div>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Comprador</p>
                        <p className="font-medium text-xs">{transfer.buyer.name}</p>
                        <p className="text-xs text-gray-500">{transfer.buyer.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Precio</p>
                        <p className="font-medium text-xs">{formatPrice(transfer.salePrice)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Fecha de Inicio</p>
                        <p className="font-medium text-xs">{formatDate(transfer.transferDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-600">Documentos</p>
                        <p className="font-medium text-xs">{transfer._count.documents} subidos</p>
                      </div>
                    </div>
                  </div>

                  {transfer.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-700">{transfer.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-xs text-gray-600">
                      Ubicación: {transfer.buyerProfile.city}, {transfer.buyerProfile.department}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/owner/transfers/${transfer.id}`)}
                    >
                      Ver Detalles
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
