import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Skeleton — loading placeholder using existing `animate-shimmer` keyframe.
 *
 * Replaces circular spinners (banned by DESIGN.md Section 22). Use anywhere
 * server data is still loading on the client.
 */

const skeletonVariants = cva(
  [
    'relative overflow-hidden bg-canvas-zinc',
    // Shimmer swipe via ::after pseudo — uses the `shimmer` keyframe already in tailwind.config.
    'after:absolute after:inset-0',
    'after:-translate-x-full rtl:after:translate-x-full',
    'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
    'after:animate-shimmer',
  ],
  {
    variants: {
      rounded: {
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: { rounded: 'md' },
  }
);

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, rounded, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-hidden="true"
      className={cn(skeletonVariants({ rounded }), className)}
      {...props}
    />
  );
}
