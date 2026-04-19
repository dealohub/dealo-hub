import type { CSSProperties, ReactNode } from 'react';

/**
 * BackgroundPattern115 — Center Vignette Dot Grid (shadcn-blocks port)
 */
interface BackgroundPattern115Props {
  className?: string;
  children?: ReactNode;
  density?: number;
  vignette?: number;
  style?: CSSProperties;
}

const BackgroundPattern115 = ({
  className = '',
  children,
  density = 3,
  vignette = 60,
  style = {},
}: BackgroundPattern115Props) => {
  const bgStyle: CSSProperties = {
    background:
      'radial-gradient(oklch(from var(--primary) calc(l * 0.8) calc(c * 1.5) h / 1) 1px, transparent 1px)',
    backgroundSize: `${density}px ${density}px`,
    maskImage: `radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 1), transparent ${vignette}%)`,
    WebkitMaskImage: `radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 1), transparent ${vignette}%)`,
  };

  return (
    <section
      className={`relative flex min-h-screen w-full items-center justify-center ${className}`}
      style={style}
    >
      <div className="absolute inset-0 z-0 pointer-events-none" style={bgStyle} />
      <div className="relative z-10 w-full">{children ?? <PatternPlaceholder />}</div>
    </section>
  );
};

/** PatternPlaceholder — the default shadcn-blocks placeholder slot. */
export const PatternPlaceholder = () => (
  <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/60 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm">
    Pattern Placeholder
  </div>
);

export default BackgroundPattern115;
