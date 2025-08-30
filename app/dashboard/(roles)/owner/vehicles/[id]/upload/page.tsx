'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, AlertCircle, CloudUpload } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import Link from 'next/link';
import { LoadingPage } from '@/components/ui/loading';

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
}

const DOCUMENT_TYPES = [
  { value: 'SOAT', label: 'SOAT' },
  { value: 'TECNOMECANICO', label: 'Revisión Tecnomecánica' },
  { value: 'TARJETA_PROPIEDAD', label: 'Tarjeta de Propiedad' },
  { value: 'REVISION_GASES', label: 'Revisión de Gases' },
  { value: 'POLIZA_SEGURO', label: 'Póliza de Seguro' },
  { value: 'LICENCIA_TRANSITO', label: 'Licencia de Tránsito' },
  { value: 'OTHER', label: 'Otros' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export default function UploadDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const vehicleId = resolvedParams.id;

  const [car, setCar] = useState<CarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    documentType: '',
    file: null as File | null,
    expiryDate: undefined as Date | undefined,
    customName: '',
  });

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
      router.push('/dashboard');
      return;
    }

    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Vehículo no encontrado');
          } else if (response.status === 403) {
            setError('No tienes permisos para ver este vehículo');
          } else {
            throw new Error('Error al obtener el vehículo');
          }
          return;
        }

        const data = await response.json();
        setCar(data);
      } catch (error) {
        console.error('Error al obtener el vehículo:', error);
        setError('Error al cargar los detalles del vehículo');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchCar();
    }
  }, [vehicleId, router, session, status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se aceptan PDF, JPG, PNG y WebP.');
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.documentType) {
      setError('Por favor selecciona el tipo de documento');
      return false;
    }

    if (!formData.file) {
      setError('Por favor selecciona un archivo');
      return false;
    }

    if (formData.expiryDate && new Date(formData.expiryDate) < new Date()) {
      setError('La fecha de vencimiento no puede ser en el pasado');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('documentType', formData.documentType);
      formDataToSend.append('file', formData.file as Blob);
      if (formData.expiryDate) {
        formDataToSend.append('expiryDate', formData.expiryDate.toISOString().split('T')[0]);
      }

      if (formData.customName.trim()) {
        formDataToSend.append('customName', formData.customName.trim());
      }

      const response = await fetch(`/api/cars/${vehicleId}/documents`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al subir el documento');
      }

      toast.success('Documento subido exitosamente');
      router.push(`/dashboard/owner/vehicles/${vehicleId}`);
    } catch (error) {
      console.error('Error al subir documento:', error);
      setError(error instanceof Error ? error.message : 'Error al subir el documento');
      toast.error('Error al subir el documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <LoadingPage />;
  }

  if (error && !car) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/owner/vehicles">Volver a Vehículos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Subir Documento</h1>
          {car && (
            <p className="text-muted-foreground text-xs">
              {car.brand} {car.model} • {car.licensePlate}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-card">
            Información del Documento
          </CardTitle>
          <CardDescription>
            Sube documentos importantes como SOAT, revisión tecnomecánica, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && toast.error(error)}

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento *</Label>
              <Select
                value={formData.documentType}
                onValueChange={value => setFormData(prev => ({ ...prev, documentType: value }))}
              >
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="Selecciona el tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name */}
            <div className="space-y-2">
              <Label htmlFor="customName">Nombre Personalizado (Opcional)</Label>
              <Input
                id="customName"
                className="text-xs"
                value={formData.customName}
                onChange={e => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                placeholder="Ej: SOAT 2024, Tecnomecánica Diciembre"
              />
              <p className="text-xs text-muted-foreground">
                Si no especificas un nombre, se usará el tipo de documento y la fecha
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Archivo *</Label>
              <div className="border border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <CloudUpload className="mx-auto h-12 w-12 mb-4 text-zinc-400" />
                  <div className="space-y-2">
                    <Label
                      htmlFor="file"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Seleccionar Archivo
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG, PNG o WebP (máximo 10MB)
                  </p>
                  {formData.file && (
                    <p className="text-xs font-medium mt-2 text-primary">
                      {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>Fecha de Vencimiento (Opcional)</Label>
              <DatePicker
                value={formData.expiryDate}
                onChange={date => setFormData(prev => ({ ...prev, expiryDate: date }))}
              />
              <p className="text-xs text-muted-foreground">
                Para documentos como SOAT que tienen fecha de vencimiento
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Subiendo...' : 'Subir Documento'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
