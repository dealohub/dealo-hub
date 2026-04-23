import type { Metadata } from 'next';
import { Dashboard9 } from '@/components/dashboard9';
import LocaleToggle from '@/components/locale-toggle';

/**
 * Admin dashboard — the premium shadcnblocks `dashboard9` block as shipped.
 *
 * Phase 9c rewires this route to the block referenced by
 * https://www.shadcnblocks.com/admin-dashboard — the self-contained
 * dashboard variant with its own `SidebarProvider`, `AppSidebar`,
 * `DashboardHeader` (date range + platform/product filters + export + bell),
 * accounting KPI cards, sales-pipeline bar chart, revenue-flow line chart,
 * recent-orders table, and fulfillment progress panel.
 *
 * Because `Dashboard9` owns the full shell, the parent layout
 * (`app/[locale]/admin/layout.tsx`) is intentionally shell-less — it only
 * runs the auth gate. Sibling routes like `/admin/listings` bring their
 * own `AdminShell` when they need the moderation sidebar.
 *
 * Intentionally unchanged from the reference block: branding ("Acme Store"),
 * hardcoded demo data, English UI. These are the next customization passes
 * once the reference design is verified end-to-end.
 */

export const metadata: Metadata = {
  title: 'Dashboard · Dealo',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <>
      <Dashboard9 />
      <LocaleToggle />
    </>
  );
}
