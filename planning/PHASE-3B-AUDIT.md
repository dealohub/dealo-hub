# Phase 3b — UI Fields Audit + Full Wiring Plan

> **Scope:** exhaustive audit of every field consumed by the 8 `/rides/[id]`
> detail components, mapped to a DB location so every piece of data on
> the page comes from real storage — zero synthesis, zero adapter.
>
> **Supersedes:** the earlier "hybrid adapter" proposal. The adapter path
> kept `buildRideSpecs` alive as tech debt. This plan extends the schema
> instead, then retires the synthesis engines entirely.
>
> **Author:** Claude Code · **Date:** 2026-04-20
>
> **Source of truth for decisions:** `planning/TAXONOMY-V2.md`
> §Schema Implications (JSONB for category-specific fields),
> `planning/PHASE-3-SUPABASE.md` v1.1 (queries/types scaffold).

---

## 1. UI Fields Audit

Every field referenced by any `ride-detail-*.tsx` component. Sources:
`RideListing` (seed, `rides-data.ts`), `buildRideSpecs(listing)`
(`build-ride-specs.ts`), `buildRideGallery(listing)`
(`build-ride-gallery.ts`), and component-local hash helpers
(`hashSignals`, `hashSig`).

**Legend for "Decision":**
- **A** — lives in `listings.category_fields` JSONB (vertical-specific)
- **B** — new column on `listings` (generic across verticals)
- **C** — new column on an existing table, or new table
- **D** — drop from UI (decorative / not worth DB weight / replaceable)
- **✓** — already covered by existing schema (no change needed)

### 1.1 Top-level `RideListing` (seed shape, 18 fields)

| # | Component(s) | Field | Type | Usage | Currently From | Decision | Target location |
|---|---|---|---|---|---|---|---|
| 1 | all | `id` | number | pk, keys | seed | ✓ | `listings.id` |
| 2 | header, similar, purchase, gallery | `type` | `VehicleType` | `VEHICLE_COLORS[type]`, filter, breadcrumb label | seed | ✓ (derived) | `categories.parent.slug` → helper map `catColor(slug)` |
| 3 | header, gallery, similar, purchase, mobile | `title` | string | h1, alt, WA message | seed | ✓ | `listings.title` |
| 4 | purchase, mobile | `price` (string "AED 485,000") | string | display, parsed via `priceNum` | seed | ✓ | `listings.price_minor_units` + `currency_code` → `formatPrice()` |
| 5 | purchase | `oldPrice` | string? | strike-through | seed | **B** | new column `listings.old_price_minor_units BIGINT` |
| 6 | purchase, header | `dropPct` | number? | badge, verdict | seed | ✓ (derived) | computed: `(1 - price/old) × 100` when old present |
| 7 | header, key-info, description | `year` | number | spec sheet, synth seed | seed | ✓ | already `category_fields.year` |
| 8 | header, description | `specA` (engine string) | string | "4.4L V8" display | seed | ✓ (derived) | computed from `engineCc` + `cylinders` |
| 9 | header, purchase | `specB` (mileage label) | string | "0 km" / "12K km" / "Brand new" | seed | ✓ (derived) | computed from `mileage_km` |
| 10 | header, purchase | `location` | string | city display | seed | ✓ | `cities.name_ar`/`_en` via join |
| 11 | header, purchase, description | `dealer` | string | name + initials + WA attribution | seed | ✓ | `profiles.dealer_name ?? display_name` |
| 12 | header, purchase | `dealerVerified` | boolean | verified badge | seed | ✓ | `profiles.is_dealer && dealer_verified_at IS NOT NULL` |
| 13 | gallery | `image` | string URL | gallery cover seed | seed | ✓ | `listing_images` position=0 |
| 14 | (unused in detail) | `images?` | string[] | optional batch | seed | ✓ | `listing_images` |
| 15 | header | `photoCount` | number | stats chip | seed | ✓ (derived) | `listing_images.length` |
| 16 | header, purchase | `featured` | boolean | badge, glow, verdict, feature threshold | seed | **B** | new column `listings.is_featured BOOLEAN` |
| 17 | header, purchase | `hot` | boolean | badge, verdict | seed | **B** | new column `listings.is_hot BOOLEAN` |
| 18 | header | `verifiedListing` | boolean | trust badge | seed | ✓ (derived) | `fraud_status='clean'` + `status='live'` |
|   | grid only | `bentoSize` | 'spotlight'\|... | hub layout only | seed | **D** | not used in detail page |

