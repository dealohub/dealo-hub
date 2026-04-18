import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { routing, type Locale } from '@/i18n/routing';

// Plus Jakarta Sans — closest free Satoshi-class sans (per DESIGN-EXCELLENCE.md Typography).
// Satoshi itself requires Fontshare license ($49/yr) — slated for Sprint 6 before public launch.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-satoshi',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-arabic',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

/**
 * Locale layout — sets lang + dir + font based on URL segment.
 *
 * Implements RTL-first principle (DESIGN.md Section 5):
 * - Arabic (ar) → dir="rtl" + IBM Plex Sans Arabic
 * - English (en) → dir="ltr" + Satoshi
 */

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Load translations for this locale
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={direction}
      className={cn(plusJakarta.variable, ibmPlexArabic.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          'bg-canvas-zinc text-charcoal-ink antialiased',
          locale === 'ar' ? 'font-arabic' : 'font-satoshi'
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
