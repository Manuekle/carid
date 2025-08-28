import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import ChatInterface from '@/components/chat/chat-interface';

interface MechanicChatPageProps {
  params: {
    carId: string;
  };
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
          <Button asChild variant="outline" size="sm">
            <Link href="/mechanic/chat">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">
              Chat con {maintenance.car.owner.name}
            </h1>
            <p className="text-muted-foreground text-xs">
              {maintenance.car.brand} {maintenance.car.model} • {maintenance.car.licensePlate}
            </p>
          </div>
        </div>

        <ChatInterface
          carId={maintenance.car.id}
          currentUserId={session.user.id}
          otherUser={maintenance.car.owner}
        />
      </div>
    </>
  );
}
