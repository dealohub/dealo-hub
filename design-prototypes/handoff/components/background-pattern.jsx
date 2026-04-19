/**
 * BackgroundPattern115 — Center Vignette Dot Grid (shadcn-blocks port)
 *
 * Real location in your codebase:
 *   src/components/shadcnblocks/background-pattern-115.tsx
 *
 * import { PatternPlaceholder } from "@/components/shadcnblocks/pattern-placeholder";
 * import { cn } from "@/lib/utils";
 *
 * interface BackgroundPattern115Props { className?: string; }
 *
 * The original wraps a <PatternPlaceholder /> inside the section. In this
 * HTML port we accept `children` so callers can swap in any content.
 */
const BackgroundPattern115 = ({ className = "", children, density = 3, vignette = 60, style = {} }) => {
  const bgStyle = {
    background:
      "radial-gradient(oklch(from var(--primary) calc(l * 0.8) calc(c * 1.5) h / 1) 1px, transparent 1px)",
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
const PatternPlaceholder = () => (
  <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/60 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm">
    Pattern Placeholder
  </div>
);

Object.assign(window, { BackgroundPattern115, PatternPlaceholder });
