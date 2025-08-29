'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompleteMaintenanceButtonProps {
  maintenanceId: string;
}

export default function CompleteMaintenanceButton({
  maintenanceId,
}: CompleteMaintenanceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  const handleComplete = () => {
    setShowConfirmDialog(true);
  };

  const confirmComplete = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}/complete`, {
        method: 'PATCH',
      });

      if (response.ok) {
        router.refresh();
        toast.success('Mantenimiento completado exitosamente');
      } else {
        const data = await response.json();
        setError(data.error);
        toast.error(data.error);
      }
    } catch (error) {
      setError('Error al completar el mantenimiento');
      toast.error('Error al completar el mantenimiento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-heading">
              ¿Confirmar finalización?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              ¿Estás seguro de que quieres marcar este mantenimiento como completado? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete} className="text-xs">
              Marcar como Completado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleComplete} disabled={isLoading} variant="default" className="text-xs">
          {isLoading ? 'Completando...' : 'Completar Mantenimiento'}
        </Button>
      </div>
    </>
  );
}
