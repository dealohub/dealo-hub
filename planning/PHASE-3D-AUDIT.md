# Phase 3d — Landing Wiring Audit + Plan

> Scope: wire the Landing page (`/[locale]/`) dynamic sections to
> Supabase, following the Phase 3b/3c pattern. Editorial sections
> stay hardcoded.
>
> Target: **zero synthesis, zero adapter**, UI parity with the
> current Landing. The live-feed simulation + Feature283 hero
> imagery migrate to real DB data; ACTIVITY_SIGNALS + partner /
> brand / AI blocks stay editorial per the Q3-locked strategy.
>
> Pattern matches Phase 3c exactly: audit → plan → (merged green-tree
> wiring commit) → cleanup → docs.
>
> **Author:** Claude Code · **Date:** 2026-04-20 · **Supersedes:** n/a

---

## 1. Component audit

6 Landing surfaces (plus helpers inside `live-feed-parts.tsx`). The
decision per component:

| # | Component | Reads `listings-data.ts`? | Decision | Reason |
|---|-----------|---------------------------|----------|--------|
| 1 | `feature-283.tsx` (hero) | **Yes** — `SEED_LISTINGS`, `HERO_LISTING_INDICES` | **A** | Scatters 6 cover images around the headline; needs real listing images. |
| 2 | `live-feed.tsx` | **Yes** — `SEED_LISTINGS`, `SEED_PRICE_DROPS`, `ACTIVITY_SIGNALS` | **A** | Renders listings + price-drops + activity signals; listings/price-drops need DB, signals stay editorial. |
| 3 | `live-feed-parts.tsx` (helpers: `LiveStatusBar`, `FeedHeader`, `FilterPills`, `SignalRow`, type exports) | No | **B** | Pure presentation + types consumed via props. `FeaturedPartnersSection` defined here with hardcoded `PARTNERS` array. |
| 4 | `ai-protection-strip.tsx` | No | **B** | Hardcoded `FEATURES` array (safety / inspection / trust claims). Editorial trust-building content. |
| 5 | `featured-brands-strip.tsx` | No | **B** | Hardcoded 12 brand marks marquee. Editorial marketing. |
| 6 | `site-footer.tsx` | No | **B** | Pure chrome — nav links, social, legal. No data dependency. |

### Totals

- **A (DB wiring):** 2 components (`feature-283`, `live-feed`)
- **B (editorial / hardcoded):** 4 components (`ai-protection-strip`, `featured-brands-strip`, `FeaturedPartnersSection` inside `live-feed-parts`, `site-footer`)
- **C (new architecture):** 0

The `live-feed-parts.tsx` file hosts 5 sub-components + type exports
+ the `PARTNERS` constant + `FeaturedPartnersSection`. None of these
read listings data directly. They consume the `FeedItem[]` prop from
`LiveFeed`. So the file stays as-is.

**No schema changes required.** The current tables (`listings`,
`listing_images`, `profiles`, `cities`, `categories`) cover every
field the Landing consumes. Categories for `real-estate` / `tech` /
`jobs` are seeded metadata but not listings (those verticals launch
later per TAXONOMY-V2 Phase 2/3).

---

## 2. New query surface

A new directory `src/lib/landing/` alongside `src/lib/rides/`. Same
conventions: server client, `cache()`, console-logged errors,
null/[] on failure.

### 2.1 `getLiveFeedListings`

```ts
export const getLiveFeedListings = cache(async function getLiveFeedListings(
  opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<FeedListing[]>
```

**Behaviour:**
- Fetches up to `limit` live listings (default 8) across all
  categories, sorted by `created_at DESC`.
- Filter: `status='live'` AND `fraud_status NOT IN ('held','rejected')`
  AND `soft_deleted_at IS NULL`.
- Derives `kind`: `'pricedrop'` when `old_price_minor_units IS NOT NULL`,
  otherwise `'listing'`.
- Derives `drop` percent in app from `(1 - price/old_price) * 100`.
- Joins: seller (name + dealer flags), city (localised), category
  (for the CategoryKey bucket mapping), cover image (position 0).

