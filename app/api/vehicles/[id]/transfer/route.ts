import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface VehicleTransferParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: VehicleTransferParams) {
  try {
    const { id: carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { buyerEmail, salePrice, notes } = await request.json();

    // Validaciones básicas
    if (!buyerEmail || !salePrice) {
      return NextResponse.json(
        {
          error: 'Email del comprador y precio son obligatorios',
        },
        { status: 400 }
      );
    }

    if (salePrice <= 0) {
      return NextResponse.json(
        {
          error: 'El precio debe ser mayor a cero',
        },
        { status: 400 }
      );
    }

    // Verificar que el vehículo pertenece al usuario
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        ownerId: session.user.id,
      },
    });

    if (!car) {
      return NextResponse.json(
        {
          error: 'Vehículo no encontrado o no autorizado',
        },
        { status: 404 }
      );
    }

    // Verificar que no hay un traspaso activo para este vehículo
    const existingTransfer = await prisma.vehicleTransfer.findFirst({
      where: {
        carId,
        status: {
          in: ['PENDING_SELLER_DOCUMENTS', 'PENDING_BUYER_ACCEPTANCE', 'PENDING_ADMIN_APPROVAL'],
        },
      },
    });

    if (existingTransfer) {
      return NextResponse.json(
        {
          error: 'Ya existe un proceso de traspaso activo para este vehículo',
        },
        { status: 400 }
      );
    }

    // Buscar al comprador
    const buyer = await prisma.user.findUnique({
      where: { email: buyerEmail.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!buyer) {
      return NextResponse.json(
        {
          error: 'No se encontró un usuario con ese email',
        },
        { status: 404 }
      );
    }

    if (buyer.role !== 'OWNER') {
      return NextResponse.json(
        {
          error: 'El comprador debe ser un propietario de vehículo registrado',
        },
        { status: 400 }
      );
    }

    if (buyer.id === session.user.id) {
      return NextResponse.json(
        {
          error: 'No puede transferir un vehículo a usted mismo',
        },
        { status: 400 }
      );
    }

    // Verificar perfil del vendedor
    const sellerProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!sellerProfile?.documentNumber || !sellerProfile?.city) {
      return NextResponse.json(
        {
          error:
            'Debe completar su perfil (documento de identidad y ciudad) antes de iniciar un traspaso',
        },
        { status: 400 }
      );
    }

    // Verificar perfil del comprador
    if (!buyer.profile?.documentNumber || !buyer.profile?.city) {
      return NextResponse.json(
        {
          error: 'El comprador debe completar su perfil (documento de identidad y ciudad)',
        },
        { status: 400 }
      );
    }

    // Crear el traspaso
    const transfer = await prisma.vehicleTransfer.create({
      data: {
        carId,
        sellerId: session.user.id,
        sellerProfileId: sellerProfile.id,
        buyerId: buyer.id,
        buyerProfileId: buyer.profile.id,
        salePrice: Number(salePrice),
        notes: notes?.trim() || null,
        status: 'PENDING_BUYER_ACCEPTANCE',
        transferDate: new Date(),
      },
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sellerProfile: {
          select: {
            city: true,
            department: true,
            documentType: true,
          },
        },
        buyerProfile: {
          select: {
            city: true,
            department: true,
            documentType: true,
          },
        },
      },
    });

    // TODO: Enviar notificación por email al comprador
    // await sendTransferNotificationEmail(buyer.email, transfer);

    return NextResponse.json({
      message: 'Proceso de traspaso iniciado exitosamente. El comprador recibirá una notificación.',
      transfer,
    });
  } catch (error) {
    console.error('Error starting transfer:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: VehicleTransferParams) {
  try {
    const { id: carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let whereClause: any = { carId };

    // Solo admin puede ver todos los traspasos
    if (session.user.role !== 'ADMIN') {
      whereClause = {
        carId,
        OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }],
      };
    }

    const transfer = await prisma.vehicleTransfer.findFirst({
      where: whereClause,
      include: {
        car: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sellerProfile: true,
        buyerProfile: true,
        documents: {
          include: {
            uploader: { select: { name: true } },
            verifier: { select: { name: true } },
          },
          orderBy: { uploadedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transfer });
  } catch (error) {
    console.error('Error fetching transfer:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
