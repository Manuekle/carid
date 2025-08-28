import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    carId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user has access to this car's chat
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        OR: [
          { ownerId: session.user.id }, // Owner can access
          {
            maintenanceLogs: {
              some: {
                mechanicId: session.user.id,
                status: 'IN_PROGRESS',
              },
            },
          }, // Mechanic working on the car can access
        ],
      },
    });

    if (!car) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Get or create chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: { carId },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: { carId },
      });

      // Add participants to the chat session
      const owner = await prisma.car.findUnique({
        where: { id: carId },
        select: { ownerId: true },
      });

      const activeMaintenance = await prisma.maintenanceLog.findFirst({
        where: {
          carId,
          status: 'IN_PROGRESS',
        },
        select: { mechanicId: true },
      });

      if (owner) {
        await prisma.userChatSession.create({
          data: {
            userId: owner.ownerId,
            chatSessionId: chatSession.id,
          },
        });
      }

      if (activeMaintenance) {
        await prisma.userChatSession.create({
          data: {
            userId: activeMaintenance.mechanicId,
            chatSessionId: chatSession.id,
          },
        });
      }
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: chatSession.id },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { sentAt: 'asc' },
    });

    const formattedMessages = messages.map(message => ({
      id: message.id,
      message: message.message,
      senderId: message.senderId,
      senderName: message.sender.name,
      sentAt: message.sentAt.toISOString(),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // Verify user has access to this car's chat
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        OR: [
          { ownerId: session.user.id },
          {
            maintenanceLogs: {
              some: {
                mechanicId: session.user.id,
                status: 'IN_PROGRESS',
              },
            },
          },
        ],
      },
    });

    if (!car) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Get or create chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: { carId },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: { carId },
      });
    }

    // Create message
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        senderId: session.user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: {
        id: newMessage.id,
        message: newMessage.message,
        senderId: newMessage.senderId,
        senderName: newMessage.sender.name,
        sentAt: newMessage.sentAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
