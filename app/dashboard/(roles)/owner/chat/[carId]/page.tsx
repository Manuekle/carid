import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import ChatInterface from '@/components/chat/chat-interface';

interface ChatPageProps {
  params: {
    carId: string;
  };
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

          <div className="text-center h-[calc(100vh-20rem)] flex items-center justify-center">
            <p className="text-muted-foreground text-xs">
              No hay mantenimientos activos para este vehículo. El chat estará disponible cuando un
              mecánico esté trabajando en tu vehículo.
            </p>
          </div>
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
              Chat con {activeMaintenance.mechanic.name}
            </h1>
            <p className="text-muted-foreground text-xs">
              {car.brand} {car.model} • {car.licensePlate}
            </p>
          </div>
        </div>

        <ChatInterface
          carId={car.id}
          currentUserId={session.user.id}
          otherUser={activeMaintenance.mechanic}
        />
      </div>
    </>
  );
}
