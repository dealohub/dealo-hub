# Dealo Hub — Build Status

> Living snapshot of what's built, what's in flight, and what's queued.
> Update this file whenever a section lands or a decision flips.
>
> Last updated: **2026-04-21** (Phase 5a + 5b complete — Auth UI + Sell wizard end-to-end. Users can now sign up, log in, and publish real listings that surface in /rides or /properties. 33 local commits across Phases 3→5b. Phase 5c — Chat realtime — is next.)

---

## 1. Shipped

| Area | Route / surface | Notes |
|------|-----------------|-------|
| Landing page | `/[locale]/` | Built by Claude Design; shell unchanged. **Dynamic surfaces DB-backed** (Phase 3d + 2026-04-21 polish): one `getLiveFeedListings({ limit: 12 })` call feeds both Feature283 hero scatters (6 slots via `.slice(0, 6)`, each a `Link` into `/rides/[slug]`) and LiveFeed (`.slice(0, 8)` as `initialFeed`). Editorial `ACTIVITY_SIGNALS` passed as a sibling prop. 4 editorial sections (brands strip, AI protection, partners, footer) stay hardcoded. ISR revalidate=60. |
| Rides vertical — grid | `/[locale]/rides` | Hub page with 10 sections. **3 dynamic sections DB-backed** (featured-premium + main-grid + listing-card) via `getFeaturedRides` / `getRidesForGrid` / `getRideTypeCounts`. 8 editorial sections stay hardcoded per Q3-locked strategy. Filter chips driven by real sub-category counts. |
| Rides vertical — detail | `/[locale]/rides/[id]` | Premium detail page, 8 components (header, gallery, key info, features, description, similar, purchase panel, mobile action bar). **Fully DB-backed** via `getRideById` / `getSimilarRides`. See `docs/RIDES-DETAIL.md`. |
| Rides DB wiring (Phase 3b + 3c) | `listings.category_fields` JSONB + related columns | Schema extensions: `category_fields`, `slug`, `is_featured`, `is_hot`, `old_price_minor_units`, `listing_images.category`, profiles dealer fields. **6 used-cars seeded** with full detail data (BMW M5, Mercedes G63, Toyota Camry, Honda Civic Type R, Tesla Model 3 LR, Porsche 911 Carrera S). `buildRideSpecs` + `buildRideGallery` + `rides-data.ts` (seed) retired. |
| Properties DB foundation (Phase 4a) | `src/lib/properties/` + migrations 0025-0027 | **Doctrine-led** evidence-based design (Dubizzle KW + Q84Sale live DOM + Kuwait Law 74/1979 + global benchmarks). Taxonomy: `real-estate` parent + 8 sub-cats. `PropertyFields` Zod schema (14 property types, 22 amenities, structured diwaniya, chalet availability primitives, off-plan payment plans). New cross-vertical columns: `verification_tier` + `verified_at/by` (drives trust badge), bilingual `title_ar`/`title_en`. **Filter C** — discriminatory-wording rejection at submit (validated by Dubizzle live listing `"Non-Arabs Only"`). 10 seed properties, each demonstrating one doctrine pillar. |
| Properties detail page (Phase 4b) | `/[locale]/properties/[slug]` | **End-to-end doctrine surfaces render live**. Composition: navbar → centered hero header (breadcrumb + tier badge + featured/hot + h1 + meta row + stats) → ownership-eligibility banner (sale listings, Law 74 derived from sub_cat + zoning_type) → 2-column grid { gallery (dynamic filter pills per listing) + key-info (5 sections, populated-only rows) + amenities (22-slug locked list, 4 tiers) + chalet-booking (P4 — sky-blue accent, shown only for chalet rent) + payment-plan (P13 — indigo accent, shown only for off-plan sale, with sum-meter bar) + description + structured-diwaniya card (P14 — amber accent) + similar-properties (4-card grid with tier badges) } { sticky purchase-panel (price + period + cheques + deposit + service charge + CTA branches by listing_purpose — chalet/sale/rent/exchange + WhatsApp + Save/Compare/Share) } → mobile sticky action bar (lg-). ISR revalidate=60. 10 components + queries (`getPropertyBySlug`, `getSimilarProperties` 2-pass algo) + 163 i18n keys. Tested live on `bnaider-chalet-a1-14` (P4 chalet) and `bayan-villa-18` (P1/P6/P8/P10/P14 — all pillars visible in AR + EN). |
| Properties hub page (Phase 4c) | `/[locale]/properties` | 7-section composition: navbar → hero (live stats bar: total listings / Dealo-Inspected count / chalets count) → browse-by-type tiles (14 types, empty ones hidden) → featured premium row (6 cards, ordered verification_tier DESC) → **trust strip** (5 editorial pillars naming Dubizzle KW gaps by name) → main grid (client-side filter chips All/Rent/Sale/Rooms/Land/Chalet⭐ + 5 sort options) → articles strip (3 hardcoded guides) → footer. ISR revalidate=60. 7 components + 3 hub queries + 67 i18n keys. `listing-card-properties` reusable across featured + grid + similar-detail. Tested live on `/ar/properties` with full AR render. |
| Auth UI (Phase 5a) | `/signin` · `/signup` · `/reset-password` · `/reset-password/confirm` · `/auth-callback` | Email auth end-to-end. 3 shared primitives (`AuthCard`, `AuthFormField`, `AuthSubmitButton` w/ useFormStatus), 4 client forms (Signin/Signup/ResetRequest/ResetConfirm) using `useFormState` for field-error surfacing across server action round-trip. 4 page routes + 1 route handler for `/auth-callback` (exchangeCodeForSession + redirect). Rich-text i18n via `t.rich()` for inline links ("New to Dealo Hub? <link>Create account</link>"). All pages `robots: noindex`. Server actions from `src/lib/auth/actions.ts` unchanged — UI wire only. Phone auth stays deferred to Sprint 6 (Twilio + Kuwait sender-ID). Tested live on `/ar/signin`. |
| Sell wizard (Phase 5b) | `/sell/category` · `/sell/media` · `/sell/details` · `/sell/price` · `/sell/location` · `/sell/delivery` · `/sell/preview` | **Supply loop closed**. 7-step wizard (authenticity luxury step deferred). Shared `WizardShell` (top bar + step indicator + content slot) + `WizardStepIndicator` (done✓/current/future statuses). 7 step components: category-picker (two-level tree), media-uploader (drag-drop + client WebP resize + Supabase Storage), details-form (title+description+condition+brand/model), price-form (3 modes + min-offer conditional), location-form (governorate + cascading area), delivery-form (3-option multi-select), preview-publish (full summary + edit-back links + publish CTA). Auth-gated + step-order-gated — users can't skip required earlier steps. On publish: `publishListing` validates via PublishSchema (Filter A + B + C applied), inserts listing, moves images from drafts/ to listings/, fires embedding, redirects to the correct vertical detail page (/rides/[slug] for automotive, /properties/[slug] for real-estate). Backend (actions, validators, client-upload) was pre-built — this phase wires UI only. |
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
| Properties | 🟢 Phases 4a + 4b + 4c shipped · 4d navbar wire queued | **Detail + hub pages live** at `/[locale]/properties` and `/[locale]/properties/[slug]`. All 14 doctrine pillars rendering across both surfaces. 18 components (8 detail + 7 hub + 3 reusable). Queries: `getPropertyBySlug`, `getSimilarProperties`, `getFeaturedProperties`, `getPropertiesForGrid`, `getPropertyTypeCounts`. 230 i18n keys AR+EN (163 detail + 67 hub). Chalet filter chip ⭐ on the hub surfaces the Dubizzle gap visibly. Trust strip calls out 5 Dubizzle gaps by name. Still queued: 4d navbar wire (`عقارات` → `/properties`), 4e maps + chalet booking calendar. |
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
| 4 | ~~Landing `LiveFeed` + `Feature283` still read `listings-data.ts` seed~~ | — | **Fixed 2026-04-20** in Phase 3d.2 — wired via `getLiveFeedListings` / `getHeroListings`; `listings-data.ts` deleted in Phase 3d.3. Follow-up (2026-04-21): `getHeroListings` retired — hero scatters now reuse the same `getLiveFeedListings` call as the feed, giving cohesion. Seeded a 6th car (Porsche) to fill the 6 hero slots; replaced 3 dead Unsplash URLs (migration 0024). |

