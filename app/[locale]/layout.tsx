import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Bricolage_Grotesque, Cairo } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from 'next-themes';
import { routing, type Locale } from '@/i18n/routing';

/**
 * Per-locale metadata — overrides the root title/description with
 * language-appropriate copy and sets og:locale correctly. Anything
 * not set here falls through to app/layout.tsx defaults.
 */
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (locale === 'ar') {
    return {
      title: {
        default: 'ديلو هَب — سوق الخليج الموثوق',
        template: '%s · ديلو هَب',
      },
      description:
        'بائعون حقيقيون. إعلانات موثّقة. كل إعلان على ديلو هَب يتحقّق منه الذكاء الاصطناعي ومراجعون بشريون — بِع واشترِ في الخليج بثقة.',
      openGraph: {
        locale: 'ar_KW',
        alternateLocale: ['en_US'],
        title: 'ديلو هَب — سوق الخليج الموثوق',
        description:
          'بائعون حقيقيون. إعلانات موثّقة. كل إعلان على ديلو هَب يتحقّق منه الذكاء الاصطناعي ومراجعون بشريون.',
      },
      twitter: {
        title: 'ديلو هَب — سوق الخليج الموثوق',
        description: 'بائعون حقيقيون. إعلانات موثّقة.',
      },
    };
  }
  // English stays on the root defaults (set in app/layout.tsx).
  return {};
}

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-bricolage',
  display: 'swap',
});

// Arabic typography — Cairo.
// - Google Fonts ⇒ fast CDN delivery + cross-browser safe.
// - Includes the weights we rely on for hierarchy: 300/400/500/600/700/800.
// - Sans-serif, designed for screens — pairs well with Geist for Latin.
// Activated via CSS on html[dir="rtl"] (see globals.css), so the Arabic
// payload only loads when the Arabic font variable is actually applied.
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${GeistSans.variable} ${bricolage.variable} ${cairo.variable} dark`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {/*
          Skip-to-content link — invisible until focused by keyboard.
          Critical a11y affordance for users navigating with Tab: lets
          them jump past the ~10 navbar links straight to page content.
          Pages that want to be the target add id="main-content" to
          their top-level <main>. Pages without one just fall through
          harmlessly (the anchor resolves to nothing, same as today).
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {locale === 'ar' ? 'تخطّى إلى المحتوى' : 'Skip to content'}
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
