'use client';

import type React from 'react';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas');
      } else {
        // Get session to determine redirect based on role
        const session = await getSession();
        if (session?.user?.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (session?.user?.role === 'MECHANIC') {
          router.push('/dashboard/mechanic');
        } else {
          router.push('/dashboard/owner');
        }
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-heading">Iniciar Sesión</CardTitle>
          <CardDescription className="text-xs">
            Ingresa tus credenciales para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                className="text-xs"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  className="text-xs"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="•••••••••••"
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            <p className="text-muted-foreground text-xs">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Cuentas de prueba:</p>
            <p>Admin: admin@carid.com / admin123</p>
            <p>Mecánico: mechanic@carid.com / mechanic123</p>
            <p>Propietario: owner@carid.com / owner123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
