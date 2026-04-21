/**
 * Observability — error capture.
 *
 * Central function used by `app/[locale]/error.tsx`, server actions,
 * and anywhere we need to log a non-fatal failure.
 *
 * Transport:
 *   - If Sentry is wired (SENTRY_DSN present) we call `Sentry.captureException`.
 *   - Otherwise we fall through to `console.error` — which Next.js prints
 *     server-side and ships to Vercel Runtime Logs in production.
 *
 * We deliberately DO NOT import `@sentry/nextjs` unconditionally:
 *   - Keeps the bundle light until Sentry is actually provisioned.
 *   - No "missing env var" warnings on local dev.
 *
 * When Sentry lands we'll swap the body for a thin adapter. Callers
 * never change.
 */

export interface CaptureContext {
  /** Short identifier of where the error was caught. */
  scope?: string;
  /** Next.js server-action error digest (safe to log). */
  digest?: string;
  /** Extra tags to attach (key: string, value: string). */
  tags?: Record<string, string>;
  /** Free-form extra payload — kept small; never PII. */
  extra?: Record<string, unknown>;
  /** Authenticated user id, if known. */
  userId?: string;
}

export function captureError(
  error: unknown,
  ctx: CaptureContext = {},
): void {
  try {
    const payload = {
      scope: ctx.scope ?? 'unknown',
      digest: ctx.digest,
      tags: ctx.tags,
      userId: ctx.userId,
      extra: ctx.extra,
    };
    // eslint-disable-next-line no-console
    console.error(
      `[observability] ${payload.scope}${payload.digest ? ` (${payload.digest})` : ''}:`,
      error instanceof Error ? error.stack || error.message : error,
      Object.keys(payload.tags ?? {}).length || Object.keys(payload.extra ?? {}).length
        ? payload
        : '',
    );

    // Sentry wiring lands here — kept inline as a TODO so the switch
    // is literally one conditional import. Do not turn this into an
    // npm dependency until the Sentry DSN is provisioned.
    //
    //   if (process.env.SENTRY_DSN) {
    //     const Sentry = await import('@sentry/nextjs');
    //     Sentry.captureException(error, { tags: payload.tags, extra: payload.extra, user: payload.userId ? { id: payload.userId } : undefined });
    //   }
  } catch {
    // Capture must never throw — the caller is already in a bad state.
  }
}
