# Phase 3 — Supabase Wiring Plan

> **Locked decision (v1.1 — supersedes v1.0):** Data model for
> vehicle-specific fields = **Option 1 (JSONB on listings)** per
> `planning/TAXONOMY-V2.md` §Schema Implications (locked 2026-04-18).
> No new `ride_specs` table. The `listings` table gains a single
> `category_fields JSONB` column validated at the app layer via Zod
> schemas, indexed via GIN for nested-key filtering.
>
> The same column serves every vertical (automotive, real-estate,
> jobs, services, …) — each vertical's Zod schema defines its own
> required keys. This is the locked cross-vertical strategy from
> TAXONOMY-V2.
>
> This document is pure planning — no migrations, no code, no schema
> changes are executed here. Execution happens in Phase 3a onward
> under separate tasks.
>
> **Author:** Claude Code · **Date:** 2026-04-20 (v1.1)

---

## 1. Current state — full inventory

Every visible surface on every shipped page, classified by what it
currently reads from. Based on a direct code read, not assumption.

### 1.1 Landing — `/[locale]/`

| Component | Source file | Data type | Dynamic? |
|-----------|-------------|-----------|----------|
| `EcommerceNavbar1` | hardcoded `MENU` constant + i18n | Chrome | No |
| `BackgroundPattern115` | none (SVG) | Decorative | No |
| `Feature283` | `listings-data.ts` → `SEED_LISTINGS`, `HERO_LISTING_INDICES` | **Listings** | **Yes** |
| `FeaturedBrandsStrip` | hardcoded brand array | Editorial | No |
| `AIProtectionStrip` | hardcoded 4-card content | Marketing | No |
| `LiveFeed` | `listings-data.ts` → `SEED_LISTINGS`, `SEED_PRICE_DROPS`, `ACTIVITY_SIGNALS` | **Listings + activity signals** | **Yes** |
| `LiveStatusBar` (in live-feed-parts) | derived from feed prop | Count-up metrics | Yes (derivative) |
| `FeaturedPartnersSection` (in live-feed-parts) | hardcoded partners + MarketPulse | Editorial | No |
| `SiteFooter` | hardcoded links + i18n | Chrome | No |

### 1.2 Rides hub — `/[locale]/rides`

| Component | Source file | Data type | Dynamic? |
|-----------|-------------|-----------|----------|
| `EcommerceNavbar1` | (shared chrome) | Chrome | No |
| `RidesHeroSplit` | hardcoded search UI + dealer spotlight placeholder | Editorial + UI state | No |
| `RidesBrandPartners` | hardcoded `BRANDS` (typographic, 12 entries) | Editorial | No |
| `RidesShopByStyle` | hardcoded `STYLES` (8 body types + image + emoji + hardcoded counts) | Taxonomy + counts | Partial (counts should be dynamic) |
| `RidesAdBanner` | hardcoded "Dealo Pro" ad | Editorial (paid) | No |
| `RidesBestOf2026` | hardcoded `WINNERS` array | Editorial | No |
| `RidesFeaturedPremium` | `rides-data.ts` → `RIDE_LISTINGS.filter(l => l.featured)` | **Listings** | **Yes** |
| `RidesMainGrid` | `rides-data.ts` → `RIDE_LISTINGS` + `VEHICLE_TYPES` + `VEHICLE_COLORS` | **Listings + taxonomy** | **Yes** |
| `RidesFinanceBanner` | hardcoded NBK finance content | Editorial (paid) | No |
| `RidesArticlesStrip` | hardcoded `ARTICLES` | Editorial | No |
| `RidesDealerSpotlight` | hardcoded `DEALERS` | Editorial or Directory | Undecided |
| `SiteFooter` | (shared chrome) | Chrome | No |

### 1.3 Rides detail — `/[locale]/rides/[id]`

