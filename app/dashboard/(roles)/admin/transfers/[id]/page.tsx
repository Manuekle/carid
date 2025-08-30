'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Eye,
  Download,
  Check,
  X,
  ArrowLeft,
  CheckCircle,
  Loader2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingPage } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';

interface Transfer {
  id: string;
  status: string;
  salePrice: number;
  transferDate: string;
  completionDate?: string;
  notes?: string;
  adminNotes?: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    vin: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    isVerified: boolean;
    uploadedAt: string;
  }>;
}

export default function AdminTransferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [id, setId] = useState<string>('');
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<{
    approve: boolean;
    reject: boolean;
    cancel: boolean;
  }>({
    approve: false,
    reject: false,
    cancel: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Initialize the id from params
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);
      } catch (error) {
        console.error('Error loading params:', error);
      }
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchTransfer = async () => {
      try {
        const response = await fetch(`/api/admin/transfers/${id}`);
        const data = await response.json();

        if (response.ok) {
          setTransfer(data.transfer);
          setAdminNotes(data.transfer.adminNotes || '');
        } else {
          setMessage({ type: 'error', text: data.error || 'Error al cargar el traspaso' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error de conexión' });
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [id]);

  const handleStatusUpdate = async (action: 'approve' | 'reject' | 'cancel') => {
    if (!transfer) return;

    setLoadingState(prev => ({ ...prev, [action]: true }));
    try {
      const response = await fetch(`/api/admin/transfers/${transfer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTransfer(data.transfer);
        setMessage({
          type: 'success',
          text: `Traspaso ${action === 'approve' ? 'aprobado' : action === 'reject' ? 'rechazado' : 'cancelado'} correctamente`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar el estado' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoadingState(prev => ({ ...prev, [action]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: es });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' }
    > = {
      PENDING_SELLER_DOCUMENTS: { label: 'Pendiente Documentos', variant: 'outline' },
      PENDING_BUYER_ACCEPTANCE: { label: 'Pendiente Aceptación', variant: 'outline' },
      PENDING_ADMIN_APPROVAL: { label: 'Pendiente Aprobación', variant: 'secondary' },
      COMPLETED: { label: 'Completado', variant: 'default' },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' },
      REJECTED: { label: 'Rechazado', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getDocumentTypeName = (docType: string) => {
    const typeMap: Record<string, string> = {
      buyer_id: 'Identificación del Comprador',
      seller_id: 'Identificación del Vendedor',
      sale_contract: 'Contrato de Venta',
      vehicle_title: 'Título del Vehículo',
      bill_of_sale: 'Factura de Venta',
      inspection_report: 'Informe de Inspección',
      insurance_document: 'Documento de Seguro',
      transfer_form: 'Formulario de Traspaso',
    };

    return (
      typeMap[docType] ||
      docType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!transfer) {
    return toast.error('No se pudo cargar la información del traspaso');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/admin/transfers')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a traspasos
        </Button>
        <div className="flex items-center gap-2">{getStatusBadge(transfer.status)}</div>
      </div>

      {message && toast.success(message.text)}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Vehicle Details */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-card">
                Detalles del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Marca</p>
                  <p className="font-medium text-xs">{transfer.car.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modelo</p>
                  <p className="font-medium text-xs">{transfer.car.model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Año</p>
                  <p className="font-medium text-xs">{transfer.car.year}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Placa</p>
                  <p className="font-medium text-xs">{transfer.car.licensePlate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">VIN</p>
                  <p className="font-mono text-xs">{transfer.car.vin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Precio de Venta</p>
                  <p className="font-medium text-xs">
                    ${transfer.salePrice.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-card">
                Partes Interesadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-xs font-medium mb-2">Vendedor</h4>
                <div className="space-y-1">
                  <p className="font-medium text-xs">{transfer.seller.name}</p>
                  <p className="text-xs text-muted-foreground">{transfer.seller.email}</p>
                  {transfer.seller.phone && (
                    <p className="text-xs text-muted-foreground">{transfer.seller.phone}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-medium mb-2">Comprador</h4>
                <div className="space-y-1">
                  <p className="font-medium text-xs">{transfer.buyer.name}</p>
                  <p className="text-xs text-muted-foreground">{transfer.buyer.email}</p>
                  {transfer.buyer.phone && (
                    <p className="text-xs text-muted-foreground">{transfer.buyer.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {transfer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-card">
                  Notas del Traspaso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs whitespace-pre-line">{transfer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Estado actual:</p>
                {getStatusBadge(transfer.status)}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium mb-2">Notas administrativas</p>
                  <Textarea
                    id="adminNotes"
                    disabled={transfer.status !== 'PENDING_ADMIN_APPROVAL'}
                    className="w-full p-2 border rounded-md text-xs resize-none"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Agregar notas internas sobre este traspaso..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('cancel')}
                    disabled={
                      loadingState.cancel || !['PENDING_ADMIN_APPROVAL'].includes(transfer.status)
                    }
                  >
                    {loadingState.cancel ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Cancelar'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate('reject')}
                    disabled={
                      loadingState.reject || !['PENDING_ADMIN_APPROVAL'].includes(transfer.status)
                    }
                  >
                    {loadingState.reject ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Rechazar'
                    )}
                  </Button>
                  <Button
                    className="col-span-2"
                    onClick={() => handleStatusUpdate('approve')}
                    disabled={
                      loadingState.approve || !['PENDING_ADMIN_APPROVAL'].includes(transfer.status)
                    }
                  >
                    {loadingState.approve ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Aprobar Traspaso'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-card">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {transfer.documents.length > 0 ? (
                <div className="space-y-3">
                  {transfer.documents.map(doc => {
                    const docType = doc.documentType.toLowerCase();
                    const isRequired =
                      docType.includes('cedula') ||
                      docType.includes('identificacion') ||
                      docType.includes('matricula');

                    return (
                      <div
                        key={doc.id}
                        className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
                              {getDocumentTypeName(doc.documentType)}
                            </p>
                            {isRequired ? (
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                Requerido
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                Opcional
                              </Badge>
                            )}
                          </div>

                          {!doc.isVerified && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              Pendiente
                            </Badge>
                          )}
                        </div>

                        {/* Body */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{doc.fileName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              className="flex items-center"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span>Ver</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.fileUrl, '_blank', 'download')}
                              className="flex items-center"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span>Descargar</span>
                            </Button>
                            <div className="ml-auto">
                              <Button
                                size="sm"
                                variant={doc.isVerified ? 'outline' : 'default'}
                                onClick={async () => {
                                  try {
                                    await fetch(
                                      `/api/transfers/${transfer.id}/documents/${doc.id}/verify`,
                                      {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          isVerified: !doc.isVerified,
                                        }),
                                      }
                                    );
                                    // Refresh the page to show updated status
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error updating document verification:', error);
                                    toast.error(
                                      'Error al actualizar la verificación del documento'
                                    );
                                  }
                                }}
                                className="flex items-center gap-1"
                              >
                                {doc.isVerified ? (
                                  <>
                                    <X className="h-3 w-3" />
                                    <span>Desmarcar</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>Verificar</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No hay documentos adjuntos</p>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-card">Historial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium">Fecha de inicio</p>
                <p className="text-xs text-muted-foreground">{formatDate(transfer.transferDate)}</p>
              </div>
              {transfer.completionDate && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Fecha de finalización</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transfer.completionDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
