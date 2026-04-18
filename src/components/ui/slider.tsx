'use client';

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

/**
 * Slider — Radix range slider primitive.
 *
 * - Amber accent on active range + thumbs
 * - 24px thumbs for comfortable mobile touch
 * - Supports single- or multi-thumb (pass `value=[min, max]` for range)
 * - RTL: Radix handles directionality automatically via document `dir`
 */
export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const thumbCount = Array.isArray(props.value)
    ? props.value.length
    : Array.isArray(props.defaultValue)
      ? props.defaultValue.length
      : 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-200"
      >
        <SliderPrimitive.Range className="absolute h-full bg-warm-amber" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'block size-6 rounded-full bg-pure-surface border-2 border-warm-amber',
            'shadow-[0_1px_4px_rgba(24,24,27,0.12)]',
            'transition-shadow duration-150',
            'hover:shadow-[0_2px_8px_rgba(217,119,6,0.24)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2',
            'disabled:pointer-events-none'
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = 'Slider';
