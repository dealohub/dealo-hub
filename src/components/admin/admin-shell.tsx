'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

interface AdminShellProps {
  /** Persisted sidebar open/closed state from the `sidebar_state` cookie. */
  defaultOpen: boolean;
  /** Current admin — drives the footer NavUser widget. */
  user: SidebarUser;
  children: React.ReactNode;
}

/**
 * Outer chrome for `/admin/*`.
 *
 * This now delegates to the original shadcn `dashboard-01` AppSidebar
 * (installed at `src/components/app-sidebar.tsx`) so every feature from
 * the reference kit — nav groups, documents list, quick create, nav-user
 * dropdown — ships as-is. The only integration point is the `user` prop,
 * which we fill from the live admin's profile so NavUser shows the real
 * account rather than the demo "shadcn / m@example.com".
 *
 * Dealo-specific customization (branding, locale-aware nav, RTL side)
 * happens on top of this scaffold in later passes — the current goal is
 * the original, full-featured design intact.
 */
export function AdminShell({ defaultOpen, user, children }: AdminShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