### 1.2 `RideSpecs` from `buildRideSpecs()` (30+ fields)

Consumed exclusively by `key-info`, `features`, `description`.

| # | Component(s) | Field | Type | Usage | Decision | Target location |
|---|---|---|---|---|---|---|
| 19 | key-info | `mileageKm` | number | display + market bar | ✓ | `category_fields.mileage_km` |
| 20 | (internal) | `mileageLabel` | string | passthrough | **D** | derive from `mileage_km` in UI |
| 21 | key-info | `bodyType` | string | i18n label | ✓ | `category_fields.body_style` |
| 22 | key-info | `exteriorColor.key` | string | color name | ✓ | `category_fields.exterior_color` (stores the name) |
| 23 | key-info | `exteriorColor.hex` | string | swatch fill | **D** | derive hex via frontend color-name→hex map (`src/lib/rides/color-swatches.ts`) |
| 24 | key-info | `interiorColor.key` | string | color name | ✓ | `category_fields.interior_color` |
| 25 | key-info | `interiorColor.hex` | string | swatch fill | **D** | same helper as #23 |
| 26 | key-info | `regionSpec` | 'gcc'\|'american'\|'european'\|'japanese' | GCC spec chip | **A** | new `category_fields.region_spec` (enum in Zod) |
| 27 | key-info | `engine` (string) | string | display label "4.4L V8" | ✓ (derived) | `${engineCc/1000}L ${cylinders-label}` in UI |
| 28 | (internal) | `displacement` | string | passthrough | **D** | not used outside |
| 29 | key-info | `cylinders` | number | row display | **A** | new `category_fields.cylinders` |
| 30 | key-info | `transmission` | enum | i18n label | ✓ | `category_fields.transmission` |
| 31 | key-info | `drivetrain` | enum | i18n label | ✓ | `category_fields.drivetrain` (already optional) |
| 32 | key-info | `fuel` | enum | i18n label | ✓ | `category_fields.fuel_type` |
| 33 | key-info | `doors` | number | row display (`> 0` guard) | **A** | new `category_fields.doors` |
| 34 | key-info | `seats` | number | row display | **A** | new `category_fields.seats` |
| 35 | key-info | `warranty.active` | boolean | row "yes/no" | **A** | new `category_fields.warranty_active` |
| 36 | key-info, description synth | `warranty.remainingMonths` | number | "12 months remaining" | **A** | new `category_fields.warranty_remaining_months` |
| 37 | key-info | `vin` (17 chars) | string | masked display + copy | ✓ | `category_fields.vin` |
| 38 | key-info | `registration` ("X 12345") | string | row display | **A** | new `category_fields.registration_ref` |
| 39 | key-info | `marketAvgMileageKm` | number | context bar | **D** | market avg is not per-listing; drop the bar in V1 (reinstate as query-time aggregate in Phase 3d+) |
| 40 | key-info | `mileageVsMarketPct` | number | context bar | **D** | same as #39 |
| 41 | (deleted) | `performance.horsepower` | number | was Performance component (removed) | ✓ | `category_fields.horsepower` already kept for future enthusiast view |
| 42 | description synth only | `performance.torqueNm` | number | internal to synth helpers | **D** after description rewrite (synth helpers go away). Field stays optional if ever re-surfaced → keep as optional `category_fields.torque_nm` |
| 43 | (deleted) | `performance.zeroToHundred` | number | deleted | **D** | |
| 44 | (deleted) | `performance.topSpeedKmh` | number | deleted | **D** | |
| 45 | (deleted) | `performance.fuelEfficiency` | number | deleted | **D** | |
| 46 | (deleted) | `performance.rangeKm` | number | deleted | **D** | |
| 47 | (deleted) | `performance.co2` | number | deleted | **D** | |
| 48 | features | `features: Set<FeatureKey>` (30 possible keys) | Set | equipment checklist | **A** | new `category_fields.features: string[]` (JSONB array). FeatureKey enum validated via Zod |

