/**
 * Inbox loading skeleton.
 *
 * Mirrors the real inbox: title + active/archived tabs + a list of
 * conversation rows. Each row skeleton matches the real row's shape
 * — avatar + title/preview stack + timestamp + price.
 */
export default function InboxLoading() {
  return (
    <main
      className="mx-auto max-w-3xl px-4 py-6"
      role="status"
      aria-live="polite"
      aria-label="Loading inbox"
    >
      <div className="mb-2 h-7 w-32 animate-pulse rounded-lg bg-foreground/5" />
      <div className="mb-5 h-3 w-2/3 animate-pulse rounded bg-foreground/5" />

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-border/50">
        <div className="h-9 w-24 animate-pulse rounded-t-lg bg-foreground/5" />
        <div className="h-9 w-20 animate-pulse rounded-t-lg bg-foreground/5" />
      </div>

      {/* Rows */}
      <ul className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3"
          >
            <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-lg bg-foreground/5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/5" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-foreground/5" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-foreground/5" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-2.5 w-12 animate-pulse rounded bg-foreground/5" />
              <div className="h-3 w-16 animate-pulse rounded bg-foreground/5" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading conversations…</span>
    </main>
  );
}
