// app/api/owner/documents/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CarInfo {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface Document {
  id: string;
  name: string;
  docType: string;
  fileUrl: string;
  fileName: string;
  expiryDate: Date | null;
  uploadedAt: Date;
  car: CarInfo;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: {
        car: {
          ownerId: session.user.id,
        },
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
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    // Transform documents to match expected interface
    const transformedDocuments = documents.map((doc: Document) => ({
      id: doc.id,
      name: doc.name,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      documentType: doc.docType, // Map docType to documentType for frontend
      expiryDate: doc.expiryDate,
      uploadedAt: doc.uploadedAt,
      car: doc.car,
    }));

    return NextResponse.json({ documents: transformedDocuments });
  } catch (error) {
    console.error('Error fetching owner documents:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
