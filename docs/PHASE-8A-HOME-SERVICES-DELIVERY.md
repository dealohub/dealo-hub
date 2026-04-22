# Phase 8a — Home Services Vertical — Delivery Handoff

**Date:** 2026-04-22
**Author:** Fawzi Al-Ibrahim
**Audience:** engineering collaborator / technical co-worker
**Phase status:** ✅ **SHIPPED end-to-end** (closed 2026-04-22 early afternoon)
**Commits delivered:** 8 (see §2)
**Tests health:** 715/715 green · typecheck clean
**Push status:** 73 local commits ahead of `origin/master` (held per the standing rule — no push until visual sign-off)

---

## 1. Why this phase exists

The Kuwait/GCC home-services market transacts primarily on **WhatsApp groups + word-of-mouth**, not on classifieds. Live Chrome DevTools MCP probes of the two dominant Kuwait classifieds (2026-04-22) tell the story:

- **Dubizzle Kuwait** `/services/` — 1,708 total ads but the "Domestic Services" sub-cat has **6 ads, mostly mislabeled** (concrete cutting, car rentals, a phone number masquerading as a price). No dedicated cleaning sub-cat. "Call" button exposes phone directly.
- **Q84Sale / 4Sale** `/services/cleaning-services/1` — **171 ads, 100% commercial companies** (zero individual providers). Phone numbers **baked into banner JPEGs** (un-suppressible). 4Sale shipped a prominent "Get Quotes" button with copy "+20 providers are waiting for your request" — **but it 500s at probe time**. The Thumbtack moat was attempted locally and not yet captured.

**The gap:** no Kuwaiti platform represents the individual provider (the actual atomic unit of the market), no post-completion review layer exists, no structured quote flow works, and no platform holds the contact channel (phone-number hand-off = platform disintermediation = zero re-engagement).

Phase 8a ships the first Kuwait-adapted competitor to this pattern, starting narrow (home cleaning + handyman — NOT licensed trades, NOT beauty, NOT delivery) to prove the doctrine before expanding sub-cats.

## 2. What shipped (8 commits)

| # | SHA | Category | Summary |
|---|-----|----------|---------|
| 1 | `f423121` | feat | **Foundation** — doctrine (10 pillars, 3 research tracks, 8 founder-resolved decisions) + migrations 0037 (services taxonomy + 3 tables + RLS + profile extensions) + 0038 (messages.kind + payload enum) + `src/lib/services/` types + validators (`ServiceFieldsSchema` + 4 chat-payload schemas + contact-info leak detector + booking state machine) + **67 new unit tests** |
| 2 | `75fe473` | feat | **Hub + seeds** — migration 0039a/b (5 auth.users + 5 profiles with 4-tier verification spread + 14 served-area rows + 12 service listings spanning all 8 task_types) + `src/lib/services/queries.ts` (detail + hub + featured + task-type counts + provider reviews + similar) + `listing-card-services` component + `/services` hub page (hero + 8 browse tiles + 4-pillar trust strip + 6-card featured row + 12-card main grid) + 26 i18n keys |
| 3 | `2363046` | feat | **Detail page** — 5 new components (`service-detail-header`, `service-detail-provider-card` with attestation summary, `service-detail-reviews`, `service-detail-purchase-panel` with hybrid-pricing layout + Dealo Guarantee callout, `service-detail-similar`) + `getSimilarServices` query + migration 0039c seeding **8 completed bookings + 16 cross-reviews** with 3-tag booleans + 28 i18n keys |
| 4 | `503cfdc` | feat | **Discovery integration** — navbar Services mega-menu entry (8 sub-task items) + `/categories/services` 308 redirect + landing feed bucket (`FeedCategoryKey` gets `'services'`) + `verticalPathForFeedCat` route + `HERO_BUCKET_PRIORITY` updated to 5 buckets + `deriveMeta` extended for services rate/rating + sitemap `/services` entry + `listingDetailHref` + `listingDetailHrefFromParent` branches + `/search` NoResults chip + sitemap test count bump |
| 5 | `d506070` | feat | **Quote flow** — `src/lib/services/actions.ts` with 4 server actions: `sendQuoteRequest` / `respondWithQuote` / `proposeBooking` / `markCompletion`. All typed `ServiceActionResult<T>` discriminated union with 9 error codes. All validate via Zod + run `containsPhoneOrEmailPattern` on free-text fields. `ChatMessage.kind` + `payload` plumbed through `src/lib/chat/types.ts` + `queries.ts`. `MessageBubble` dispatches structured kinds to new `ServiceMessageCard` component with 4 per-kind card layouts (sky quote_request / emerald quote_response / indigo booking_proposal / emerald-pill completion_mark) + 18 i18n keys |
| 6 | `6e4730a` | feat | **Sell wizard** — `services-details-form.tsx` 7-section single-page form (task type / pricing with P7 enforcement / governorates / provider info / availability / title+desc / **P9 attestations blocking publish**) wired into `/sell/details` branch on `parent.slug === 'services'` + 40 i18n keys including verbatim attestation copy from doctrine P9 |
| 7 | `383b3db` | docs | STATUS.md + PROGRESS-REPORT-2026-04-22 §10 addendum covering research → code → numbers → what works end-to-end → scope boundaries → next candidates |
| 8 | `07cf2ec` | fix | Migration 0040: services listing_images (27 rows across 12 listings via Unsplash — same bug class as Electronics 0035→0036). **Visual smoke-test across 6 surfaces** (hero 4-vertical mix confirmed via DOM inspection, navbar SERVICES, /categories/services 308, /search NoResults chip, no regression on tech/properties/rides, 715/715 tests). Chapter closed. |

