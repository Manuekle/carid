import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getMechanicMaintenanceHistory } from '@/lib/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Wrench, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function MechanicHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MECHANIC') {
    redirect('/auth/login');
  }

  const maintenanceHistory = await getMechanicMaintenanceHistory(session.user.id);

  const completedJobs = maintenanceHistory.filter(job => job.status === 'COMPLETED');
  const inProgressJobs = maintenanceHistory.filter(job => job.status === 'IN_PROGRESS');
  const totalEarnings = completedJobs.reduce(
    (sum, job) => sum + (job.invoice?.mechanicShare || 0),
    0
  );

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Historial de Trabajos</h1>
          <p className="text-muted-foreground text-xs">
            Todos tus mantenimientos y reparaciones realizadas
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Trabajos Completados</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{completedJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">En Progreso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{inProgressJobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Ganancias Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">${totalEarnings.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-heading">
              Historial Completo
            </CardTitle>
            <CardDescription>{maintenanceHistory.length} trabajo(s) registrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceHistory.length > 0 ? (
              <div className="space-y-4">
                {maintenanceHistory.map(job => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">
                          {job.car.brand} {job.car.model} ({job.car.year})
                        </h4>
                        <Badge variant={job.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {job.status === 'COMPLETED' ? 'Completado' : 'En Progreso'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{job.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Propietario: {job.car.owner.name} • Placa: {job.car.licensePlate}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.status === 'COMPLETED' && job.completedDate
                          ? `Completado: ${new Date(job.completedDate).toLocaleDateString()}`
                          : `Iniciado: ${new Date(job.startDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <p className="font-medium">${job.totalCost.toLocaleString()}</p>
                        {job.invoice && (
                          <p className="text-xs text-green-600">
                            Tu parte: ${job.invoice.mechanicShare.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm" className="bg-transparent">
                        <Link href={`/mechanic/maintenance/${job.id}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-xs">No tienes trabajos registrados aún</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
