import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: transferId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        {
          error: 'Archivo y tipo de documento son requeridos',
        },
        { status: 400 }
      );
    }

    // Verificar que el transfer existe y el usuario tiene acceso
    const transfer = await prisma.vehicleTransfer.findFirst({
      where: {
        id: transferId,
        OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }],
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          error: 'Traspaso no encontrado o no autorizado',
        },
        { status: 404 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de archivo no válido. Solo se permiten PDF e imágenes',
        },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'El archivo es demasiado grande (máximo 5MB)',
        },
        { status: 400 }
      );
    }

    // Subir archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const blob = await put(`transfers/${transferId}/${fileName}`, file, {
      access: 'public',
    });

    // Determinar si es requerido
    const requiredDocs = ['seller_id', 'buyer_id'];
    const isRequired = requiredDocs.includes(documentType);

    // Crear registro del documento
    const document = await prisma.transferDocument.create({
      data: {
        transferId,
        documentType,
        fileName: file.name,
        fileUrl: blob.url,
        uploadedBy: session.user.id,
        isRequired,
      },
      include: {
        uploader: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Documento subido exitosamente',
      document: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        isRequired: document.isRequired,
        isVerified: document.isVerified,
        uploadedAt: document.uploadedAt,
        uploader: document.uploader,
      },
    });
  } catch (error) {
    console.error('Error uploading transfer document:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: transferId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar acceso al traspaso
    let whereClause: any = { id: transferId };

    if (session.user.role !== 'ADMIN') {
      whereClause = {
        id: transferId,
        OR: [{ sellerId: session.user.id }, { buyerId: session.user.id }],
      };
    }

    const transfer = await prisma.vehicleTransfer.findFirst({
      where: whereClause,
    });

    if (!transfer) {
      return NextResponse.json(
        {
          error: 'Traspaso no encontrado o no autorizado',
        },
        { status: 404 }
      );
    }

    // Obtener documentos
    const documents = await prisma.transferDocument.findMany({
      where: { transferId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching transfer documents:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
