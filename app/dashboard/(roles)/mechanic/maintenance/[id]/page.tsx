import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wrench, Car, User, Package, Receipt, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import CompleteMaintenanceButton from '@/components/complete-maintenance-button';

import { Metadata, ResolvingMetadata } from 'next';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function MaintenancePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MECHANIC') {
    redirect('/auth/login');
  }

  const maintenance = await prisma.maintenanceLog.findUnique({
    where: { id: params.id },
    include: {
      car: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          maintenanceLogs: true,
          documents: true,
        },
      },
      mechanic: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      usedParts: {
        include: {
          part: true,
        },
      },
      invoice: true,
    },
  });

  if (!maintenance) {
    notFound();
  }

  // Only allow mechanic who created the maintenance to view it
  if (maintenance.mechanicId !== session.user.id) {
    redirect('/mechanic');
  }

  const isCompleted = maintenance.status === 'COMPLETED';

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between sm:flex-row flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">Detalle de Mantenimiento</h1>
            <p className="text-muted-foreground text-xs">
              {maintenance.car.brand} {maintenance.car.model} ({maintenance.car.year}) • Placa:{' '}
              {maintenance.car.licensePlate}
            </p>
          </div>
          <div className="flex sm:flex-row flex-col items-center gap-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href={`/dashboard/mechanic/car/${maintenance.carId}`}>Volver al Vehículo</Link>
            </Button>
            {!isCompleted && <CompleteMaintenanceButton maintenanceId={maintenance.id} />}
          </div>
        </div>

        {/* Status */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold text-xl tracking-heading">
                    {isCompleted ? 'Mantenimiento Completado' : 'Mantenimiento en Progreso'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isCompleted
                      ? `Completado el ${maintenance.completedDate ? new Date(maintenance.completedDate).toLocaleDateString() : 'N/A'}`
                      : `Iniciado el ${new Date(maintenance.startDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <Badge variant={isCompleted ? 'default' : 'secondary'}>
                {isCompleted ? 'Completado' : 'En Progreso'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle & Owner Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                  <Car className="h-5 w-5" />
                  Información del Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Marca:</span>
                  <span className="font-medium text-xs">{maintenance.car.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Modelo:</span>
                  <span className="font-medium text-xs">{maintenance.car.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Año:</span>
                  <span className="font-medium text-xs">{maintenance.car.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Placa:</span>
                  <span className="font-medium text-xs">{maintenance.car.licensePlate}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                  <User className="h-5 w-5" />
                  Propietario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Nombre:</span>
                  <span className="font-medium text-xs">{maintenance.car.owner.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Correo Electrónico:</span>
                  <span className="font-medium text-xs">{maintenance.car.owner.email}</span>
                </div>
                {maintenance.car.owner.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Teléfono:</span>
                    <span className="font-medium text-xs">{maintenance.car.owner.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Work Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                  <Wrench className="h-5 w-5" />
                  Detalles del Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-xs">Descripción:</span>
                  <p className="font-medium mt-1 text-xs">{maintenance.description}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Mecánico:</span>
                  <span className="font-medium text-xs">{maintenance.mechanic.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Fecha de inicio:</span>
                  <span className="font-medium text-xs">
                    {new Date(maintenance.startDate).toLocaleDateString()}
                  </span>
                </div>
                {maintenance.estimatedTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Tiempo estimado:</span>
                    <span className="font-medium text-xs">{maintenance.estimatedTime} horas</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Used Parts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                  <Package className="h-5 w-5" />
                  Repuestos Utilizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenance.usedParts.length > 0 ? (
                  <div className="space-y-3">
                    {maintenance.usedParts.map(
                      (usedPart: {
                        id: string;
                        part: { name: string };
                        unitPrice: number;
                        quantity: number;
                      }) => (
                        <div
                          key={usedPart.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-xs">{usedPart.part.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${usedPart.unitPrice.toLocaleString()} x {usedPart.quantity}
                            </p>
                          </div>
                          <span className="font-medium text-xs">
                            ${(usedPart.unitPrice * usedPart.quantity).toLocaleString()}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    No se utilizaron repuestos
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Invoice */}
        {maintenance.invoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Factura
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Desglose de costos y ganancias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs">Subtotal (Repuestos):</span>
                  <span className="font-medium text-xs">
                    ${maintenance.invoice.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Mano de Obra:</span>
                  <span className="font-medium text-xs">
                    ${maintenance.invoice.laborCost.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span className="text-xs">Total:</span>
                  <span className="text-xs">${maintenance.invoice.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-xs">Distribución de Ganancias:</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-xs">Tu parte (60%):</span>
                  <span className="font-medium text-xs">
                    ${maintenance.invoice.mechanicShare.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mecánico (40%):</span>
                  <span className="font-medium text-xs">
                    ${maintenance.invoice.adminShare.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