## 6. Deprecations / removed from surface

| Item | Reason | Status |
|------|--------|--------|
| `RideDetailAccordions` (service history, factory packages) | Data was synthetic and not verifiable. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
| `RideDetailPerformance` (HP, torque, 0-100…) | Not a decision factor for Kuwaiti buyers. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
| `build-ride-specs.ts` + `build-ride-gallery.ts` (hash-deterministic synthesis engines) | Components now read real specs from `listings.category_fields` (Zod-parsed) and real images from `listing_images`. Synthesis obsolete. | **Deleted 2026-04-20** in Phase 3b.7 |
| `rides-data.ts` (20-seed listings + VEHICLE_TYPES + VEHICLE_COLORS + RideListing type) | Hub fully DB-wired (Phase 3c) — no consumers remain. `getRideCatColor` in queries + `SUB_CAT_ACCENT` in the main-grid UI cover the color mapping that VEHICLE_COLORS used to do. | **Deleted 2026-04-20** in Phase 3c.4 |
| `listings-data.ts` (SEED_LISTINGS + SEED_PRICE_DROPS + HERO_LISTING_INDICES + ACTIVITY_SIGNALS + SeedListing/SeedPriceDrop types) | Landing page fully DB-wired (Phase 3d). ACTIVITY_SIGNALS moved to `src/lib/landing/constants.ts`; everything else superseded by `getHeroListings` + `getLiveFeedListings` returning `HeroImage[]` / `FeedListing[]`. | **Deleted 2026-04-20** in Phase 3d.3 |
| AI Insights section (price verdict + AI Q&A) on public detail page | Hostile to sellers. Moves to seller dashboard (private) instead. | Removed from page composition earlier |
| Sponsored ad slot in detail-page header | Visually unbalanced. May come back in a dedicated placement. | Removed from page composition earlier |
| Icon action column inside detail header | Visually disconnected from price. Moved into purchase panel. | Refactored earlier |

## 7. Docs index

| File | What it's for |
|------|---------------|
| `docs/RIDES-DETAIL.md` | Complete record of the rides-detail build (all components, decisions, patterns, pending work) |
| `docs/STATUS.md` | **This file** — build status at a glance |
| `README.md` | Project overview + quick start |
| `planning/PHASE-3-SUPABASE.md` | v1.1 — JSONB wiring plan (superseded by 3B/3C audits but retains context). |
| `planning/PHASE-3B-AUDIT.md` | Full-field audit + wiring plan for `/rides/[id]` detail page. |
| `planning/PHASE-3C-AUDIT.md` | Hub component triage + wiring plan for `/rides`. |
| `planning/PHASE-3D-AUDIT.md` | Landing component triage + wiring plan for `/[locale]/`. |
| `planning/PHASE-4A-AUDIT.md` | Properties vertical — 14-pillar doctrine, evidence-based schema, 22-amenity master, Filter C spec, 10-property seed plan. |
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
