/**
 * Chat thread loading skeleton.
 *
 * Mirrors the real thread layout: listing mini-header + messages
 * column + composer at the bottom. The real content swaps in
 * once `getThread` resolves (which on a warm DB is usually
 * <100ms, but this keeps the shell stable over a slow 4G tab).
 */
export default function ThreadLoading() {
  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col px-4 py-4 md:py-6"
      role="status"
      aria-live="polite"
      aria-label="Loading conversation"
    >
      {/* Header strip — back button + listing mini */}
      <header className="mb-3 flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-foreground/5" />
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-foreground/5" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="h-3 w-1/3 animate-pulse rounded bg-foreground/5" />
          <div className="h-2.5 w-2/3 animate-pulse rounded bg-foreground/5" />
        </div>
      </header>

      {/* Messages list — alternating sides */}
      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        <div className="flex justify-start">
          <div className="h-10 w-3/5 animate-pulse rounded-2xl rounded-bl-sm bg-foreground/5" />
        </div>
        <div className="flex justify-end">
          <div className="h-14 w-2/3 animate-pulse rounded-2xl rounded-br-sm bg-primary/10" />
        </div>
        <div className="flex justify-start">
          <div className="h-8 w-1/2 animate-pulse rounded-2xl rounded-bl-sm bg-foreground/5" />
        </div>
      </div>

      {/* Composer placeholder */}
      <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-card p-3">
        <div className="flex items-end gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-foreground/5" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-foreground/5" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-foreground/10" />
        </div>
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-foreground/5" />
      </div>
      <span className="sr-only">Loading conversation…</span>
    </main>
  );
}
