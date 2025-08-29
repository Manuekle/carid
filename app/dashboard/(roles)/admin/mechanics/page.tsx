'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Mechanic {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
}

export default function MechanicsPage() {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<
    Record<string, 'approving' | 'rejecting' | null>
  >({});
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await fetch('/api/mechanic/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch mechanics');
        }
        const data = await response.json();
        setMechanics(data);
      } catch (error) {
        console.error('Error fetching mechanics:', error);
        toast.error('Error al cargar los mecánicos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  const handleStatusUpdate = async (mechanicId: string, action: 'approve' | 'reject') => {
    try {
      setLoadingStates(prev => ({
        ...prev,
        [mechanicId]: action === 'approve' ? 'approving' : 'rejecting',
      }));

      const endpoint = action === 'approve' ? '/api/mechanic/approved' : '/api/mechanic/rejected';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: mechanicId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} mechanic`);
      }

      // Remove the mechanic from the list
      setMechanics(prev => prev.filter(m => m.id !== mechanicId));

      toast.success(`Mecánico ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);
      // Refresh the list after a short delay to show the success message
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(`Error ${action}ing mechanic:`, error);
      toast.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el mecánico`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [mechanicId]: null }));
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Gestión de Mecánicos</h1>
          <p className="text-muted-foreground text-xs">
            Aprueba o rechaza solicitudes de registro de mecánicos
          </p>
        </div>

        {/* Pending Mechanics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
              Mecánicos Pendientes de Aprobación
            </CardTitle>
            <CardDescription>
              {mechanics.length} solicitud(es) esperando tu revisión
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading />
            ) : mechanics.length > 0 ? (
              <div className="space-y-4">
                {mechanics.map(mechanic => (
                  <div
                    key={mechanic.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-xs">{mechanic.name}</h4>
                      <p className="text-xs text-muted-foreground">{mechanic.email}</p>
                      <p className="text-xs text-muted-foreground">{mechanic.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        Registrado: {new Date(mechanic.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pendiente</Badge>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(mechanic.id, 'approve')}
                        disabled={!!loadingStates[mechanic.id]}
                      >
                        {loadingStates[mechanic.id] === 'approving' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {loadingStates[mechanic.id] === 'approving' ? 'Aprobando...' : 'Aprobar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(mechanic.id, 'reject')}
                        disabled={!!loadingStates[mechanic.id]}
                      >
                        {loadingStates[mechanic.id] === 'rejecting' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {loadingStates[mechanic.id] === 'rejecting' ? 'Rechazando...' : 'Rechazar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    No hay mecánicos pendientes de aprobación
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
