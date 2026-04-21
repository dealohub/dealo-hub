/**
 * App-facing types for the Landing-page dynamic surfaces
 * (`LiveFeed` + `Feature283`).
 *
 * Naming convention: camelCase for derived fields (dealerVerified?)
 * but the historical feed shape from the seed era used lower-case
 * names (`loc`, `cat`, `meta`, `image`, `ts`). To avoid rewriting
 * both consumers in the same commit as this types file lands, we
 * preserve that shape exactly — the query mapper emits identical
 * property names so `live-feed.tsx` + `live-feed-parts.tsx` keep
 * compiling with only their prop injection wired up.
 *
 * Safety: phone_e164 and email MUST NEVER appear on these shapes
 * (Decision 2 — chat-only contact).
 */

export type FeedCategoryKey = 'cars' | 'property' | 'tech' | 'jobs';

export interface FeedListing {
  kind: 'listing' | 'pricedrop';
  id: number;
  cat: FeedCategoryKey;
  title: string;
  /** Compact spec line — "2024 · 1,500 km" style. */
  meta?: string;
  /** Pre-formatted current price, e.g. "AED 38,500.000". */
  price: string;
  /** Pre-formatted previous price; only set when kind='pricedrop'. */
  oldPrice?: string;
  /** Drop percent as a negative integer (e.g. -13). Only for pricedrop. */
  drop?: number;
  loc: string;
  dealer: string;
  verified?: boolean;
  featured?: boolean;
  /** Cover image URL. Rows without a cover are filtered out upstream. */
  image: string;
  /** created_at as epoch ms — drives the relative-time label. */
  ts: number;
}

/**
 * Hero-scatter image for Feature283. Sized and positioned by the
 * component's wrapper classes; the data layer only provides `src`
 * + `alt`.
 */
export interface HeroImage {
  src: string;
  alt: string;
}
