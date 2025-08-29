'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Download, Copy, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Importar QRCode de forma dinámica
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => (
    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <QrCode className="h-12 w-12 text-gray-400" />
    </div>
  ),
});

interface VehicleFormData {
  vin: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
}

interface CreatedVehicleData {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  qrCode: string;
}

const INITIAL_FORM_DATA: VehicleFormData = {
  vin: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  licensePlate: '',
};

export default function AddVehiclePage() {
  const [formData, setFormData] = useState<VehicleFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdVehicle, setCreatedVehicle] = useState<CreatedVehicleData | null>(null);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const requiredFields: (keyof VehicleFormData)[] = [
      'vin',
      'brand',
      'model',
      'year',
      'color',
      'licensePlate',
    ];
    const emptyFields = requiredFields.filter(field => !formData[field].trim());

    if (emptyFields.length > 0) {
      setError('Por favor completa todos los campos requeridos');
      return false;
    }

    if (formData.vin.length !== 17) {
      setError('El VIN debe tener exactamente 17 caracteres');
      return false;
    }

    const currentYear = new Date().getFullYear();
    const year = parseInt(formData.year);
    if (year < 1900 || year > currentYear + 1) {
      setError(`El año debe estar entre 1900 y ${currentYear + 1}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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
        setCreatedVehicle(data.car);
        setFormData(INITIAL_FORM_DATA);

        toast.success('¡Vehículo agregado exitosamente!', {
          duration: 4000,
        });
      } else {
        const errorMessage = data.error || 'Error al agregar el vehículo';
        setError(errorMessage);
        toast.error('Error al agregar vehículo', {
          duration: 5000,
        });
      }
    } catch (error) {
      const errorMessage = 'Error de conexión al agregar vehículo';
      setError(errorMessage);
      toast.error('Error de conexión', {
        duration: 5000,
      });
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!createdVehicle?.qrCode) return;

    try {
      // Crear un canvas temporal para generar la imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;

      // Buscar el SVG del QR en el DOM
      const qrElement = document.querySelector('#success-qr-code svg');
      if (qrElement) {
        const svgData = new XMLSerializer().serializeToString(qrElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(blob => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `qr-${createdVehicle.brand}-${createdVehicle.model}-${createdVehicle.licensePlate}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success('Código QR descargado');
            }
          });

          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      }
    } catch (error) {
      toast.error('Error al descargar', {
        duration: 5000,
      });
    }
  };

  const handleCopyQR = async () => {
    if (!createdVehicle?.qrCode) return;

    try {
      await navigator.clipboard.writeText(createdVehicle.qrCode);
      toast.success('Token QR copiado al portapapeles', {
        duration: 5000,
      });
    } catch (error) {
      toast.error('Error al copiar', {
        duration: 5000,
      });
    }
  };

  // Mostrar página de éxito con QR
  if (createdVehicle) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-heading">
              ¡Vehículo Agregado Exitosamente!
            </CardTitle>
            <CardDescription>
              Tu vehículo ha sido registrado en el sistema. Aquí tienes el código QR para acceso
              rápido.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div id="success-qr-code" className="p-4 bg-white rounded-lg shadow-sm border">
              <QRCode value={createdVehicle.qrCode} size={256} level="M" includeMargin={true} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg tracking-card">
                {createdVehicle.brand} {createdVehicle.model} ({createdVehicle.year})
              </h3>
              <p className="text-xs text-muted-foreground">
                Placa: {createdVehicle.licensePlate} • Color: {createdVehicle.color}
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-gray-100 px-4 py-2 rounded-md">
                {createdVehicle.qrCode}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar QR
              </Button>

              <Button variant="outline" onClick={handleCopyQR} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Token
              </Button>

              <Button
                onClick={() => router.push(`/dashboard/owner/vehicles/${createdVehicle.id}`)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver Detalles
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-4 border-t">
              <Button
                variant="default"
                onClick={() => router.push('/dashboard/owner/vehicles')}
                className="flex items-center gap-2"
              >
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar formulario
  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4">
      <div className="flex items-center space-x-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Agregar Nuevo Vehículo</h1>
          <p className="text-xs text-muted-foreground">Registra un nuevo vehículo en tu cuenta</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-card">
            Información del Vehículo
          </CardTitle>
          <CardDescription className="text-xs">
            Completa todos los campos para registrar tu vehículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={e => handleInputChange('brand', e.target.value)}
                  required
                  placeholder="Ej: Toyota, Honda, Chevrolet"
                  className="focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={e => handleInputChange('model', e.target.value)}
                  required
                  placeholder="Ej: Corolla, Civic, Spark"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Año *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={e => handleInputChange('year', e.target.value)}
                  required
                  placeholder="Ej: 2020"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={e => handleInputChange('color', e.target.value)}
                  required
                  placeholder="Ej: Blanco, Negro, Azul"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={e => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                  required
                  placeholder="Ej: ABC123"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="vin">VIN (Número de Identificación) *</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={e => handleInputChange('vin', e.target.value.toUpperCase())}
                  required
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                />
                <p className="text-xs text-muted-foreground">
                  Debe contener exactamente 17 caracteres alfanuméricos
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Agregando...
                    </>
                  ) : (
                    'Agregar Vehículo'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