All 8 components consume `rides-data.ts` (the listing itself) +
`build-ride-specs.ts` / `build-ride-gallery.ts` (deterministic
synthesis) + `VEHICLE_COLORS`. Every component here is **fully
dynamic** and must wire to DB.

| Component | What it reads | What it synthesizes |
|-----------|---------------|---------------------|
| `RideDetailHeader` | listing core fields (title, year, location, dealer, badges, photoCount) | watching/saves/inquiries counts (hash-based) |
| `RideDetailGallery` | listing image + specA (derived) | full 10-image set + categories |
| `RideDetailKeyInfo` | listing core | 25+ spec fields (mileage, engine, colors, VIN, warranty, registration, market context) |
| `RideDetailFeatures` | listing core | feature set from 5 categories (safety/comfort/tech/entertainment/exterior) |
| `RideDetailDescription` | listing core | bilingual seller blurb + highlights |
| `RideDetailSimilar` | listing core (type, price) | filtered from RIDE_LISTINGS |
| `RideDetailPurchasePanel` | listing core (price, dealer, featured/hot/dropPct) | phone, rating, reviews, years, postedDays, viewedToday (hash-based) |
| `RideDetailMobileActionBar` | listing core (price, dealer) | phone (hash-based) |

---

## 2. Data classification — where does each thing live?

### Category A — Dynamic listings (MUST move to DB)

The following are user-generated or must reflect real inventory, so
they belong in Supabase and read via server actions:

- `Feature283` hero tiles
- `LiveFeed` (including `SEED_PRICE_DROPS`, `ACTIVITY_SIGNALS`)
- `RidesFeaturedPremium`
- `RidesMainGrid`
- All 8 `RideDetail*` components
- `RidesShopByStyle` counts (the per-type totals should query `COUNT(*)` filtered by vehicle type, not be hardcoded)

**Data shape needed:** `listings` row + `ride_specs` row + images + seller profile join.

### Category B — Editorial content (stays hardcoded / config for V1)

These are curated by the Dealo team and change on a weekly/monthly cadence at most:

- `EcommerceNavbar1` menu
- `FeaturedBrandsStrip` (Landing)
- `AIProtectionStrip` (Landing)
- `FeaturedPartnersSection` (Landing)
- `RidesHeroSplit` search card copy + dealer spotlight placeholder art
- `RidesBrandPartners` (12 typographic brand marks)
- `RidesAdBanner` (paid slot — one rotating partner per deploy)
- `RidesBestOf2026` (awards — annual)
- `RidesFinanceBanner` (NBK partnership — long-term)
- `RidesArticlesStrip` (editorial articles)
- `SiteFooter`

**Long-term direction:** when we add a CMS (Phase 5+), these move out of TSX into a content layer. For V1, they stay in constants. The plan explicitly does NOT move them in Phase 3.

### Category C — Taxonomies (already in DB, need to be consumed)

- `categories` (64 rows) — already queried by server actions that don't yet reach the UI
- `countries` (6 rows, KW active)
- `cities` (6 rows)
- `areas` (52 rows)
- `VEHICLE_TYPES` / `VEHICLE_COLORS` — currently hardcoded in `rides-data.ts`. **Decision:** keep as static constants because vehicle-type list is a product decision, not user-editable. Colors are design tokens.

---

## 3. Data model — `listings.category_fields` (JSONB)

Locked strategy from `planning/TAXONOMY-V2.md` §Schema Implications:
**one `JSONB` column on `listings`**, validated per category by the
application layer via Zod schemas. No per-vertical tables.

### 3.1 Schema change

```sql
ALTER TABLE listings
  ADD COLUMN category_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX listings_category_fields_gin_idx
  ON listings USING gin (category_fields);

COMMENT ON COLUMN listings.category_fields IS
  'Category-specific structured fields. Validated per category via
   app-layer Zod schemas. See planning/TAXONOMY-V2.md §Schema.';
```

