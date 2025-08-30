'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import PartsSelector from '@/components/parts-selector';
import { Car } from '@/types';
import { LoadingPage } from '@/components/ui/loading';

interface SelectedPart {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  photoUrl: string | null;
  quantity: number;
}

interface NewMaintenancePageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

interface FormData {
  description: string;
  laborCost: string;
  estimatedTime: string;
}

export default function NewMaintenancePage({ params }: NewMaintenancePageProps) {
  const { id } = use(Promise.resolve({ id: params.id })) as { id: string };
  const [car, setCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState<FormData>({
    description: '',
    laborCost: '',
    estimatedTime: '',
  });
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCar, setIsLoadingCar] = useState<boolean>(true);
  const router = useRouter();

  const fetchCar = useCallback(async () => {
    try {
      const response = await fetch(`/api/cars/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCar(data.car);
      } else {
        setError('Error al cargar información del vehículo');
      }
    } catch (error) {
      setError('Error al cargar información del vehículo');
    } finally {
      setIsLoadingCar(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCar();
  }, [fetchCar]);

  const getPartsCost = (): number => {
    return selectedParts.reduce(
      (sum: number, part: SelectedPart) => sum + part.price * part.quantity,
      0
    );
  };

  const getLaborCost = () => {
    return Number.parseFloat(formData.laborCost) || 0;
  };

  const getTotalCost = () => {
    return getPartsCost() + getLaborCost();
  };

  const getMechanicShare = () => {
    return getTotalCost() * 0.6;
  };

  const getAdminShare = () => {
    return getTotalCost() * 0.4;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.description.trim()) {
      setError('La descripción del trabajo es requerida');
      setIsLoading(false);
      return;
    }

    if (getLaborCost() <= 0) {
      setError('El costo de mano de obra debe ser mayor a 0');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carId: id,
          description: formData.description,
          laborCost: getLaborCost(),
          estimatedTime: Number.parseInt(formData.estimatedTime) || null,
          parts: selectedParts.map(part => ({
            partId: part.id,
            quantity: part.quantity,
            unitPrice: part.price,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/mechanic/maintenance/${data.maintenance.id}`);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al crear el mantenimiento');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCar) {
    return <LoadingPage />;
  }

  if (!car) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
        if (typeof window !== 'undefined') {
          toast.error('No se pudo cargar la información del vehículo');
        }
      `,
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Nueva Reparación</h1>
          <p className="text-muted-foreground text-xs">
            {car.brand} {car.model} ({car.year}) • Placa: {car.licensePlate}
          </p>
          <p className="text-xs text-muted-foreground">Propietario: {car.owner.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && toast.error(error)}

          {/* Work Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Descripción del Trabajo
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Detalla el trabajo que se realizará en el vehículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Mantenimiento</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  className="text-xs resize-none"
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Ej: Cambio de aceite y filtro, revisión de frenos..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Costo de Mano de Obra (COP)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    min="0"
                    step="1000"
                    className="text-xs"
                    value={formData.laborCost}
                    onChange={e => setFormData({ ...formData, laborCost: e.target.value })}
                    required
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Tiempo Estimado (horas)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    min="0"
                    step="0.5"
                    className="text-xs"
                    value={formData.estimatedTime}
                    onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parts Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Selección de Repuestos
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Elige los repuestos que se utilizarán en la reparación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartsSelector selectedParts={selectedParts} onPartsChange={setSelectedParts} />
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Resumen de Costos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Costo de Repuestos:</span>
                  <span className="font-medium text-xs">${getPartsCost().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Mano de Obra:</span>
                  <span className="font-medium text-xs">${getLaborCost().toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-xs font-medium">Total:</span>
                  <span className="text-xs font-medium">${getTotalCost().toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <h4 className="font-medium text-foreground">Distribución de Ganancias:</h4>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Tu parte (60%):</span>
                  <span className="font-medium">${getMechanicShare().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Administración (40%):</span>
                  <span className="font-medium">${getAdminShare().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || getTotalCost() <= 0} className="flex-1">
              {isLoading ? 'Creando...' : 'Iniciar Reparación'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="bg-transparent"
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
