import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: user.profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      phone,
      documentType,
      documentNumber,
      address,
      city,
      department,
      birthDate,
      emergencyContact,
      emergencyPhone,
    } = data;

    // Validar campos obligatorios
    if (!name || !phone) {
      return NextResponse.json(
        {
          error: 'Nombre y teléfono son obligatorios',
        },
        { status: 400 }
      );
    }

    // Verificar si el documento ya existe (si se está actualizando)
    if (documentNumber) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: {
          documentNumber,
          userId: { not: session.user.id },
        },
      });

      if (existingProfile) {
        return NextResponse.json(
          {
            error: 'Ya existe un usuario con este número de documento',
          },
          { status: 400 }
        );
      }
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async tx => {
      // Actualizar datos básicos del usuario
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { name, phone },
      });

      // Crear o actualizar perfil extendido
      const updatedProfile = await tx.userProfile.upsert({
        where: { userId: session.user.id },
        update: {
          documentType,
          documentNumber,
          address,
          city,
          department,
          birthDate: birthDate ? new Date(birthDate) : null,
          emergencyContact,
          emergencyPhone,
        },
        create: {
          userId: session.user.id,
          documentType,
          documentNumber,
          address,
          city,
          department: department || 'Cauca',
          country: 'Colombia',
          birthDate: birthDate ? new Date(birthDate) : null,
          emergencyContact,
          emergencyPhone,
        },
      });

      return { user: updatedUser, profile: updatedProfile };
    });

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
      },
      profile: result.profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