### 1.3 `buildRideGallery()` output

Consumed exclusively by `gallery`.

| # | Field | Type | Usage | Decision | Target location |
|---|---|---|---|---|---|
| 49 | image `src` | string URL | `<img>` src | ✓ | `listing_images.url` |
| 50 | image `category` | 'exterior'\|'interior'\|'engine'\|'wheels'\|'details' | filter pills | **C** | new column `listing_images.category TEXT` with CHECK constraint |
| 51 | image `alt` | string | a11y | ✓ | `listing_images.alt_text` |

### 1.4 Hash-synthesized signals (runtime only, not seed)

Component-local `hashSignals(id)` / `hashSig(id)` produce these.

| # | Component | Field | Usage | Decision | Replacement |
|---|---|---|---|---|---|
| 52 | header | `watching` (3–55) | live "watching now" pill | **D** | no presence service; drop the pill. Replace with `view_count` snapshot (cumulative views). |
| 53 | header | `saves` (8–250) | stats chip | ✓ | `listings.save_count` (already trigger-maintained) |
| 54 | header | `inquiries` (1–28) | stats chip | ✓ | `listings.chat_initiation_count` (already trigger-maintained) |
| 55 | purchase, mobile | `phone` (fake E.164) | reveal button display | **D** | per Decision 2 phone stays hidden; reveal button opens chat instead of showing a number. Mask text can stay as cosmetic placeholder. |
| 56 | purchase | `rating` (4.5–5.0) | dealer card star | ✓ | `profiles.rating_avg` (already trigger-maintained) |
| 57 | purchase | `reviews` (40–300) | dealer card count | ✓ | `profiles.rating_count` |
| 58 | purchase | `years` (8–48) | dealer card "yrs experience" | ✓ (derived) | `EXTRACT(YEAR FROM AGE(NOW(), profiles.created_at))` — computed in UI |
| 59 | purchase | `postedDays` (1–14) | social proof | ✓ (derived) | `days between listings.published_at and NOW()` — computed in UI |
| 60 | purchase | `viewedToday` (180–2580) | social proof | **D** | daily view count requires a time-bucketed aggregate table; `listings.view_count` is cumulative. V1: replace with `view_count` (cumulative) labelled "total views", or drop |

### 1.5 Component prop additions (for clean data flow)

| Component | New prop needed | Source |
|---|---|---|
| `similar` | `similar: RideCard[]` | page fetches via `getSimilarRides` and passes down |
| `gallery` | `images: RideImage[]` (already inside `listing` via `RideDetail.images`) | no new prop |

---

## 2. Schema Extension Decisions — aggregate counts

| Decision | Count | Summary |
|---|---|---|
| **A** — `category_fields` JSONB extensions | 10 new keys | cylinders, doors, seats, warranty_active, warranty_remaining_months, region_spec, torque_nm, registration_ref, features (array), and the existing ones (year, mileage_km, transmission, fuel_type, vin, accident_history, engine_cc, horsepower, body_style, exterior_color, interior_color, service_history_status, trim_level, drivetrain) stay. |
| **B** — new `listings` columns | 3 | `old_price_minor_units`, `is_featured`, `is_hot` |
| **C** — new columns on existing tables | 1 | `listing_images.category` |
| **D** — UI cut or derived-in-app | 14 | mileageLabel, colorHex × 2, displacement, marketAvgMileageKm, mileageVsMarketPct, performance.zeroToHundred/top/efficiency/range/co2, bentoSize, watching, phone, viewedToday |
| **✓** — already covered | 32 | title, description, price, condition, location, dealer, images, photoCount, year, mileage_km, transmission, fuel_type, vin, accident_history, engine_cc, horsepower, body_style, exterior_color, interior_color, service_history_status, trim_level, drivetrain, save_count, chat_initiation_count, rating_avg, rating_count, plus derivations |