That is the entire schema change. No enums, no extra table, no FK,
no RLS updates (inherits all listings RLS automatically). The GIN
index enables nested-key filtering (`category_fields @> '{"year":2024}'`
and `category_fields->>'fuel_type' = 'electric'` both fast).

### 3.2 JSONB shape per category (app-layer contract)

Shapes are **not** enforced by Postgres. They are Zod schemas in
`src/lib/listings/validators.ts` keyed by category slug. Per
TAXONOMY-V2 §Schema:

```ts
// automotive/used-cars
{
  make: string,              // "BMW"
  model: string,             // "M5"
  year: number,              // 2024
  mileage_km: number,
  transmission: 'automatic' | 'manual' | 'cvt' | 'dct',
  fuel_type: 'petrol' | 'diesel' | 'hybrid' | 'plug_in_hybrid' | 'electric',
  vin?: string,              // 17 chars, optional
  accident_history: 'none' | 'minor' | 'major' | 'unknown',
  engine_cc?: number,
  horsepower?: number,
  body_style?: 'sedan' | 'suv' | 'coupe' | 'hatchback' | 'pickup' | 'convertible' | 'wagon' | 'van' | 'other',
  exterior_color?: string,
  interior_color?: string,
  service_history_status?: 'full' | 'partial' | 'none' | 'unknown',
  trim_level?: string,
  drivetrain?: 'awd' | 'fwd' | 'rwd' | '4wd',
}

// real-estate/property-for-rent (for context — not Phase 3a scope)
{ property_type, bedrooms, bathrooms, area_sqm, furnished, utilities_included }

// watercraft
{ type, length_ft, engine_hp, hull_material, year }

// jobs/vacancies
{ salary_range, contract_type, industry, experience_level }
```

### 3.3 Decisions log

| Choice | Rationale |
|--------|-----------|
| JSONB on listings, not `ride_specs` FK table | Locked in TAXONOMY-V2 §Schema (2026-04-18). Same column serves 21 verticals; per-category Zod schemas give type safety without migration churn when a vertical's fields evolve. |
| App-layer validation via Zod | Postgres enforcement would require a CHECK per category or a trigger. Zod keeps the validation rules version-controlled with the code that reads/writes them. |
| Single GIN index on the whole JSONB column | Enables both containment queries (`@>`) and key-existence lookups across all categories with one index. Phase 3c can add targeted expression indexes (e.g. `((category_fields->>'year')::int)`) if a filter becomes hot. |
| `NOT NULL DEFAULT '{}'::jsonb` | Every listing has a JSONB (possibly empty for `general` category). Easier to query than NULL handling everywhere. |
| `listings.brand` / `listings.model` / `listings.color` already exist | For automotive listings, these are populated alongside `category_fields.make` / `.model` / `.exterior_color`. The seed & publish action write both so simple list-card queries don't need JSONB extraction. Duplicate-but-consistent is acceptable when one is cheap to derive from the other at write time. |

---

## 4. Migrations required

Numbering continues from the existing series (last is `0014_listing_drafts.sql`).

### 4.1 `0015_listings_category_fields.sql` — JSONB column + GIN index
- `ALTER TABLE listings ADD COLUMN category_fields JSONB NOT NULL DEFAULT '{}'::jsonb`
- `CREATE INDEX listings_category_fields_gin_idx ON listings USING gin (category_fields)`
- Column comment referencing TAXONOMY-V2 §Schema

### 4.2 `0016_profile_dealer_fields.sql` — dealer flag on profiles
- `ALTER TABLE profiles ADD COLUMN is_dealer BOOLEAN NOT NULL DEFAULT false`
- `ALTER TABLE profiles ADD COLUMN dealer_name TEXT`
- `ALTER TABLE profiles ADD COLUMN dealer_verified_at TIMESTAMPTZ`
- `CHECK (is_dealer = false OR dealer_name IS NOT NULL)`
- Partial index `WHERE is_dealer = true`