## 3. The 10 pillars (doctrine)

Full doctrine in `planning/PHASE-8A-HOME-SERVICES.md`. Headlines:

| P | Name | One-line |
|---|------|---|
| P1 | Individual-first atomic unit | Profile = human who shows up, not brand |
| P2 | Verified identity as gate | 4-tier: unverified → identity_verified → address_verified → dealo_inspected |
| P3 | 3-quote flow as discovery mechanic | Buyer posts need, ≤5 providers respond within 24h (5-max cap from Thumbtack; data layer ready, composer UI in 8b) |
| P4 | Chat-only + structured primitives | 4 new `messages.kind` (quote_request / quote_response / booking_proposal / completion_mark); contact-info leak filter on writes |
| P5 | Post-completion reviews only | Review unlocks only when BOTH sides sent `completion_mark` |
| P6 | Governorate + area-level serving map | Explicit serving declaration; area-level filter prevents unreachable matches |
| P7 | Transparent pricing | No "call for quote" — schema enforces at least one of hourly/fixed populated |
| P8 | Dealo Guarantee (KD 200 cap, chat-only) | Anti-disintermediation lever without holding money |
| P9 | Regulatory-honest attestations | Blocking at provider signup: Law 68/2015 consent + authorization-to-offer |
| P10 | Plain-language UX | Ported from Phase 7 v2 electronics — Arabic-first, 7-section form with numbered sections |

Founder's 8 design decisions (recorded verbatim in doctrine §8):
- Individual providers allowed without MOCI (tier-capped at `identity_verified`)
- Dealo Guarantee cap: **KD 200**
- Fan-out: **5 max, first 3 visible**
- Review tags: `{on_time, clean_work, fair_price}`
- Seed density: 12 bookings / 5 providers
- Task-type scope: 8 values, no expansion (cleaning × 2 + handyman × 6)
- Dispute UI: **policy copy only in 8a**, claim-filing UI in 8b
- Parent naming: `services` + `home-services` sub-cat (TAXONOMY-V2 preserved)

## 4. Where to poke it (5-minute tour)

Dev server on `localhost:3000`. Suggested tour order:

