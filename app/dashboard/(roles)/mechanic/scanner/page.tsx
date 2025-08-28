'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/qr-scanner';
import { Card, CardContent } from '@/components/ui/card';

export default function ScannerPage() {
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleScan = async (result: { carId: string; vin: string; timestamp: string }) => {
    setIsProcessing(true);
    setError('');

    try {
      // Verify car exists in database
      const response = await fetch(`/api/cars/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carId: result.carId, vin: result.vin, timestamp: result.timestamp }),
      });

      if (response.ok) {
        const { car } = await response.json();
        // Redirect to car details page
        router.push(`/mechanic/car/${car.id}`);
      } else {
        const { error } = await response.json();
        setError(error || 'Código QR inválido');
      }
    } catch (err) {
      console.error('Error processing QR:', err);
      setError('Código QR inválido o formato incorrecto');
    } finally {
      setIsProcessing(false);
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

        {/* Processing State */}
        {isProcessing && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Procesando código QR...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
