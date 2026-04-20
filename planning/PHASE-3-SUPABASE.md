# Phase 3 — Supabase Wiring Plan

> Locked decision: **Data model for vehicles = Option 2** — a new
> `ride_specs` table with a 1-to-1 FK to `listings`. `listings` keeps the
> generic fields that apply to every vertical (title, price, condition,
> location, lifecycle, AI telemetry). `ride_specs` holds only
> vehicle-specific fields.
>
> This document is pure planning — no migrations, no code, no schema
> changes are executed here. Execution happens in Phase 3a onward
> under separate tasks.
>
> **Author:** Claude Code · **Date:** 2026-04-20

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

## 3. Data model — `ride_specs`

> Correction to the task's proposed schema: `listings.id` is
> `BIGSERIAL`, not UUID. So `ride_specs.listing_id` must be `BIGINT`,
> not UUID. All FKs to `listings` across the codebase (e.g.
> `listing_images.listing_id`) use BIGINT.

### 3.1 Proposed schema

```sql
-- New enums (scoped to vehicles)
CREATE TYPE vehicle_fuel_type AS ENUM (
  'petrol',
  'diesel',
  'hybrid',
  'plug_in_hybrid',
  'electric'
);

CREATE TYPE vehicle_transmission AS ENUM (
  'automatic',
  'manual',
  'cvt',
  'dct'          -- dual-clutch
);

CREATE TYPE vehicle_body_style AS ENUM (
  'sedan',
  'suv',
  'coupe',
  'hatchback',
  'pickup',
  'convertible',
  'wagon',
  'van',
  'minivan',
  'bike',
  'scooter',
  'boat',
  'camper',
  'bicycle',
  'truck',
  'other'
);

CREATE TYPE vehicle_service_history AS ENUM (
  'full',        -- full dealer history
  'partial',     -- some records
  'none',        -- no records
  'unknown'
);

CREATE TYPE vehicle_accident_history AS ENUM (
  'none',
  'minor',
  'major',
  'unknown'
);

CREATE TABLE ride_specs (
  id                    BIGSERIAL    PRIMARY KEY,
  listing_id            BIGINT       NOT NULL UNIQUE
                                     REFERENCES listings(id) ON DELETE CASCADE,

  -- Identification
  -- NOTE: listings already carries `brand` + `model` + `color` TEXT fields.
  -- For vehicles those are treated as make + model + exterior color.
  -- We DO NOT duplicate them here; we read from listings directly.
  year                  SMALLINT     NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  trim_level            TEXT,                                -- e.g., "M Competition", "Sport"

  -- Usage
  mileage_km            INTEGER      CHECK (mileage_km >= 0),

  -- Powertrain
  engine_cc             INTEGER      CHECK (engine_cc BETWEEN 0 AND 10000),
  cylinders             SMALLINT     CHECK (cylinders BETWEEN 0 AND 16),
  horsepower            INTEGER      CHECK (horsepower BETWEEN 0 AND 2000),
  torque_nm             INTEGER      CHECK (torque_nm BETWEEN 0 AND 2500),
  fuel_type             vehicle_fuel_type         NOT NULL,
  transmission          vehicle_transmission      NOT NULL,
  drivetrain            TEXT         CHECK (drivetrain IS NULL OR drivetrain IN
                                       ('awd','fwd','rwd','4wd')),

  -- Body
  body_style            vehicle_body_style        NOT NULL,
  doors                 SMALLINT     CHECK (doors BETWEEN 0 AND 6),
  seats                 SMALLINT     CHECK (seats BETWEEN 1 AND 60),
  interior_color        TEXT,

  -- Identification docs
  vin                   TEXT         UNIQUE CHECK (vin IS NULL OR LENGTH(vin) = 17),
  registration_ref      TEXT,                                -- "estimara" / plate ref

  -- History
  service_history       vehicle_service_history   NOT NULL DEFAULT 'unknown',
  accident_history      vehicle_accident_history  NOT NULL DEFAULT 'unknown',

  -- Market / provenance
  region_spec           TEXT         CHECK (region_spec IS NULL OR region_spec IN
                                       ('gcc','american','european','japanese','other')),
  warranty_active       BOOLEAN      NOT NULL DEFAULT false,
  warranty_remaining_months SMALLINT CHECK (warranty_remaining_months BETWEEN 0 AND 240),

  -- Timestamps
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes (tuned for /rides hub filters + detail-page joins)
CREATE INDEX idx_ride_specs_listing       ON ride_specs (listing_id);
CREATE INDEX idx_ride_specs_year          ON ride_specs (year DESC);
CREATE INDEX idx_ride_specs_mileage       ON ride_specs (mileage_km);
CREATE INDEX idx_ride_specs_fuel          ON ride_specs (fuel_type);
CREATE INDEX idx_ride_specs_transmission  ON ride_specs (transmission);
CREATE INDEX idx_ride_specs_body_style    ON ride_specs (body_style);
-- Composite for /rides hub main filter combos
CREATE INDEX idx_ride_specs_type_year     ON ride_specs (body_style, year DESC);
```