**Total audited fields:** 60.

---

## 3. Migrations plan

Numbering continues from `0019_seed_cars.sql` (last applied in Phase 3a).

### 3.1 `0020_listings_badges_and_old_price.sql` — B extensions

```sql
ALTER TABLE listings
  ADD COLUMN old_price_minor_units BIGINT
    CHECK (old_price_minor_units IS NULL OR old_price_minor_units > 0),
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_hot      BOOLEAN NOT NULL DEFAULT false;

-- is_featured + is_hot drive paid placements and trending chips;
-- partial indexes because only a small slice of listings is true.
CREATE INDEX listings_is_featured_idx
  ON listings (is_featured) WHERE is_featured = true;
CREATE INDEX listings_is_hot_idx
  ON listings (is_hot) WHERE is_hot = true;

-- old_price sanity: must exceed current price when present
ALTER TABLE listings
  ADD CONSTRAINT chk_old_price_exceeds_current
    CHECK (
      old_price_minor_units IS NULL
      OR old_price_minor_units > price_minor_units
    );
```

### 3.2 `0021_listing_images_category.sql` — C addition

```sql
ALTER TABLE listing_images
  ADD COLUMN category TEXT
    CHECK (category IS NULL OR category IN
      ('exterior','interior','engine','wheels','details'));

-- Speed up category-filtered galleries
CREATE INDEX listing_images_listing_cat_idx
  ON listing_images (listing_id, category, position);
```

Note: nullable because non-automotive verticals (electronics, fashion) don't need image categories. For those rows the column stays NULL.

### 3.3 `0022_reseed_cars_full.sql` — full seed rewrite

**Strategy:** DELETE the 5 Phase 3a seed rows + re-INSERT with every field populated. Cascade on `listings_id_fkey` cleans up `listing_images` automatically. Wrapped in a transaction.

The 5 cars get realistic data:
- BMW M5 Competition — 8 cyl, 4 doors, 5 seats, full warranty 30mo, GCC spec, featured=true, 6 images (2 ext / 2 int / 1 engine / 1 wheels), ~25 features.
- Mercedes-AMG G63 — 8 cyl, 4 doors, 5 seats, full warranty 18mo, GCC spec, hot=true, 6 images, ~22 features.
- Toyota Camry — 4 cyl, 4 doors, 5 seats, warranty expired, GCC spec, 4 images, ~14 features.
- Honda Civic Type R — 4 cyl, 4 doors, 5 seats, full warranty 22mo, american spec, 5 images, ~16 features.
- Tesla Model 3 LR — 0 cyl (electric), 4 doors, 5 seats, full warranty 30mo, american spec, 5 images, ~20 features.

Every `category_fields` object now includes: `cylinders`, `doors`, `seats`, `warranty_active`, `warranty_remaining_months`, `region_spec`, `torque_nm`, `registration_ref`, `features` (array of keys per TAXONOMY-V2). The `exterior_color` / `interior_color` stay as readable strings ("Alpine White", "Black Merino"); hex is derived in the UI.

An `old_price_minor_units` is set on the 2 "price-drop" cars (Camry and Tesla, to show the strike-through UI). `is_featured=true` on BMW M5, `is_hot=true` on G63.

Each car gets 4–6 `listing_images` rows (position 0 = cover, positions 1–5 staggered across categories `exterior`, `interior`, `engine`, `wheels`, `details`).