### 4.3 `0017_listings_slug.sql` — SEO-friendly URL column
- `ALTER TABLE listings ADD COLUMN slug TEXT`
- Backfill: `UPDATE listings SET slug = 'listing-' || id WHERE slug IS NULL`
- Then `ALTER COLUMN slug SET NOT NULL` + `UNIQUE` + `CHECK (slug ~ '^[a-z0-9-]+$' AND length BETWEEN 3 AND 120)`
- Unique index on slug

### 4.4 `0018_add_automotive_category.sql` — taxonomy seed
Per TAXONOMY-V2.md §1 — `automotive` parent + **15 sub-categories** (exact slugs):
used-cars, new-cars, classic-cars, junk-cars, wanted-cars, motorcycles, watercraft, cmvs, auto-spare-parts, auto-accessories, auto-services, dealerships, car-garages, car-rental-business, food-trucks.

All seeded active; phase exposure is controlled at the UI layer, not via `is_active`.

### 4.5 `0019_seed_cars.sql` — 5 used-cars for `/rides/[id]`
- Reuses the single existing `profiles` row as `seller_id` (no new auth users)
- `category_id` = `(SELECT id FROM categories WHERE slug = 'used-cars')`
- `brand`/`model`/`color` populated on `listings` in addition to `category_fields` (see §3.3 last row)
- `status = 'live'`, `published_at = NOW()`, `expires_at = NOW() + INTERVAL '30 days'`, `fraud_status = 'clean'`
- Slug: `<brand>-<model>-<year>-<id>` (lowercase, hyphens)
- `listing_images` row per car, 1600×1066 from a stable CDN
- Wrapped in a single transaction, idempotent via `ON CONFLICT DO NOTHING` on the slug unique constraint

---

## 5. Server actions + queries

All new code lives under `src/lib/rides/`. Pattern matches the
existing `src/lib/listings/` structure. No `ride_specs` joins —
everything reads the JSONB via `listings.category_fields`.

### 5.1 `src/lib/rides/queries.ts`

```ts
// Detail page — fetches listing + images + seller profile
// Vehicle-specific fields come from listings.category_fields.
export async function getRideById(idOrSlug: string | number): Promise<RideDetail | null>
// RideDetail = listings row (including category_fields) + images[] + seller profile

// Hub — featured (paid premium row)
export async function getFeaturedRides(limit = 4): Promise<RideCard[]>

// Hub — main grid with filters
export async function getRidesForGrid(params: {
  subCategorySlug?: string;        // "used-cars", "motorcycles", ...
  bodyStyle?: string;              // category_fields->>'body_style'
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
  limit: number;
  offset: number;
}): Promise<{ items: RideCard[]; total: number }>

// Detail — similar vehicles
export async function getSimilarRides(
  listingId: number,
  limit = 4
): Promise<RideCard[]>
// Logic: same sub-category_id; ORDER BY abs(price - current_price) LIMIT 4

// /rides shop-by-style counts
// COUNT(*) grouped by category_fields->>'body_style' for listings
// under automotive.
export async function getRideTypeCounts():
  Promise<Record<string, number>>
```

Types `RideDetail`, `RideCard` defined alongside and exported for
client-component prop typing. `RideCard` is a shallow shape (cover
image + headline + price + year + location) — enough to render a grid
card without full JSONB extraction.

### 5.2 `src/lib/rides/actions.ts`

```ts
// Publish flow — single INSERT to listings with category_fields populated.
// No cross-table transaction needed (JSONB lives on the same row).
export async function publishRide(formData: FormData): Promise<
  { ok: true; listingId: number } | { ok: false; error: string }
>

// Draft update for in-progress wizard
export async function updateRideDraft(draftId: string, data: Partial<RideInput>)
```

`publishRide` must run inside a single `supabase.rpc(...)` or manual
`pg_notify`-style transaction so a partial insert is impossible. If
the `ride_specs` insert fails after `listings` succeeds, the listing
is rolled back.

