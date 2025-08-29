// app/api/cars/[id]/documents/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

// Document type enum to match Prisma schema
const DocumentType = {
  SOAT: 'SOAT',
  TECNOMECANICO: 'TECNOMECANICO',
  TARJETA_PROPIEDAD: 'TARJETA_PROPIEDAD',
  REVISION_GASES: 'REVISION_GASES',
  POLIZA_SEGURO: 'POLIZA_SEGURO',
  LICENCIA_TRANSITO: 'LICENCIA_TRANSITO',
  OTHER: 'OTHER',
} as const;

type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// Interface for document data
interface Document {
  id: string;
  name: string;
  docType: DocumentType;
  fileUrl: string;
  fileName: string;
  expiryDate: Date | null;
  uploadedAt: Date;
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify car ownership
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        ownerId: session.user.id,
      },
    });

    if (!car) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const expiryDate = formData.get('expiryDate') as string | null;
    const customName = formData.get('customName') as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Archivo y tipo de documento son requeridos' },
        { status: 400 }
      );
    }

    // Map document types to match schema enum
    const mapDocumentType = (type: string): DocumentType => {
      switch (type) {
        case 'SOAT':
          return DocumentType.SOAT;
        case 'TECNOMECANICO':
          return DocumentType.TECNOMECANICO;
        case 'TARJETA_PROPIEDAD':
          return DocumentType.TARJETA_PROPIEDAD;
        case 'REVISION_GASES':
          return DocumentType.REVISION_GASES;
        case 'POLIZA_SEGURO':
          return DocumentType.POLIZA_SEGURO;
        case 'LICENCIA_TRANSITO':
          return DocumentType.LICENCIA_TRANSITO;
        default:
          return DocumentType.OTHER;
      }
    };

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no válido' }, { status: 400 });
    }

    try {
      // Upload file to blob storage
      const timestamp = Date.now();
      const blobFileName = `${timestamp}-${file.name}`;
      const blob = await put(`documents/${carId}/${blobFileName}`, file, {
        access: 'public',
      });

      // Generate document display name
      const documentName =
        customName ||
        `${documentType} - ${car.brand} ${car.model} - ${new Date().toLocaleDateString('es-ES')}`;

      // Create document record with proper typing
      const document = (await prisma.document.create({
        data: {
          car: { connect: { id: carId } },
          name: documentName,
          docType: mapDocumentType(documentType),
          fileUrl: blob.url,
          fileName: file.name,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      })) as unknown as Document;

      return NextResponse.json({
        message: 'Documento subido exitosamente',
        document: {
          id: document.id,
          name: document.name,
          fileName: document.fileName,
          documentType: document.docType,
          expiryDate: document.expiryDate,
          uploadedAt: document.uploadedAt,
        },
      });
    } catch (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: carId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify access to car
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

    if (!car && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const documents = (await prisma.document.findMany({
      where: { carId },
      orderBy: { uploadedAt: 'desc' },
    })) as unknown as Document[];

    // Transform documents to match expected interface
    const transformedDocuments = documents.map((doc: Document) => ({
      id: doc.id,
      name: doc.name,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      documentType: doc.docType,
      expiryDate: doc.expiryDate,
      uploadedAt: doc.uploadedAt,
    }));

    return NextResponse.json({ documents: transformedDocuments });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
