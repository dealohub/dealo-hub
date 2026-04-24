# Dealo Hub — Engineering Progress Report

**Date:** 2026-04-24
**Author:** Fawzi Al-Ibrahim
**Scope:** Hub-page composition — trust-strip compression, query-level dedup, sponsored-banner triplet
**Audience:** engineering collaborator / technical co-founder
**Prior report:** `docs/PROGRESS-REPORT-2026-04-23.md` (cross-vertical detail pages — visual redesign + polish pass)

---

## Executive Summary

Today closed three sequential goals across all five hub pages:

1. **Trust-strip compression (4 pages)** — The "Why Dealo …" trust manifesto on `/tech`, `/properties`, and `/services` was built as a 700–900 px wall-of-text with a 2-col header and four-to-five vertical numbered rows (massive faded "01–05" glyphs + 13 px paragraphs). The information is the actual moat — but the listing cards above already deliver each promise in their badges, so the section was repeating itself in a wall of text. All three were rebuilt to the same compact 4/5-pillar icon-pillar strip pattern. Same i18n keys, same message, ~67 % shorter on average.

2. **Query-level deduplication (4 pages)** — The hub product sections (Featured / Activity / Grid) all run different DB queries with different intents (curated picks / recency / full inventory), but with thin inventory (8–10 listings per vertical) the same listings showed up in all three back-to-back, creating a déjà-vu experience. An `excludeIds` parameter was added to the relevant queries in `src/lib/{electronics,properties,services}/queries.ts`, and the page-level fetches were chained so each section only sees listings the previous sections didn't claim. The chaining strategy was deliberately tuned per page (more on this below).

3. **Sponsored-banner triplet** — Two new full-width animated banners (`TechTradeInBanner` and `PropertiesFinanceBanner`) were built to complete a triplet with the existing `RidesFinanceBanner`. Each uses a distinct palette (emerald / amber / indigo) so a returning user instantly knows they're on a different vertical with a different lender. Each banner solves a different question — monthly payment (rides), instant trade-in (tech), maximum loan (properties) — which is the real differentiator beyond color.

Net impact: 13 commits pushed to `master`, **−3,918 px** of vertical real estate trimmed across 5 pages, two new revenue surfaces wired up. TypeScript clean throughout. Visual verification done in `en` + `ar` (RTL) for every change.

---

## 1. What shipped today

### Phase A — Landing and Rides cleanup (commits 1–3)

Two redundant "Featured Partners" sections were deleted across `/` and `/rides`, freeing **−1,468 px** of vertical real estate. Both pages already proved partner trust elsewhere (the "TRUSTED BY LEADING BRANDS" strip up top on both pages, plus `Feature 76` on landing and `Hand-picked listings from top partners` on `/rides`). The third section in each case was duplicative and visually weak — initial-avatar placeholders ("AF / EM / DM / GM") that broke the section's "names you already trust" promise.

| File | Change type | Notes |
|------|-------------|-------|
| `src/components/shadcnblocks/live-feed-parts.tsx` | Removed `FeaturedPartnersSection` (114 lines) + `PARTNERS` constant + `PartnerKind` type | The component had been swapped to a `logos13`-derived editorial layout earlier in the session, then deleted entirely once the redundancy was clear |
| `src/components/shadcnblocks/rides-dealer-spotlight.tsx` | File deleted (124 lines) | Same pattern, same conclusion |
| `app/[locale]/page.tsx` + `app/[locale]/rides/page.tsx` | Removed import + JSX usage | |
| `messages/en.json` + `messages/ar.json` | Removed `marketplace.partners` (landing) + `marketplace.rides.dealers` (rides) namespaces | 41 keys removed total |
| `src/components/logos13.tsx` | Created then deleted | Installed via `npx shadcn add @shadcnblocks/logos13` as a structural reference for the swap attempt; no longer needed after the deletion decision |

**Senior call documented in commits 5837747 + bcef2b1:** The first instinct was to swap the weak section for a better block (logos13). After installing and adapting it, the page composition still felt off — three partner-themed sections on one page is two too many. The right move was to delete, not improve.

