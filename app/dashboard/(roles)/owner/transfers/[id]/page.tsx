'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Users,
  CloudUpload,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

interface TransferDetailsProps {
  params: Promise<{ id: string }>;
}

interface TransferDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  uploader: {
    id: string;
    name: string;
  };
  verifier?: {
    id: string;
    name: string;
  };
}

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
    documents: Array<{
      id: string;
      name: string;
      docType: string;
      fileUrl: string;
      expiryDate?: string;
    }>;
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
  sellerProfile: {
    documentType: string;
    documentNumber: string;
    address?: string;
    city: string;
    department: string;
    country: string;
  };
  buyerProfile: {
    documentType: string;
    documentNumber: string;
    address?: string;
    city: string;
    department: string;
    country: string;
  };
  documents: TransferDocument[];
  approvedByAdmin?: {
    id: string;
    name: string;
    email: string;
  };
}

const STATUS_STEPS = [
  { key: 'PENDING_SELLER_DOCUMENTS', label: 'Documentos del Vendedor', icon: FileText },
  { key: 'PENDING_BUYER_ACCEPTANCE', label: 'Aceptación del Comprador', icon: User },
  { key: 'PENDING_ADMIN_APPROVAL', label: 'Aprobación Administrativa', icon: Shield },
  { key: 'COMPLETED', label: 'Completado', icon: CheckCircle },
];

const DOCUMENT_TYPES = {
  seller_id: 'Documento de Identidad del Vendedor',
  buyer_id: 'Documento de Identidad del Comprador',
  sale_contract: 'Contrato de Compraventa',
  other: 'Otro Documento',
};

