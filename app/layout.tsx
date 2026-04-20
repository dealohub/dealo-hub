import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Root metadata — applies to every page unless a nested layout or
 * page overrides. Per-locale translation of title/description is
 * handled in app/[locale]/layout.tsx.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://dealohub.com'),
  title: {
    default: 'Dealo Hub — Premium C2C marketplace for the Gulf',
    template: '%s · Dealo Hub',
  },
  description:
    'Real sellers. Real verified listings. Every ad on Dealo Hub is verified by AI and humans so you can buy and sell across the Gulf with confidence.',
  applicationName: 'Dealo Hub',
  authors: [{ name: 'Dealo Hub' }],
  generator: 'Next.js',
  keywords: [
    'Dealo Hub',
    'Kuwait marketplace',
    'Gulf classifieds',
    'AI verified listings',
    'buy and sell Kuwait',
    'C2C marketplace',
    'Arabian Gulf listings',
  ],
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    siteName: 'Dealo Hub',
    title: 'Dealo Hub — Premium C2C marketplace for the Gulf',
    description:
      'Real sellers. Real verified listings. Every ad verified by AI and humans.',
    url: 'https://dealohub.com',
    locale: 'en_US',
    alternateLocale: ['ar_KW'],
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Dealo Hub — Premium C2C marketplace for the Gulf',
    description:
      'Real sellers. Real verified listings. Every ad verified by AI and humans.',
  },

  // Robots — allow all until we launch
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

  // Icons (paths are placeholders until design assets ship)
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },

  // Locale alternates tell search engines the Arabic version exists
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'ar-KW': '/ar',
      'x-default': '/en',
    },
  },
};

/**
 * Viewport + theme color. Dark mode matches the page's default theme
 * so the browser chrome (iOS status bar, Android address bar) stays
 * visually continuous with the page.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