### 5.3 `src/lib/landing/queries.ts` — new, minimal

```ts
// For Landing LiveFeed + Feature283
export async function getLiveFeedListings(limit = 24): Promise<FeedItem[]>
export async function getHeroListings(): Promise<FeedItem[]>
// Reuses listings.* schema; doesn't need ride_specs — shows all categories
```

### 5.4 Existing — fixes needed in place

- `src/lib/browse/queries.ts` still imports a deleted `ListingCard`. Fix when the browse page is wired (not this phase) or inline now as part of 3a cleanup if it blocks `tsc`. Fixed in Phase 3a.

---

## 6. Phased execution plan

Each phase is one working session, 1–3 commits, ends with a green
typecheck and a working page.

### Phase 3a — `ride_specs` schema + seeds · 2 commits

**Scope:** land the DB changes. No UI wiring yet.

- Write `0015_ride_specs.sql` migration
- Write `0016_ride_seeds.sql` with 5 demo rides
- Apply against Supabase via MCP (`apply_migration`)
- Regenerate types: `src/types/database.ts`
- Fix `src/lib/browse/queries.ts` stale import (so `tsc --noEmit` is clean for the first time)

**Deliverables:**
- Both migrations committed
- Types committed
- 5 real rows visible in `listings` + `ride_specs` via SQL editor

**Success criteria:**
- `supabase list_tables` shows `ride_specs`
- `SELECT * FROM ride_specs;` returns 5 rows
- `tsc --noEmit` = 0 errors (finally)

### Phase 3b — `/rides/[id]` wiring · 3 commits

**Scope:** swap the detail page's seed-data reads for real DB reads. Keep UI identical.

- Write `src/lib/rides/queries.ts` with `getRideById` + `getSimilarRides`
- Replace `RIDE_LISTINGS.find(...)` in `app/[locale]/rides/[id]/page.tsx` with `getRideById()`
- Adapt the 8 `ride-detail-*` components to read from `listings.category_fields` JSONB instead of `buildRideSpecs()`. Hash-based synth stays only for truly ephemeral signals (live watching count — Q4 recommends dropping this entirely in favour of `view_count`).
- Retire `build-ride-specs.ts` for fields that now come from DB

**Deliverables:**
- `/rides/[id]/<slug-or-id>` renders from real DB
- Related rides pulled via real query
- TS clean

**Success criteria:**
- Opening a seed ride's URL works end-to-end from DB
- Editing `category_fields` in Supabase → page reflects after rebuild

### Phase 3c — `/rides` hub wiring · 2 commits

**Scope:** swap the 3 dynamic hub components.

- `getFeaturedRides` → `RidesFeaturedPremium`
- `getRidesForGrid` → `RidesMainGrid` (sort + filter params pushed through the server action)
- `getRideTypeCounts` → `RidesShopByStyle` (replaces hardcoded counts)

**Deliverables:**
- Hub page pulls from DB
- Filter chips + sort work against real data

**Success criteria:**
- Publishing a new seed row in `listings` (with automotive category + `category_fields` populated) appears on the grid
- Counts per `body_style` (pulled via `category_fields->>'body_style'`) update

### Phase 3d — Landing LiveFeed wiring · 2 commits

**Scope:** Landing page dynamic pieces — not vehicle-specific, just `listings`.

- `getLiveFeedListings` → `LiveFeed`
- `getHeroListings` → `Feature283`
- Retire `listings-data.ts` `SEED_LISTINGS` / `HERO_LISTING_INDICES`
- `SEED_PRICE_DROPS` + `ACTIVITY_SIGNALS` stay client-deterministic (V1; real signals need analytics wiring)

**Deliverables:**
- Landing shows real listings from every category, not just rides
- `listings-data.ts` can be deleted

**Success criteria:**
- Landing renders with empty DB (graceful empty state)
- Landing renders with seed data (live feed shows real items)

### Phase 3e — Editorial content strategy · 0 commits (decision only)

