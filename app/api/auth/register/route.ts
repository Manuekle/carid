import { type NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, role } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role as UserRole,
        isApproved: role === UserRole.MECHANIC ? false : true, // Mechanics need approval
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message:
        role === UserRole.MECHANIC
          ? 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.'
          : 'Registro exitoso',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
