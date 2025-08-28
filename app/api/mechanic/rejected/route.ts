import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Mechanic ID is required' }), {
        status: 400,
      });
    }

    const updatedMechanic = await prisma.user.update({
      where: { id },
      data: {
        role: 'MECHANIC',
        isApproved: false,
      },
    });

    return NextResponse.json(updatedMechanic);
  } catch (error) {
    console.error('Error rejecting mechanic:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