**Scope:** decide but don't implement.

- Confirm Category B components stay as constants through V1
- Document a CMS migration path for Phase 5+
- Update `docs/STATUS.md` queue with the decision

**Deliverables:** a paragraph in `docs/STATUS.md` §6 describing the
long-term plan for editorial content. No code changes.

### Phase 3f — Cleanup · 1 commit

**Scope:** finish.

- Delete `rides-data.ts`, `build-ride-specs.ts`, `build-ride-gallery.ts`, `listings-data.ts`
- Remove all imports
- Update `docs/RIDES-DETAIL.md` §3 to describe the real data model instead of the synthesis engine
- Update `docs/STATUS.md` §2 to mark Phase 3 complete

---

## 7. Open questions — need a decision before Phase 3a

### Q1 — Dealer modelling
**Options:**
- **A.** `profiles.is_dealer BOOLEAN` + `profiles.dealer_name` + verification timestamp. Simple, extensible, no new join.
- **B.** Separate `dealers` table with its own FK from `listings`. More normalized, but doubles the seller join and forces every listing query to choose which side owns the display name.

**Recommendation:** A. Most marketplaces model dealers as a flag on the user entity. Promotes single source of truth for "who posted this".

### Q2 — Seed strategy
**Options:**
- **A.** 5 hand-crafted rides using public images + realistic data (BMW M5, Toyota Land Cruiser, Honda Odyssey, Yamaha R1, Harley-Davidson). One of each common body style.
- **B.** 50 rides generated from `rides-data.ts` seed + hash-based specs. High volume but less realistic.
- **C.** Tiered: start with A for Phase 3a, expand to B in Phase 3c when we need enough data to exercise filters.

**Recommendation:** C. Start small, scale when the UI needs it.

### Q3 — Editorial content long-term
**Options:**
- **A.** Stays in TSX constants forever. Simplest.
- **B.** Move to a `editorial_blocks` table in Phase 5+. Editable via admin UI.
- **C.** Integrate a headless CMS (Sanity, Contentful). Overkill for V1.

**Recommendation:** A through V1, B when we have an internal team that isn't engineering-only. Don't touch until there's a reason.

### Q4 — Synthetic fields in V1 (watching / viewed today / saves)
`RideDetailPurchasePanel` shows "51 people watching now", "247 viewed today", etc. The real counters exist on `listings` (`view_count`, `save_count`) but we don't have live-watching infrastructure.

**Options:**
- **A.** Keep client-deterministic hash synth for live metrics (pretend data).
- **B.** Use the real `view_count` / `save_count` columns (counters already exist). Skip the "watching now" until we build a presence service.
- **C.** Drop the "watching now" from V1 entirely; show real view_count / save_count instead.

**Recommendation:** C. "Watching now" without a real WebSocket presence service is dishonest. Real `view_count` is already populated by existing triggers.

### Q5 — `/rides/[id]` ID scheme
Current URL is `/rides/1001` (a seed id). Once wired to `listings.id BIGSERIAL`, new listings get sequential ids (`1, 2, 3, ...`). That's ugly and scraper-friendly. Most marketplaces use slug or short hash:

**Options:**
- **A.** Keep numeric BIGINT. Simple.
- **B.** Add `slug` column on `listings` (unique, auto-generated from title + id). SEO-friendly.
- **C.** Add `short_id TEXT` (e.g., nanoid 10-char). Not scrapable.

**Recommendation:** B, in Phase 3b. Slug helps SEO and is a low-cost addition.

### Q6 — `generateStaticParams`
Current `/rides/[id]/page.tsx` has `generateStaticParams()` returning every seed id for SSG. With DB, we don't want to SSG every listing — too many, and they change. **Decision needed:** switch to on-demand (`dynamicParams: true` + no pre-render), or SSG only the N most popular.

**Recommendation:** On-demand, with ISR (`revalidate: 60`) so each URL is cached for a minute. Keeps the page fast without the SSG ballooning.