### Phase B — Tech hub overhaul (commits 4–8, four files)

The `/tech` hub absorbed the bulk of today's work — five commits over four files. The starting state had the same "Why Dealo Tech is different" wall-of-text trust strip as the other verticals, plus a thin-inventory duplication problem visible across three product sections (Verified picks / Happening now / All tech), plus a `LiveFeed` component that doubled its items array regardless of count.

| File | Change | Details |
|------|--------|---------|
| `src/lib/electronics/queries.ts` | Added `excludeIds?: number[]` to `getRecentElectronicsActivity` and `getElectronicsForGrid` | When the array is non-empty, queries append `.not('id', 'in', '(${ids.join(',')})')` to the Supabase chain |
| `app/[locale]/tech/page.tsx` | Re-chained queries: `featured` first → `activity` excludes featured IDs → `grid` excludes both | `getElectronicsSubCatCounts` stays parallel with featured (touches a different aggregation) |
| `app/[locale]/tech/page.tsx` | Hide entire `All tech` section when `grid.length === 0` | The previous empty state ("No tech listings yet") read as a contradiction directly under sections that just showed 8 listings. Removed `Package` icon import that became unused |
| `src/components/shadcnblocks/tech-trust-strip.tsx` | Full rewrite | Was 700 px, now 295 px. 4-pillar icon strip with `BookCheck / Fingerprint / BatteryFull / Store` from lucide. Same i18n keys (`trust.catalog`, `trust.imei`, `trust.battery`, `trust.provenance`) |
| `src/components/shadcnblocks/electronics-live-feed.tsx` | `useMemo` for rotation array now skips the `[...items, ...items]` doubling when `items.length <= VISIBLE_COUNT` | Was rendering iPhone 12 / PS5 / iPhone 12 / PS5 (the same two listings twice) when activity was thin |
| `src/components/shadcnblocks/electronics-live-feed.tsx` | Grid columns adapt to `visible.length` (1/2/3/4) | Tailwind safelist-friendly via static class strings, not template interpolation |
| `src/components/shadcnblocks/tech-trade-in-banner.tsx` | New component (358 lines) | See "Sponsored-banner triplet" below |
| `messages/en.json` + `messages/ar.json` | Added `electronicsHub.tradeIn.*` namespace (15 keys × 2 locales) | |

Net: page shortens from 4687 px → 3695 px, every product appears exactly once.

### Phase C — Properties hub overhaul (commits 9–10, three files)

The `/properties` hub had a 915 px trust strip — the largest single section we compressed today — plus the same query-overlap problem.

| File | Change | Details |
|------|--------|---------|
| `src/components/shadcnblocks/properties-trust-strip.tsx` | Full rewrite, 5 pillars (vs 4 elsewhere) | 915 px → 295 px (−67 %). Icons: `Scale → Law 74 clarity`, `Shield → No discriminatory filters`, `Sofa → Structured diwaniya`, `CalendarClock → Chalet booking data`, `BadgeCheck → Dealo Inspected tier`. Same i18n keys preserved |
| `src/lib/properties/queries.ts` | Added `excludeIds?: number[]` to `getFeaturedProperties`, `getPropertiesForGrid`, `getRecentPropertyActivity` | Three queries needed it (vs two on `/tech`) because Properties has a separate Activity section between Featured and Grid |
| `app/[locale]/properties/page.tsx` | Re-chained with a deliberate refinement: Featured ⊥ Activity, but **Grid only excludes Featured (not Activity)** | The catalog rightfully includes recent listings — they're "recent" AND part of the catalog. Excluding both would have left the grid empty and embarrassed the page |
| `src/components/shadcnblocks/properties-finance-banner.tsx` | New component (350 lines) | See "Sponsored-banner triplet" below |
| `messages/en.json` + `messages/ar.json` | Added `marketplace.properties.hub.financeBanner.*` namespace (16 keys × 2 locales) | |

**Senior lesson learned during /properties:** On `/tech`, excluding all upper sections from the grid worked because the grid was small (24 listings, easily empty). On `/properties` the grid is the page's center of gravity (filter chips, sort, pagination), so excluding both Featured and Activity emptied it and showed a "No properties match these filters" state directly under sections that just showed 10 listings. The fix was to relax the dedup to "Featured only" — Activity is allowed in the catalog because it conceptually belongs there.

