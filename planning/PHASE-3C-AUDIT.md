# Phase 3c — `/rides` Hub Wiring Audit + Plan

> Scope: migrate the `/rides` hub components from `RIDE_LISTINGS`
> seed + hardcoded counts to real Supabase data, using the DB model
> already established in Phase 3a + 3b (no schema changes required).
>
> Target: **zero adapter, zero synthetic listings**, UI parity with
> the current hub. The 8 editorial blocks (hero search card, brand
> partners, ad banners, awards, finance, articles, dealer spotlight,
> shop-by-style) stay hardcoded per Q3-locked editorial strategy.
>
> Pattern: same as Phase 3b — audit → plan → (single green-tree
> wiring commit per logical group) → cleanup → docs.
>
> **Author:** Claude Code · **Date:** 2026-04-20 · **Supersedes:** n/a

---

## 1. Component audit

11 hub-side components live under `src/components/shadcnblocks/`.
For each, the question is: does it read listing rows (A), is it
editorial/hardcoded (B), or does it need a brand-new query shape (C)?

| # | Component | Lines touched by rides-data | Decision | Reason |
|---|-----------|-----------------------------|----------|--------|
| 1 | `rides-hero-split.tsx` | — | **B** | Hardcoded hero search card + dealer spotlight placeholder art. Pure UI / editorial. |
| 2 | `rides-brand-partners.tsx` | — | **B** | Typographic marquee of 12 OEM brand names. Not inventory data. |
| 3 | `rides-shop-by-style.tsx` | — | **B** *(counts note)* | Hardcoded STYLES tiles with Unsplash images + hardcoded `count` per tile (1248, 2140, ...). Body-style counts could go dynamic via `getRideBodyStyleCounts()` but that's nice-to-have — out of Phase 3c scope. Counts stay static; tiles themselves stay hardcoded. |
| 4 | `rides-ad-banner.tsx` | — | **B** | Dealo Pro paid ad. Not inventory. |
| 5 | `rides-best-of-2026.tsx` | — | **B** | Annual editorial awards block. Not inventory. |
| 6 | `rides-featured-premium.tsx` | **`RIDE_LISTINGS.filter(l => l.featured).slice(0, 4)`** | **A** | Reads 4 featured listings → needs `getFeaturedRides(limit)`. |
| 7 | `rides-main-grid.tsx` | **`RIDE_LISTINGS`, `VEHICLE_TYPES`, `VEHICLE_COLORS`** + sort + filter + paginate | **A** | Main browse grid → needs `getRidesForGrid({ subCategorySlug?, sortBy, limit, offset })` + `getRideTypeCounts()` for the filter chips. |
| 8 | `rides-finance-banner.tsx` | — | **B** | NBK partnership banner. Long-term partner content. |
| 9 | `rides-articles-strip.tsx` | — | **B** | Editorial articles. CMS candidate in Phase 5+. |
| 10 | `rides-dealer-spotlight.tsx` | — | **B** | Dealer directory. Could dynamise via profiles.is_dealer filter, but directory formatting (top dealers, verified badges, review snippets) goes beyond a thin list — keep static until dealer profiles exist. |
| 11 | `listing-card-rides.tsx` | `VEHICLE_COLORS[item.type]` + `RideListing` prop | **A** (downstream) | Card component consumed by #6 and #7. Switches prop shape from `RideListing` → `RideCard`. |

### Totals

- **A (DB wiring):** 3 components (featured-premium, main-grid, listing-card-rides)
- **B (editorial / hardcoded):** 8 components
- **C (new architecture):** 0

No migrations required — the schema from Phase 3a + 3b already
covers every field the hub renders.

---

## 2. New query surface

All additions live in `src/lib/rides/queries.ts` alongside
`getRideById` and `getSimilarRides`. Same conventions: server client,
`cache()`, console-logged failures, null/[] on error.

### 2.1 `getFeaturedRides`

```ts
export const getFeaturedRides = cache(async function getFeaturedRides(
  opts: { limit?: number; locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<RideCard[]>
```

**Behaviour:**
- Filters automotive listings (parent-category = `automotive`)
  where `is_featured = true`.
- `status='live'` AND `fraud_status NOT IN ('held','rejected')` AND
  `soft_deleted_at IS NULL` — matches public RLS.
- Order: `is_hot DESC, created_at DESC` — surfaces fresh hot deals
  alongside paid placements.
- `limit` defaults to 4 (matches the fixed 4-col premium row).

**Parent-category resolution:** a single `WHERE category_id IN
(SELECT id FROM categories WHERE parent_id = automotive_id)` lookup
or — simpler — resolve the automotive parent id + sub-ids upfront
via a small cached helper.

### 2.2 `getRidesForGrid`