1. `/ar/` — landing hero shows 6 scatter images mixing **cars + properties + tech + services** (Maryam's deep-clean listing is 4th scatter, linking to `/ar/services/maryam-premium-deep-clean`). The LiveFeed below includes a services card with "3 KD/hr · ★ 5.0" style meta.
2. `/ar/services` — hub: hero with 3 stat pills (12 listings / 5 providers / 8 jobs done) + browse-by-task 8-tile strip + trust strip (4 pillars: ID verify / chat-only / post-completion reviews / KD 200 guarantee) + 6 featured cards + 12-card main grid. Every card is clickable.
3. `/ar/services/maryam-premium-deep-clean` — detail: breadcrumb → "محقق من Dealo" gold tier → title → ⭐ 5.0 · 2 reviews · 2 jobs done · 12+ years · provider card with tier description + facts grid + 4 languages + serving areas + **P9 attestations callout** + review panel (2 reviews with 3-tag chips) + sticky purchase panel showing **hybrid pricing** (5.000 KD/hr min 4h + 25.000 KD fixed) + P8 guarantee callout + similar 4-card strip.
4. `/ar/categories/services` — 308-redirects to `/ar/services`.
5. `/ar/search?q=xyznothingfound` — NoResults shows 5 chips: `/categories` · `/rides` · `/properties` · `/tech` · **`/services`**.
6. **Navbar** hover on "SERVICES" (top, between TECH and وظائف) — mega-menu opens with 8 sub-task links.
7. (Requires real auth — try after a manual login as any seeded provider like seed-fatima) `/sell` → category → home-services → media upload → `/sell/details` branches to `ServicesDetailsForm` (7 numbered sections, P9 attestations blocking).

## 5. Database state

5 migrations applied this phase:

- `0037_services_taxonomy_schema` — services parent + home-services sub-cat in categories, `profiles.services_provider_verification_tier` + 2 attestation timestamps, 3 new tables (`service_areas_served` + `service_bookings` + `service_reviews`) with RLS mirroring conversations/messages.
- `0038_messages_kind_payload` — `messages.kind` (CHECK constraint: 6-value allowlist) + `messages.payload JSONB` + structured-kind-requires-payload CHECK + backfill of existing rows (`sent_as_offer=true → 'offer'`, else `'free_text'`).
- `0039a_seed_services_providers` — 5 auth.users + 5 profile rows (force-override display_name via DO UPDATE because auth trigger sets it to email prefix) + 14 served-area rows.
- `0039b_seed_services_listings` — 12 listings across the 8 task_types, category_fields JSONB populated with aggregates (rating_avg, rating_count, completed_bookings_count) that match the bookings seeded in 0039c.
- `0039c_seed_services_bookings_reviews` — 8 completed bookings (both-side completion_at stamped) + 16 service_reviews (buyer→provider + provider→buyer per booking) with 3-tag booleans.
- `0040_seed_services_listing_images` — CHECK constraint extended (before / after / tools / portfolio buckets added) + 27 listing_images rows across 12 listings (Unsplash-sourced, fixes the "services invisible on landing hero" bug that mirrored Electronics migration 0035→0036).

**Seeded providers (synthetic UUIDs `a0000001`..`a0000005`):**

| UUID suffix | Name | Verification | Listings | Bookings | Rating |
|---|---|---|---|---|---|
| `...001` | فاطمة الخالدي | identity_verified | 2 | 2 | 4.5 |
| `...002` | Handyman Ahmed | identity_verified | 3 | 2 | 4.8 |
| `...003` | Maryam Al-Sabah | **dealo_inspected** | 2 | 2 | 5.0 |
| `...004` | Ultra Services (Deepak) | address_verified | 3 | 1 | 4.0 |
| `...005` | ناصر المطيري | identity_verified | 2 | 1 | 4.7 |

## 6. What works end-to-end (no stubs)

- Listing discovery: navbar, redirects, landing, search, sitemap.
- Detail page rendering with full trust stack: tier badge + attestation summary + review list + hybrid price + Dealo Guarantee callout.
- Database writes for all 4 quote-flow actions. `sendQuoteRequest` writes a conversation (creates if absent) + a `quote_request` message with validated payload. `respondWithQuote` gates on caller being the seller. `proposeBooking` writes **both** a message and a `service_bookings` row with `status='proposed'`. `markCompletion` runs the booking state machine and auto-flips to `completed` when both sides have marked.
- Chat primitive rendering in `/messages/[id]` for all 4 kinds via `ServiceMessageCard`.
- Sell wizard publishes a draft listing with all P7-compliant pricing modes and P9 attestation timestamps stamped.

## 7. What's explicitly NOT shipped in 8a (deferred scope)

- **Composer UI for the quote flow.** The data layer is complete; the buyer-facing "request a quote" form and the provider's quote-response form are Phase 8b work. Server actions are callable via direct code paths today.
- **Fan-out matchmaking.** One `sendQuoteRequest` writes to one provider today. The 5-max fan-out algorithm is Phase 8b — it needs real provider inventory scale (~20+) to be meaningful; with 5 seed providers the matching degenerates to "whoever fits the governorate."
- **Dealo Guarantee claim filing + admin resolution.** Schema-ready (`service_bookings.guarantee_applies` + `status='disputed'` state + `canTransitionBooking` allows the transition). Phase 8b.
- **Rate limits on quote submissions.** Phase 5g's `rate_limits` table is live; 1-line wire-up from `actions.ts` once the composer ships.
- **Phase 8b-e sub-cats.** Moving-storage + event-services + photography (Thumbtack family extensions, 8b); licensed trades (8c, needs MOCI verification infra); beauty + tutoring (8d, Mindbody menu-booking model — distinct doctrine); delivery-courier (8e — candidate for its own Logistics vertical, not Services).

## 8. Test coverage

- **67 new tests** in `src/lib/services/validators.test.ts` across 4 sections:
  - ServiceFields happy-path + P7 invariant (12 tests)
  - Governorate + language + task_type enums (7 tests)
  - Chat payload schemas (18 tests across the 4 kinds)
  - `containsPhoneOrEmailPattern` (13 tests — Kuwait mobile + Arabic-Indic digits + international E.164 + email)
  - `canTransitionBooking` state machine (11 tests)
- Full suite: **715/715 green**.
- Sitemap composer test counts bumped (14→16 static, 22→24 aggregate) to lock the new `/services` route.
- Landing types test locks the `verticalPathForFeedCat('services', ...)` routing.

Integration tests for queries/actions deliberately not written — same convention as Electronics + Properties (integration-tested via the live render + manual smoke-test). Services has more validator coverage than either other vertical.

## 9. Known bugs fixed during the session

| Symptom | Root cause | Fix |
|---|---|---|
| Landing hero shows 6 electronics, 0 cars | migration 0035 set `created_at=NOW()` for all electronics, feed ordered by `created_at DESC` so cars fell off LIMIT 18 | commit `7c3f3ed` — feed now orders by `published_at DESC` + `listing_images!inner` |
| Electronics cards blank (no images) | migration 0035 forgot listing_images entirely | commit `6d4f271` — migration 0036 seeds 32 image rows |
| Services seeded profiles showed "seed-fatima" instead of "فاطمة الخالدي" | auth.users create-profile trigger sets display_name to email prefix; ON CONFLICT DO UPDATE didn't override | commit `75fe473` migration 0039a — added `display_name = EXCLUDED.display_name` to DO UPDATE SET |
| Services invisible on landing hero | Same bug class as electronics — seeded listings but not listing_images | commit `07cf2ec` — migration 0040 seeds 27 image rows + extends CHECK with services-specific categories |
| Services not routable from `/categories/services` or navbar | Phase 8a foundation shipped without discovery integration | commit `503cfdc` — navbar entry, redirect, landing bucket, sitemap, route resolver, search NoResults |

All caught by visual smoke-test via Chrome DevTools MCP. Without the smoke-test pass, they would have shipped to push.

## 10. Open questions for cowork

1. **Fan-out defaults for 8b.** Doctrine decision set 5-max, first-3-visible. With only 5 seed providers today, fan-out is effectively 1:1. Should we seed ~30 providers before the composer ships, or let the composer ship with visible 1:1 and scale providers in 8b2?
2. **Rate-limit budget for quote submissions.** Thumbtack allows ~50 quote submissions per buyer per day; Bark caps at 10. What's the Kuwait SMB-budget-friendly number — 5/day? 10/day? Or no cap until we see abuse?
3. **Dealo Guarantee claim workflow — who arbitrates?** Manual founder review OK for v1 (low volume)? Or do we need a 3-party arbitration process defined before we surface the KD 200 guarantee to real users?
4. **Area-level filter UX.** Phase 8a has governorate filter; Phase 8b should add area-level (e.g. "providers who serve Salmiya specifically"). Sticky combobox? Map-picker (like Careem)? Tied to PACI address auto-fill?
5. **Push gate.** 73 commits pending. Visual smoke-test passed on 6 surfaces. Is visual validation enough, or does cowork want a staging deploy first?

## 11. How to pick this up fresh

Everything is in `planning/PHASE-8A-HOME-SERVICES.md` + `planning/research-8a-home-services/`. The 3 research files + synthesis are the evidence floor; the doctrine references them by section. 8 founder decisions are recorded inline. No hidden reasoning.

Relevant entry points:
- `app/[locale]/services/page.tsx` — hub
- `app/[locale]/services/[slug]/page.tsx` — detail
- `app/[locale]/sell/details/page.tsx` — branches into `ServicesDetailsForm`
- `src/lib/services/` — 4 files (types, validators, validators.test, queries, actions)
- `src/components/shadcnblocks/service-detail-*.tsx` + `listing-card-services.tsx` — 6 components
- `src/components/chat/service-message-cards.tsx` — 4 chat primitive cards
- `src/components/sell/services-details-form.tsx` — 7-section sell wizard

---

*End of Phase 8a delivery handoff. Phase 8b queued, scope narrowed to the composer UI + fan-out + area-filter.*
