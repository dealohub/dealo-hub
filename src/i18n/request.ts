import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

/**
 * Per-request i18n configuration for next-intl.
 *
 * Loads translation messages for the current locale from /messages/{locale}.json.
 *
 * next-intl 4 API: the callback now receives `{ requestLocale }` as a
 * Promise (not `{ locale }` directly), and we must fall back to the
 * default locale if it's missing or unsupported.
 */

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Asia/Kuwait',
    now: new Date(),
  };
});
