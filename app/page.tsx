'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Car, ArrowRight, CarFront } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'MECHANIC':
          router.push('/mechanic');
          break;
        case 'OWNER':
          router.push('/owner');
          break;
        default:
          break;
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative">
            <Car className="h-8 w-8 text-blue-500 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header con Logo */}
      <div className="flex items-center justify-center pt-16">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-black">
            <CarFront className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-heading">CarID</h1>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-20">
        <div className="max-w-sm mx-auto w-full space-y-8">
          {/* Título Principal */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold tracking-heading">
              Historial completo de tu vehículo
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Gestiona mantenimientos, documentos y comunicación con mecánicos desde una sola app
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full h-12 font-medium" size="lg">
              <Link href="/auth/login" className="flex items-center justify-center space-x-2">
                <span>Iniciar Sesión</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full h-12 font-medium" size="lg">
              <Link href="/auth/register">Crear Cuenta</Link>
            </Button>
          </div>

          {/* Texto inferior */}
          <div className="text-center pt-6">
            <p className="text-xs text-gray-400">
              Únete a miles de usuarios que ya confían en CarID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
