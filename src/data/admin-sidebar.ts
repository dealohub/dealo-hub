import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ListChecks } from 'lucide-react';
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
 * so icons stay as real component references rather than strings, and so
 * badge counts are hydrated once per request from a single RPC round-trip.
 */

export interface AdminNavLeaf {
  title: string;
  url: string;
  icon?: LucideIcon;
  /** Rendered inside a `<Badge>` on the right edge of the row. */
  badge?: string | null;
}

export interface AdminNavGroupedItem {
  title: string;
  icon?: LucideIcon;
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
          icon: LayoutDashboard,
        },
        {
          title: t('nav.listings'),
          url: `${prefix}/listings`,
          icon: ListChecks,
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
