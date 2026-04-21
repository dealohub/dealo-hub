/**
 * Locale-wide loading fallback.
 *
 * Rendered by Next.js during the server-render gap for any route under
 * /{locale}/… that doesn't define its own `loading.tsx`. Keeps the
 * navbar region quiet (the navbar isn't part of this segment on most
 * pages; each page imports it explicitly) and gives a calm skeleton
 * for the main content area.
 *
 * Pages with richer skeletons (property detail, rides hub, messages)
 * override this with their own loading.tsx.
 */
export default function LocaleLoading() {
  return (
    <div
      className="min-h-[70vh] px-4 py-10"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Title skeleton */}
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-foreground/5" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/5" />

        {/* Content grid skeleton */}
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border/40 bg-card/40 p-4"
            >
              <div className="h-40 animate-pulse rounded-lg bg-foreground/5" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-foreground/5" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/5" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-foreground/5" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