**CategoryKey mapping** (see §4) — the 4-bucket feed uses a small
helper keyed on the parent-category slug.

### 2.2 `getHeroListings`

```ts
export const getHeroListings = cache(async function getHeroListings(
  opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<HeroImage[]>
```

**Behaviour:**
- Fetches up to `limit` listings (default 6).
- Same RLS scope as above.
- Returns `{ src, alt }` per listing — alt uses the listing title.
- Listings without a cover image are filtered out.
- Order: newest first.

### 2.3 Types

```ts
export type FeedCategoryKey = 'cars' | 'property' | 'tech' | 'jobs';

export interface FeedListing {
  kind: 'listing' | 'pricedrop';
  id: number;
  cat: FeedCategoryKey;
  title: string;
  meta?: string;           // compact spec line (e.g. "2024 · 1,500 km")
  price: string;           // formatted via formatPrice
  oldPrice?: string;       // formatted; only when kind='pricedrop'
  drop?: number;           // negative percentage; only when kind='pricedrop'
  loc: string;             // localised city name
  dealer: string;          // dealer_name ?? display_name
  verified?: boolean;      // dealer-verified flag
  featured?: boolean;      // is_featured
  image: string;           // cover URL
  ts: number;              // created_at as epoch ms
}

export interface HeroImage {
  src: string;
  alt: string;
}
```

These match the shape consumed by `LiveFeed` + `Feature283` today,
so the components only need prop-injection + source swap — no UI
rewrite.

---

## 3. Component migration plan

### 3.1 `feature-283.tsx`

- Keep `'use client'` (uses `useState` for the category pills + `motion.div` drag).
- Change: drop `SEED_LISTINGS` / `HERO_LISTING_INDICES` imports.
- Add prop: `images: HeroImage[]`.
- Loop through the 6 `wraps` slots, showing up to `images.length` scatters.
  - If fewer than 6 images exist, render only what's available (the extra slots stay empty — the headline remains the visual focus).
- No other UI changes — the rest of the component is editorial copy + search UI.

### 3.2 `live-feed.tsx`

- Keeps `'use client'` for the 8-second rotation + filter state.
- New props: `initialFeed: FeedListing[]` + `activitySignals: string[]`.
- Initial state derived from `initialFeed`, with price-drops/listings
  already typed.
- 8-second tick logic unchanged but pulls from `initialFeed` pool
  instead of seed arrays: shuffles a random fresh item from the
  pre-fetched set, prepends it with a new `ts`, and drops the oldest
  to keep the visible set at 8.
- `ACTIVITY_SIGNALS` — now lives in a new `src/lib/landing/constants.ts`
  (editorial strings, locale-independent one-liners for V1).
- Filter pills keep their existing 4 buckets. If a bucket has zero
  items in the pre-fetched set, the pill can still render but
  filtering yields an empty state.

### 3.3 `app/[locale]/page.tsx`

- Flips from `'use client'` to a default-async Server Component.
- Pre-fetches in parallel: `getHeroListings({ limit: 6, locale })` +
  `getLiveFeedListings({ limit: 8, locale })`.
- Passes results down as props. `ACTIVITY_SIGNALS` imported from
  `src/lib/landing/constants.ts` and passed through.
- Add `export const revalidate = 60` for ISR parity with other pages.

The `ThemeToggle` / `LocaleToggle` / `SiteFooter` / `AIProtectionStrip`
/ `FeaturedBrandsStrip` / `FeaturedPartnersSection` all stay as-is.

---

## 4. CategoryKey mapping helper

The feed has 4 UI buckets (`cars` / `property` / `tech` / `jobs`),
but the DB has 21 parent categories. Map via parent-category slug:

```ts
const PARENT_TO_BUCKET: Record<string, FeedCategoryKey> = {
  automotive: 'cars',
  'real-estate': 'property',
  electronics: 'tech',
  jobs: 'jobs',
};

function toFeedCategory(parentSlug: string | null): FeedCategoryKey {
  return (parentSlug && PARENT_TO_BUCKET[parentSlug]) || 'tech';
}
```

