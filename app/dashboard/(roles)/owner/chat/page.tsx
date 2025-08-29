'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Car, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LoadingPage } from '@/components/ui/loading';

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  maintenanceLogs: {
    id: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    mechanicId: string;
  }[];
}

export default function OwnerChatPage() {
  const { data: session } = useSession();
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch('/api/owner/cars');
        if (response.ok) {
          const data = await response.json();
          setCars(data.cars);
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.role === 'OWNER') {
      fetchCars();
    }
  }, [session]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
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
          <CardContent className="text-center h-96 flex flex-col justify-center items-center">
            <h3 className="text-xs">No tienes vehículos registrados</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Necesitas registrar un vehículo para poder chatear con mecánicos
            </p>
            <Button asChild>
              <Link href="/dashboard/owner/vehicles/add">Agregar Vehículo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
