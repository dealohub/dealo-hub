import Link from 'next/link';

/**
 * AuthCard — centered card shell used by all auth pages (signin,
 * signup, reset-password, reset-password/confirm).
 *
 * Layout:
 *   - Background pattern (subtle dot grid, same as landing hero backdrop)
 *   - Logo → back home
 *   - Title + subtitle
 *   - Content slot (form)
 *   - Optional footer slot (link to sibling page: "No account? Sign up")
 */

interface Props {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  locale: 'ar' | 'en';
}

export default function AuthCard({ title, subtitle, footer, children, locale }: Props) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Subtle dot grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgb(from_var(--foreground)_r_g_b_/_0.08)_1px,transparent_0)] [background-size:24px_24px]"
      />
      {/* Center-vignette glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]"
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
        >
          <svg
            width="24"
            height="28"
            viewBox="0 0 78 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-auto"
            aria-hidden="true"
          >
            <path
              d="M38.9999 0L0 22.2857V66.857L38.9999 89.1427L77.989 66.8636L78.0001 66.8457V22.2852L38.9999 0ZM38.9999 8.57868L66.7352 24.425L59.2336 28.7131L39.0004 17.1563L18.7716 28.7163L11.2632 24.4248L38.9999 8.57868ZM55.4857 35.1517V49.7034L42.7541 42.4322V27.8797L55.4857 35.1517ZM35.2458 27.8797V42.429L22.5177 49.7019V35.152L35.2458 27.8797ZM35.2458 78.4208L7.50401 62.5701V30.8587L15.0074 35.1467V58.2812L35.2455 69.8456L35.2458 78.4208ZM26.2649 56.1351L38.9965 48.8596L51.7315 56.1351L38.9999 63.408L26.2649 56.1351ZM70.4946 62.5705L42.7528 78.4212V69.8443L62.9893 58.2834V35.1446L70.4926 30.8565V62.5701L70.4946 62.5705Z"
              fill="currentColor"
            />
          </svg>
          <span>Dealo Hub</span>
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm leading-relaxed text-foreground/60">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {footer && <div className="text-center text-sm text-foreground/60">{footer}</div>}
      </div>
    </div>
  );
}
