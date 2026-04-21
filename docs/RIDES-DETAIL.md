# Rides Detail Page — `/[locale]/rides/[id]`

> The first **vertical** detail page in Dealo Hub. A premium, dedicated
> experience for vehicle listings (cars, bikes, boats, trucks, campers,
> bicycles) — modelled on Carwow + Dubizzle, tuned for Kuwait / GCC.
>
> This document captures everything built for this page across multiple
> sessions so future development (including other verticals) can reuse
> the patterns without re-inventing them.

---

## 1. Status at a glance

| Item | State |
|------|-------|
| Route | `app/[locale]/rides/[id]/page.tsx` ✅ |
| Data source | **DB-backed** via `getListingById` / `getSimilarRides` (wired in Phase 3b.6; `rides-data.ts` retired in Phase 3c.4) |
| Static generation | `generateStaticParams` → pre-renders all seed listings |
| TypeScript | Clean (`tsc --noEmit` passes, excl. the pre-existing `browse/queries.ts` issue) |
| i18n | Fully bilingual (AR default · EN toggle) under `marketplace.rides.detail.*` |
| RTL | Logical properties throughout (`ms-`, `me-`, `start-`, `end-`, `ps-`, `pe-`) |
| Responsive | Mobile-first. Sticky bottom action bar appears on `<lg` |
| Framer Motion | Entry + scroll-in animations, price count-up, sticky reveal |

---

## 2. Final page composition (as of this doc)

```
<RideDetailPage>
├─ <EcommerceNavbar1 />              ← shared site chrome
├─ <RideDetailHeader />              ← centered hero (badges · title · specs · dealer strip)
│
├─ <section max-w-7xl>               ← two-column grid
│   ├─ Main column (flex-1)
│   │   ├─ <RideDetailGallery />      ← hero image + parallax + lightbox
│   │   ├─ <RideDetailKeyInfo />      ← spec grid (identity / mechanical / documents)
│   │   ├─ <RideDetailFeatures />     ← included equipment list
│   │   ├─ <RideDetailDescription />  ← seller's bilingual blurb
│   │   └─ <RideDetailSimilar />      ← 4 similar vehicles carousel
│   │
│   └─ Sidebar (400px, sticky lg+)
│       └─ <RideDetailPurchasePanel /> ← price, CTAs, finance calc, dealer, trust
│
├─ <RideDetailMobileActionBar />      ← appears only on mobile (sticky bottom)
├─ <SiteFooter />
├─ <ThemeToggle />
└─ <LocaleToggle />
```

---

## 3. Data model

### 3.1 Source — Supabase (DB-backed)

Every field the detail page renders comes from the database. No
synthesis, no seed fallback. The sub-tables that power one page:

| Table | Role |
|-------|------|
| `listings` | Core row: id, slug, title, description, brand, model, color, price, lifecycle, `is_featured`, `is_hot`, `old_price_minor_units`, counters (`view_count`, `save_count`, `chat_initiation_count`), and **`category_fields` JSONB** for vertical-specific data. |
| `listing_images` | Cover + gallery, ordered by `position`. Each row carries a `category` (`exterior` / `interior` / `engine` / `wheels` / `details`) that drives the filter pills. |
| `profiles` | Seller mini-card — `display_name`, `handle`, `avatar_url`, `is_dealer`, `dealer_name`, `dealer_verified_at`, `rating_avg`, `rating_count`, `created_at` (for years-active). |
| `cities` / `categories` | Join for `cityName` (locale-aware) and category breadcrumb labels. |

### 3.2 Vertical-specific fields — `listings.category_fields` (JSONB)

Automotive listings carry a Zod-validated shape under this column.
The full contract lives in `src/lib/rides/validators.ts`. Keys as of
Phase 3b:

```
make, model, year, mileage_km, transmission, fuel_type, vin,
accident_history, engine_cc, horsepower, torque_nm, cylinders,
doors, seats, body_style, drivetrain, exterior_color, interior_color,
service_history_status, region_spec, warranty_active,
warranty_remaining_months, registration_ref, trim_level, features[]
```

Values are stored in snake_case; the Zod `.transform()` emits
`UsedCarFields` (camelCase) to the app layer — consumers never see
snake_case.

### 3.3 App-facing types

