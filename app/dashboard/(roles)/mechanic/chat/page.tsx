'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Car, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LoadingPage } from '@/components/ui/loading';

interface MaintenanceData {
  id: string;
  description: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    owner: {
      name: string;
    };
  };
}

export default function MechanicChatPage() {
  const { data: session } = useSession();
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        const response = await fetch('/api/mechanic/maintenance/history');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceLogs(data.maintenanceHistory);
        }
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user.role === 'MECHANIC') {
      fetchMaintenanceData();
    }
  }, [session]);

  if (loading) {
    return <LoadingPage />;
  }

  const activeMaintenances = maintenanceLogs.filter(log => log.status === 'IN_PROGRESS');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-heading">Chat con Propietarios</h1>
        <p className="text-muted-foreground text-xs">
          Comunícate con los propietarios de los vehículos en los que estás trabajando
        </p>
      </div>

      {/* Active Maintenance Chats */}
      {activeMaintenances.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeMaintenances.map(maintenance => (
            <Card key={maintenance.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold tracking-heading flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      {maintenance.car.brand} {maintenance.car.model}
                    </CardTitle>
                    <CardDescription>
                      {maintenance.car.year} • {maintenance.car.licensePlate}
                    </CardDescription>
                  </div>
                  <div
                    className="w-3 h-3 bg-green-500 rounded-full animate-pulse"
                    title="Mantenimiento activo"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs">
                  <p className="font-medium">Propietario: {maintenance.car.owner.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Trabajo: {maintenance.description}
                  </p>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/dashboard/mechanic/chat/${maintenance.car.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir Chat
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center h-[calc(100vh-20rem)] flex flex-col items-center justify-center">
            <h3 className="text-xs ">No tienes mantenimientos activos</h3>
            <p className="text-xs text-muted-foreground pb-4">
              El chat estará disponible cuando tengas trabajos en progreso
            </p>
            <Button asChild variant="default">
              <Link href="/dashboard/mechanic/scanner">Escanear QR para iniciar trabajo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
