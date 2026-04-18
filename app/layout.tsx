import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Root layout — locale-agnostic.
 * Actual HTML lang/dir set in app/[locale]/layout.tsx per request.
 *
 * This file exists because Next.js requires a root layout.
 * Most work happens in the [locale] segment below.
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Dealo Hub — منصة C2C الخليجية المحمية بالذكاء الاصطناعي',
    template: '%s · Dealo Hub',
  },
  description:
    'Dealo Hub — The first AI-Protected C2C marketplace in the Gulf. Human-written listings, trust-first experience.',
  applicationName: 'Dealo Hub',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'marketplace',
    'kuwait',
    'gcc',
    'c2c',
    'classifieds',
    'منصة بيع وشراء',
    'إعلانات الكويت',
  ],
  authors: [{ name: 'Fawzi Al-Ibrahim' }],
  creator: 'Dealo Hub',
  publisher: 'Dealo Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Dealo Hub',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@dealohub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#F4F4F5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
