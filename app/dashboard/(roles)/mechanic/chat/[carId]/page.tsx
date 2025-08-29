import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import ChatInterface from '@/components/chat/chat-interface';

interface MechanicChatPageProps {
  params: { carId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function MechanicChatPage({ params }: MechanicChatPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MECHANIC') {
    redirect('/auth/login');
  }

  const maintenance = await prisma.maintenanceLog.findFirst({
    where: {
      carId: params.carId,
      mechanicId: session.user.id,
      status: 'IN_PROGRESS',
    },
    include: {
      car: {
        include: {
          owner: {
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

  if (!maintenance) {
    notFound();
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">
              Chat con {maintenance.car.owner.name || 'Propietario'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {maintenance.car.brand} {maintenance.car.model} • {maintenance.car.licensePlate}
            </p>
          </div>
        </div>

        <ChatInterface
          carId={maintenance.car.id}
          currentUserId={session.user.id}
          otherUser={{
            id: maintenance.car.ownerId,
            name: maintenance.car.owner.name,
            email: maintenance.car.owner.email,
          }}
        />
      </div>
    </>
  );
}
