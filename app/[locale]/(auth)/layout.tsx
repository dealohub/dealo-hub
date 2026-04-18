import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';
import { Sparkles } from 'lucide-react';

/**
 * (auth) route-group layout.
 *
 * Centered card layout on a subtle warm gradient. No Nav / Footer here —
 * the authenticated-app shell lives under (app) route group.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        min-h-[100dvh] w-full
        flex flex-col items-center
        bg-canvas-zinc
        bg-[radial-gradient(circle_at_50%_0%,_rgba(217,119,6,0.06)_0%,_transparent_50%)]
      "
    >
      {/* Brand header — simple, not full Nav */}
      <header className="w-full py-6">
        <div className="container flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="
                flex items-center justify-center
                size-8 rounded-lg bg-warm-amber text-white
                transition-transform duration-200
                group-hover:rotate-[-3deg] group-hover:scale-105
              "
            >
              <Sparkles className="size-4" strokeWidth={2.5} />
            </span>
            <span className="text-heading-3 font-bold tracking-tight text-charcoal-ink">
              Dealo Hub
            </span>
          </Link>
        </div>
      </header>

      {/* Card slot */}
      <main className="flex-1 w-full flex items-start sm:items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