Rationale: only 4 verticals map cleanly to the visible feed buckets.
Everything else (furniture / fashion / luxury / etc.) defaults to
`'tech'` in V1 as a catch-all. When more hubs ship (Phase 4+), either
expand the buckets or migrate the feed to category-slug-keyed pills
dynamically.

Resolving the parent slug in the query uses a nested Supabase select:

```ts
category:categories!listings_category_id_fkey (
  slug,
  parent:parent_id (slug)
)
```

---

## 5. Commit sequence (4 commits)

Same tree-green discipline as Phase 3c.

| # | Commit | Scope |
|---|--------|-------|
| 3d.1 | `feat(landing): add queries + FeedListing/HeroImage types` | `src/lib/landing/queries.ts` + `src/lib/landing/constants.ts` (ACTIVITY_SIGNALS) + `src/lib/landing/types.ts`. |
| 3d.2 | `feat(landing): wire LiveFeed + Feature283 to DB (big merge)` | `app/[locale]/page.tsx` becomes async; `feature-283` takes `images` prop; `live-feed` takes `initialFeed` + `activitySignals` props. |
| 3d.3 | `chore(landing): retire listings-data.ts` | Grep-verified zero consumers, then delete. |
| 3d.4 | `docs: mark landing as DB-backed (Phase 3d complete)` | `docs/STATUS.md` + `docs/RIDES-DETAIL.md` change log + remove `listings-data.ts` from deprecation list. |

---

## 6. Success criteria

- [ ] `getLiveFeedListings` + `getHeroListings` land in `src/lib/landing/queries.ts`, typed + cached.
- [ ] `ACTIVITY_SIGNALS` relocates to `src/lib/landing/constants.ts`.
- [ ] Landing page renders real listings end-to-end (Feature283 hero + LiveFeed cards).
- [ ] Hero shows up to 6 real cover images; if DB holds <6, extra slots stay empty without errors.
- [ ] LiveFeed filter pills work: `all` shows everything; `cars` shows automotive items; `property` / `tech` / `jobs` show empty states in V1 (no listings in those verticals yet).
- [ ] Price-drop items render with strike-through where `old_price_minor_units IS NOT NULL`.
- [ ] `listings-data.ts` deleted. Grep `listings-data` across `src/` + `app/` returns 0.
- [ ] `tsc --noEmit` = 0 errors throughout.
- [ ] ISR revalidate = 60 on the Landing page.
- [ ] `docs/STATUS.md` + `docs/RIDES-DETAIL.md` change log updated.

---

## 7. Open questions (none block 3d.1)

### Q1 — Multi-vertical seed data
Current DB has 5 automotive listings only. Property / tech / jobs
categories aren't seeded with listings. The Landing feed therefore
shows "cars only" in practice.

**Recommendation:** accept V1 only-automotive feed. The bar at top
says "live across the Gulf" but everything underneath is cars. Honest
with reality until the next vertical seeds. Alternative would be to
pre-seed 2-3 fake non-automotive listings, but that's a "demo
polish" task — out of Phase 3d scope.

### Q2 — 8-second rotation with a small pool
The Phase 3a + 3b seed has 5 automotive listings. With 8 visible
slots and a rotation that fetches the pool avoiding recent items,
the rotation will cycle quickly and feel repetitive.

**Recommendation:** keep the rotation code but tolerate repetition
for V1. When more seeds land (Phase 4+), the rotation becomes
naturally varied. The alternative (pausing the rotation when pool
is exhausted) adds complexity for a V1 cosmetic concern.

### Q3 — FeedHeader / FilterPills copy
Current headers refer to activity across 4 verticals. In V1 with
only-automotive content, the copy ("جديد في السوق", "across the
Gulf") still works generically.

**Recommendation:** no change. Copy remains honest-ish. Revisit
when the vertical mix expands.

---

## 8. Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-20 | Initial audit. 6 components triaged: 2 A (LiveFeed, Feature283), 4 B (editorial), 0 C. 2 new queries + 1 helper mapping + 1 constants file. Zero migrations needed. 4-commit sequence planned. | Claude Code |