### Phase D — Services hub (commit 13, three files)

The smallest of the four hub-page passes — `/services` has no Activity section, so it was a straight trust-strip compression + Featured/Grid dedup.

| File | Change | Details |
|------|--------|---------|
| `src/components/shadcnblocks/services-trust-strip.tsx` | Full rewrite, 4 pillars | 858 px → 277 px (−68 %). Icons: `Fingerprint → identity verification`, `MessagesSquare → chat-only contact`, `Star → reviews after completion`, `ShieldCheck → KD 200 guarantee` |
| `src/lib/services/queries.ts` | Added `excludeIds?: number[]` to `getServicesForGrid` | One query needed it |
| `app/[locale]/services/page.tsx` | Featured first, Grid excludes featured IDs | `taskCounts` stays parallel with featured |

Net: page shortens from 3870 px → 3019 px (−22 %).

---

## 2. Sponsored-banner triplet

Three full-width animated banners were either built or extended today. The third (rides) already existed; the other two are new and follow the same structural template:

| Banner | Hub | Palette | Hero number | Conceptual question |
|--------|-----|---------|-------------|---------------------|
| `RidesFinanceBanner` (existing) | `/rides` | Emerald 🟢 | 0 % APR + monthly payment | "What's the monthly cost of this car?" |
| `TechTradeInBanner` (new) | `/tech` | Amber 🟡 | up to AED 1,800 trade-in | "What's my old phone worth?" |
| `PropertiesFinanceBanner` (new) | `/properties` | Indigo 🔵 | up to KWD 250,000 max loan | "What can I actually afford?" |

The conceptual differentiation is more important than the color one. The properties banner is a deliberate **inversion** of the rides banner: instead of "given a price, what's the monthly payment?", it asks "given my income, what's the maximum loan?" — the question Kuwait property buyers actually have *before* they start browsing. The mock calculator in each banner reflects this: rides shows `Price / Down / Term / APR → Monthly`, tech shows `Device / Storage / Condition / Battery → Estimated payout`, properties shows `Income / Debts / Term / Profit rate → Max loan`.

**Visual template (shared across all three):**

- `'use client'` + `useInView` (margin: '-120px', amount: 0.25) — gates all entrance animations on scroll
- `<motion.article>` outer card with rounded-3xl + gradient-br background
- Layer 1: radial wash from corners (palette-tinted)
- Layer 2: shimmer sweep — a 100° linear gradient moving x: -100% → 200% on a 2.6 s loop
- Layer 3: two floating blur-3xl orbs with breath animation (scale 1 / 1.08 / 0.95 / 1)
- Two-column `md:grid-cols-[1fr_1.2fr]` body
- Left: small rocking pill (rotate animation), counted `<AnimatedKWD/AED>` headline with scale + textShadow pulse, pitch text, 3 small pillar chips with stagger-in
- Right: mock calculator card with 4 fields in a 2x2 grid, divider, animated estimate, white CTA button with breathing box-shadow
- All RTL-safe via `start-*` / `end-*` logical properties + `rtl:rotate-180` on arrow icons

**Per-banner i18n namespace** under `electronicsHub.tradeIn` and `marketplace.properties.hub.financeBanner` — both fully translated en/ar.

---

## 3. Patterns established for future hubs

This session crystallized three reusable patterns that future verticals (or the inevitable next batch of "Why Dealo …" sections) should adopt directly.

### 3.1 Compact trust-strip (replaces tall manifesto pattern)

**When to use:** Any place where you have 3–6 trust pillars and you're tempted to write a tall numbered manifesto.

**Template:**

```tsx
const pillars = [
  { icon: IconA, title: t('pillar1.title'), body: t('pillar1.body') },
  // ... 3-5 total
];

<section className="border-y border-foreground/10 bg-foreground/[0.02] py-10 md:py-12">
  <div className="mx-auto max-w-7xl px-6">
    {/* compact inline header (eyebrow + h2 + subline on one row at sm+) */}
    {/* grid of icon-pillar cards with stagger-in */}
  </div>
</section>
```