```ts
export const getRidesForGrid = cache(async function getRidesForGrid(
  params: {
    subCategorySlug?: string;          // e.g. 'used-cars', 'motorcycles'
    sortBy?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular' | 'relevance';
    limit: number;
    offset: number;
    locale: 'ar' | 'en';
  },
): Promise<{ items: RideCard[]; total: number }>
```

**Behaviour:**
- Without `subCategorySlug`: all automotive sub-cats, excluding
  `is_featured` (featured row shows those above).
- With `subCategorySlug`: only that sub-cat, featured included
  (matches current seed-side logic).
- Sort map:
  - `newest` → `created_at DESC`
  - `priceAsc` → `price_minor_units ASC`
  - `priceDesc` → `price_minor_units DESC`
  - `popular` → `save_count DESC, view_count DESC`
  - `relevance` (default) → `is_hot DESC, created_at DESC`
- `limit` / `offset` drive the "Load more" pager (client-side state
  stays as-is, the action just re-fetches with a larger `limit`).
- `total` returned via Supabase `count: 'exact'` so the progress bar
  remains accurate.

### 2.3 `getRideTypeCounts`

```ts
export const getRideTypeCounts = cache(async function getRideTypeCounts(
  opts: { locale: 'ar' | 'en' } = { locale: 'ar' },
): Promise<Array<{ slug: string; nameAr: string; nameEn: string; count: number }>>
```

**Behaviour:**
- Returns all automotive sub-categories with `count > 0` of live
  listings under them. Empty sub-cats are omitted so the UI doesn't
  show chips that can't be clicked to anything.
- Implementation: single query joining `categories` → `listings`
  (count grouped by `category_id`), filtered by parent = automotive.
- Used by the filter chip row in `rides-main-grid`. The "All" chip
  stays a client-side constant.

### 2.4 No changes to existing queries

`getRideById` and `getSimilarRides` were sized for Phase 3b and
remain unchanged.

---

## 3. Component migration plan

### 3.1 `listing-card-rides.tsx`

Shape shift: `{ item: RideListing }` → `{ item: RideCard }`.

Changes:
- Remove `VEHICLE_COLORS[item.type]` → use `item.catColor` (already
  set by the query mapper).
- Replace `item.image` with `item.coverImage`.
- Replace `item.price` (string) with `formatPriceNumber(item.priceMinorUnits, item.currencyCode, locale)` + separate currency label (same visual split as `similar`).
- Replace `item.specA` / `item.specB` derivations with `item.year`,
  `item.mileageKm`, `item.bodyStyle` — the card was already showing
  these as compact labels; wire them from the new fields.
- Replace `item.location` with `item.cityName`.
- Drop `item.featured` / `item.hot` / `item.dropPct` / `item.oldPrice`
  references — `RideCard` is intentionally shallow. If the card's
  current visual parity needs any of these, escalate and expand
  `RideCard` in a single focused commit before wiring (not expected
  for V1).

### 3.2 `rides-featured-premium.tsx`

