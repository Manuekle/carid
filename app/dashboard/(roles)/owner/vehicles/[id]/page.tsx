'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Wrench,
  FileText,
  QrCode as QrCodeIcon,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LoadingPage } from '@/components/ui/loading';

interface MaintenanceLog {
  id: string;
  description: string;
  status: string;
  startDate: string;
  completedAt: string | null;
  mechanic: {
    name: string | null;
    email: string | null;
  } | null;
  usedParts: Array<{
    part: {
      name: string;
    };
    quantity: number;
  }>;
  invoice?: {
    id: string;
    totalCost: number;
    createdAt: string;
  };
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  docType?: string;
  fileName?: string;
}

interface CarData {
  id: string;
  vin: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  qrCode: string | null;
  maintenanceLogs: MaintenanceLog[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const vehicleId = resolvedParams.id;

  const [car, setCar] = useState<CarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Helper function to validate and format QR code URL
  const getValidQrCodeUrl = (qrCode: string | null): string | null => {
    if (!qrCode) return null;

    // Check if it's already a valid URL
    try {
      new URL(qrCode);
      return qrCode;
    } catch {
      // If it's not a valid URL, check if it looks like a relative path
      if (qrCode.startsWith('/')) {
        return qrCode;
      }
      // If it's just an ID or invalid format, return null
      return null;
    }
  };

  // Function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Function to translate status
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      COMPLETED: 'COMPLETADO',
      IN_PROGRESS: 'EN PROGRESO',
      PENDING: 'PENDIENTE',
      CANCELLED: 'CANCELADO',
    };
    return translations[status] || status;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
      router.push('/dashboard');
      return;
    }

    const fetchCar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Vehículo no encontrado');
          } else if (response.status === 403) {
            setError('No tienes permisos para ver este vehículo');
          } else {
            throw new Error('Error al obtener el vehículo');
          }
          return;
        }

        const data = await response.json();
        setCar(data);
      } catch (error) {
        console.error('Error al obtener el vehículo:', error);
        setError('Error al cargar los detalles del vehículo. Por favor intenta de nuevo.');
        toast.error('Error al cargar los detalles del vehículo');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCar();
    }
  }, [vehicleId, router, session, status]);

  if (status === 'loading' || isLoading) {
    return <LoadingPage />;
  }

  if (error || !car) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehículo no encontrado</CardTitle>
            <CardDescription>
              {error ||
                'El vehículo solicitado no se pudo encontrar o no tienes permisos para verlo.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalSpent = car.maintenanceLogs
    .filter(log => log.invoice)
    .reduce((sum, log) => sum + (log.invoice?.totalCost || 0), 0);

  const validQrCodeUrl = getValidQrCodeUrl(car.qrCode);

  return (
    <div className="space-y-8">
      {/* QR Code Section */}
      <div className="mb-8" id="vehicle-qr-code">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-heading">
                  Código QR del Vehículo
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Escanea este código para acceder rápidamente a la información del vehículo
                </CardDescription>
              </div>
              {validQrCodeUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = validQrCodeUrl;
                    link.download = `qr-${car.brand}-${car.model}-${car.licensePlate}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            {validQrCodeUrl ? (
              <div className="p-4 bg-white rounded-lg">
                <Image
                  src={validQrCodeUrl}
                  alt={`Código QR para ${car.brand} ${car.model}`}
                  width={192}
                  height={192}
                  className="w-48 h-48 object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <QrCodeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-xs">Código QR no disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Details */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold tracking-heading">
                {car.brand} {car.model}
              </CardTitle>
              <CardDescription className="mt-1">
                {car.licensePlate} • {car.year} • {car.color}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">VIN: {car.vin}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const qrElement = document.getElementById('vehicle-qr-code');
                  if (qrElement) {
                    qrElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                Mostrar Código QR
              </Button>
              <Button size="sm" asChild>
                <Link href={`/dashboard/owner/vehicles/${car.id}/edit`}>Editar Vehículo</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Gastado</p>
                  <p className="text-xs font-medium">${totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mantenimiento</p>
                  <p className="text-xs font-medium">
                    {car.maintenanceLogs.length}{' '}
                    {car.maintenanceLogs.length === 1 ? 'Registro' : 'Registros'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Documentos</p>
                  <p className="text-xs font-medium">
                    {car.documents.length} {car.documents.length === 1 ? 'Documento' : 'Documentos'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Historial de Mantenimiento
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Registros recientes de mantenimiento y servicio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {car.maintenanceLogs.length > 0 ? (
                <div className="space-y-4">
                  {car.maintenanceLogs.map(log => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{log.description}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              {new Date(log.startDate).toLocaleDateString('es-ES')}
                            </div>
                            {log.mechanic?.name && (
                              <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                {log.mechanic.name}
                              </div>
                            )}
                            {log.invoice && (
                              <div className="flex items-center">
                                <DollarSign className="h-3.5 w-3.5 mr-1.5" />$
                                {log.invoice.totalCost.toFixed(2)}
                              </div>
                            )}
                          </div>

                          {log.usedParts.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Repuestos Utilizados:
                              </p>
                              <ul className="text-xs space-y-1 mt-1">
                                {log.usedParts.map((part, index) => (
                                  <li key={index} className="flex items-center">
                                    <span className="text-muted-foreground">•</span>
                                    <span className="ml-2">
                                      {part.quantity}x {part.part.name}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={getStatusVariant(log.status)}
                          className="self-start sm:self-center"
                        >
                          {translateStatus(log.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No se encontraron registros de mantenimiento
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Agregar Registro de Mantenimiento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">Documentos</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Documentos y registros del vehículo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {car.documents.length > 0 ? (
                <div className="space-y-2">
                  {car.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.name}</p>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{new Date(doc.uploadedAt).toLocaleDateString('es-ES')}</span>
                            {doc.docType && <span>• {doc.docType}</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/90"
                        >
                          Ver
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No hay documentos cargados</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Subir Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