### 3.4 Migration ordering

```
0020_listings_badges_and_old_price.sql   (schema)
0021_listing_images_category.sql         (schema)
0022_reseed_cars_full.sql                (data)
```

0022 depends on 0020 (old_price, is_featured, is_hot) AND 0021 (image category). Run in order.

---

## 4. Zod extensions (`src/lib/rides/validators.ts`)

Append to `UsedCarFieldsRawSchema`:

```ts
const UsedCarFieldsRawSchema = z.object({
  // ... existing keys ...

  // Phase 3b additions
  cylinders: z.number().int().min(0).max(16).optional(),
  doors: z.number().int().min(0).max(6).optional(),
  seats: z.number().int().min(1).max(60).optional(),
  warranty_active: z.boolean().optional(),
  warranty_remaining_months: z.number().int().min(0).max(240).optional(),
  region_spec: z.enum(['gcc','american','european','japanese','other']).optional(),
  torque_nm: z.number().int().min(0).max(2500).optional(),
  registration_ref: z.string().max(40).optional(),
  features: z.array(FeatureKeyEnum).optional(),
});
```

Add `FeatureKeyEnum`:

```ts
export const FeatureKeyEnum = z.enum([
  // safety
  'abs','airbags','esp','adaptiveCruise','laneAssist','blindSpot',
  'camera360','parkingSensors',
  // comfort
  'leatherSeats','heatedSeats','ventilatedSeats','climateControl',
  'sunroof','keylessEntry','remoteStart','powerSeats',
  // tech
  'applecarplay','androidauto','navigation','wirelessCharging',
  'headupDisplay','digitalCluster','premiumSound','bluetooth',
  // entertainment
  'rearEntertainment','ambientLighting',
  // exterior
  'ledHeadlights','alloyWheels','powerTailgate','towHitch','roofRack',
]);
```

Transform map extends accordingly (camelCase output): `warrantyActive`, `warrantyRemainingMonths`, `regionSpec`, `torqueNm`, `registrationRef`, `features`.

---

## 5. Type extensions (`src/lib/rides/types.ts`)

Add to `RideDetail`:
- `oldPriceMinorUnits: number | null`
- `isFeatured: boolean`
- `isHot: boolean`
- `catColor: string` (derived in mapper from `category.slug`)

Add to `RideImage`:
- `category: 'exterior' | 'interior' | 'engine' | 'wheels' | 'details' | null`

`RideSeller` additions:
- `yearsActive: number` (derived from `profiles.created_at` in mapper)

The `RideDetail.specs` automatically gains all the new Zod-transformed fields (camelCase) — no manual typing needed.

`RideCard` stays as-is (shallow).

---

## 6. Full wiring commit sequence

After the schema + seed migrations land, components can be refactored
safely. Ordered from simplest to most complex so each step has a quick
sanity check.

