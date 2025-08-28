import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getDailyStats, getPendingMechanics } from '@/lib/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Wrench, Users, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const today = new Date();
  const dailyStats = await getDailyStats(today);
  const pendingMechanics = await getPendingMechanics();

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-card">Dashboard Administrativo</h1>
          <p className="text-muted-foreground text-xs">
            Resumen de actividades y estadísticas del día
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Ingresos del Día</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                ${dailyStats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Tu parte: ${dailyStats.adminShare.toLocaleString()} (40%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Reparaciones Completadas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{dailyStats.completedMaintenances}</div>
              <p className="text-xs text-muted-foreground">Trabajos finalizados hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Mecánicos Pendientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingMechanics.length}</div>
              <p className="text-xs text-muted-foreground">Esperando aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Ganancia Mecánicos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                ${dailyStats.mechanicShare.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">60% de ingresos totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Mechanics */}
        {pendingMechanics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mecánicos Pendientes de Aprobación</CardTitle>
              <CardDescription>
                Revisa y aprueba las solicitudes de registro de mecánicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMechanics.map(mechanic => (
                  <div
                    key={mechanic.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{mechanic.name}</h4>
                      <p className="text-xs text-muted-foreground">{mechanic.email}</p>
                      <p className="text-xs text-muted-foreground">{mechanic.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pendiente</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs">
                <p>• Gestionar inventario de repuestos</p>
                <p>• Aprobar nuevos mecánicos</p>
                <p>• Ver reportes detallados</p>
                <p>• Configurar precios y comisiones</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs">
                <p>• Sistema de códigos QR activo</p>
                <p>• Inventario sincronizado</p>
                <p>• Facturación automática</p>
                <p>• Chat en tiempo real</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
