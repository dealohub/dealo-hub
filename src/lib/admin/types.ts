/**
 * Pure types and constants shared between the admin server queries and the
 * admin client components. This module has NO `server-only` guard — it's
 * imported from client components (e.g. listings-table) for types + the
 * status-tab enum. Keep it free of runtime deps on supabase / fs / cookies.
 */

// ---------------------------------------------------------------------------
// Sidebar badges
// ---------------------------------------------------------------------------

export interface AdminBadges {
  held_count: number;
  ai_held_count: number;
  pending_reports_count: number;
}

// ---------------------------------------------------------------------------
// Listings moderation
// ---------------------------------------------------------------------------

export const LISTING_STATUS_TABS = [
  'all',
  'held',
  'live',
  'rejected',
  'draft',
  'sold',
  'archived',
] as const;

export type ListingStatusTab = (typeof LISTING_STATUS_TABS)[number];

/**
 * Listing row shape used by the admin listings table.
 * Intentionally flat — the table doesn't render nested blocks, just cells.
 */
export interface AdminListingRow {
  id: number;
  title: string;
  status: string;
  fraud_status: string;
  price_minor_units: number;
  currency_code: string;
  country_code: string;
  category_id: number;
  category_name_ar: string | null;
  category_name_en: string | null;
  seller_id: string;
  seller_name: string | null;
  seller_handle: string | null;
  thumbnail_url: string | null;
  created_at: string;
  published_at: string | null;
}

export interface GetListingsPageInput {
  tab: ListingStatusTab;
  /** Search query against title. Case-insensitive. */
  q?: string;
  /** 1-indexed. */
  page?: number;
  /** Default 25. Capped at 100. */
  pageSize?: number;
}

export interface GetListingsPageResult {
  rows: AdminListingRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type StatusCounts = Record<ListingStatusTab, number>;
