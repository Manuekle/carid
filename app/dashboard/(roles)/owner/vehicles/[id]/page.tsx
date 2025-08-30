'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import {
  Wrench,
  FileText,
  QrCode as QrCodeIcon,
  Calendar,
  DollarSign,
  User,
  Download,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingPage } from '@/components/ui/loading';

// Importar QRCode de forma dinámica para evitar problemas de SSR
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => (
    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <QrCodeIcon className="h-12 w-12 text-gray-400" />
    </div>
  ),
});

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
  const resolvedParams = use(params);
  const vehicleId = resolvedParams.id;

  const [car, setCar] = useState<CarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: 0,
    color: '',
    licensePlate: '',
    vin: '',
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize form data when car data is loaded
  useEffect(() => {
    if (car) {
      setFormData({
        brand: car.brand,
        model: car.model,
        year: car.year,
        color: car.color,
        licensePlate: car.licensePlate,
        vin: car.vin,
      });
    }
  }, [car]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'year' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/vehicles/${car.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el vehículo');
      }

      const updatedCar = await response.json();
      setCar(updatedCar);
      toast.success('Vehículo actualizado correctamente');
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Error al actualizar el vehículo:', error);
      toast.error('Error al actualizar el vehículo');
    } finally {
      setIsSubmitting(false);
    }
  };
  const { data: session, status } = useSession();
  const router = useRouter();

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

  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      COMPLETED: 'COMPLETADO',
      IN_PROGRESS: 'EN PROGRESO',
      PENDING: 'PENDIENTE',
      CANCELLED: 'CANCELADO',
    };
    return translations[status] || status;
  };

  // Función para descargar QR como imagen
  const downloadQRCode = () => {
    if (!car?.qrCode) {
      toast.error('No hay código QR disponible');
      return;
    }

    // Crear un canvas temporal para generar la imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    // Buscar el SVG del QR en el DOM
    const qrElement = document.querySelector('#qr-code-display svg');
    if (qrElement) {
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-${car.brand}-${car.model}-${car.licensePlate}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Código QR descargado');
          }
        });

        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    }
  };

  // Función para copiar el token QR
  const copyQRToken = async () => {
    if (!car?.qrCode) {
      toast.error('No hay código QR disponible');
      return;
    }

    try {
      await navigator.clipboard.writeText(car.qrCode);
      toast.success('Token QR copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar el token');
    }
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

  return (
    <div className="space-y-8">
      {/* QR Code Section */}
      <div className="mb-8" id="vehicle-qr-code">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-heading">
                  Código QR del Vehículo
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Escanea este código para acceder rápidamente a la información del vehículo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6">
            {car.qrCode ? (
              <>
                <div id="qr-code-display" className="p-4 bg-white rounded-lg border mb-4">
                  <QRCode
                    value={car.qrCode}
                    size={192}
                    level="M"
                    includeMargin={true}
                    className="w-48 h-48"
                  />
                </div>
                <div className="text-center space-y-2">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <p className="text-xs text-muted-foreground font-mono bg-gray-100 px-4 py-2 rounded-md">
                      {car.qrCode}
                    </p>
                    <div className="flex flex-row justify-center gap-2 w-full">
                      <Button variant="outline" size="sm" onClick={copyQRToken}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadQRCode}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este token identifica únicamente tu vehículo
                  </p>
                </div>
              </>
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
            <div className="flex flex-row justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/owner/vehicles/${car.id}/transfer`)}
              >
                Solicitar Traspaso
              </Button>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button onClick={() => setIsDrawerOpen(true)}>Editar Vehículo</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                      <DrawerTitle className="text-2xl font-semibold tracking-heading">
                        Editar Vehículo
                      </DrawerTitle>
                      <DrawerDescription className="text-xs">
                        Actualiza la información del vehículo
                      </DrawerDescription>
                    </DrawerHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="p-4 pb-0">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input
                              className="text-xs"
                              id="brand"
                              value={formData.brand}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="model">Modelo</Label>
                            <Input
                              className="text-xs"
                              id="model"
                              value={formData.model}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="year">Año</Label>
                            <Input
                              className="text-xs"
                              id="year"
                              type="number"
                              value={formData.year}
                              onChange={handleInputChange}
                              min="1900"
                              max={new Date().getFullYear() + 1}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="color">Color</Label>
                            <Input
                              className="text-xs"
                              id="color"
                              value={formData.color}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="licensePlate">Placa</Label>
                            <Input
                              className="text-xs"
                              id="licensePlate"
                              value={formData.licensePlate}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="vin">VIN</Label>
                            <Input
                              className="text-xs"
                              id="vin"
                              value={formData.vin}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <DrawerFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                        <DrawerClose asChild>
                          <Button type="button" variant="outline" disabled={isSubmitting}>
                            Cancelar
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </form>
                  </div>
                </DrawerContent>
              </Drawer>
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
                  <p className="text-xs font-medium">
                    $
                    {totalSpent.toLocaleString('es-CO', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
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

      {/* Maintenance & Documents - Rest of the component remains the same */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
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
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-xs">{log.description}</h4>
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
                              ${log.invoice.totalCost.toFixed(2)}
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
              <div className="text-center h-32 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  No se encontraron registros de mantenimiento
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
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
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{doc.name}</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="text-xs">
                            {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                          </span>
                          {doc.docType && <span className="text-xs">• {doc.docType}</span>}
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
              <div className="text-center h-32 flex flex-col   items-center justify-center">
                <p className="text-xs text-muted-foreground">No hay documentos cargados</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 "
                  onClick={() => {
                    router.push(`/dashboard/owner/vehicles/${car.id}/upload`);
                  }}
                >
                  Subir Documento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
