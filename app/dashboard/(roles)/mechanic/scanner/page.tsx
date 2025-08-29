'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/qr-scanner';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ScannerPage() {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleScan = async (result: { carId: string; vin: string; timestamp: string }) => {
    setIsProcessing(true);
    setError('');

    toast.loading('Procesando código QR...');

    // Log the raw QR code data for debugging
    console.log('Processing QR code data:', result.carId);

    try {
      // Verify car exists in database - send the raw QR code data
      const response = await fetch(`/api/cars/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: result.carId }),
      });

      if (response.ok) {
        const { car } = await response.json();
        // Redirect to car details page
        toast.success('Código QR procesado correctamente');
        router.push(`/dashboard/mechanic/car/${car.id}`);
      } else {
        const { error } = await response.json();
        setError(error || 'Código QR inválido');
        toast.error(error || 'Código QR inválido');
      }
    } catch (err) {
      console.error('Error processing QR:', err);
      setError('Código QR inválido o formato incorrecto');
    } finally {
      setIsProcessing(false);
      toast.dismiss();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-heading">Escáner de Vehículos</h1>
          <p className="text-muted-foreground text-xs">
            Escanea el código QR del vehículo para acceder a su información
          </p>
        </div>

        {/* Scanner */}
        <QRScanner onScan={handleScan} onError={handleError} />
      </div>
    </>
  );
}
