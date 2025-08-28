'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share } from 'lucide-react';

interface QRActionsProps {
  qrCodeUrl: string;
  licensePlate: string;
  brand: string;
  model: string;
}

export function QRActions({ qrCodeUrl, licensePlate, brand, model }: QRActionsProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${licensePlate}.png`;
    link.click();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `QR Code - ${brand} ${model}`,
        text: `Código QR para el vehículo ${licensePlate}`,
        url: qrCodeUrl,
      });
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleDownload} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Descargar Código QR
      </Button>

      <Button variant="outline" onClick={handleShare} className="w-full">
        <Share className="h-4 w-4 mr-2" />
        Compartir
      </Button>
    </div>
  );
}

export default function QRCodePage() {
  // You might want to fetch this data or pass it as props
  const qrCodeUrl = ''; // Replace with actual QR code URL
  const licensePlate = ''; // Replace with actual license plate
  const brand = ''; // Replace with actual brand
  const model = ''; // Replace with actual model

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-semibold tracking-heading text-center mb-6">
        Código QR del Vehículo
      </h1>
      <Card className="p-6">
        <div className="flex justify-center mb-6">
          <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg">
            <p className="text-center text-gray-500">QR Code Image</p>
          </div>
        </div>
        <QRActions qrCodeUrl={qrCodeUrl} licensePlate={licensePlate} brand={brand} model={model} />
      </Card>
    </div>
  );
}