Changes:
- Becomes `async` Server Component OR keeps `'use client'` with
  `similar`-style prop injection. **Chosen pattern:** make it a
  Server Component (no client state needed — it's a static row).
- Fetches via `await getFeaturedRides({ limit: 4, locale })`.
- Props: add `locale: 'ar' | 'en'` passed from the page.
- Passes `item: RideCard` to `ListingCardRides` (premium variant).

### 3.3 `rides-main-grid.tsx`

Trickier — has client state (active chip, sort, load-more), so must
stay `'use client'`. Data fetch moves to the server via props.

**Approach:** split into a thin Server wrapper (`RidesMainGrid`,
Server Component) that fetches the initial page + the type counts,
and the existing interactive body (renamed to `RidesMainGridClient`,
still `'use client'`) that consumes those as props plus takes over
"Load more" via a client action.

Initial thinking:
- Server wrapper:
  - `const { items, total } = await getRidesForGrid({ sortBy: 'relevance', limit: 12, offset: 0, locale })`
  - `const typeCounts = await getRideTypeCounts({ locale })`
  - Passes both to the client component.
- Client component:
  - Keeps `activeType` / `sortKey` / `visibleCount` state.
  - On change, calls a server action `loadRides(params)` (new — in
    `src/lib/rides/actions.ts`) to refetch. For V1 with 5 seed rows,
    we can ship a simpler path: fetch all on the server, filter +
    sort client-side. Acceptable because total listings are tiny.
    When the grid grows past ~50 rows we switch to server-fetched
    pagination.

**Phase 3c chosen path for simplicity:**
- Server wrapper fetches ALL live automotive (no sort/filter) +
  type counts. Client-side filter/sort stays as it is. "Load more"
  is client-side slicing. This matches the existing behaviour
  exactly and avoids a new server action round-trip.
- Follow-up: migrate to true server-side pagination in Phase 4+
  when the grid exceeds one page of realistic inventory.

Changes:
- Drop `RIDE_LISTINGS`, `VEHICLE_TYPES`, `VEHICLE_COLORS` imports.
- Filter chip row consumes `typeCounts` prop: one chip per
  `{ slug, nameAr/nameEn, count }` entry.
- Sort functions use `RideCard` fields (`priceMinorUnits`,
  `bodyStyle`, etc.) instead of parsing strings.
- Map `l.type === activeType` → `l.subCategorySlug === activeType`
  (needs adding `subCategorySlug: string` to `RideCard` via the
  mapper — small extension, worth doing here).

### 3.4 Type extension

`RideCard` needs one new field for the grid filter:
- `subCategorySlug: string` — derived in `mapCard` from the joined
  `category.slug`. Shallow read, no Zod.

This is a narrow extension that doesn't require a full Phase 3b-style
migration cycle.

---

## 4. Commit sequence (4 commits)

Same tree-green discipline as Phase 3b — each commit leaves
`tsc --noEmit` clean.

| # | Commit | Scope |
|---|--------|-------|
| 3c.1 | `feat(rides): add hub queries + extend RideCard` | `getFeaturedRides`, `getRidesForGrid`, `getRideTypeCounts` in `src/lib/rides/queries.ts`; add `subCategorySlug` to `RideCard` in `types.ts`; update `mapCard` accordingly. |
| 3c.2 | `refactor(rides-card): migrate listing-card-rides to RideCard` | Card-only shape shift. Unblocks the two consumers. |
| 3c.3 | `feat(rides-hub): wire featured-premium + main-grid to DB (big merge)` | Server wrappers for both; client body for main-grid; page.tsx passes locale. |
| 3c.4 | `chore(rides): retire RIDE_LISTINGS / VEHICLE_TYPES if unused` | Grep across src/ + app/ to confirm zero consumers; if clean, delete from `rides-data.ts`. `VEHICLE_COLORS` stays (used by listing page constants / future helpers). If any consumer remains, document + skip. |

Plus documentation update at the tail:
- 3c.5 (trivial): `docs: mark /rides hub as DB-backed in STATUS.md + RIDES-DETAIL.md change log`.

---

## 5. Success criteria

- [ ] `getFeaturedRides` + `getRidesForGrid` + `getRideTypeCounts` land in `src/lib/rides/queries.ts`, typed + cached.
- [ ] `/ar/rides` and `/en/rides` render the full hub end-to-end from DB (featured row shows BMW M5; main grid shows the other 4 cars).
- [ ] `subCategorySlug` filter chip for `used-cars` shows 5 (featured row also shows the 1 featured; main grid without a chip excludes featured; main grid with `used-cars` chip shows all 5).
- [ ] No `RIDE_LISTINGS` imports remain outside `rides-data.ts` itself.
- [ ] Sort options still work (newest/priceAsc/priceDesc/popular/relevance) with real field values.
- [ ] `tsc --noEmit` = 0 errors throughout.
- [ ] `docs/STATUS.md` lists `/rides` as DB-backed; `docs/RIDES-DETAIL.md` change log noted.
- [ ] Grep check: `buildRideSpecs`, `buildRideGallery` still return 0 (Phase 3b holds), and `RIDE_LISTINGS` returns 0 outside `rides-data.ts`.

---

## 6. Open questions (none block 3c.1)

### Q1 — Dynamic shop-by-style counts
The shop-by-style tiles show hardcoded counts (sedan: 1248, SUV:
2140, ...). Making them real needs `getRideBodyStyleCounts()` which
groups `category_fields->>'body_style'` across live listings.
**Recommendation:** keep hardcoded for V1. Revisit when the grid
has real inventory volume. Log as a "dynamic counts" task under
Phase 4+.

### Q2 — Dealer spotlight directory
`rides-dealer-spotlight` could read `profiles WHERE is_dealer =
true`. But the tile design currently shows review snippets + a
hand-picked "featured dealer of the month" vibe that we don't have
DB data for. **Recommendation:** keep hardcoded for V1; revisit
when there are ≥5 verified dealer profiles with reviews.

### Q3 — Articles dynamic source
`rides-articles-strip` could be DB-backed via a new `articles`
table. This is a CMS concern — recommendation stays from Phase 3:
hardcoded through V1, move to CMS in Phase 5+.

---

## 7. Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-20 | Initial audit. 11 hub components triaged: 3 A (wiring), 8 B (editorial), 0 C (new architecture). 3 new queries specified. 1 small RideCard extension (`subCategorySlug`). 4-commit sequence + 1 docs commit planned. No migrations needed. | Claude Code |
