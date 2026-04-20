import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Bricolage_Grotesque, Cairo } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from 'next-themes';
import { routing, type Locale } from '@/i18n/routing';

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
