import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car, User, Calendar, Wrench, Plus, FileText } from 'lucide-react';
import Link from 'next/link';

interface CarPageProps {
  params: {
    id: string;
  };
}

export default async function CarPage({ params }: CarPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MECHANIC') {
    redirect('/auth/login');
  }

  const car = await prisma.car.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      maintenanceLogs: {
        include: {
          mechanic: {
            select: {
              name: true,
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
          uploadedAt: 'desc',
        },
      },
    },
  });

  if (!car) {
    notFound();
  }

  const activeMaintenances = car.maintenanceLogs.filter(log => log.status === 'IN_PROGRESS');
  const completedMaintenances = car.maintenanceLogs.filter(log => log.status === 'COMPLETED');

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">
              {car.brand} {car.model} ({car.year})
            </h1>
            <p className="text-muted-foreground text-xs">
              VIN: {car.vin} • Placa: {car.licensePlate}
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/mechanic/car/${car.id}/maintenance/new`}>Nueva Reparación</Link>
          </Button>
        </div>

        {/* Vehicle Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 tracking-heading text-xl font-semibold">
                <Car className="h-5 w-5" />
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Marca:</span>
                <span className="font-medium text-xs">{car.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Modelo:</span>
                <span className="font-medium text-xs">{car.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Año:</span>
                <span className="font-medium text-xs">{car.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Color:</span>
                <span className="font-medium text-xs">{car.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Placa:</span>
                <span className="font-medium text-xs">{car.licensePlate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 tracking-heading text-xl font-semibold">
                <User className="h-5 w-5" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Nombre:</span>
                <span className="font-medium text-xs">{car.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Correo Electrónico:</span>
                <span className="font-medium text-xs">{car.owner.email}</span>
              </div>
              {car.owner.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Teléfono:</span>
                  <span className="font-medium text-xs">{car.owner.phone}</span>
                </div>
              )}
              <Separator />
              <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                <Link href={`/dashboard/mechanic/chat/${car.id}`}>Iniciar Chat</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Maintenances */}
        {activeMaintenances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 tracking-heading text-xl font-semibold">
                Mantenimientos Activos
              </CardTitle>
              <CardDescription>Trabajos en progreso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeMaintenances.map(maintenance => (
                  <>
                    <div key={maintenance.id}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-xs">{maintenance.description}</h4>
                        <Badge variant="secondary">En Progreso</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Iniciado: {new Date(maintenance.startDate).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">
                          Costo estimado: ${maintenance.totalCost.toLocaleString()}
                        </span>
                        <Button asChild size="sm">
                          <Link href={`/mechanic/maintenance/${maintenance.id}`}>Ver Detalles</Link>
                        </Button>
                      </div>
                    </div>
                    {activeMaintenances.length > 1 && <Separator />}
                  </>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-heading text-xl font-semibold">
              Historial de Mantenimientos
            </CardTitle>
            <CardDescription>Trabajos completados anteriormente</CardDescription>
          </CardHeader>
          <CardContent>
            {completedMaintenances.length > 0 ? (
              <div className="space-y-4">
                {completedMaintenances.map(maintenance => (
                  <div key={maintenance.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{maintenance.description}</h4>
                      <Badge>Completado</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Mecánico: {maintenance.mechanic.name} •{' '}
                      {maintenance.completedDate
                        ? new Date(maintenance.completedDate).toLocaleDateString()
                        : 'Fecha no disponible'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">
                        Costo total: ${maintenance.totalCost.toLocaleString()}
                      </span>
                      <Button asChild variant="outline" size="sm" className="bg-transparent">
                        <Link href={`/mechanic/maintenance/${maintenance.id}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-32 flex items-center justify-center ">
                <p className="text-muted-foreground text-xs">No hay mantenimientos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-heading text-xl font-semibold">
              Documentos del Vehículo
            </CardTitle>
            <CardDescription>SOAT, tecnomecánico y otros documentos</CardDescription>
          </CardHeader>
          <CardContent>
            {car.documents.length > 0 ? (
              <div className="space-y-3">
                {car.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{doc.docType}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileName} • Subido: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.expiryDate && (
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(doc.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm" className="bg-transparent">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-xs h-32 flex items-center justify-center">
                No hay documentos disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
