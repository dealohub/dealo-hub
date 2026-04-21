import { notFound } from 'next/navigation';

/**
 * Catch-all route — forces unknown paths under /{locale}/… to render
 * the branded `app/[locale]/not-found.tsx` instead of Next's bare
 * default 404.
 *
 * Without this file, Next treats "no matching route file" as a hard
 * 404 that bypasses the segment's not-found boundary. With it, the
 * segment's layout + navbar + footer stay, and our localized page
 * renders inside.
 *
 * Recommended by next-intl for i18n-aware 404s. See:
 *   https://next-intl-docs.vercel.app/docs/environments/error-files#not-foundjs
 */
export default function CatchAll() {
  notFound();
}
