'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { parseCarQR } from '@/lib/qr-generator';

interface QRScannerProps {
  onScan: (result: { carId: string; vin: string; timestamp: string }) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No se encontró cámara disponible');
          return;
        }

        const qrScanner = new QrScanner(
          videoRef.current,
          result => {
            try {
              const parsed = parseCarQR(result.data);
              onScan(parsed);
              setError('');
              stopScanning(); // detener al encontrar un QR válido
            } catch (err) {
              console.error(err);
              setError('Formato de QR inválido');
              onError?.('Formato de QR inválido');
              stopScanning(); // detener también si es inválido
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
          }
        );

        qrScannerRef.current = qrScanner;
      } catch (err) {
        console.error('Error initializing QR scanner:', err);
        setError('Error al inicializar el escáner');
        onError?.('Error al inicializar el escáner');
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [onScan, onError]);

  const startScanning = async () => {
    if (!qrScannerRef.current) return;
    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Error al iniciar el escáner. Verifica los permisos de cámara.');
      onError?.('Error al iniciar el escáner');
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const toggleScanning = () => {
    if (isScanning) stopScanning();
    else startScanning();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardDescription>Apunta la cámara hacia el código QR del vehículo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasCamera ? (
          <>
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">Presiona iniciar para comenzar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={toggleScanning}
                variant={isScanning ? 'destructive' : 'default'}
                className="w-full font-medium"
              >
                {isScanning ? <>Detener</> : <>Iniciar</>}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No se encontró cámara disponible</p>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>Asegúrate de permitir el acceso a la cámara cuando se solicite</p>
        </div>
      </CardContent>
    </Card>
  );
}
