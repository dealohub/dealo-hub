import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CoverImageProps {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  /** Sizes hint for next/image. Defaults to grid-card breakpoints. */
  sizes?: string;
}

const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';

/**
 * CoverImage — next/image wrapper for listing covers.
 *
 * - 4:3 aspect enforced by parent (use inside a `relative aspect-[4/3]` container)
 * - `priority` hint on the first 4 cards of a grid
 * - Graceful fallback when `src` is missing (skeleton-tinted placeholder)
 */
export function CoverImage({ src, alt, priority, className, sizes = DEFAULT_SIZES }: CoverImageProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'absolute inset-0 bg-canvas-zinc flex items-center justify-center',
          'text-muted-steel text-caption',
          className
        )}
      >
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      className={cn('object-cover transition-transform duration-500', className)}
    />
  );
}