Each pillar card: `flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.025] p-3.5`, with a `size-9` rounded-lg icon tile in `bg-primary/10 text-primary` on the start, `text-[13px]` title and `text-[11.5px]` body on the rest. Hover bumps the border + bg one tier.

Existing implementations: `tech-trust-strip.tsx`, `properties-trust-strip.tsx`, `services-trust-strip.tsx`. They are now functionally identical except for the icon set + pillar count.

### 3.2 Hub-query dedup chain

**When to use:** Any hub page rendering multiple product sections from different queries on the same underlying inventory.

**Template:**

```ts
// Page-level
const [featured, counts] = await Promise.all([
  getFeatured({ limit: 6 }),
  getCounts(),  // different aggregation, fetch in parallel
]);
const featuredIds = featured.map(f => f.id);
const [activity, grid] = await Promise.all([
  getActivity({ limit: 12, excludeIds: featuredIds }),
  // Choose one of:
  // (a) Catalog grid — only exclude featured (recent items belong here too)
  getGrid({ limit: 24, excludeIds: featuredIds }),
  // (b) Strict dedup — exclude featured + activity (only if grid is small / hideable when empty)
  // getGrid({ limit: 24, excludeIds: [...featuredIds, ...activity.map(a => a.id)] }),
]);
```

**Per-query template (Supabase):**

```ts
let q = supabase
  .from('listings')
  .select(CARD_SELECT)
  .in('category_id', categoryIds)
  .eq('status', 'live')
  .not('fraud_status', 'in', '(held,rejected)')
  .is('soft_deleted_at', null);
if (opts.excludeIds && opts.excludeIds.length > 0) {
  q = q.not('id', 'in', `(${opts.excludeIds.join(',')})`);
}
const { data } = await q.order(...).limit(...);
```

The "(a) vs (b)" choice depends on whether the grid section is the page's center of gravity. If hiding the section when empty is acceptable (small grid like `/tech`), use (b) for cleaner separation. If the grid is the heart of the page (filter chips, sort, pagination — like `/properties`), use (a) so the grid stays populated even with thin inventory.

Existing implementations:
- `/tech` uses (b) — grid hidden when empty
- `/properties` uses (a) — grid always shown, only Featured excluded
- `/services` uses (a)
- `/rides` not yet wired (Phase 5+)

### 3.3 Sponsored anchor banner

**When to use:** Any hub page where the rhythm reads as "GRID → STRIP → GRID" with no editorial anchor in the middle, AND there's a relevant sponsored placement available.

**Template:** Mirror `tech-trade-in-banner.tsx` or `properties-finance-banner.tsx`. Pick a palette that's distinct from the existing two banners (currently emerald and amber and indigo are taken — next vertical needs a fourth).

**Conceptual rule:** The hero number must answer the buyer's most pressing pre-purchase question, and the calculator must reverse-engineer to that number. Don't ship a generic "promo banner" that just says "Sponsored by X — Click here." The interactivity is the differentiator.

---

## 4. Metrics

### Vertical real-estate freed (per page, sorted by impact)

| Page | Before (px) | After (px) | Δ | % |
|------|-------------|------------|---|---|
| `/tech` | 4687 | 3695 | **−992** | −21 % |
| `/services` | 3870 | 3019 | **−851** | −22 % |
| `/` (landing) | – | – | **−840** | – |
| `/rides` | – | – | **−628** | – |
| `/properties` | 4777 | 4170 | **−607** | −13 % |
| **Total** | – | – | **−3,918** | – |

