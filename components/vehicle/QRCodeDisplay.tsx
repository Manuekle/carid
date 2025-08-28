import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface QRCodeDisplayProps {
  qrCode: string;
  vehicleName: string;
  className?: string;
}

export function QRCodeDisplay({ qrCode, vehicleName, className = '' }: QRCodeDisplayProps) {
  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-${vehicleName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrCode) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <Image
          src={qrCode}
          alt={`QR Code for ${vehicleName}`}
          width={200}
          height={200}
          className="w-full h-auto max-w-xs"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  );
}