- `RideDetail` (`src/lib/rides/types.ts`) — full detail shape that
  every `ride-detail-*` component consumes. Includes nested `specs:
  UsedCarFields`, `images: RideImage[]`, `seller: RideSeller`,
  `category: { id, slug, nameAr, nameEn }`, and a derived
  `catColor` for display tints.
- `RideCard` — shallow shape used by grids and the similar-vehicles
  carousel (id, slug, title, brand, model, price, cover, city, year,
  body style, fuel, mileage, catColor).

### 3.4 Query surface — `src/lib/rides/queries.ts`

```
getRideById(idOrSlug, { locale }): RideDetail | null
getSimilarRides(listingId, limit, { locale }): RideCard[]
getRideCatColor(subCategorySlug): string
```

Both queries filter by the public RLS scope: `status='live'` AND
`fraud_status NOT IN ('held','rejected')` AND `soft_deleted_at IS
NULL`. They log errors and return `null` / `[]` instead of throwing,
so Server Components can render `notFound()` cleanly.

### 3.5 Retired synthesis

The Phase-3a seed shape + the `buildRideSpecs` and `buildRideGallery`
synthesis engines are **gone** as of Phase 3b.7. Components no longer
carry hash-based pseudo-random generators for rating / reviews /
watching / phone — those now come from real counters, real seller
profiles, and (for phone) are never exposed per Decision 2.

---

## 4. Component catalogue

Each component lives in `src/components/shadcnblocks/ride-detail-*.tsx`
and is a client component (`'use client'`). Most take `{ listing:
RideDetail }`; a few accept extra context props (`locale`, `similar`,
`catColor`) set by the page.

### 4.1 `RideDetailHeader`
- **Role:** centered editorial hero — the visual anchor of the page.
- **Contents:** centered breadcrumb · centered badges row · H1 title · spec line · dealer strip (avatar + stats).
- **Design notes:**
  - Title scale: `text-[28px] md:text-[36px] lg:text-[44px]` (balanced, not overwhelming)
  - Breadcrumb doubles as back-navigation — no separate back button
  - Dealer strip is split: dealer left, stats right (including live watching, saves, inquiries, photos, ID)
  - Live watching pill pulses via `animate-ping`
  - Ambient radial gradient tinted to vehicle-type colour
  - Subtle diagonal sheen (`linear-gradient` + motion `x` loop)

### 4.2 `RideDetailGallery`
- **Role:** 2026-trend gallery — parallax hero with crossfade + lightbox.
- **Key features:** photo counter chip, category labels (all/exterior/interior/engine/wheels), fullscreen lightbox with keyboard nav, scroll parallax on hero.
- **Note:** was originally a `<section>` with its own `max-w-7xl` — refactored to a plain `<div>` so the page's grid defines its width.

### 4.3 `RideDetailKeyInfo`
- **Role:** the "what is this car" spec sheet.
- **Contents:** compact 2-column grid, grouped into Identity (year, body, color, spec region), Mechanical (engine, transmission, drivetrain, fuel), Documents (VIN with masking + copy, warranty, registration).
- **Design notes:**
  - Color swatches for exterior/interior (hex → tinted squares)
  - VIN shows masked until click → copies to clipboard
  - Mileage vs market context bar
  - Hero stats strip was removed (too cluttery) — info consolidated into the grid

### 4.4 `RideDetailFeatures`
- **Role:** buyer-facing equipment checklist.
- **Contents:** flat 3-column grid of included features with category-tinted icons; "show more" toggle for overflow past 12.
- **Design history:** originally had tabs + search + "show missing" toggle — those were removed because they belong in the **seller dashboard** (when editing a listing), not the public detail page. Buyers just want a clean list of what's included.

### 4.5 `RideDetailDescription`
- **Role:** "كلام البائع" — the seller's own blurb about the vehicle.
- **Contents:** bilingual (AR / EN) synthesized description, highlight chips for key selling points, "Read more" toggle.
- **Design notes:**
  - Uses `useLocale()` to default language to the page locale
  - Word-boundary truncation (no mid-word cuts)
  - Gold highlight chips for key facts (year, low mileage, warranty remaining)
  - Language toggle is inline, not hidden in a menu

