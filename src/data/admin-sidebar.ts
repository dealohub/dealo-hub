import type { AdminBadges } from '@/lib/admin/types';

/**
 * Admin navigation schema.
 *
 * Phase 9a ships a deliberately thin menu — only the surfaces that have
 * real pages behind them. Later phases add sub-items (e.g. AI reviews,
 * user reports, categories) by extending `AdminNavItem` with an optional
 * `items` array; the NavGroup renderer already supports that nested shape.
 *
 * The schema is built server-side (inside `app/[locale]/admin/layout.tsx`)
 * so titles can be translated once per request and badge counts are
 * hydrated from a single RPC round-trip.
 *
 * Icons are referenced by NAME (string union below), not by component
 * import. This keeps the schema a plain serializable object — required
 * because Next 16 / React 19 refuses to pass component references from
 * a Server Component to a Client Component ("Only plain objects can be
 * passed…"). The NavGroup client component maps names → lucide-react
 * components via a local lookup table.
 */

/** Icon names supported by the admin sidebar. Add new names here AND
 *  extend the `ICONS` map inside `nav-group.tsx`. Keeping both in the
 *  same module would drag `lucide-react` into the server graph. */
export type AdminIconName = 'LayoutDashboard' | 'ListChecks';

export interface AdminNavLeaf {
  title: string;
  url: string;
  icon?: AdminIconName;
  /** Rendered inside a `<Badge>` on the right edge of the row. */
  badge?: string | null;
}

export interface AdminNavGroupedItem {
  title: string;
  icon?: AdminIconName;
  badge?: string | null;
  items: AdminNavLeaf[];
}

export type AdminNavItem = AdminNavLeaf | AdminNavGroupedItem;

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

type AdminTranslator = (key: string) => string;

/**
 * Build the sidebar nav groups. Called from the admin layout (server
 * component) with a `getTranslations('admin')` translator and the live
 * badge counts from `getAdminBadges()`.
 *
 * URLs are locale-prefixed here so the NavGroup client component doesn't
 * have to call `useLocale()` — keeps the component data-driven and pure.
 */
export function buildAdminNavGroups(
  locale: 'ar' | 'en',
  t: AdminTranslator,
  badges: AdminBadges
): AdminNavGroup[] {
  const prefix = `/${locale}/admin`;
  const heldBadge =
    badges.held_count > 0 ? formatBadgeCount(badges.held_count) : null;

  return [
    {
      title: t('nav.moderation'),
      items: [
        {
          title: t('nav.dashboard'),
          url: prefix,
          icon: 'LayoutDashboard',
        },
        {
          title: t('nav.listings'),
          url: `${prefix}/listings`,
          icon: 'ListChecks',
          badge: heldBadge,
        },
      ],
    },
  ];
}

/**
 * Format a count for the sidebar badge. Counts over 99 clamp to "99+" so
 * the pill never blows out the row's width in the collapsed mobile view.
 */
function formatBadgeCount(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

/** Minimal admin user shape rendered in `NavUser` (sidebar footer). */
export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}
