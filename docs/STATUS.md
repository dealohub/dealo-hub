# Dealo Hub — Build Status

> Living snapshot of what's built, what's in flight, and what's queued.
> Update this file whenever a section lands or a decision flips.
>
> Last updated: **2026-04-21** (Block A Feature Build **100% complete** — all 7 phases shipped (5a auth UI · 5b sell wizard · 5c chat realtime · 5d search · 5e account surfaces · 5f navbar wire + LiveFeed fixes · 5g observability + rate limits). Phase 6a (AI Negotiator doctrine, 503 lines) + Phase 6b (engine + migration 0030 + live smoke test @ $0.000357) shipped. Block C test foundation: **286 assertions** (271 unit + 15 RLS). Two verticals live (Rides + Properties). 46+ local commits pending push.)

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
| Chat realtime (Phase 5c) | `/messages` · `/messages/[id]` + ContactSellerButton on detail pages | **DECISIONS #2 core moat live**. Migration 0028 wires RLS policies (conv_read/insert/update, msg_read/insert), conversation-header sync trigger (last_message_at + unread counts), mark_conversation_read RPC, Supabase Realtime publication on messages + conversations. `src/lib/chat/` module: types, queries (getInbox, getUnreadCount, getThread), actions (startOrResumeConversation, sendMessage, markConversationRead, archive/block). UI: inbox with active/archived tabs + empty-state CTA; thread with listing mini-header + MessageBubble (offer variant with amber bubble + formatted amount) + MessageComposer (auto-growing textarea, Enter-to-send, offer-mode toggle, Filter A + C inline errors); ThreadRealtime client subscribes to postgres_changes for INSERT on messages + UPDATE on conversations, triggers router.refresh() on change. ContactSellerButton wired into property purchase-panel (variants: book-now/make-offer/contact-seller per sub-cat) + mobile action bar. WhatsApp CTA visibly stubbed as disabled per chat-only doctrine. 110 i18n keys AR+EN. Rides vertical wiring deferred to 5c.4 polish. |
| Search page (Phase 5d) | `/search?q=...` | Hybrid (70% semantic + 30% keyword) results wrapping `searchListings` from `src/lib/search/queries.ts`. SearchInput (client form w/ clear + submit) + SearchResultCard (vertical-list layout, routes to /rides or /properties based on category slug). "Smart search" sky badge when semanticUsed=true. 3 empty-state branches: empty-query, no-results, results-with-header. Filter UI panel deferred to 5f polish. |
| Account surfaces (Phase 5e) | `/my-listings` · `/saved` · `/profile/me` · `/profile/edit` | `src/lib/account/queries.ts` exports getMyListings (all statuses for seller inventory) + getSavedListings (two-pass with favorite-order preservation). /my-listings renders 3 sections (Live / Drafts / Archived+Sold) with status pills + "New listing" CTA. /saved reuses SearchResultCard with empty-state quick-jumps. /profile/me redirects to /profile/[handle] (or /profile/edit when no handle set). /profile/edit wraps `updateProfile` server action with a form reusing AuthFormField + AuthSubmitButton primitives (display_name + handle + bio + preferred_locale). Public /profile/[handle] view + avatar upload UI deferred. |
| Navbar wire + LiveFeed fixes (Phase 5f) | Auth-aware navbar on all routes | Avatar button + 5-item dropdown (messages/my-listings/saved/profile/sign-out) + unread-messages badge. Fixed high-impact bug where property listings labelled "TECH" and routed to `/rides/<slug>` in LiveFeed (root cause: PostgREST self-FK embed unreliable; replaced with explicit two-step query). Error boundaries at `app/global-error.tsx` + `app/[locale]/error.tsx`. Localized 404 at `app/[locale]/[...rest]/page.tsx`. Route-specific loading skeletons. A11y: skip-to-content + focus-visible + prefers-reduced-motion. |
| Observability + rate limits (Phase 5g) | `rate_limits` table + `check_rate_limit()` RPC + capture/track helpers | Migration 0029: `rate_limits` table + atomic SECURITY DEFINER RPC. Wired into chat.send_message (30/min), chat.start_conversation (10/10min), listings.publish (20/hour). `src/lib/observability/capture.ts` + `track.ts` — typed 11-event catalog, PostHog + Sentry drop-in ready (awaiting DSNs). |
| Block C — Test foundation | `src/lib/**/*.test.ts` + `supabase/tests/rls.sql` | **286 total assertions** (271 unit + 15 RLS). Vitest from scratch. 10 suites covering: listings validators (Filter A/B/C), properties validators + Law 74, format helpers, chat routing, landing types, AI negotiator (policy + dialogue + floor-leak + safety + OpenAI adapter). Full suite runs in ~400ms. Caught 2 production bugs during authoring (Filter A false-positive + Filter C plural false-negative). |
| AI Negotiator engine (Phase 6b) | `src/lib/ai-negotiator/` + migration 0030 | 9 TS files (~1100 LOC engine + ~900 LOC tests). CICERO split architecture: pure-TS policy state machine + LLM verbalisation only. Secret floor never leaves DB (`is_offer_above_floor` RPC one-way). 5-layer safety (prompt guardrails + Filter A/B/C + floor-leak regex + rate limits + human close gate). Live smoke test: 3-turn Arabic negotiation @ $0.000357 total, projected $0.36/1000 deals. See `planning/PHASE-6A-AI-NEGOTIATOR.md` + §2 in this doc. |
| Supabase backend | 30 migrations, 20 tables | Profiles, listings (with category_fields JSONB + slug + badges + negotiation fields), images (with category)/videos/drafts, categories (80: 10 original + automotive parent + 15 automotive sub-cats + real-estate parent + 8 sub-cats), geo (countries/cities/areas), social, AI layer, waitlist, **rate_limits, ai_message_log**. RLS on every table. |
| Server actions / queries | 27 files in `src/lib/` | Listings, auth, profile, favorites, search (hybrid keyword + pgvector), embeddings, storage. |
| i18n | AR (default) + EN | 16 namespaces under `messages/{ar,en}.json`. |
| Design system | CSS vars + Tailwind + fonts | Bricolage (LTR display), Geist (LTR body), Cairo (RTL). Warm stone palette. `.dark` class flip. See `DESIGN.md`. |