### 4.6 `RideDetailSimilar`
- **Role:** "you may also like" carousel — keeps the buyer exploring inside Dealo.
- **Logic:** same vehicle type, sorted by price proximity, top 4.
- **Design:** horizontal scroll on mobile · 4-col grid on desktop · hover lift + image zoom · year / featured / photo-count chips on each card.
- **Deliberately neutral:** no price comparisons, no "better than this one" badges (we don't want to undermine the current listing in front of its own seller).

### 4.7 `RideDetailPurchasePanel` (sidebar)
- **Role:** the sticky "buy-side" card — where intent converts.
- **Contents (top to bottom):**
  - AI verdict banner (Great deal / Fair / Competitive / At market) — tone-based, no hostile "above market" label
  - Action icon row (♥ Save · ⇄ Compare · ↗ Share) — with toggle state on Save
  - Price block with strike-through + drop %
  - Animated price count-up on mount
  - Monthly installment preview → opens full finance calculator (down%, APR, term, live monthly)
  - Primary CTAs: phone reveal (masked → reveals + copies), WhatsApp deep-link with pre-filled message, Send inquiry
  - Dealer mini-card (avatar + verified tick + online-now pulse + rating + years)
  - Trust strip (Inspected · Warranty · Free delivery)
  - Social-proof footer (posted N days ago · X viewed today)
- **Sticky behaviour:** `lg:sticky lg:top-6 self-start` on an `<aside>`, and the parent grid uses `items-start` so the sticky doesn't stretch.
- **Critical fix from past debugging:** do NOT gate visibility behind `useInView` — it breaks full-page screenshots and can leave the panel invisible below the fold.

### 4.8 `RideDetailMobileActionBar`
- **Role:** fixed bottom bar on mobile — replaces the sticky sidebar on narrow screens.
- **Visibility:** only `<lg`. Hidden on desktop.
- **Contents:** mini price + condensed CTAs (Save · WhatsApp · Call).

---

## 5. Design decisions we removed (and why)

These are intentional "simplifications that came from real feedback." Future verticals should follow the same restraint.

| Removed component / feature | Reason |
|------|--------|
| `RideDetailAccordions` (service history / factory packages / included items / documents) | Synthetic, unverifiable data — doesn't belong on a public buyer-facing page. File deleted 2026-04-20 (pre-Supabase cleanup). When a seller dashboard service-history view is needed later, rebuild against real data. |
| `RideDetailPerformance` (HP / torque / 0-100 / top speed / efficiency / CO₂ cards) | The average Kuwaiti buyer doesn't decide from 0-100 numbers — they decide from price + condition + year + dealer. File deleted 2026-04-20 (pre-Supabase cleanup). Can be re-introduced as an "enthusiast mode" once real vehicle specs are in the database. |
| AI Insights section (price verdict + AI Q&A) | **Fatal for sellers** — publicly labelling a listing "12% above market" drives sellers to competitors. Price intelligence belongs in the **seller's dashboard** (private), not the public listing. AI Q&A was trimmed because the "what's resale value in 3 years" question can kill a purchase decision. |
| Brand partners strip on landing | Unsplash placeholder images broke repeatedly → replaced with typography-based brand names. |
| Scaffold placeholder for "Steps 7–9" | Was a dashed-border card listing future steps. Removed once those steps were either built or consciously deprioritised. |
| Icon actions (Heart / Compare / Share) in the header | Disconnected visually from the title. Moved into the purchase panel at the top-right of the card (closer to the price, where action makes sense). |
| Ad slot banner in header | Tried as a sponsored placement next to title. Rejected — visually unbalanced and the experimental partner lockup was pulling focus from the car itself. Revenue patterns can come back later in a dedicated placement that won't compete with the hero. |

---

## 6. i18n key structure

Namespace root: `marketplace.rides.detail.*`

```
marketplace.rides.detail
├─ header          (crumbHome, crumbRides, badges, actions, stats, dealer strip)
├─ gallery         (photo counter, categories, lightbox controls)
├─ purchase        (price, finance calc, CTAs, verdict, trust, social proof)
├─ keyInfo         (group titles, labels, VIN mask, color names)
├─ description     (toggle labels, seller persona, CTAs, highlight pills)
├─ features        (eyebrow, titleSimple, countSimple, showMore, list.* per feature key)
└─ similar         (eyebrow, title, viewAll, featured/hot labels, photos)
```

**Non-namespace contracts:**
- `marketplace.rides.types.{cars|bikes|boats|trucks|campers|bicycles}` — vehicle-type labels (reused across listing, card, header)
- All keys exist in BOTH `messages/ar.json` and `messages/en.json` with identical shape.

---

## 7. Patterns established for future verticals

When we build `/properties/[id]`, `/jobs/[id]`, `/tech/[id]`, copy these patterns verbatim:

### 7.1 Deterministic spec synthesis
- Lean seed data (`X_LISTINGS`) carries only the fields needed by the grid cards
- A `buildXSpecs(listing)` engine (hash + shifts) fills the rest
- Same ID → same specs every render → testable demos

### 7.2 Component naming
- `x-detail-*` file-per-block
- Each accepts `{ listing: XListing }` and nothing else
- Each is `'use client'`
- Each gets a one-paragraph JSDoc at the top (what + why)

### 7.3 Vertical accent colors
- A `{VERTICAL}_COLORS: Record<SubType, string>` map
- Use it for: badge backgrounds, chip dots, ambient glows, active-state borders
- Never hardcode colours inside a component that varies by sub-type

### 7.4 Page shell
- Header full-width
- Grid 2-column: main (`flex-1 min-w-0`) + sidebar (`[1fr_400px]`)
- `items-start` on the grid (sticky sidebar requires it)
- Mobile: sidebar collapses, mobile action bar replaces it

### 7.5 Neutral public surface
- No price shaming — keep the detail page friendly to both buyer **and** seller
- All "judging" data (price vs market, resale forecasts, above/below average) → **seller dashboard only**

### 7.6 Sticky survival
- `aside.self-start.lg:sticky.lg:top-6` + parent `grid.items-start`
- Never gate the sidebar behind `useInView` — it breaks below-the-fold rendering

### 7.7 Bilingual seller blurbs
- Synthesize AR and EN variants from structured data (year, brand tokens, condition, warranty)
- Default to the current locale via `useLocale()`
- Expose a lightweight inline language toggle

### 7.8 i18n discipline
- All user-visible strings under `marketplace.{vertical}.detail.*`
- Keys mirror the component file structure
- Western digits (`numberingSystem: 'latn'`) even in Arabic UI (per `planning/DECISIONS.md`)

### 7.9 RTL
- Only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`)
- Direction-sensitive icons (arrows, chevrons) flip with `rtl:rotate-180` or an `isAr ? ArrowLeft : ArrowRight` ternary

### 7.10 Motion budget
- Entry: `initial / animate / transition` with `ease: [0.22, 0.61, 0.36, 1]` and ~0.35–0.5s duration
- Scroll-in: `whileInView` with `viewport={{ once: true, margin: '-50px' }}`
- Stagger: `delay: i * 0.04` for lists, never more than 0.1 per step
- No infinite looping except the live-watching pulse and the hero sheen

---

## 8. Known files vs active page

All files under `src/components/shadcnblocks/ride-detail-*.tsx` are active
and rendered in `/rides/[id]`. No deactivated leftovers remain after the
2026-04-20 cleanup.

| File | Status |
|------|--------|
| `ride-detail-header.tsx` | ✅ active |
| `ride-detail-gallery.tsx` | ✅ active |
| `ride-detail-purchase-panel.tsx` | ✅ active |
| `ride-detail-key-info.tsx` | ✅ active |
| `ride-detail-description.tsx` | ✅ active |
| `ride-detail-features.tsx` | ✅ active |
| `ride-detail-similar.tsx` | ✅ active |
| `ride-detail-mobile-actionbar.tsx` | ✅ active |

**Historical (deleted 2026-04-20):** `ride-detail-performance.tsx`,
`ride-detail-accordions.tsx`. See §5 for rationale.

---

## 9. Wiring to Supabase — complete

Landed in **Phase 3b.6** (2026-04-20). No seed, no synthesis, no adapter.

**What shipped:**
- `src/lib/rides/queries.ts` — `getRideById(slug)` + `getSimilarRides(rideId, subCategorySlug, limit)`. Both return a `RideDetail` shape parsed from `listings` + `listing_images` + `profiles` + `cities` + `categories` via one PostgREST call each.
- `src/lib/rides/validators.ts` — Zod schema over `listings.category_fields` (automotive JSONB) with snake→camel `.transform()`. Invalid rows fail loudly at query time rather than silently rendering broken specs.
- Schema extensions landed in migrations 0015–0021: `listings.category_fields` (JSONB), `slug`, `is_featured`, `is_hot`, `old_price_minor_units`; `listing_images.category` (exterior/interior/engine/wheels/details); profiles dealer fields. 6 used-cars seeded with full data (migrations 0022 + 0023 + 0024).
- `app/[locale]/rides/[id]/page.tsx` consumes `getRideById` directly. All 8 page components receive a single `RideDetail` object; they no longer touch a seed array.
- `buildRideSpecs` + `buildRideGallery` synthesis engines **deleted** in Phase 3b.7 (no consumers remain).
- `Save` / `Compare` / `Share` interactions already existed client-side; `toggleFavorite(listingId)` is the final hook for the Save button when auth persistence lands.

**Reference:** `planning/PHASE-3B-AUDIT.md` for the full wiring plan + before/after diff.

---

## 10. Open work

| Track | Priority | Notes |
|-------|----------|-------|
| Compare bar + `/rides/compare` page | 🟠 Mid | Up to 4 vehicles side-by-side |
| Seller dashboard — vehicle-specific panel | 🟠 Mid | Host the Price AI + Performance views that don't fit on the public page |
| Image hashes for vehicle photos | 🟡 Low | Reuse the `image_hashes` fraud pipeline |
| Semantic search for rides vertical | 🟡 Low | `listing_embeddings` already exists |
| `/rides/new` (or reuse generic `/sell` flow) | ⚪ Future | Decide once `/sell` wizard ships |

---

## 11. Workflow / context

- **Claude Design** built the landing page at `/[locale]/`.
- **Claude Code** (this author, across several sessions) built everything else on the rides vertical end-to-end — header, gallery, purchase panel, key info, features, description, similar, mobile action bar, and the iterations that trimmed out the accordions / performance / AI sections.
- The planning docs (`planning/MASTER-PLAN.md`, `planning/DECISIONS.md`, `DESIGN.md`) predate the rides vertical and still assume a single generic `/listings/[id]` path. This doc is the authoritative record for the rides vertical specifically and should be updated alongside any structural change to `/rides/[id]`.

---

## 12. Change log

| Date | Change |
|------|--------|
| 2026-04-20 | Initial comprehensive doc — captures every decision across the rides-detail build sessions to date (header through similar carousel, action relocation, removed sections, bilingual description, purchase panel sticky, ad-slot experiment and rollback, centered hero pivot). |
| 2026-04-20 | Pre-Supabase cleanup: deleted `ride-detail-performance.tsx` and `ride-detail-accordions.tsx` (deactivated, no imports). §5 and §8 updated. |
| 2026-04-20 | Phase 3b wiring complete. All 8 components + page now read `RideDetail` from Supabase via `getRideById` / `getSimilarRides`. `buildRideSpecs` + `buildRideGallery` synthesis engines retired and deleted. §3 rewritten around the DB-backed model (category_fields JSONB, Zod transform, query surface). |
| 2026-04-20 | Phase 3c complete — `/rides` hub wired. Added `getFeaturedRides`, `getRidesForGrid`, `getRideTypeCounts` to `src/lib/rides/queries.ts`; extended `RideCard` with `subCategorySlug`. Featured-premium, main-grid, and `listing-card-rides` now consume `RideCard[]` from server-fetched queries. `rides-data.ts` deleted (229 lines) — zero seed / zero synthesis / zero adapter across the rides vertical. Main-grid filter chips now driven by live sub-category counts; shallow card drops featured/hot/dropPct/oldPrice/dealer/photoCount/live-pulse fields. |
| 2026-04-20 | Phase 3d complete — Landing (`/[locale]/`) DB-wired. New `src/lib/landing/` module: `queries.ts` (`getLiveFeedListings`, `getHeroListings`) + `types.ts` (`FeedListing`, `HeroImage`) + `constants.ts` (`ACTIVITY_SIGNALS`). Feature283 now accepts an `images: HeroImage[]` prop; LiveFeed takes `initialFeed: FeedListing[]` + `activitySignals: readonly string[]`. `listings-data.ts` deleted (74 lines) — the last seed file. App-wide: every dynamic surface is DB-backed. |
