# Dealo Hub — Build Status

> Living snapshot of what's built, what's in flight, and what's queued.
> Update this file whenever a section lands or a decision flips.
>
> Last updated: **2026-04-20**

---

## 1. Shipped

| Area | Route / surface | Notes |
|------|-----------------|-------|
| Landing page | `/[locale]/` | Built by Claude Design. Hero, brands strip, AI protection, live feed, featured partners, footer. Dark + light + RTL. |
| Rides vertical — grid | `/[locale]/rides` | Bento grid of 20 seed listings across 6 vehicle types (cars, bikes, boats, trucks, campers, bicycles). |
| Rides vertical — detail | `/[locale]/rides/[id]` | Premium detail page, 8 components (header, gallery, key info, features, description, similar, purchase panel, mobile action bar). See `docs/RIDES-DETAIL.md`. |
| Supabase backend | 14 migrations, 18 tables | Profiles, listings, images/videos/drafts, categories (64), geo (countries/cities/areas), social, AI layer, waitlist. RLS on every table. |
| Server actions / queries | 27 files in `src/lib/` | Listings, auth, profile, favorites, search (hybrid keyword + pgvector), embeddings, storage. |
| i18n | AR (default) + EN | 16 namespaces under `messages/{ar,en}.json`. |
| Design system | CSS vars + Tailwind + fonts | Bricolage (LTR display), Geist (LTR body), Cairo (RTL). Warm stone palette. `.dark` class flip. See `DESIGN.md`. |

## 2. In flight

_(currently none — awaiting next decision)_

## 3. Queued (short list)

| Priority | Item | Depends on |
|----------|------|-----------|
| 🔴 High | Seller dashboard shell | Where price-AI / performance moves once we wire real listings |
| 🔴 High | `/rides/[id]` → Supabase wiring | Extend `listings` schema for vehicle-specific fields, or use `extras` JSONB |
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
| Rides (vehicles) | ✅ Prototype done, Supabase wiring pending | Covers 6 sub-types in one codebase |
| Properties | ⬜ Planned | Different data shape (bedrooms, area m², amenities) |
| Tech | ⬜ Planned | Phones, laptops, cameras — condition-heavy |
| Jobs | ⬜ Planned | Different CTA model (apply, not buy) |
| Fashion | ⬜ Planned | Size grids, condition states |
| Community / services | ⬜ Planned | Lower-priced, high-volume |
| Luxury | ⬜ Planned | Authenticity pipeline required — blocked on AI authenticator |

## 5. Known issues

| # | Issue | Impact | Planned fix |
|---|-------|--------|-------------|
| 1 | `src/lib/browse/queries.ts` imports the deleted `@/components/listings/ListingCard` | `tsc --noEmit` fails with one error; `next dev` + `next build` tolerate | Replace when the browse page is built (pick a card variant in context) |
| 2 | Rides page uses seed data, not Supabase | Can't publish / favourite / report real vehicles yet | After seller dashboard shape lands |

## 6. Deprecations / removed from surface

| Item | Reason | Status |
|------|--------|--------|
| `RideDetailAccordions` (service history, factory packages) | Data was synthetic and not verifiable. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
| `RideDetailPerformance` (HP, torque, 0-100…) | Not a decision factor for Kuwaiti buyers. | **Deleted 2026-04-20** (pre-Supabase cleanup) |
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