| # | Commit | Scope | Est. lines |
|---|---|---|---|
| 3b.1 | `feat(schema): listings badges + old price` | 0020 migration + apply via MCP | ~50 SQL |
| 3b.2 | `feat(schema): listing_images.category` | 0021 migration + apply via MCP | ~20 SQL |
| 3b.3 | `seed(rides): re-seed 5 cars with full detail data` | 0022 migration + apply via MCP | ~500 SQL |
| 3b.4 | `feat(rides): extend validators + types for full detail shape` | Zod + RideDetail/RideImage/RideSeller additions | ~80 TS |
| 3b.5 | `feat(rides): extend queries mappers for new fields` | `queries.ts` mapDetail/mapCard include new fields | ~60 TS |
| 3b.6 | `feat(rides): color-swatches helper` | new `src/lib/rides/color-swatches.ts` — name → hex | ~40 TS |
| 3b.7 | `refactor(rides): wire /rides/[id] page to real DB + ISR` | page.tsx: `getRideById` + `getSimilarRides` + `revalidate: 60`; drop `generateStaticParams` | ~50 TS |
| 3b.8 | `refactor(rides-detail): migrate similar + mobile-actionbar to RideDetail` | 2 simplest components | ~60 TS |
| 3b.9 | `refactor(rides-detail): migrate header to RideDetail` | header rewrite against real fields | ~80 TS |
| 3b.10 | `refactor(rides-detail): migrate gallery to DB-backed images` | gallery consumes `listing.images`, uses `image.category` for filters | ~100 TS |
| 3b.11 | `refactor(rides-detail): migrate key-info to RideDetail` | largest spec sheet rewrite | ~200 TS |
| 3b.12 | `refactor(rides-detail): migrate features to DB-backed list` | reads `listing.specs.features` array, groups via static `FEATURE_CATEGORIES` helper (kept local to the component or moved to `src/lib/rides/features-taxonomy.ts`) | ~80 TS |
| 3b.13 | `refactor(rides-detail): migrate description to real DB text` | strip bilingual synth helpers, display `listing.description` as-is with a "Show more" fold | ~120 TS |
| 3b.14 | `refactor(rides-detail): migrate purchase-panel to RideDetail` | use `formatPrice`, seller profile, real counters | ~200 TS |
| 3b.15 | `chore(rides): retire build-ride-specs + build-ride-gallery` | delete both synthesis files; update `docs/RIDES-DETAIL.md` §3 to describe the DB-backed model; update `docs/STATUS.md` | ~cleanup |

**Total:** 15 commits. Large surface, but each one is scoped tight and
lands with a working detail page (or an isolated-to-schema change).
Zero adapter layer. Zero synthesis. UI parity with the current design.

---

## 7. Re-seeding plan

### 7.1 Why re-seed, not UPDATE

- The Phase 3a seed (migration 0019) ran before `is_featured`,
  `is_hot`, `old_price_minor_units`, and `listing_images.category`
  existed. A pure UPDATE path would need to touch every row and every
  image, and still wouldn't populate the expanded `category_fields`
  cleanly.
- A DELETE + re-INSERT in a single transaction is explicit, auditable,
  and mirrors how the eventual "reset demo" admin script will work.

### 7.2 Safety

- The 5 seed listings are demo data — nobody depends on their IDs
  externally. It's safe to cascade-delete.
- `listing_images` rows go with them (`ON DELETE CASCADE`).
- Wrapped in a single `BEGIN / COMMIT`. On failure, nothing changes.
- Idempotency: the DO-block pattern from 0019 is retained
  (`IF count(listings WHERE category_id = used-cars) >= 5 THEN skip`),
  but upgraded to recognise old-schema seeds and wipe them first.

### 7.3 Source of realistic values

- **BMW M5 Competition** — 4.4L V8, 617 hp, 750 Nm, 8-speed auto
  (classified as `automatic` in Zod enum). GCC spec. Featured. New.
- **Mercedes-AMG G63** — 4.0L V8 biturbo, 577 hp, 850 Nm. GCC spec. Hot.
- **Toyota Camry 2.5 GCC** — 2.5L I4, 203 hp, 247 Nm, CVT. GCC spec.
  Used condition. Old price to show strike-through.
- **Honda Civic Type R** — 2.0L I4 turbo, 315 hp, 420 Nm, 6-speed
  manual. American (US/JDM) spec.
- **Tesla Model 3 LR** — Dual motor, 346 hp combined, instant torque.
  0 cylinders. Electric. Old price to show EV price drop.

Feature lists are distilled from each manufacturer's public option
sheet, mapped to our 30-key `FeatureKey` enum. Keeps the demo honest
(no phantom features like "iPhone 20 integration").

---

## 8. Architectural decisions that need founder approval

Before implementation begins, two choices have asymmetric downstream
consequences.

### Q1 — `features` storage: JSONB array vs separate table

