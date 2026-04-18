import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from './routing';

/**
 * Per-request i18n configuration for next-intl.
 *
 * Loads translation messages for the current locale from /messages/{locale}.json
 */

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Asia/Kuwait',
    now: new Date(),
  };
});
