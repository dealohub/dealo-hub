/**
 * Property detail loading skeleton.
 *
 * Mirrors the real 2-column layout:
 *   [ gallery + key-info + amenities + description ]  [ purchase panel ]
 *
 * The real page's `getPropertyBySlug` is usually <150ms but pulls a
 * lot of joins; on cold cache the skeleton keeps the header stable
 * while the grid fills in.
 */
export default function PropertyDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading property"
      className="mx-auto max-w-7xl px-4 py-6"
    >
      {/* Breadcrumb + hero header strip */}
      <div className="mb-4 h-3 w-1/3 animate-pulse rounded bg-foreground/5" />
      <div className="mb-3 h-8 w-2/3 animate-pulse rounded-lg bg-foreground/5" />
      <div className="mb-6 flex items-center gap-4">
        <div className="h-4 w-16 animate-pulse rounded bg-foreground/5" />
        <div className="h-4 w-20 animate-pulse rounded bg-foreground/5" />
        <div className="h-4 w-24 animate-pulse rounded bg-foreground/5" />
        <div className="h-4 w-28 animate-pulse rounded bg-foreground/5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Gallery */}
          <div className="h-[320px] animate-pulse rounded-2xl bg-foreground/5 md:h-[440px]" />
          {/* Gallery filter pills */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-foreground/5" />
            ))}
          </div>

          {/* Key info card */}
          <div className="space-y-3 rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-foreground/5" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-16 animate-pulse rounded bg-foreground/5" />
                  <div className="h-4 w-24 animate-pulse rounded bg-foreground/5" />
                </div>
              ))}
            </div>
          </div>

          {/* Amenities card */}
          <div className="space-y-3 rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="h-5 w-24 animate-pulse rounded bg-foreground/5" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-foreground/5" />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="h-5 w-28 animate-pulse rounded bg-foreground/5" />
            <div className="h-3 w-full animate-pulse rounded bg-foreground/5" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-foreground/5" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-foreground/5" />
          </div>
        </div>

        {/* Sidebar — purchase panel */}
        <aside className="space-y-4">
          <div className="sticky top-4 space-y-4 rounded-2xl border border-border/40 bg-card/40 p-5">
            <div className="h-9 w-40 animate-pulse rounded-lg bg-foreground/5" />
            <div className="h-3 w-24 animate-pulse rounded bg-foreground/5" />
            <div className="space-y-2 border-t border-border/40 pt-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-24 animate-pulse rounded bg-foreground/5" />
                  <div className="h-3 w-16 animate-pulse rounded bg-foreground/5" />
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-11 animate-pulse rounded-lg bg-primary/10" />
              <div className="h-11 animate-pulse rounded-lg bg-foreground/5" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-foreground/5" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-foreground/5" />
              <div className="h-9 flex-1 animate-pulse rounded-lg bg-foreground/5" />
            </div>
          </div>
        </aside>
      </div>
      <span className="sr-only">Loading property details…</span>
    </div>
  );
}
