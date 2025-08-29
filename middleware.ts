import { UserRole } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicPaths = ['/', '/auth', '/_next', '/favicon.ico', '/api/auth', '/icons'];

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    console.log(`Middleware: ${pathname}`); // Para debugging en Vercel

    // Verificar si es una ruta pública
    const isPublicPath = publicPaths.some(
      path => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Obtener el token una sola vez para evitar múltiples llamadas
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log(`Token exists: ${!!token}, Role: ${token?.role}, Approved: ${token?.isApproved}`);

    // Manejar acceso a páginas de autenticación
    if (pathname.startsWith('/auth/')) {
      // Si el usuario ya está autenticado, redirigir según su rol
      if (token && token.isApproved) {
        let targetPath = '/dashboard';
        const userRole = token.role as UserRole;

        // Redirigir según el rol del usuario
        switch (userRole) {
          case UserRole.ADMIN:
            targetPath = '/dashboard/admin';
            break;
          case UserRole.MECHANIC:
            targetPath = '/dashboard/mechanic';
            break;
          case UserRole.OWNER:
            targetPath = '/dashboard/owner';
            break;
        }

        console.log(`Redirecting authenticated user to: ${targetPath}`);
        return NextResponse.redirect(new URL(targetPath, req.url));
      }

      // Si es mecánico no aprobado, solo permitir pending-approval
      if (token && token.role === UserRole.MECHANIC && !token.isApproved) {
        if (pathname !== '/auth/pending-approval') {
          return NextResponse.redirect(new URL('/auth/pending-approval', req.url));
        }
      }

      // Si no está autenticado, permitir el acceso a auth
      return NextResponse.next();
    }

    // Si es una ruta pública, permitir el acceso
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Si no hay token, redirigir a login
    if (!token) {
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const userRole = token.role as UserRole;

    // Verificar si el mecánico está aprobado
    if (userRole === UserRole.MECHANIC && !token.isApproved) {
      // Solo permitir acceso a la página de aprobación pendiente
      if (pathname !== '/auth/pending-approval') {
        console.log('Mechanic not approved, redirecting to pending approval');
        return NextResponse.redirect(new URL('/auth/pending-approval', req.url));
      }
      return NextResponse.next();
    }

    // Crear response con headers de seguridad
    const response = NextResponse.next();

    // Headers de seguridad
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // --- Redirection from root ---
    if (pathname === '/') {
      let targetPath: string;
      switch (userRole) {
        case UserRole.ADMIN:
          targetPath = '/dashboard/admin';
          break;
        case UserRole.MECHANIC:
          targetPath = '/dashboard/mechanic';
          break;
        case UserRole.OWNER:
          targetPath = '/dashboard/owner';
          break;
        default:
          targetPath = '/auth/login';
          break;
      }
      console.log(`Root redirect to: ${targetPath}`);
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // --- Redirection from generic dashboard ---
    if (pathname === '/dashboard') {
      let targetPath: string;
      switch (userRole) {
        case UserRole.ADMIN:
          targetPath = '/dashboard/admin';
          break;
        case UserRole.MECHANIC:
          targetPath = '/dashboard/mechanic';
          break;
        case UserRole.OWNER:
          targetPath = '/dashboard/owner';
          break;
        default:
          targetPath = '/auth/login';
          break;
      }
      console.log(`Dashboard redirect to: ${targetPath}`);
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // --- API Route Protection ---
    if (pathname.startsWith('/api/')) {
      // Headers adicionales para APIs
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

      const unauthorizedResponse = NextResponse.json(
        { message: 'Acceso denegado.' },
        { status: 403 }
      );

      // Validaciones específicas por rol
      if (pathname.startsWith('/api/admin') && userRole !== UserRole.ADMIN) {
        return unauthorizedResponse;
      }

      if (pathname.startsWith('/api/mechanic')) {
        if (userRole !== UserRole.MECHANIC && userRole !== UserRole.ADMIN) {
          return unauthorizedResponse;
        }
      }

      if (pathname.startsWith('/api/owner')) {
        if (userRole !== UserRole.OWNER && userRole !== UserRole.ADMIN) {
          return unauthorizedResponse;
        }
      }

      // APIs compartidas que requieren autenticación pero permiten múltiples roles
      if (pathname.startsWith('/api/cars') || pathname.startsWith('/api/maintenance')) {
        const allowedRoles = [UserRole.ADMIN, UserRole.MECHANIC, UserRole.OWNER];
        if (!allowedRoles.includes(userRole)) {
          return unauthorizedResponse;
        }
      }
    }

    // --- Page Route Protection ---
    if (pathname.startsWith('/dashboard/')) {
      const unauthorizedUrl = new URL('/auth/unauthorized', req.url);

      if (pathname.startsWith('/dashboard/admin') && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(unauthorizedUrl);
      }

      if (pathname.startsWith('/dashboard/mechanic')) {
        if (userRole !== UserRole.MECHANIC) {
          return NextResponse.redirect(unauthorizedUrl);
        }
        // Verificar aprobación del mecánico
        if (!token.isApproved) {
          return NextResponse.redirect(new URL('/auth/pending-approval', req.url));
        }
      }

      if (pathname.startsWith('/dashboard/owner') && userRole !== UserRole.OWNER) {
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    // --- Profile and shared routes ---
    if (pathname.startsWith('/profile')) {
      // Permitir acceso a perfil para usuarios autenticados
      const allowedRoles = [UserRole.ADMIN, UserRole.MECHANIC, UserRole.OWNER];
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir rutas públicas
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }

        // Permitir rutas de autenticación
        if (pathname.startsWith('/auth/')) {
          return true;
        }

        // Requerir autenticación para rutas protegidas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Proteger todas las rutas excepto las públicas y estáticas
    '/((?!_next/static|_next/image|favicon.ico|icons|api/auth).*)',
  ],
};
