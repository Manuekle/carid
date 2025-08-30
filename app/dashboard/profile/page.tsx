'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingPage } from '@/components/ui/loading';

interface Profile {
  documentType?: string;
  documentNumber?: string;
  address?: string;
  city?: string;
  department?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PP', label: 'Pasaporte' },
];

const DEPARTMENTS = [
  'Cauca',
  'Valle del Cauca',
  'Nariño',
  'Huila',
  'Tolima',
  'Cundinamarca',
  'Antioquia',
  'Santander',
  'Atlántico',
  'Bolivar',
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Removed message state since we're using toast notifications directly

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setProfile(data.profile || {});
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      // Ensure birthDate is properly formatted if it exists
      if (data.birthDate) {
        data.birthDate = new Date(data.birthDate as string).toISOString();
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setUser(result.user);
        setProfile(result.profile);
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getCompletionStatus = () => {
    const requiredFields = ['name', 'phone', 'documentType', 'documentNumber', 'city'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'name' || field === 'phone') {
        return user?.[field as keyof UserData];
      }
      return profile?.[field as keyof Profile];
    });
    return { completed: completedFields.length, total: requiredFields.length };
  };

  if (loading) {
    return <LoadingPage />;
  }

  const completionStatus = getCompletionStatus();
  const isProfileComplete = completionStatus.completed === completionStatus.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-heading">Información Personal</h1>
          <p className="text-muted-foreground text-xs">
            Administra tu información personal y datos de contacto
          </p>
        </div>
      </div>

      {/* Toast notifications are handled by the Toaster component */}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input id="name" name="name" defaultValue={user?.name || ''} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" value={user?.email || ''} disabled className="bg-gray-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user?.phone || ''}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Fecha de Nacimiento</Label>
                  <DatePicker
                    value={profile?.birthDate ? new Date(profile.birthDate) : undefined}
                    onChange={date => {
                      // Update the form state when date changes
                      setProfile(prev => ({
                        ...prev,
                        birthDate: date?.toISOString(),
                      }));
                    }}
                  />
                  <input type="hidden" name="birthDate" value={profile?.birthDate || ''} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">
                  Documento de Identidad
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <Select name="documentType" defaultValue={profile?.documentType || ''}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="documentNumber">Número de Documento *</Label>
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    defaultValue={profile?.documentNumber || ''}
                    placeholder="Sin puntos ni guiones"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={profile?.city || ''}
                    placeholder="Ej: Popayán"
                  />
                </div>
                <div className="flex flex-col gap-2 ">
                  <Label htmlFor="department">Departamento</Label>
                  <Select name="department" defaultValue={profile?.department || 'Cauca'}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1 flex flex-col gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={profile?.address || ''}
                    placeholder="Dirección completa"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">
                  Contacto de Emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    defaultValue={profile?.emergencyContact || ''}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="emergencyPhone">Teléfono del Contacto</Label>
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    defaultValue={profile?.emergencyPhone || ''}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-heading">
                Estado del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs">Completado:</span>
                  <span className="font-medium text-xs">
                    {completionStatus.completed}/{completionStatus.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isProfileComplete ? 'bg-black' : 'bg-black'
                    }`}
                    style={{
                      width: `${(completionStatus.completed / completionStatus.total) * 100}%`,
                    }}
                  ></div>
                </div>
                {isProfileComplete ? (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-4 w-4" />
                    Perfil completo
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4" />
                    Perfil incompleto
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {session?.user?.role === 'OWNER' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-heading">
                  Traspasos de Vehículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-3">
                  Para realizar traspasos de vehículos necesitas completar tu perfil con documento
                  de identidad y ciudad.
                </p>
                {isProfileComplete ? (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-4 w-4" />
                    ¡Listo para traspasos!
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4" />
                    Complete los campos marcados con *
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-heading">
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <span className="text-gray-600">Rol:</span>
                <span className="ml-2 font-medium">
                  {session?.user?.role === 'ADMIN'
                    ? 'ADMINISTRADOR'
                    : session?.user?.role === 'MECHANIC'
                      ? 'MECÁNICO'
                      : session?.user?.role === 'OWNER'
                        ? 'PROPIETARIO'
                        : session?.user?.role}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Miembro desde:</span>
                <span className="ml-2 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO') : '-'}
                </span>
              </div>
              {session?.user?.role === 'MECHANIC' && (
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <Badge
                    variant={session.user.isApproved ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {session.user.isApproved ? 'Aprobado' : 'Pendiente'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