- **A (chosen default in §3):** `category_fields.features: string[]`
  inside the JSONB. Simplest, follows TAXONOMY-V2 precedent, one GIN
  index (existing) handles filtering `?[]` (contains any).
- **C (alternative):** `listing_features(listing_id, feature_key)` junction
  table. Better for "show all listings with adaptive cruise" filtering
  at scale + admin maintenance. Overhead: one extra migration, one
  extra query in `mapDetail`.

**Recommendation:** A for V1 (matches TAXONOMY-V2 directive). Re-evaluate
in Phase 5+ if feature-based filtering becomes a hot path.

### Q2 — Color hex: frontend map vs DB column

- **D (chosen default in §1):** drop the hex, keep only the color name
  in `category_fields`. A small TypeScript map in
  `src/lib/rides/color-swatches.ts` resolves display names
  ("Alpine White", "Pearl White", "Obsidian Black") to hex values
  for the swatch.
- **A (alternative):** store both as an object `{name, hex}` per color.
  More storage, but the seller controls the exact swatch shown.

**Recommendation:** D. Hex is a presentation concern, not data. The map
covers the ~30 common paint-code names with graceful fallback to a
generic grey for unknowns.

### Q3 — "Watching now" replacement

- **D (chosen default):** drop the pill entirely; show `view_count`
  (cumulative, already in `listings`) labelled "views" on the header stat strip.
- **Alternative:** keep the pulsing LIVE pill but use a random 3–15
  per page load. Dishonest but feels alive.

**Recommendation:** D. Reintroduce with a real presence service in Phase 5+
once WebSocket infrastructure lands.

---

## 9. Success criteria — Phase 3b fully complete when…

- [ ] `0020`, `0021`, `0022` migrations applied; verified via `SELECT` on the new columns + rows
- [ ] `buildRideSpecs.ts` and `build-ride-gallery.ts` deleted from `src/components/shadcnblocks/`
- [ ] No `buildRideSpecs` or `buildRideGallery` import anywhere in the tree (`grep` returns 0)
- [ ] No `RideListing`-seed-shape imports in any `ride-detail-*.tsx` (all use `RideDetail` from `src/lib/rides/types.ts`)
- [ ] No `hashSignals` / `hashSig` helpers left in detail components (saves / inquiries / watching / rating come from DB)
- [ ] `/ar/rides/bmw-m5-competition-2024-2` and `/en/...` both render full detail pages from real DB, visually 1:1 with the current design (verified side-by-side)
- [ ] `/ar/rides/999999` returns 404
- [ ] `/ar/rides/2` (numeric) also works (slug-or-id)
- [ ] Similar vehicles section pulls 4 rides via `getSimilarRides` with price-closest ordering
- [ ] Gallery filter pills work against real `listing_images.category` values
- [ ] Features component lists real feature keys from `category_fields.features` grouped by the local `FEATURE_CATEGORIES` taxonomy
- [ ] Key-info shows real specs including cylinders, doors, seats, warranty status+months, region spec, registration
- [ ] Purchase panel's old-price strike-through appears on the 2 seeds with `old_price_minor_units` set
- [ ] Description shows real `listings.description` text (no bilingual synth)
- [ ] `tsc --noEmit` = 0 errors
- [ ] `planning/PHASE-3-SUPABASE.md` v1.2 changelog entry recording the schema extension
- [ ] `docs/RIDES-DETAIL.md` §3 rewritten around real DB data
- [ ] `docs/STATUS.md` marks Rides detail page as DB-backed

---

## 10. Change log

| Date | Change | Author |
|---|---|---|
| 2026-04-20 | Initial audit. 60 fields catalogued across 8 components. Schema extensions: 3 new `listings` columns (old_price, is_featured, is_hot), 1 new `listing_images` column (category), 10 new keys in `category_fields`. 14 fields dropped as decorative or derivable. 15-commit wiring sequence drafted. 3 founder questions surfaced (features storage, color hex location, watching-now replacement). | Claude Code |
