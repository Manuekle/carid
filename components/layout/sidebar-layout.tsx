'use client';

import { navLinkGroups } from '@/config/navigation';
import type { Role } from '@/types/navigation';
import { ChevronDown, LogOut, Settings, Car, CarFront } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function AppSidebar({ homePath }: { homePath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    try {
      // Primero cerrar sesión
      await signOut({ redirect: false });
      // Luego redirigir a la página de login
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // En caso de error, redirigir de todos modos
      window.location.href = '/auth/login';
    }
  };

  const userRole = session?.user?.role as Role | undefined;

  const accessibleNavGroups = React.useMemo(() => {
    if (status === 'loading' || !userRole) return [];
    return navLinkGroups
      .map(group => ({
        ...group,
        links: group.links.filter(link => link.roles.includes(userRole)),
      }))
      .filter(group => group.links.length > 0);
  }, [userRole, status]);

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getRoleDisplayName = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'MECHANIC':
        return 'Mecánico';
      case 'OWNER':
        return 'Propietario';
      default:
        return 'Usuario';
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Sidebar variant="inset" className="h-screen fixed font-sans">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                  <CarFront className="h-5 w-5" />
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">CarID</span>
                  <span className="truncate text-xs text-muted-foreground">Gestión Vehicular</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {status === 'loading' ? (
          <SidebarMenu>
            {Array.from({ length: 4 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <div className="flex items-center gap-3 p-2">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            {accessibleNavGroups.map(group => (
              <SidebarGroup key={group.title} className="py-2">
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-1 mt-2">
                  {group.links.map(link => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isLinkActive(link.href)}
                        className="flex items-center gap-2"
                      >
                        <Link href={link.href} className="flex items-center gap-3">
                          <link.icon className="h-4 w-4" />
                          <span className="text-xs">{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700 text-xs">
                    <AvatarFallback>{getUserInitials(session?.user?.name || '')}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left overflow-hidden flex-1">
                    <p className="text-xs font-medium truncate font-sans">
                      {session?.user?.name?.split(' ')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-sans">
                      {getRoleDisplayName(userRole as Role)}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="font-sans w-80 sm:w-64"
                side="top"
                align="end"
                sideOffset={8}
                alignOffset={-20}
                collisionPadding={16}
              >
                <div className="px-4 py-3">
                  <p className="text-xs font-medium truncate">{session?.user?.name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email || getRoleDisplayName(userRole as Role)}
                  </p>
                </div>
                <Separator />
                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="cursor-pointer py-2 px-4 text-xs flex items-center"
                >
                  <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer py-2 px-4 text-xs flex items-center"
                >
                  <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="font-sans">Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  const homePath = React.useMemo(() => {
    switch (userRole) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'MECHANIC':
        return '/dashboard/mechanic';
      case 'OWNER':
        return '/dashboard/owner';
      default:
        return '/dashboard';
    }
  }, [userRole]);

  const breadcrumbLinks = React.useMemo(() => {
    if (!userRole) return [];

    // Función para aplanar todos los enlaces, incluyendo los subLinks
    const getAllLinks = () => {
      return navLinkGroups.flatMap(group =>
        group.links
          .filter(link => link.roles.includes(userRole))
          .flatMap(link => {
            const result = [{ ...link, isSubLink: false }];
            if (link.subLinks) {
              result.push(
                ...link.subLinks
                  .filter(subLink => subLink.roles.includes(userRole))
                  .map(subLink => ({
                    ...subLink,
                    parentHref: link.href,
                    isSubLink: true,
                    icon: subLink.icon || link.icon, // Provide a fallback icon from parent
                  }))
              );
            }
            return result;
          })
      );
    };

    const allLinks = getAllLinks();

    // Función para verificar si una ruta coincide con un patrón de ruta dinámica
    const isMatchingRoute = (routePattern: string, currentPath: string) => {
      // Si la ruta incluye [id], la convertimos en un patrón de expresión regular
      if (routePattern.includes('[id]')) {
        const pattern = routePattern.replace(/\[id\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}(?:/|$)`);
        return regex.test(currentPath);
      }
      // Para rutas estáticas, comparación normal
      return currentPath === routePattern || currentPath.startsWith(`${routePattern}/`);
    };

    // Encontrar el enlace que mejor coincida con la ruta actual
    const currentLink = allLinks
      .sort((a, b) => b.href.length - a.href.length)
      .find(link => isMatchingRoute(link.href, pathname));

    const crumbs = [{ href: homePath, label: 'Dashboard' }];

    if (!currentLink) return crumbs;

    // Si es un subLink, añadimos primero su padre
    if (currentLink.isSubLink && currentLink.parentHref) {
      const parentLink = allLinks.find(
        link => !link.isSubLink && link.href === currentLink.parentHref
      );
      if (parentLink) {
        crumbs.push({
          href: parentLink.href,
          label: parentLink.label,
        });
      }
    }
    // Si no es un subLink pero tiene subLinks, lo añadimos directamente
    else if (!currentLink.isSubLink) {
      // Solo lo añadimos si no es el home
      if (currentLink.href !== homePath) {
        crumbs.push({
          href: currentLink.href,
          label: currentLink.label,
        });
      }
    }

    // Finalmente, si es un subLink o la ruta actual es un subLink, lo añadimos
    if (currentLink.isSubLink || (currentLink.subLinks && pathname !== currentLink.href)) {
      // Buscar si hay un subLink activo
      const activeSubLink = currentLink.subLinks?.find(
        subLink => pathname === subLink.href || pathname.startsWith(`${subLink.href}/`)
      );

      if (activeSubLink) {
        crumbs.push({
          href: activeSubLink.href,
          label: activeSubLink.label,
        });
      } else if (currentLink.isSubLink) {
        // Si es un subLink y no hemos encontrado otro subLink más específico
        crumbs.push({
          href: currentLink.href,
          label: currentLink.label,
        });
      }
    }

    return crumbs;
  }, [pathname, userRole, homePath]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar homePath={homePath} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 font-sans">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbLinks.map((link, index) => (
                  <React.Fragment key={link.href}>
                    <BreadcrumbItem>
                      {index === breadcrumbLinks.length - 1 ? (
                        <BreadcrumbPage>{link.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={link.href}>{link.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbLinks.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-4 sm:p-6 font-sans">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
