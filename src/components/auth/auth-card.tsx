import Link from 'next/link';
import Image from 'next/image';

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
          <Image
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-icon.svg"
            alt="Dealo Hub"
            width={24}
            height={24}
            className="h-6 w-6"
          />
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
