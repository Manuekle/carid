'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Wrench, FileText, QrCode } from 'lucide-react';
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
  createdAt: string;
  maintenanceLogs: {
    id: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    createdAt: string;
  }[];
  documents: {
    id: string;
  }[];
}

export default function VehiclesPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Mis Vehículos</h1>
          <p className="text-muted-foreground text-xs">Gestiona todos tus vehículos registrados</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/owner/vehicles/add">Agregar Vehículo</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Vehículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{cars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">En Taller</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {
                cars.filter(car => car.maintenanceLogs.some(log => log.status === 'IN_PROGRESS'))
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Mantenimientos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {cars.reduce((sum, car) => sum + car.maintenanceLogs.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {cars.reduce((sum, car) => sum + car.documents.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Grid */}
      {cars.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cars.map(car => {
            const isInMaintenance = car.maintenanceLogs.some(log => log.status === 'IN_PROGRESS');
            const lastMaintenance = car.maintenanceLogs.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            return (
              <Card key={car.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold tracking-heading">
                        {car.brand} {car.model}
                      </CardTitle>
                      <CardDescription>
                        {car.year} • {car.color} • {car.licensePlate}
                      </CardDescription>
                    </div>
                    <Badge variant={isInMaintenance ? 'destructive' : 'secondary'}>
                      {isInMaintenance ? 'En Taller' : 'Disponible'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Mantenimientos:</span>
                      <p className="font-medium">{car.maintenanceLogs.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documentos:</span>
                      <p className="font-medium">{car.documents.length}</p>
                    </div>
                  </div>

                  {lastMaintenance && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Último mantenimiento:</span>
                      <p className="font-medium">
                        {new Date(lastMaintenance.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link href={`/dashboard/owner/vehicles/${car.id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
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
              Agrega tu primer vehículo para comenzar a gestionar su historial
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
