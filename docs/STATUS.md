# Dealo Hub — Build Status

> Living snapshot of what's built, what's in flight, and what's queued.
> Update this file whenever a section lands or a decision flips.
>
> Last updated: **2026-04-20** (Phase 3c complete)

---

## 1. Shipped

| Area | Route / surface | Notes |
|------|-----------------|-------|
| Landing page | `/[locale]/` | Built by Claude Design. Hero, brands strip, AI protection, live feed, featured partners, footer. Dark + light + RTL. |
| Rides vertical — grid | `/[locale]/rides` | Hub page with 10 sections. **3 dynamic sections DB-backed** (featured-premium + main-grid + listing-card) via `getFeaturedRides` / `getRidesForGrid` / `getRideTypeCounts`. 8 editorial sections stay hardcoded per Q3-locked strategy. Filter chips driven by real sub-category counts. |
| Rides vertical — detail | `/[locale]/rides/[id]` | Premium detail page, 8 components (header, gallery, key info, features, description, similar, purchase panel, mobile action bar). **Fully DB-backed** via `getRideById` / `getSimilarRides`. See `docs/RIDES-DETAIL.md`. |
| Rides DB wiring (Phase 3b + 3c) | `listings.category_fields` JSONB + related columns | Schema extensions: `category_fields`, `slug`, `is_featured`, `is_hot`, `old_price_minor_units`, `listing_images.category`, profiles dealer fields. 5 used-cars seeded with full detail data. `buildRideSpecs` + `buildRideGallery` + `rides-data.ts` (seed) retired. |
| Supabase backend | 22 migrations, 18 tables | Profiles, listings (with category_fields JSONB + slug + badges), images (with category)/videos/drafts, categories (80: 10 original + automotive parent + 15 automotive sub-cats), geo (countries/cities/areas), social, AI layer, waitlist. RLS on every table. |
| Server actions / queries | 27 files in `src/lib/` | Listings, auth, profile, favorites, search (hybrid keyword + pgvector), embeddings, storage. |
| i18n | AR (default) + EN | 16 namespaces under `messages/{ar,en}.json`. |
| Design system | CSS vars + Tailwind + fonts | Bricolage (LTR display), Geist (LTR body), Cairo (RTL). Warm stone palette. `.dark` class flip. See `DESIGN.md`. |

## 2. In flight

_(currently none — awaiting next decision)_

## 3. Queued (short list)

| Priority | Item | Depends on |
|----------|------|-----------|
| 🔴 High | Seller dashboard shell | Where price-AI / performance moves for private seller insights |
| 🔴 High | Landing wiring (Phase 3d) | LiveFeed + Feature283 hero still read `listings-data.ts` seed. Needs `getLiveFeedListings` + `getHeroListings`. |
| 🟠 Mid | Compare bar + `/rides/compare` | Stand-alone, can start any time |
| 🟠 Mid | Browse: `/[locale]/categories` (all 10) | Planning doc's original "next step" |
| 🟠 Mid | Generic `/[locale]/listings/[id]` | Applies rides detail patterns to non-vehicle categories |
| 🟡 Low | Sell wizard (`/sell/*`) | 8 steps, validators already exist |
| 🟡 Low | Auth pages (`/signin`, `/signup`, `/verify-otp`, `/reset-password`) | Server actions already exist |
| 🟡 Low | Profile + my-listings + saved pages | Server actions already exist |
| ⚪ Deferred | AI photo-to-listing | Feature flag off in `.env.local` |

## 4. Verticals roadmap

Rides was the first vertical. The pattern (see `docs/RIDES-DETAIL.md §7`) is reusable.

| Vertical | Status | Notes |
|----------|--------|-------|
| Rides (vehicles) | ✅ Fully DB-wired · detail (Phase 3b) + hub (Phase 3c) | Zero seed, zero synthesis, zero adapter. Covers 15 automotive sub-categories via `getRidesForGrid`; grid chips dynamic. |
| Properties | ⬜ Planned | Different data shape (bedrooms, area m², amenities) |
| Tech | ⬜ Planned | Phones, laptops, cameras — condition-heavy |
| Jobs | ⬜ Planned | Different CTA model (apply, not buy) |
| Fashion | ⬜ Planned | Size grids, condition states |
| Community / services | ⬜ Planned | Lower-priced, high-volume |
| Luxury | ⬜ Planned | Authenticity pipeline required — blocked on AI authenticator |