### 3.2 Decisions log

| Choice | Rationale |
|--------|-----------|
| `listing_id BIGINT` (not UUID) | Matches existing `listings.id BIGSERIAL`. Avoids a pk-type mismatch across the codebase. |
| 1-to-1 via `UNIQUE (listing_id)` | A listing is either a vehicle or not — can't be partially one. Enforced at DB level. |
| `ON DELETE CASCADE` | If a listing is hard-deleted, its spec row goes too. Soft-deletion is handled at the listings level (`soft_deleted_at`). |
| Don't duplicate `brand`/`model`/`color` | They already exist on `listings`. For vehicles, `listings.brand = make`, `listings.model = model`, `listings.color = exterior color`. Saves storage + joins. |
| Enums over TEXT for `fuel_type`, `transmission`, `body_style`, `service_history`, `accident_history` | These are finite, design-controlled, and directly drive UI filter chips. Enums give Postgres-level validation + better query planning. |
| TEXT+CHECK for `drivetrain`, `region_spec` | Small sets but may expand per-region (Japanese/GCC/etc.). CHECK constraint is cheaper to modify than an enum. |
| `vin` UNIQUE | Same VIN shouldn't appear twice in active inventory — fraud signal. `NULL`able to allow listings without VIN (private sellers often skip). |
| Indexes on `year`, `mileage_km`, `fuel_type`, `transmission`, `body_style` | These are the main filter dimensions on `/rides`. |
| Composite `(body_style, year DESC)` | Most common combination: "show me SUVs newest first". |
| `SMALLINT` for year/doors/seats/cylinders/warranty_months | Range-bounded; avoids INT bloat. |
| `INTEGER` for mileage/hp/torque/engine_cc | Can exceed SMALLINT range (mileage > 32k km). |

### 3.3 RLS policies (to be detailed in the migration)

- **SELECT:** public on rows joined to `listings.status = 'live'`. Authenticated sellers can see their own draft/held rows.
- **INSERT / UPDATE:** only the listing's `seller_id` (matched via join) or `service_role`.
- **DELETE:** cascade from `listings` only — no direct delete allowed by clients.

Implementation pattern: all RLS policies on `ride_specs` join to
`listings` and reuse `listings.seller_id = auth.uid()` / `status =
'live'` checks. This keeps the rules DRY with the rest of the schema.

---

## 4. Migrations required

Numbering continues from the existing series (last is `0014_listing_drafts.sql`).

### 4.1 `0015_ride_specs.sql` — core schema
- 5 new enums (fuel_type, transmission, body_style, service_history, accident_history)
- `ride_specs` table with FK + UNIQUE + CHECKs
- 7 indexes (simple + one composite)
- Trigger to auto-touch `updated_at` on row change
- RLS policies (SELECT public via join, INSERT/UPDATE via seller_id via join, DELETE via cascade)

### 4.2 `0016_ride_seeds.sql` — test fixtures
- 5–10 demo rides (drafted from real public data)
- Inserts a matching `profiles` + `listings` + `listing_images` + `ride_specs` row per demo
- Wrapped in a single transaction so it can be reverted cleanly
- Guarded with `ON CONFLICT DO NOTHING` for idempotency