(Landing and rides "before" heights weren't measured precisely — the deletions were known to free ~840 + ~628 px from the section sizes.)

### Lines changed (across 13 commits)

| Type | Count |
|------|-------|
| Files added | 3 (two banners + i18n keys per file) |
| Files deleted | 2 (`logos13.tsx` scaffold, `rides-dealer-spotlight.tsx`) |
| Net lines added | +708 (banners) + ~80 (dedup logic) = ~+788 |
| Net lines deleted | ~−480 (trust-strip rewrites) + ~−250 (deleted sections) = ~−730 |
| **Net diff** | **+58 lines** for substantially more value |

### Verification surface

Every change verified visually in `en` + `ar` (RTL) at desktop viewport. Mobile viewport spot-checked on the major changes (landing partners removal, trade-in banner). TypeScript `tsc --noEmit` clean throughout. JSON files validated with `node -e 'JSON.parse(...)'` after every i18n edit. No automated tests run — the affected files are UI components or query layers that don't have test coverage in the current suite.

---

## 5. Caveats and known limits

### Framer-motion + static screenshots

Every banner with a `useInView` gate (NBK Finance, Dealo Cash, KFH Home Finance) renders at `opacity: 0` in static full-page screenshots because the intersection observer never fires. This is **not a real-user bug** — confirmed by scrolling to the section in Playwright and capturing only the viewport. Future progress reports that include landing-page screenshots should scroll-per-section rather than full-page, or expect the banners to look like dead black boxes in the export. See discussion in `tech` Phase B for the diagnosis trail.

### Inventory-thin grids

`/tech`'s "All tech" section is currently hidden because the dedup chain consumes the entire 8-listing inventory into Featured + Activity. This is intentional and correct for now — the section will reappear automatically when inventory crosses 12+. If we want it visible sooner, the right move is more inventory, not weaker dedup.

### Properties grid is empty for a different reason

After today's dedup tuning, `/properties` "All properties" shows a real grid (980 px, ~10 cards) — but the listings are mostly the same as those in Activity, since Activity is allowed in the catalog by design. This is intentional: Activity is the "fresh" lens on the same inventory, the grid is the "browsable" lens. Different framings of the same items, not duplication.

### `/services` has no anchor banner yet

The triplet (NBK / Dealo Cash / KFH) is complete for `/rides`, `/tech`, `/properties`. `/services` is the only remaining vertical without one. Open question for the next session: who's the sponsor? Plausible options — a same-day-pickup logistics brand, or a Dealo-internal "Dealo Guarantee" highlight rather than an external lender. Logged for next session.

---

## 6. What's next

Items deferred from today, ranked roughly by impact:

1. **`/services` Same-Day banner.** Completes the anchor triplet → quartet. Decide sponsor first.
2. **Detail-page polish parity (`/{vertical}/[slug]`)** — the detail pages were polished on 2026-04-23, but they predate today's dedup logic. If "similar listings" overlap with the current listing or with Featured, that pattern should also get an `excludeIds`.
3. **`/rides` query dedup** — currently the only hub without `excludeIds` chaining (it has no LiveFeed activity section, so the urgency was lower; only Featured + Grid would benefit). Phase 5+ work.
4. **`/properties` chalet booking depth** — the trust strip claims "Chalet booking data: seasonal multipliers, weekend premiums, check-in times" but the detail page barely surfaces these. Either dial back the claim or build the surface.

---

## Commit log

```
4c6ea77 refactor(services): compact trust strip + dedup featured from grid
60b683a feat(properties): add KFH Home Finance affordability banner
c11b4e1 refactor(properties): compact trust strip + dedup featured from grid
deee7af feat(tech): add Dealo Cash trade-in banner + adaptive LiveFeed grid
db7716d fix(electronics-live-feed): don't duplicate items when below VISIBLE_COUNT
fa2b7c5 refactor(tech-trust-strip): compress to compact 4-pillar icon strip
bc85934 fix(tech): dedupe listings across Featured/Activity/Grid sections
bcef2b1 refactor(rides): remove redundant Top Verified Dealers section
5837747 refactor(landing): remove redundant Featured Partners section
2375e3d feat(partners): swap Featured Partners to logos13-derived editorial layout (superseded)
c4fd6b4 polish(feature76): trim top padding further to hug brand rail
fbed276 polish(feature76): tighten vertical spacing
53d83dc feat(ai-strip): swap AIProtectionStrip for shadcnblocks Feature 76
```

(`2375e3d` and earlier polish commits are from the Feature 76 swap done at the start of the session — kept here for completeness since they're part of the same `master` push range.)

---

*End of report.*
