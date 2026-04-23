'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary — catches errors thrown by the root layout
 * itself (app/layout.tsx). Must define its own <html>/<body> because
 * the root layout fails to render when this fires.
 *
 * Everything inside the locale segment is caught by
 * app/[locale]/error.tsx instead (which preserves navigation + i18n).
 * This one is the absolute last-resort fallback.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No i18n, no Supabase, no analytics here — everything may be
    // broken. Just log to the server-side console via Next's runtime
    // and hope a future observability layer picks it up.
    // eslint-disable-next-line no-console
    console.error('[global-error]', error.digest ?? '(no digest)', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#0a0a0c',
          color: '#f4f2ee',
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              opacity: 0.6,
            }}
            aria-hidden
          >
            ⚠
          </div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            عذراً — واجه التطبيق خطأ غير متوقّع.
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            Something went wrong. Our team was notified. If it keeps
            happening please contact support.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.625rem',
                opacity: 0.4,
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#f4f2ee',
                color: '#0a0a0c',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              إعادة المحاولة
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error must work even when root layout fails, so <Link> is unsafe here */}
            <a
              href="/"
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                color: '#f4f2ee',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid rgba(244, 242, 238, 0.3)',
                textDecoration: 'none',
              }}
            >
              العودة للرئيسية
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
