import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import ChatInterface from '@/components/chat/chat-interface';
import { Card, CardContent } from '@/components/ui/card';

interface ChatPageProps {
  params: { carId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CarChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'OWNER') {
    redirect('/auth/login');
  }

  const car = await prisma.car.findFirst({
    where: {
      id: params.carId,
      ownerId: session.user.id,
    },
    include: {
      maintenanceLogs: {
        where: {
          status: 'IN_PROGRESS',
        },
        include: {
          mechanic: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!car) {
    notFound();
  }

  const activeMaintenance = car.maintenanceLogs[0];

  if (!activeMaintenance) {
    return (
      <>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-heading">Chat no disponible</h1>
              <p className="text-muted-foreground text-xs">
                {car.brand} {car.model} • {car.licensePlate}
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="text-center h-[calc(100vh-20rem)] flex flex-col items-center justify-center">
              <p className="text-xs pb-1">No hay mantenimientos activos para este vehículo.</p>
              <p className="text-xs text-muted-foreground pb-6">
                El chat estará disponible cuando un mecánico esté trabajando en tu vehículo.
              </p>
              <Button asChild variant="default">
                <Link href="/dashboard/mechanic/scanner">Escanear QR para iniciar trabajo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">
              Chat con {activeMaintenance.mechanic?.name || 'Mecánico'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {car.brand} {car.model} • {car.licensePlate}
            </p>
          </div>
        </div>

        <ChatInterface
          carId={car.id}
          currentUserId={session.user.id}
          otherUser={{
            id: activeMaintenance.mechanicId,
            name: activeMaintenance.mechanic?.name || 'Mecánico',
            email: activeMaintenance.mechanic?.email || null,
          }}
        />
      </div>
    </>
  );
}
