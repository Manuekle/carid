'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Car, User, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
}

interface TransferPageProps {
  params: Promise<{ id: string }>;
}

export default function TransferPage({ params }: TransferPageProps) {
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    buyerEmail: '',
    salePrice: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/cars/${id}`);
        const data = await response.json();

        if (response.ok) {
          setCar(data.car);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al cargar el vehículo' });
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const { id } = await params;
      const response = await fetch(`/api/vehicles/${id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        // Redirect to transfers list after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/owner/transfers');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al iniciar el traspaso' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-6">
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (typeof window !== 'undefined') {
            toast.error('No se pudo cargar la información del vehículo');
          }
        `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
          if (typeof window !== 'undefined') {
            toast.${message.type}('${message.text.replace(/'/g, "\\'")}');
          }
        `,
          }}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">Iniciar Traspaso</h1>
            <p className="text-muted-foreground text-xs">
              Inicia un proceso de traspaso de vehículo
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-gray-600 text-xs">Marca y Modelo:</span>
                <div className="font-medium text-xs">
                  {car.brand} {car.model}
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-xs">Año:</span>
                <div className="font-medium text-xs">{car.year}</div>
              </div>
              <div>
                <span className="text-gray-600 text-xs">Placa:</span>
                <div className="font-medium text-xs">{car.licensePlate}</div>
              </div>
              <div>
                <span className="text-gray-600 text-xs">VIN:</span>
                <div className="font-medium text-xs">{car.vin}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Información del Traspaso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Email del Comprador *</Label>
                <Input
                  id="buyerEmail"
                  name="buyerEmail"
                  type="email"
                  value={formData.buyerEmail}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  El comprador debe estar registrado como propietario en el sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Precio de Venta (COP) *</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  min="1"
                  max="1000000000"
                  step="1000"
                  value={formData.salePrice}
                  onChange={e => {
                    const value = e.target.value;
                    // Only update if the value is within the allowed range or empty
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 1000000000)) {
                      handleInputChange(e);
                    }
                  }}
                  onBlur={e => {
                    // Ensure the value is within bounds when input loses focus
                    const value = parseInt(e.target.value);
                    if (value > 1000000000) {
                      setFormData(prev => ({ ...prev, salePrice: '1000000000' }));
                    } else if (value < 1) {
                      setFormData(prev => ({ ...prev, salePrice: '1' }));
                    }
                  }}
                  placeholder="15000000"
                  required
                />
                <p className="text-xs text-muted-foreground">Máximo: 1,000,000,000 COP</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  className="text-xs resize-none"
                  onChange={handleInputChange}
                  placeholder="Información adicional sobre la venta..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-xs text-blue-900 mb-2">Proceso de Traspaso:</h4>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>El comprador recibirá una notificación por email</li>
                  <li>El comprador debe aceptar el traspaso</li>
                  <li>Ambas partes deben subir documentos requeridos</li>
                  <li>Un administrador revisará y aprobará el traspaso</li>
                  <li>El vehículo será transferido al nuevo propietario</li>
                </ol>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Iniciando Traspaso...' : 'Iniciar Proceso de Traspaso'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
