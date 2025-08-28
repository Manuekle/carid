import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-heading">
            Cuenta Pendiente de Aprobación
          </CardTitle>
          <CardDescription className="text-xs">
            Tu registro como mecánico ha sido recibido y está siendo revisado por nuestro equipo de
            administración.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              Recibirás una notificación por email una vez que tu cuenta sea aprobada. Este proceso
              puede tomar entre 24-48 horas.
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild variant="default" className="w-full">
              <Link href="/auth/login">Volver al Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
