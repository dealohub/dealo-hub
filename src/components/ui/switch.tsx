'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Switch — Radix-based toggle primitive (DESIGN.md Section 5 input pattern).
 *
 * States:
 *   off → zinc track, thumb on start
 *   on  → amber track, thumb on end
 *   focus-visible: amber ring + offset
 *   disabled: 50% opacity
 *
 * Sizes:
 *   sm → 32x18 (compact rows)
 *   md → 44x24 (default — meets 44px touch height on mobile when wrapped in a label)
 *
 * RTL: Radix Switch auto-flips thumb direction via `dir` on document — no extra work.
 */

const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full',
    'border border-transparent',
    'transition-[background,box-shadow] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-warm-amber',
    'data-[state=unchecked]:bg-zinc-300',
  ],
  {
    variants: {
      size: {
        sm: 'h-[18px] w-8',
        md: 'h-6 w-11',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const thumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-white',
    'shadow-[0_1px_2px_rgba(24,24,27,0.12)]',
    'transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
    'data-[state=unchecked]:translate-x-0',
    // Radix appends `data-state` on both track and thumb; `rtl:` flips direction.
  ],
  {
    variants: {
      size: {
        sm: 'size-3.5 data-[state=checked]:translate-x-[14px] rtl:data-[state=checked]:-translate-x-[14px]',
        md: 'size-5 data-[state=checked]:translate-x-[20px] rtl:data-[state=checked]:-translate-x-[20px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export interface SwitchProps
  extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn(thumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  )
);

Switch.displayName = 'Switch';
