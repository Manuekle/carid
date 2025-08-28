'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Minus, Package } from 'lucide-react';
import { LoadingPage } from './ui/loading';

interface Part {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  photoUrl: string | null;
}

interface SelectedPart extends Part {
  quantity: number;
}

interface PartsSelectorProps {
  selectedParts: SelectedPart[];
  onPartsChange: (parts: SelectedPart[]) => void;
}

export default function PartsSelector({ selectedParts, onPartsChange }: PartsSelectorProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (error) {
      setError('Error al cargar el inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const addPart = (part: Part) => {
    const existingPart = selectedParts.find(p => p.id === part.id);
    if (existingPart) {
      if (existingPart.quantity < part.stock) {
        onPartsChange(
          selectedParts.map(p => (p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p))
        );
      }
    } else {
      onPartsChange([...selectedParts, { ...part, quantity: 1 }]);
    }
  };

  const removePart = (partId: string) => {
    const existingPart = selectedParts.find(p => p.id === partId);
    if (existingPart && existingPart.quantity > 1) {
      onPartsChange(
        selectedParts.map(p => (p.id === partId ? { ...p, quantity: p.quantity - 1 } : p))
      );
    } else {
      onPartsChange(selectedParts.filter(p => p.id !== partId));
    }
  };

  const getSelectedQuantity = (partId: string) => {
    return selectedParts.find(p => p.id === partId)?.quantity || 0;
  };

  const getTotalCost = () => {
    return selectedParts.reduce((sum, part) => sum + part.price * part.quantity, 0);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar repuestos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 text-xs"
        />
      </div>

      {/* Selected Parts Summary */}
      {selectedParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repuestos Seleccionados</CardTitle>
            <CardDescription>Total: ${getTotalCost().toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedParts.map(part => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div>
                    <span className="font-medium">{part.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ${part.price.toLocaleString()} x {part.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ${(part.price * part.quantity).toLocaleString()}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removePart(part.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredParts.map(part => {
          const selectedQuantity = getSelectedQuantity(part.id);
          const canAddMore = selectedQuantity < part.stock;

          return (
            <Card key={part.id} className="relative">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {part.photoUrl && (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={part.photoUrl || '/placeholder.svg'}
                        alt={part.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/repuesto.png';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{part.name}</h4>
                    {part.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {part.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold">${part.price.toLocaleString()}</span>
                      <Badge variant={part.stock <= 10 ? 'destructive' : 'secondary'}>
                        {part.stock} disponibles
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {selectedQuantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePart(part.id)}
                        className="bg-transparent"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium px-2">{selectedQuantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addPart(part)}
                        disabled={!canAddMore}
                        className="bg-transparent"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addPart(part)}
                      disabled={part.stock === 0}
                      className="bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  )}

                  {selectedQuantity > 0 && (
                    <span className="text-xs font-medium">
                      ${(part.price * selectedQuantity).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredParts.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-xs">
            {searchTerm ? 'No se encontraron repuestos' : 'No hay repuestos disponibles'}
          </p>
        </div>
      )}
    </div>
  );
}