---

## 8. Risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Wiring the live landing breaks it for users | High | Feature-flag `getLiveFeedListings` behind `NEXT_PUBLIC_FEATURE_DB_FEED`. Default off in Vercel preview, on in dev. Flip to on after Phase 3d verification. |
| Seed shape drifts from Zod validators in `src/lib/listings/validators.ts` | Medium | Before seeding, run the seed rows through the Zod schema programmatically. If any field fails validation, halt the migration. |
| RLS gaps — leaking draft listings | Critical | Write a test matrix: anon user / authenticated user / seller / admin × (draft / live / archived / held). Must pass before Phase 3c. |
| Migration rollback | Medium | Each migration's header documents a `DOWN` script as a SQL comment. If a migration needs to be reverted, the DOWN script is run via Supabase SQL editor. pg_migrations history is append-only; rollback = new migration that reverses. |
| `database.ts` type drift breaks the build | Low | Regenerate types immediately after each migration. Commit types in the same PR as the migration. |
| ISR cache staleness on high-traffic listing changes | Low | `revalidate: 60` is aggressive enough for V1. Revisit if real traffic shows stale content complaints. |
| Seed images hotlink breaks (Unsplash 404) | Medium | Migrate seed images to the `listing-images` Supabase bucket in Phase 3a. Never rely on external hosts in DB seeds. |

---

## 9. Success criteria — Phase 3 complete when…

- [ ] `0015_ride_specs.sql` applied; `ride_specs` table visible in Supabase with 5+ rows
- [ ] `src/lib/rides/queries.ts` + `src/lib/rides/actions.ts` exist and export the 7 functions listed in §5
- [ ] `src/lib/landing/queries.ts` exists for Landing feed
- [ ] `/rides/[id]/{any-seed-id}` renders fully from DB (no `RIDE_LISTINGS` import on the page)
- [ ] `/rides` hub grid, featured row, and shop-by-style counts all pull from DB
- [ ] Landing `LiveFeed` and `Feature283` pull from DB
- [ ] `rides-data.ts`, `build-ride-specs.ts`, `build-ride-gallery.ts`, `listings-data.ts` deleted from the tree
- [ ] `tsc --noEmit` = 0 errors (including the previously-known `browse/queries.ts` issue)
- [ ] End-to-end test: create a new `listings` row (automotive category + `category_fields` populated) via SQL, confirm it appears on `/rides` grid and its detail URL works
- [ ] End-to-end test: create an anonymous test session, confirm draft listings are not visible (RLS check)
- [ ] `docs/RIDES-DETAIL.md` §3 updated to describe the real data model
- [ ] `docs/STATUS.md` marks rides vertical as DB-backed
- [ ] Change log entry added to `docs/STATUS.md` and this file

---

## 10. Change log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-20 | v1.0 | Initial plan. Locked Option 2 (ride_specs with BIGINT FK). Inventoried 30 components across 3 pages. Proposed schema with 5 enums + 10 indexes + 5 RLS policies. Drafted 3 migrations, 7 server functions, 6 phased sub-tasks. Surfaced 6 open questions with recommendations. | Claude Code |
| 2026-04-20 | v1.1 | Correction after review of `planning/TAXONOMY-V2.md`. v1.0 proposed a `ride_specs` FK table with 6 invented sub-cats. The correct approach is `listings.category_fields` **JSONB** + an `automotive` parent category with **15** sub-categories as defined in TAXONOMY-V2 §1. The locked source for both decisions is TAXONOMY-V2.md §Schema Implications (2026-04-18). §3 rewritten (JSONB + app-layer Zod shapes), §4 reorganized (5 migrations in the 0015→0019 range: category_fields, dealer fields, slug, automotive taxonomy seed, cars seed), §5 updated to drop `ride_specs` joins in favour of JSONB reads, §6 references updated. | Claude Code |
