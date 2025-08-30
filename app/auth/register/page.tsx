'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Car, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-heading">Crear Cuenta</CardTitle>
          <CardDescription className="text-xs">
            Regístrate para comenzar a usar la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                if (typeof window !== 'undefined') {
                  toast.error('${error.replace(/'/g, "\\'")}');
                }
              `,
                }}
              />
            )}
            {success && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                if (typeof window !== 'undefined') {
                  toast.success('${success.replace(/'/g, "\\'")}');
                }
              `,
                }}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                className="text-xs"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                required
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="text-xs"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                className="text-xs"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuario</Label>
              <Select
                value={formData.role}
                onValueChange={value => handleInputChange('role', value)}
              >
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Propietario de Vehículo</SelectItem>
                  <SelectItem value="MECHANIC">Mecánico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  required
                  placeholder="•••••••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="text-xs"
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                required
                placeholder="•••••••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            <p className="text-muted-foreground text-xs">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