export default function TransferDetailsPage({ params }: TransferDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/transfers/${id}`);
        const data = await response.json();

        if (response.ok) {
          setTransfer(data.transfer);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al cargar el traspaso' });
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [params]);

  const handleAction = async (action: string) => {
    if (!transfer) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/transfers/${transfer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminNotes: action.includes('admin') ? adminNotes : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        // Recargar datos
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al procesar la acción' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file || !transfer) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    try {
      const response = await fetch(`/api/transfers/${transfer.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        // Recargar datos
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al subir el documento' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCurrentStep = () => {
    if (!transfer) return 0;
    return STATUS_STEPS.findIndex(step => step.key === transfer.status);
  };

  const canUserAct = () => {
    if (!session?.user || !transfer) return false;

    if (session.user.role === 'ADMIN') return true;
    if (session.user.id === transfer.seller.id) return true;
    if (session.user.id === transfer.buyer.id && transfer.status === 'PENDING_BUYER_ACCEPTANCE')
      return true;

    return false;
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!transfer) {
    return toast.error('No se pudo cargar la información del traspaso');
  }

  const currentStep = getCurrentStep();
  const isOwner = session?.user?.id === transfer.seller.id;
  const isBuyer = session?.user?.id === transfer.buyer.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Detalles del Traspaso</h1>
          <p className="text-muted-foreground text-xs">
            Información completa del proceso de transferencia
          </p>
        </div>
      </div>

      {message && toast.success(message.text)}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Estado del Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep || transfer.status === 'COMPLETED';
                  const isCancelled =
                    transfer.status === 'CANCELLED' || transfer.status === 'REJECTED';

                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs backdrop-blur-md bg-white/20 border border-zinc-200 text-zinc-700">
                        <StepIcon className="h-4 w-4" />
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-medium text-xs ${
                            isActive
                              ? 'text-zinc-900'
                              : isCompleted
                                ? 'text-zinc-700'
                                : 'text-zinc-500'
                          }`}
                        >
                          {step.label}
                        </p>
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`w-full h-[1px] mt-2 ${
                              index < currentStep ? 'bg-zinc-400' : 'bg-zinc-200'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Información del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-gray-600 text-xs">Marca y Modelo:</span>
                  <div className="font-medium text-xs">
                    {transfer.car.brand} {transfer.car.model} {transfer.car.year}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Placa:</span>
                  <div className="font-medium text-xs">{transfer.car.licensePlate}</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-600 text-xs">VIN:</span>
                  <div className="font-medium font-mono text-xs">{transfer.car.vin}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Información del Traspaso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-xs">Precio de Venta:</span>
                    <div className="font-medium text-xs">{formatPrice(transfer.salePrice)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600 text-xs">Fecha de Inicio:</span>
                    <div className="font-medium text-xs">{formatDate(transfer.transferDate)}</div>
                  </div>
                </div>
              </div>

              {transfer.notes && (
                <div>
                  <span className="text-gray-600 text-xs">Notas del Vendedor:</span>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-xs">{transfer.notes}</p>
                  </div>
                </div>
              )}

              {transfer.adminNotes && (
                <div>
                  <span className="text-gray-600 text-xs">Notas Administrativas:</span>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 text-xs">{transfer.adminNotes}</p>
                  </div>
                </div>
              )}

              {transfer.completionDate && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-gray-600 text-xs">Completado el:</span>
                    <div className="font-medium text-xs">{formatDate(transfer.completionDate)}</div>
                    {transfer.approvedByAdmin && (
                      <div className="text-xs text-gray-500">
                        Por: {transfer.approvedByAdmin.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {canUserAct() &&
            transfer.status !== 'COMPLETED' &&
            transfer.status !== 'CANCELLED' &&
            transfer.status !== 'REJECTED' && (
              <Card>
                <CardContent className="space-y-4">
                  {/* Buyer acceptance */}
                  {isBuyer && transfer.status === 'PENDING_BUYER_ACCEPTANCE' && (
                    <div className="space-y-3">
                      <p className="text-gray-700 text-xs">
                        ¿Deseas aceptar este traspaso de vehículo?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction('buyer_accept')}
                          disabled={actionLoading}
                          variant="default"
                        >
                          {actionLoading ? 'Procesando...' : 'Aceptar Traspaso'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction('cancel')}
                          disabled={actionLoading}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Admin actions */}
                  {session?.user?.role === 'ADMIN' &&
                    transfer.status === 'PENDING_ADMIN_APPROVAL' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="adminNotes">Notas de Aprobación (opcional)</Label>
                          <Textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={e => setAdminNotes(e.target.value)}
                            placeholder="Comentarios sobre la aprobación..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAction('admin_approve')}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading ? 'Procesando...' : 'Aprobar Traspaso'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleAction('admin_reject')}
                            disabled={actionLoading}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Cancel option for seller */}
                  {isOwner &&
                    ['PENDING_BUYER_ACCEPTANCE', 'PENDING_ADMIN_APPROVAL'].includes(
                      transfer.status
                    ) && (
                      <div>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction('cancel')}
                          disabled={actionLoading}
                          className="text-white"
                        >
                          Cancelar Traspaso
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-black" />
                  <span className="font-medium text-black text-xs">Vendedor</span>
                  {isOwner && <Badge variant="secondary">Tú</Badge>}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-medium text-xs">{transfer.seller.name}</p>
                  <p className="text-gray-600 text-xs">{transfer.seller.email}</p>
                  {transfer.seller.phone && (
                    <p className="text-gray-600 text-xs">{transfer.seller.phone}</p>
                  )}
                  <p className="text-gray-600 text-xs">
                    {transfer.sellerProfile.documentType} {transfer.sellerProfile.documentNumber}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {transfer.sellerProfile.city}, {transfer.sellerProfile.department}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Buyer */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-black" />
                  <span className="font-medium text-black text-xs">Comprador</span>
                  {isBuyer && <Badge variant="secondary">Tú</Badge>}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-medium">{transfer.buyer.name}</p>
                  <p className="text-gray-600">{transfer.buyer.email}</p>
                  {transfer.buyer.phone && <p className="text-gray-600">{transfer.buyer.phone}</p>}
                  <p className="text-gray-600">
                    {transfer.buyerProfile.documentType} {transfer.buyerProfile.documentNumber}
                  </p>
                  <p className="text-gray-600">
                    {transfer.buyerProfile.city}, {transfer.buyerProfile.department}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Documentos del Traspaso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
                const existingDoc = transfer.documents.find(d => d.documentType === type);
                const canUpload =
                  ((type.includes('seller') && isOwner) ||
                    (type.includes('buyer') && isBuyer) ||
                    (!type.includes('seller') && !type.includes('buyer'))) &&
                  !transfer.status.includes('COMPLETED') &&
                  !transfer.status.includes('CANCELLED');

                return (
                  <div
                    key={type}
                    className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
                          {label}
                        </p>
                        {!existingDoc &&
                          (type.includes('seller') || type.includes('buyer') ? (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              Requerido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                              Opcional
                            </Badge>
                          ))}
                      </div>

                      {existingDoc && !existingDoc.isVerified && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          Pendiente
                        </Badge>
                      )}
                    </div>

                    {/* Body */}
                    {existingDoc ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{existingDoc.fileName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(existingDoc.fileUrl, '_blank')}
                            className="flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Subido por {existingDoc.uploader.name}
                          </span>
                        </div>
                      </div>
                    ) : canUpload ? (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => handleFileUpload(e, type)}
                          className="hidden"
                          id={`upload-${type}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`upload-${type}`)?.click()}
                          className="flex items-center"
                        >
                          <CloudUpload className="h-3 w-3 mr-1" />
                          Subir documento
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {type.includes('seller')
                          ? 'Pendiente del vendedor'
                          : type.includes('buyer')
                            ? 'Pendiente del comprador'
                            : 'No subido'}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Vehicle Documents */}
          {transfer.car.documents && transfer.car.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">
                  Documentos del Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transfer.car.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm backdrop-blur-sm"
                    >
                      {/* Información del documento */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {doc.name}
                        </p>
                        <p className="text-xs text-zinc-500">{doc.docType}</p>
                        {doc.expiryDate && (
                          <p className="text-xs text-zinc-400">
                            Vence: {new Date(doc.expiryDate).toLocaleDateString('es-CO')}
                          </p>
                        )}
                      </div>

                      {/* Acción */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        className="flex items-center gap-1 self-start sm:self-center"
                      >
                        <Download className="h-3 w-3" />
                        <span className="text-xs">Ver</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
