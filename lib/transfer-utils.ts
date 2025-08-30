export const TRANSFER_STATUS = {
  PENDING_SELLER_DOCUMENTS: 'PENDING_SELLER_DOCUMENTS',
  PENDING_BUYER_ACCEPTANCE: 'PENDING_BUYER_ACCEPTANCE',
  PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export const DOCUMENT_TYPES = {
  SELLER_ID: 'seller_id',
  BUYER_ID: 'buyer_id',
  SALE_CONTRACT: 'sale_contract',
  OTHER: 'other',
} as const;

export const getTransferStatusColor = (status: string) => {
  const colors = {
    [TRANSFER_STATUS.PENDING_SELLER_DOCUMENTS]: 'bg-yellow-100 text-yellow-800',
    [TRANSFER_STATUS.PENDING_BUYER_ACCEPTANCE]: 'bg-blue-100 text-blue-800',
    [TRANSFER_STATUS.PENDING_ADMIN_APPROVAL]: 'bg-purple-100 text-purple-800',
    [TRANSFER_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
    [TRANSFER_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
    [TRANSFER_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getTransferStatusLabel = (status: string) => {
  const labels = {
    [TRANSFER_STATUS.PENDING_SELLER_DOCUMENTS]: 'Documentos del Vendedor Pendientes',
    [TRANSFER_STATUS.PENDING_BUYER_ACCEPTANCE]: 'Esperando Aceptación del Comprador',
    [TRANSFER_STATUS.PENDING_ADMIN_APPROVAL]: 'Esperando Aprobación Administrativa',
    [TRANSFER_STATUS.COMPLETED]: 'Completado',
    [TRANSFER_STATUS.CANCELLED]: 'Cancelado',
    [TRANSFER_STATUS.REJECTED]: 'Rechazado',
  };
  return labels[status as keyof typeof labels] || 'Estado Desconocido';
};

export const getNextTransferStep = (status: string) => {
  const steps = {
    [TRANSFER_STATUS.PENDING_SELLER_DOCUMENTS]: 'El vendedor debe subir sus documentos',
    [TRANSFER_STATUS.PENDING_BUYER_ACCEPTANCE]: 'El comprador debe aceptar el traspaso',
    [TRANSFER_STATUS.PENDING_ADMIN_APPROVAL]: 'Esperando aprobación administrativa',
    [TRANSFER_STATUS.COMPLETED]: 'Traspaso completado exitosamente',
    [TRANSFER_STATUS.CANCELLED]: 'El traspaso fue cancelado',
    [TRANSFER_STATUS.REJECTED]: 'El traspaso fue rechazado',
  };
  return steps[status as keyof typeof steps] || 'Estado desconocido';
};

export const formatCurrencyCOP = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const validateTransferData = (data: {
  buyerEmail: string;
  salePrice: number;
  notes?: string;
}) => {
  const errors: string[] = [];

  if (!data.buyerEmail || !data.buyerEmail.trim()) {
    errors.push('El email del comprador es requerido');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.buyerEmail)) {
    errors.push('El email del comprador no es válido');
  }

  if (!data.salePrice || data.salePrice <= 0) {
    errors.push('El precio de venta debe ser mayor a cero');
  } else if (data.salePrice > 999999999) {
    errors.push('El precio de venta es demasiado alto');
  }

  if (data.notes && data.notes.length > 500) {
    errors.push('Las notas no pueden exceder 500 caracteres');
  }

  return errors;
};
