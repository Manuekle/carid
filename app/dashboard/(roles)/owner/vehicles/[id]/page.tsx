import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Car,
  Wrench,
  FileText,
  QrCode,
  Calendar,
  DollarSign,
  User,
  ArrowLeft,
  MessageSquare,
  ChartPie,
} from 'lucide-react';
import Link from 'next/link';

interface VehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'OWNER') {
    redirect('/auth/login');
  }

  const car = await prisma.car.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id,
    },
    include: {
      maintenanceLogs: {
        include: {
          mechanic: {
            select: {
              name: true,
              email: true,
            },
          },
          usedParts: {
            include: {
              part: true,
            },
          },
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      documents: {
        orderBy: {
          uploadedAt: 'desc', // Corregido: usar uploadedAt en lugar de createdAt
        },
      },
    },
  });

  if (!car) {
    notFound();
  }

  const totalSpent = car.maintenanceLogs
    .filter(log => log.invoice)
    .reduce((sum, log) => sum + (log.invoice?.totalCost || 0), 0); // Corregido: totalCost en lugar de totalAmount

  const isInMaintenance = car.maintenanceLogs.some(log => log.status === 'IN_PROGRESS');

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-heading">
              {car.brand} {car.model}
            </h1>
            <p className="text-muted-foreground text-xs">
              {car.year} • {car.color} • Placa: {car.licensePlate}
            </p>
          </div>
          <Badge variant={isInMaintenance ? 'destructive' : 'secondary'} className="text-xs">
            {isInMaintenance ? 'En Taller' : 'Disponible'}
          </Badge>
        </div>

        {/* Vehicle Info & Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                <Car className="h-5 w-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs">Marca</span>
                  <p className="font-medium">{car.brand}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Modelo</span>
                  <p className="font-medium">{car.model}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Año</span>
                  <p className="font-medium">{car.year}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Color</span>
                  <p className="font-medium">{car.color}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Placa</span>
                  <p className="font-medium">{car.licensePlate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">VIN</span>
                  <p className="font-medium text-xs">{car.vin}</p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/dashboard/owner/vehicles/${car.id}/qr`}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Ver QR
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link href={`/dashboard/owner/chat?carId=${car.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                <ChartPie className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-black rounded-lg">
                  <Wrench className="h-6 w-6 mx-auto mb-2 text-white" />
                  <p className="text-2xl font-semibold text-white">{car.maintenanceLogs.length}</p>
                  <p className="text-xs text-white">Mantenimientos</p>
                </div>
                <div className="text-center p-4 bg-black border rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-white" />
                  <p className="text-2xl font-semibold text-white">{car.documents.length}</p>
                  <p className="text-xs text-white">Documentos</p>
                </div>
              </div>

              <div className="text-center p-4 bg-black border rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-white" />
                <p className="text-2xl font-semibold text-white">${totalSpent.toLocaleString()}</p>
                <p className="text-xs text-white">Total Invertido</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Historial de Mantenimientos
            </CardTitle>
            <CardDescription>
              Registro completo de todos los mantenimientos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {car.maintenanceLogs.length > 0 ? (
              <div className="space-y-4">
                {car.maintenanceLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{log.description}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.mechanic.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            log.status === 'COMPLETED'
                              ? 'default'
                              : log.status === 'IN_PROGRESS'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {log.status === 'COMPLETED'
                            ? 'Completado'
                            : log.status === 'IN_PROGRESS'
                              ? 'En Progreso'
                              : 'Pendiente'}
                        </Badge>
                        {log.invoice && (
                          <p className="text-xs font-medium mt-1">
                            ${log.invoice.totalCost.toLocaleString()}{' '}
                            {/* Corregido: totalCost en lugar de totalAmount */}
                          </p>
                        )}
                      </div>
                    </div>

                    {log.usedParts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Repuestos utilizados:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {log.usedParts.map(usedPart => (
                            <div key={usedPart.id} className="text-xs bg-muted p-2 rounded">
                              <p className="font-medium">{usedPart.part.name}</p>
                              <p className="text-muted-foreground text-xs">
                                Cant: {usedPart.quantity} • ${usedPart.unitPrice}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-32 flex items-center justify-center">
                <p className="text-muted-foreground text-xs">
                  No hay mantenimientos registrados para este vehículo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Documentos
            </CardTitle>
            <CardDescription>SOAT, tecnomecánica y otros documentos del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            {car.documents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {car.documents.map(doc => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{doc.fileName}</h4>{' '}
                        {/* Corregido: fileName en lugar de name */}
                        <p className="text-xs text-muted-foreground">
                          {doc.docType} • {new Date(doc.uploadedAt).toLocaleDateString()}{' '}
                          {/* Corregido: docType y uploadedAt */}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          {' '}
                          {/* Corregido: fileUrl en lugar de url */}
                          Ver
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-32 flex items-center justify-center flex-col gap-2">
                <p className="text-muted-foreground text-xs">
                  No hay documentos subidos para este vehículo
                </p>
                <Button asChild variant="default">
                  <Link href={`/dashboard/owner/documents?carId=${car.id}`}>Subir Documentos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
