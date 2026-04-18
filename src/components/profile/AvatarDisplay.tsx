import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * AvatarDisplay — avatar image with initials fallback.
 *
 * Fallback: amber-tinted circle with up-to-2 initials derived from display name.
 * Never renders a generic user-silhouette placeholder (DESIGN.md Section 22).
 */

const sizeTokens = {
  sm: { px: 32, cls: 'size-8 text-body-small' },
  md: { px: 48, cls: 'size-12 text-body' },
  lg: { px: 72, cls: 'size-[72px] text-heading-3' },
  xl: { px: 96, cls: 'size-24 text-heading-2' },
} as const;

const fallbackVariants = cva(
  [
    'flex items-center justify-center rounded-full',
    'bg-warm-amber/10 text-warm-amber-700 font-semibold',
    'select-none',
  ],
  {
    variants: {
      size: {
        sm: sizeTokens.sm.cls,
        md: sizeTokens.md.cls,
        lg: sizeTokens.lg.cls,
        xl: sizeTokens.xl.cls,
      },
    },
    defaultVariants: { size: 'md' },
  }
);

interface AvatarDisplayProps extends VariantProps<typeof fallbackVariants> {
  src?: string | null;
  name: string;
  className?: string;
}

/** Extracts up to 2 uppercase initials from a display name (ASCII + Arabic). */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarDisplay({ src, name, size = 'md', className }: AvatarDisplayProps) {
  const sizeKey = (size ?? 'md') as keyof typeof sizeTokens;
  const px = sizeTokens[sizeKey].px;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={cn(
          'rounded-full object-cover bg-canvas-zinc',
          sizeTokens[sizeKey].cls.split(' ')[0],
          className
        )}
        // Avatars change on upload (timestamped path), so Next can cache aggressively.
        sizes={`${px}px`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(fallbackVariants({ size }), className)}
    >
      {getInitials(name)}
    </span>
  );
}
