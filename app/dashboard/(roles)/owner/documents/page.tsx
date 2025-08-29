'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  Car,
  AlertTriangle,
  Eye,
  Upload,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LoadingPage } from '@/components/ui/loading';

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  expiryDate: string | null;
  uploadedAt: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

const DOCUMENT_TYPE_LABELS: { [key: string]: string } = {
  SOAT: 'SOAT',
  TECNOMECANICO: 'Revisión Tecnomecánica',
  TARJETA_PROPIEDAD: 'Tarjeta de Propiedad',
  REVISION_GASES: 'Revisión de Gases',
  POLIZA_SEGURO: 'Póliza de Seguro',
  LICENCIA_TRANSITO: 'Licencia de Tránsito',
  OTHER: 'Otros',
};

const DOCUMENT_TYPE_COLORS: { [key: string]: string } = {
  SOAT: 'bg-blue-100 text-blue-800',
  TECNOMECANICO: 'bg-green-100 text-green-800',
  TARJETA_PROPIEDAD: 'bg-purple-100 text-purple-800',
  REVISION_GASES: 'bg-yellow-100 text-yellow-800',
  POLIZA_SEGURO: 'bg-red-100 text-red-800',
  LICENCIA_TRANSITO: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user || session.user.role !== 'OWNER') return;

      try {
        // Fetch cars and documents in parallel
        const [carsResponse, documentsResponse] = await Promise.all([
          fetch('/api/owner/cars'),
          fetch('/api/owner/documents'),
        ]);

        if (carsResponse.ok) {
          const carsData = await carsResponse.json();
          setCars(carsData.cars);
        }

        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json();
          setDocuments(documentsData.documents);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCar = selectedCarId === 'all' || doc.car.id === selectedCarId;
    const matchesDocType = selectedDocType === 'all' || doc.documentType === selectedDocType;

    return matchesSearch && matchesCar && matchesDocType;
  });

  const isDocumentExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isDocumentExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry > today && expiry <= thirtyDaysFromNow;
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/cars/${documentToDelete.car.id}/documents/${documentToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar el documento');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      toast.success('Documento eliminado exitosamente');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    if (isDocumentExpired(expiryDate)) {
      return { label: 'Vencido', variant: 'destructive' as const, icon: AlertTriangle };
    }

    if (isDocumentExpiringSoon(expiryDate)) {
      return { label: 'Por vencer', variant: 'secondary' as const, icon: Calendar };
    }

    return { label: 'Vigente', variant: 'default' as const, icon: Calendar };
  };

  // Statistics
  const totalDocuments = documents.length;
  const expiredDocuments = documents.filter(doc => isDocumentExpired(doc.expiryDate)).length;
  const expiringSoonDocuments = documents.filter(doc =>
    isDocumentExpiringSoon(doc.expiryDate)
  ).length;

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Documentos</h1>
          <p className="text-muted-foreground text-xs">
            Gestiona todos los documentos de tus vehículos
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{expiredDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Por Vencer (30 días)</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold ">{expiringSoonDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Vehículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{cars.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos, vehículos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vehicle Filter */}
        <div className="min-w-[200px]">
          <Select value={selectedCarId} onValueChange={setSelectedCarId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por vehículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vehículos</SelectItem>
              {cars.map(car => (
                <SelectItem key={car.id} value={car.id}>
                  {car.brand} {car.model} • {car.licensePlate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Type Filter */}
        <div className="min-w-[200px]">
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map(document => {
            const expiryStatus = getExpiryStatus(document.expiryDate);

            return (
              <Card key={document.id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-muted mt-0.5">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-xs tracking-card truncate">
                            {document.name}
                          </h3>
                          <div className="flex-shrink-0">
                            <Badge
                              className={`text-xs ${DOCUMENT_TYPE_COLORS[document.documentType] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {document.car.brand} {document.car.model} •{' '}
                              {document.car.licensePlate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>
                              Subido: {new Date(document.uploadedAt).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>

                        {document.expiryDate && (
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                            {expiryStatus && (
                              <Badge variant={expiryStatus.variant} className="text-xs w-fit">
                                <expiryStatus.icon className="h-3 w-3 mr-1" />
                                {expiryStatus.label}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Vence: {new Date(document.expiryDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground truncate">
                          Archivo: {document.fileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-normal gap-2 mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" className="h-9 px-2.5 sm:px-3" asChild>
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="sr-only sm:not-sr-only">Ver</span>
                        </a>
                      </Button>

                      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 px-2.5 sm:px-3 text-white"
                            onClick={() => setDocumentToDelete(document)}
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="sr-only sm:not-sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-semibold tracking-card">
                              ¿Estás seguro?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">
                              Esta acción no se puede deshacer. El documento &quot;
                              {documentToDelete?.name}&quot; será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteDocument}
                              disabled={isDeleting}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center h-96 flex flex-col justify-center items-center">
            {documents.length === 0 ? (
              <>
                <h3 className="text-xs">Aún no tienes documentos</h3>
                <p className="text-muted-foreground mb-6 text-xs">
                  Sube documentos de tus vehículos para mantener todo organizado
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xs">No se encontraron documentos</h3>
                <p className="text-muted-foreground text-xs">
                  Intenta cambiar los filtros o el término de búsqueda
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCarId('all');
                    setSelectedDocType('all');
                  }}
                  className="mt-4"
                >
                  Limpiar Filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {cars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-card">Acciones Rápidas</CardTitle>
            <CardDescription className="text-xs">
              Sube documentos directamente desde aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cars.slice(0, 6).map(car => (
                <div
                  key={car.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">
                        {car.brand} {car.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {car.licensePlate} • {car.year}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/owner/vehicles/${car.id}/upload`}>
                      <Upload className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {cars.length > 6 && (
              <div className="text-center mt-4">
                <Button asChild variant="outline">
                  <Link href="/dashboard/owner/vehicles">Ver Todos los Vehículos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
