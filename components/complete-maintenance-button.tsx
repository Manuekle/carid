'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
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
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Error al completar el mantenimiento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar finalización?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres marcar este mantenimiento como completado? Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Completado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleComplete} disabled={isLoading} variant="default">
          {isLoading ? 'Completando...' : 'Completar Mantenimiento'}
        </Button>
      </div>
    </>
  );
}
