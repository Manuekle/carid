'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, FileText, MessageSquare, Wrench } from 'lucide-react';
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
    createdAt: string;
  }[];
  documents: {
    id: string;
  }[];
}

export default function OwnerDashboard() {
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

  const totalMaintenances = cars.reduce((sum, car) => sum + car.maintenanceLogs.length, 0);
  const totalDocuments = cars.reduce((sum, car) => sum + car.documents.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">
            Bienvenido, {session?.user.name}
          </h1>
          <p className="text-muted-foreground text-xs">Gestiona tus vehículos y mantenimientos</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/owner/vehicles/add">Agregar Vehículo</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Vehículos Registrados</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{cars.length}</div>
            <p className="text-xs text-muted-foreground">Total de vehículos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Mantenimientos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalMaintenances}</div>
            <p className="text-xs text-muted-foreground">Historial de reparaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">SOAT, tecnomecánico, etc.</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Gestionar Vehículos
            </CardTitle>
            <CardDescription>Ver y administrar todos tus vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard/owner/vehicles">Ver Vehículos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Documentos
            </CardTitle>
            <CardDescription>Subir y gestionar documentos de tus vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard/owner/documents">Gestionar Documentos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Chat con Mecánicos
            </CardTitle>
            <CardDescription>Comunicarte con los mecánicos de tus vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className="w-full">
              <Link href="/dashboard/owner/chat">Abrir Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-heading">Tus Vehículos</CardTitle>
          <CardDescription className="text-xs">
            Lista de todos tus vehículos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cars.length > 0 ? (
            <div className="space-y-4">
              {cars.map(car => (
                <div
                  key={car.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="text-xl font-semibold tracking-heading">
                      {car.brand} {car.model} ({car.year})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Placa: {car.licensePlate} • Color: {car.color}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {car.maintenanceLogs.length} mantenimientos • {car.documents.length}{' '}
                      documentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {car.maintenanceLogs.some(log => log.status === 'IN_PROGRESS')
                        ? 'En Taller'
                        : 'Disponible'}
                    </Badge>
                    <Button asChild variant="outline" size="sm" className="bg-transparent">
                      <Link href={`/dashboard/owner/vehicles/${car.id}`}>Ver Detalles</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4 text-xs">
                No tienes vehículos registrados aún
              </p>
              <Button asChild>
                <Link href="/dashboard/owner/vehicles/add">Agregar tu primer vehículo</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
