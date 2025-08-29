'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from '@/components/ui/drawer';
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
import { Textarea } from '@/components/ui/textarea';
import { Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';
import Image from 'next/image';

interface Part {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    photo: null as File | null,
  });

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    const filtered = parts.filter(
      part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredParts(filtered);
  }, [parts, searchTerm]);

  const fetchParts = async () => {
    try {
      const response = await fetch('/api/parts');
      if (response.ok) {
        const data = await response.json();
        setParts(data.parts);
      } else {
        setError('Error al cargar el inventario');
      }
    } catch (error: unknown) {
      console.error('Error loading inventory:', error);
      setError('Error al cargar el inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    submitData.append('stock', formData.stock);
    if (formData.photo) {
      submitData.append('photo', formData.photo);
    }

    try {
      const url = editingPart ? `/api/parts/${editingPart.id}` : '/api/parts';
      const method = editingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      if (response.ok) {
        await fetchParts();
        resetForm();
        setIsAddDialogOpen(false);
        setEditingPart(null);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error: unknown) {
      console.error('Error saving part:', error);
      setError('Error al guardar el repuesto');
    }
  };

  const handleDelete = async (partId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este repuesto?')) return;

    try {
      const response = await fetch(`/api/parts/${partId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchParts();
      } else {
        setError('Error al eliminar el repuesto');
      }
    } catch (error: unknown) {
      console.error('Error deleting part:', error);
      setError('Error al eliminar el repuesto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      photo: null,
    });
  };

  const openEditDialog = (part: Part) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      description: part.description || '',
      price: part.price.toString(),
      stock: part.stock.toString(),
      photo: null,
    });
    setIsAddDialogOpen(true);
  };

  const lowStockParts = parts.filter(part => part.stock <= 10);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between sm:flex-row gap-4 flex-col sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-heading">Gestión de Inventario</h1>
            <p className="text-muted-foreground text-xs">
              Administra el inventario de repuestos del taller
            </p>
          </div>
          <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DrawerTrigger asChild>
              <Button onClick={resetForm}>Agregar Repuesto</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle className="text-2xl tracking-heading font-semibold">
                    {editingPart ? 'Editar Repuesto' : 'Agregar Repuesto'}
                  </DrawerTitle>
                  <DrawerDescription className="text-xs">
                    {editingPart
                      ? 'Modifica la información del repuesto'
                      : 'Completa la información del nuevo repuesto'}
                  </DrawerDescription>
                </DrawerHeader>
                <form id="inventory-form" onSubmit={handleSubmit} className="p-4 space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Repuesto</Label>
                    <Input
                      id="name"
                      className="text-xs"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Filtro de aceite"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      className="text-xs"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción detallada del repuesto"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio (COP)</Label>
                      <Input
                        id="price"
                        className="text-xs"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="25000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        className="text-xs"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        required
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Foto del Repuesto</Label>
                    <Input
                      id="photo"
                      className="text-xs"
                      type="file"
                      accept="image/*"
                      onChange={e =>
                        setFormData({ ...formData, photo: e.target.files?.[0] || null })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional. Formatos: JPG, PNG, WebP
                    </p>
                  </div>
                </form>
                <DrawerFooter>
                  <Button type="submit" form="inventory-form">
                    {editingPart ? 'Actualizar' : 'Agregar'}
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingPart(null);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Low Stock Alert */}
        {lowStockParts.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Alerta de Stock Bajo:</strong> {lowStockParts.length} repuesto(s) con stock
              menor a 10 unidades.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar repuestos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredParts.length} de {parts.length} repuestos
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.map(part => (
            <Card key={part.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl tracking-card">{part.name}</CardTitle>
                    {part.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {part.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(part)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl tracking-card font-semibold">
                            ¿Estás seguro de eliminar este repuesto?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-muted-foreground">
                            Esta acción no se puede deshacer. El repuesto será eliminado
                            permanentemente del inventario.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                              e.preventDefault();
                              handleDelete(part.id);
                            }}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                  <Image
                    src={part.photoUrl ? part.photoUrl : '/images/placeholder.png'}
                    alt={part.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.png';
                    }}
                    unoptimized={!part.photoUrl}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold">${part.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Precio unitario</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          part.stock <= 10
                            ? 'destructive'
                            : part.stock <= 20
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {part.stock} unidades
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">En stock</p>
                  </div>
                </div>

                {part.stock <= 10 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-800 dark:text-orange-200">Stock bajo</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredParts.length === 0 && !isLoading && (
          <Card className="text-center flex flex-col gap-1 h-64 items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-xs font-medium">
              {searchTerm ? 'No se encontraron repuestos' : 'No hay repuestos en el inventario'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza agregando repuestos al inventario'}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
