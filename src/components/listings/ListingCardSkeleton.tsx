import { cn } from '@/lib/utils';

interface ListingCardSkeletonProps {
  className?: string;
}

/**
 * Matches ListingCard dimensions exactly. Used as suspense fallback during
 * client-side navigation and infinite-scroll loading.
 */
export function ListingCardSkeleton({ className }: ListingCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col bg-pure-surface border border-ghost-border rounded-2xl overflow-hidden shadow-card',
        className
      )}
      aria-hidden="true"
    >
      <div className="relative aspect-[4/3] bg-canvas-zinc overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-4/5 rounded bg-canvas-zinc" />
        <div className="h-5 w-3/5 rounded bg-canvas-zinc" />
        <div className="h-3 w-2/5 rounded bg-canvas-zinc mt-1" />
        <div className="h-6 w-1/2 rounded bg-canvas-zinc mt-2" />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-whisper-divider">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-canvas-zinc" />
          <div className="h-3 w-20 rounded bg-canvas-zinc" />
        </div>
        <div className="h-4 w-6 rounded bg-canvas-zinc" />
      </div>
    </div>
  );
}