## 2. In flight

### Phase 6a — AI Negotiator Doctrine ✅ LOCKED (2026-04-21)
See `planning/PHASE-6A-AI-NEGOTIATOR.md` (503 lines, 15 pillars, evidence-backed).
- Both research agents returned (Kuwait culture + global AI-negotiation SOTA).
- P12 revision: register-mirroring instead of Khaleeji-forcing (Kuwait ~70% expat reality).
- 5-layer safety: prompt guardrails + filter pass + floor-leak regex + rate limits + human close gate.

### Phase 6b — AI Negotiator Engine ✅ SHIPPED (2026-04-21)
**Schema** (migration `0030_ai_negotiator.sql`):
- `listings.negotiation_enabled` · `ai_floor_minor_units` (seller-secret) · `ai_settings` jsonb
- `messages.ai_generated` · `intent_class` · `needs_human_followup`
- `conversations.ai_negotiation_stage` (state machine: `inactive` → `negotiating` → `awaiting_seller_accept` → `accepted`/`walked`)
- `ai_message_log` table (audit trail) · `is_offer_above_floor()` RPC (one-way check) · `enforce_ai_stage_transition()` trigger (only seller can accept)

**Engine** (`src/lib/ai-negotiator/`):
- `types.ts` — IntentClass, NegotiatorTone, NegotiationStage
- `policy.ts` — pure-TS state machine (CICERO pattern: planner picks move, LLM only verbalises)
- `provider.ts` — LLMProvider interface + StubProvider
- `providers/openai.ts` — real OpenAI adapter (gpt-4o-mini = cheapest)
- `providers/select.ts` — factory with graceful fallback to Stub
- `prompts.ts` — register-mirroring scaffolds (Khaleeji + MSA + dialects + EN ladder incl. broken English)
- `dialogue.ts` — orchestrator (prompt → provider → draft)
- `floor-leak.ts` — regex scanner (Latin + Arabic-Indic digits + k-suffix + multi-currency)
- `safety.ts` — full pipeline (Filter A/B/C + floor-leak)

