import { useSession } from 'next-auth/react';

interface Transfer {
  sellerId: string;
  buyerId: string;
  status: string;
}

export function useTransferPermissions(transfer?: Transfer | null) {
  const { data: session } = useSession();

  const canView = () => {
    if (!session?.user || !transfer) return false;

    if (session.user.role === 'ADMIN') return true;
    return session.user.id === transfer.sellerId || session.user.id === transfer.buyerId;
  };

  const canInitiate = () => {
    if (!session?.user) return false;
    return session.user.role === 'OWNER';
  };

  const canAccept = () => {
    if (!session?.user || !transfer) return false;
    return session.user.id === transfer.buyerId && transfer.status === 'PENDING_BUYER_ACCEPTANCE';
  };

  const canApprove = () => {
    if (!session?.user || !transfer) return false;
    return session.user.role === 'ADMIN' && transfer.status === 'PENDING_ADMIN_APPROVAL';
  };

  const canCancel = () => {
    if (!session?.user || !transfer) return false;
    return (
      (session.user.id === transfer.sellerId || session.user.role === 'ADMIN') &&
      !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(transfer.status)
    );
  };

  const canUploadDocument = (documentType: string) => {
    if (!session?.user || !transfer) return false;

    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(transfer.status)) return false;

    if (documentType.includes('seller')) {
      return session.user.id === transfer.sellerId;
    }
    if (documentType.includes('buyer')) {
      return session.user.id === transfer.buyerId;
    }
    // Documentos generales pueden ser subidos por cualquiera de los dos
    return session.user.id === transfer.sellerId || session.user.id === transfer.buyerId;
  };

  const isOwner = () => {
    if (!session?.user || !transfer) return false;
    return session.user.id === transfer.sellerId;
  };

  const isBuyer = () => {
    if (!session?.user || !transfer) return false;
    return session.user.id === transfer.buyerId;
  };

  return {
    canView,
    canInitiate,
    canAccept,
    canApprove,
    canCancel,
    canUploadDocument,
    isOwner,
    isBuyer,
  };
}