## 5. Known issues

| # | Issue | Impact | Planned fix |
|---|-------|--------|-------------|
| 1 | ~~`src/lib/browse/queries.ts` imports the deleted `ListingCard`~~ | — | **Fixed 2026-04-20** in Phase 3b.1 — `ListingCardData` canonicalised to `src/lib/browse/types.ts` |
| 2 | ~~Rides detail page uses seed data, not Supabase~~ | — | **Fixed 2026-04-20** in Phase 3b.6 — `/rides/[id]` fully DB-backed |
| 3 | ~~`/rides` hub still uses `RIDE_LISTINGS` seed~~ | — | **Fixed 2026-04-20** in Phase 3c.2+3 — hub wired; `rides-data.ts` deleted in Phase 3c.4 |
| 4 | Landing `LiveFeed` + `Feature283` still read `listings-data.ts` seed | Home page shows demo listings not tied to real inventory | Phase 3d — wire via `getLiveFeedListings` / `getHeroListings` |

## 6. Deprecations / removed from surface

| Item | Reason | Status |
|------|--------|--------|
| `RideDetailAccordions` (service history, factory packages) | Data was synthetic and not verifiable. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
| `RideDetailPerformance` (HP, torque, 0-100…) | Not a decision factor for Kuwaiti buyers. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
| `build-ride-specs.ts` + `build-ride-gallery.ts` (hash-deterministic synthesis engines) | Components now read real specs from `listings.category_fields` (Zod-parsed) and real images from `listing_images`. Synthesis obsolete. | **Deleted 2026-04-20** in Phase 3b.7 |
| `rides-data.ts` (20-seed listings + VEHICLE_TYPES + VEHICLE_COLORS + RideListing type) | Hub fully DB-wired (Phase 3c) — no consumers remain. `getRideCatColor` in queries + `SUB_CAT_ACCENT` in the main-grid UI cover the color mapping that VEHICLE_COLORS used to do. | **Deleted 2026-04-20** in Phase 3c.4 |
| AI Insights section (price verdict + AI Q&A) on public detail page | Hostile to sellers. Moves to seller dashboard (private) instead. | Removed from page composition earlier |
| Sponsored ad slot in detail-page header | Visually unbalanced. May come back in a dedicated placement. | Removed from page composition earlier |
| Icon action column inside detail header | Visually disconnected from price. Moved into purchase panel. | Refactored earlier |

## 7. Docs index

| File | What it's for |
|------|---------------|
| `docs/RIDES-DETAIL.md` | Complete record of the rides-detail build (all components, decisions, patterns, pending work) |
| `docs/STATUS.md` | **This file** — build status at a glance |
| `README.md` | Project overview + quick start |
| `planning/BUILD-STATE.md` | 2026-04-19 snapshot — historical reference. Predates the rides vertical. |
| `planning/PHASE-3-SUPABASE.md` | v1.1 — JSONB wiring plan (superseded by 3B/3C audits but retains context). |
| `planning/PHASE-3B-AUDIT.md` | Full-field audit + wiring plan for `/rides/[id]` detail page. |
| `planning/PHASE-3C-AUDIT.md` | Hub component triage + wiring plan for `/rides`. |
| `planning/TAXONOMY-V2.md` | 21-parent category taxonomy — locked source for JSONB strategy. |
| `planning/MASTER-PLAN.md` | Full strategic plan |
| `planning/DECISIONS.md` | 9 locked project-level decisions |
| `planning/GCC-READINESS.md` | Multi-country architecture |
| `planning/COMPETITOR-DUBIZZLE.md` | Primary competitor analysis |
| `DESIGN.md` | Design system (2,674 lines) |
| `design/AI-FEATURES.md` | AI layer spec |
| `supabase/README.md` | Schema + migrations guide |
| `briefs/BRIEF-001-AUTH.md` | Auth feature brief |
| `briefs/BRIEF-002-PROFILES.md` | Profile feature brief |
| `briefs/BRIEF-003-LISTING-CREATION.md` | Listing creation brief |
