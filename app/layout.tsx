import { Toaster } from '@/components/ui/sonner';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers/session-provider';
import './globals.css';

const siteUrl = 'https://carid.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CarID',
    template: `%s | CarID`,
  },
  description:
    'Gestión de vehículos con códigos QR. Eficiencia para propietarios, mecánicos y administradores.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CarID',
    description: 'Gestión de vehículos con códigos QR.',
    url: siteUrl,
    siteName: 'CarID',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Banner del CarID',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarID',
    description: 'Gestión de vehículos con códigos QR.',
    images: ['/og-image.webp'],
    site: '@carid',
  },
  verification: {
    google: '0RPzGmepK5heQ-2axeEVsJ9o2FVPXcNp67TZSjmjF0E',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/apple-touch-icon.png',
      },
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/icons/manifest.json',
  other: {
    'msapplication-config': '/icons/browserconfig.xml',
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/icons/mstile-144x144.png',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster position="top-center" duration={5000} />
      </body>
    </html>
  );
}
