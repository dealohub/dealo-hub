'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface AdminHeaderProps {
  /** Rendered as the page's H1. Keep it short — truncates on narrow widths. */
  title: string;
  /** Optional subtitle rendered below the title, muted. */
  subtitle?: string;
  /** Right-side slot for filters / primary actions. Stays on the end edge. */
  actions?: React.ReactNode;
}

/**
 * Top bar for every admin route. Renders inside `SidebarInset` so it sits
 * flush with the sidebar edge in desktop + stacks on mobile.
 *
 * Layout (LTR):
 *   ┌──┬──────────────────────────────────┬──────────────┐
 *   │☰ │ Page title                       │ [actions]    │
 *   │  │ optional subtitle                │              │
 *   └──┴──────────────────────────────────┴──────────────┘
 *
 * In RTL the sidebar trigger lives on the right (sidebar side) and
 * actions fall on the left; achieved purely through logical `ms-`/`me-`
 * utilities, no dir branching.
 */
export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
      <SidebarTrigger className="size-8 shrink-0" />
      <Separator orientation="vertical" className="h-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground truncate text-xs">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
