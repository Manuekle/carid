'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode } from 'lucide-react';

export default function AddVehiclePage() {
  const [formData, setFormData] = useState({
    vin: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/cars/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          year: Number.parseInt(formData.year),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCodeUrl);
        // Don't redirect immediately, show QR code first
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error al registrar vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (qrCode) {
    return (
      <>
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-heading">¡Vehículo Registrado!</h1>
            <p className="text-muted-foreground text-xs">
              Tu vehículo ha sido registrado exitosamente
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR del Vehículo
              </CardTitle>
              <CardDescription>
                Guarda este código QR para que los mecánicos puedan acceder al historial
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrCode || '/placeholder.svg'}
                  alt="QR Code del vehículo"
                  className="w-64 h-64 border rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCode;
                    link.download = `qr-${formData.licensePlate}.png`;
                    link.click();
                  }}
                  className="w-full"
                >
                  Descargar Código QR
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/owner')}
                  className="w-full bg-transparent"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Marca:</span>
                  <p className="font-medium">{formData.brand}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Modelo:</span>
                  <p className="font-medium">{formData.model}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Año:</span>
                  <p className="font-medium">{formData.year}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <p className="font-medium">{formData.color}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Placa:</span>
                  <p className="font-medium">{formData.licensePlate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">VIN:</span>
                  <p className="font-medium">{formData.vin}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-heading">Agregar Vehículo</h1>
          <p className="text-muted-foreground text-xs">Registra un nuevo vehículo en tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Información del Vehículo
            </CardTitle>
            <CardDescription className="text-xs">
              Completa todos los campos para registrar tu vehículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    className="text-xs"
                    value={formData.brand}
                    onChange={e => handleInputChange('brand', e.target.value)}
                    required
                    placeholder="Toyota, Honda, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    className="text-xs"
                    value={formData.model}
                    onChange={e => handleInputChange('model', e.target.value)}
                    required
                    placeholder="Corolla, Civic, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    className="text-xs"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={e => handleInputChange('year', e.target.value)}
                    required
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    className="text-xs"
                    value={formData.color}
                    onChange={e => handleInputChange('color', e.target.value)}
                    required
                    placeholder="Blanco, Negro, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa</Label>
                <Input
                  id="licensePlate"
                  className="text-xs"
                  value={formData.licensePlate}
                  onChange={e => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                  required
                  placeholder="ABC123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN (Número de Identificación Vehicular)</Label>
                <Input
                  id="vin"
                  className="text-xs"
                  value={formData.vin}
                  onChange={e => handleInputChange('vin', e.target.value.toUpperCase())}
                  required
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                />
                <p className="text-xs text-muted-foreground">17 caracteres alfanuméricos</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Vehículo'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