### 4.3 `0017_dealer_flag.sql` — optional, **open question**
If we decide dealers are a distinct entity type, this adds:
- `profiles.is_dealer BOOLEAN`
- `profiles.dealer_name TEXT`
- `profiles.dealer_verified_at TIMESTAMPTZ`
- Index on `is_dealer`

Not building a separate `dealers` table — a dealer is a kind of profile
(has a user account, can post listings). Flag is enough for V1.

**See Section 7 open questions — DO NOT apply this migration until the
dealer modelling question is answered.**

---

## 5. Server actions + queries

All new code lives under `src/lib/rides/`. Pattern matches the
existing `src/lib/listings/` structure.

### 5.1 `src/lib/rides/queries.ts`

```ts
// Detail page
export async function getRideById(id: string | number): Promise<RideDetail | null>
// RideDetail = listings row + ride_specs row + images[] + seller profile

// Hub — featured (paid premium row)
export async function getFeaturedRides(limit = 4): Promise<RideCard[]>

// Hub — main grid with filters
export async function getRidesForGrid(params: {
  type?: VehicleType;              // body_style filter
  sortBy?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
  limit: number;
  offset: number;
}): Promise<{ items: RideCard[]; total: number }>

// Detail — similar vehicles
export async function getSimilarRides(
  listingId: number,
  limit = 4
): Promise<RideCard[]>
// Logic: same body_style; ORDER BY abs(price - current_price) LIMIT 4

// /rides shop-by-style counts
export async function getRideTypeCounts():
  Promise<Record<VehicleType, number>>
```

Types `RideDetail`, `RideCard` will be defined alongside and exported
for client-component prop typing. `RideCard` is a shallow shape (cover
image + headline + price + year + location) — enough to render a grid
card without over-fetching.

### 5.2 `src/lib/rides/actions.ts`

```ts
// Publish flow — transactional: listings INSERT + ride_specs INSERT
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
- Adapt the 8 `ride-detail-*` components to the real shape (most fields still come from the joined `ride_specs`; the hash-based synth gets replaced where the DB has real data, kept where it doesn't — e.g., `watching` counts stay client-deterministic in V1)
- Retire `build-ride-specs.ts` for fields that now come from DB; keep it only for truly ephemeral signals (live watching count)

**Deliverables:**
- `/rides/[id]/1001` (or whichever seed id) renders from real DB
- Related rides pulled via real query
- TS clean

**Success criteria:**
- Opening a seed ride's URL works end-to-end from DB
- Editing `ride_specs` row in Supabase → page reflects after rebuild

### Phase 3c — `/rides` hub wiring · 2 commits

**Scope:** swap the 3 dynamic hub components.

- `getFeaturedRides` → `RidesFeaturedPremium`
- `getRidesForGrid` → `RidesMainGrid` (sort + filter params pushed through the server action)
- `getRideTypeCounts` → `RidesShopByStyle` (replaces hardcoded counts)

**Deliverables:**
- Hub page pulls from DB
- Filter chips + sort work against real data

**Success criteria:**
- Publishing a new seed row in `listings`+`ride_specs` appears on the grid
- Counts per body style update

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
- [ ] End-to-end test: create a new `listings` + `ride_specs` pair via SQL, confirm it appears on `/rides` grid and its detail URL works
- [ ] End-to-end test: create an anonymous test session, confirm draft listings are not visible (RLS check)
- [ ] `docs/RIDES-DETAIL.md` §3 updated to describe the real data model
- [ ] `docs/STATUS.md` marks rides vertical as DB-backed
- [ ] Change log entry added to `docs/STATUS.md` and this file

---

## 10. Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-20 | Initial plan. Locked Option 2 (ride_specs with BIGINT FK). Inventoried 30 components across 3 pages. Proposed schema with 5 enums + 10 indexes + 5 RLS policies. Drafted 3 migrations, 7 server functions, 6 phased sub-tasks. Surfaced 6 open questions with recommendations. | Claude Code |
