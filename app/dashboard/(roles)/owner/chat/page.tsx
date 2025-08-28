import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getCarsByOwner } from '@/lib/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Car, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerChatPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'OWNER') {
    redirect('/auth/login');
  }

  const cars = await getCarsByOwner(session.user.id);

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Chat con Mecánicos</h1>
          <p className="text-muted-foreground text-xs">
            Comunícate directamente con los mecánicos que trabajan en tus vehículos
          </p>
        </div>

        {/* Vehicle Chat List */}
        {cars.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cars.map(car => {
              const hasActiveMaintenances = car.maintenanceLogs.some(
                log => log.status === 'IN_PROGRESS'
              );

              return (
                <Card key={car.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold flex items-center gap-2 tracking-heading">
                          <Car className="h-5 w-5" />
                          {car.brand} {car.model}
                        </CardTitle>
                        <CardDescription>
                          {car.year} • {car.color} • {car.licensePlate}
                        </CardDescription>
                      </div>
                      {hasActiveMaintenances && (
                        <div
                          className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
                          title="Mantenimiento activo"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      {hasActiveMaintenances ? (
                        <p>Mantenimiento en progreso - Chat disponible</p>
                      ) : (
                        <p>Sin mantenimientos activos</p>
                      )}
                    </div>

                    <Button
                      asChild
                      variant={hasActiveMaintenances ? 'default' : 'outline'}
                      className="w-full"
                      disabled={!hasActiveMaintenances}
                    >
                      <Link href={`/dashboard/owner/chat/${car.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {hasActiveMaintenances ? 'Abrir Chat' : 'Chat no disponible'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes vehículos registrados</h3>
              <p className="text-muted-foreground mb-6">
                Necesitas registrar un vehículo para poder chatear con mecánicos
              </p>
              <Button asChild>
                <Link href="/dashboard/owner/vehicles/add">Agregar Vehículo</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