**Tests** — **271 unit + 15 RLS = 286 total assertions**:
- 100 AI-negotiator specific (policy 31 · dialogue 25 · floor-leak 31 · safety 15 · openai 10)
- Regression guards on the P12 revision (3 tests) and policy clamp (2 tests)

**Live smoke test** (`scripts/smoke-ai-negotiator.ts`) — 3 real OpenAI calls:
- Turn 1 (greeting) · Turn 2 (mid-concession) · Turn 3 (accept) — all PASS
- Total cost: **$0.000357** for a 3-turn Arabic negotiation
- Extrapolated: **$0.36/month for 1000 negotiations**
- First run caught a tuning bug (mid-concession counter landing inside floor±5% band) — policy module now clamps counter to `floor × 1.06` so defence-in-depth stays clean

### Still pending for Phase 6 to be production-live
- Intent classifier (tiny regex or LLM — takes buyer text → IntentClass)
- Latency jitter scheduler (P14 — background worker flushing due drafts)
- Server action wiring (AI reply fires on buyer message when `negotiation_enabled`)
- Seller opt-in UI (deferred until after global redesign)
- Legal review (Kuwait Law 39/2014 + CITRA) before public launch

## 3. Queued (short list)

| Priority | Item | Depends on |
|----------|------|-----------|
| 🔴 High | Phase 6 completion: intent classifier + latency jitter + server-action wire | Completes AI Negotiator so engine fires on real buyer messages |
| 🔴 High | Seller dashboard shell | Private seller insights + AI opt-in UI (after redesign) |
| 🟠 Mid | Compare bar + `/rides/compare` | Stand-alone, can start any time |
| 🟠 Mid | Browse: `/[locale]/categories` (all 10) | Planning doc's original "next step" |
| 🟠 Mid | Generic `/[locale]/listings/[id]` | Applies rides detail patterns to non-vehicle categories |
| 🟠 Mid | Properties Phase 4e: maps + chalet booking calendar | Currently deferred |
| 🟡 Low | Legal review: Kuwait Law 39/2014 + CITRA | Before AI Negotiator public launch |
| ⚪ Deferred | AI photo-to-listing | Feature flag off in `.env.local` |
| ⚪ Deferred | Block B polish sweep | Waits for global redesign |

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
| `docs/PROGRESS-REPORT-2026-04-21.md` | Full engineering progress report for co-worker handoff — covers both verticals, Block A/C, Phases 6a+6b, live smoke test, architecture decisions, next-steps priorities |
| `README.md` | Project overview + quick start |
| `planning/PHASE-3-SUPABASE.md` | v1.1 — JSONB wiring plan (superseded by 3B/3C audits but retains context). |
| `planning/PHASE-3B-AUDIT.md` | Full-field audit + wiring plan for `/rides/[id]` detail page. |
| `planning/PHASE-3C-AUDIT.md` | Hub component triage + wiring plan for `/rides`. |
| `planning/PHASE-3D-AUDIT.md` | Landing component triage + wiring plan for `/[locale]/`. |
| `planning/PHASE-4A-AUDIT.md` | Properties vertical — 14-pillar doctrine, evidence-based schema, 22-amenity master, Filter C spec, 10-property seed plan. |
| `planning/PHASE-6A-AI-NEGOTIATOR.md` | AI Negotiator doctrine — 15 pillars, 5-layer safety, schema (migration 0030 applied), cost model (gpt-4o-mini $0.36/mo @ 1000 deals), live smoke-test findings, evidence from 2 research tracks. |
| `scripts/smoke-ai-negotiator.ts` | End-to-end smoke test script — runs 3 real OpenAI turns, validates policy + dialogue + safety pipeline. Total cost ~$0.000357. |
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
