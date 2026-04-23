'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/admin/app-sidebar';
import type { AdminNavGroup, AdminUser } from '@/data/admin-sidebar';

interface AdminShellProps {
  /** Locale for locale-aware bits (dropdown side, sign-out form). */
  locale: 'ar' | 'en';
  /** Nav groups with already-prefixed URLs + translated titles. */
  navGroups: AdminNavGroup[];
  /** Current admin for the footer nav-user widget. */
  user: AdminUser;
  /** Persisted sidebar open/closed state from the `sidebar_state` cookie. */
  defaultOpen: boolean;
  children: React.ReactNode;
}

/**
 * Outer chrome for `/admin/*`. Wires the sidebar primitive, hydrates the
 * nav schema + user, and hands the rest of the route tree to `SidebarInset`
 * so `<header>` / `<main>` flex correctly next to the sidebar.
 *
 * Why client-side:
 *   The sidebar primitive uses React context + a keyboard shortcut and a
 *   cookie write-back on toggle — all client-only. The layout's server
 *   component pre-computes data and hands it down as props, so we don't
 *   re-fetch in the browser.
 *
 * Side selection:
 *   Arabic is RTL so the sidebar lives on the right edge of the viewport;
 *   English (LTR) keeps it on the left. The `Sidebar` primitive's `side`
 *   prop is physical (`"left"` | `"right"`) because Radix Dialog's slide
 *   animation pins to a physical edge — the consumer picks based on dir.
 */
export function AdminShell({
  locale,
  navGroups,
  user,
  defaultOpen,
  children,
}: AdminShellProps) {
  const side = locale === 'ar' ? 'right' : 'left';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar side={side} locale={locale} navGroups={navGroups} user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
