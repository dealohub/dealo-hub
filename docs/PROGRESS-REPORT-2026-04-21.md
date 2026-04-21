# Dealo Hub — Engineering Progress Report

**Date:** 2026-04-21
**Author:** Fawzi Al-Ibrahim
**Scope:** Block A completion · Phase 5f/5g polish · Block C test foundation · Phase 6a doctrine · Phase 6b AI-negotiator engine · **Phase 4f Property sell wizard · 4d-polish neighbourhood resolution** (evening addendum §5a)
**Audience:** engineering collaborator / technical co-worker

---

## Executive summary

Dealo Hub — the trust-first C2C marketplace for Kuwait/GCC — reached a major milestone today. Two full verticals are live end-to-end on **both sides (supply + demand)**: **Rides (automotive, fully DB-wired)** and **Properties (real-estate, 4-phase delivery 4a+4b+4c+4f + 4d-polish including the 14-pillar Phase 4a doctrine — the flagship differentiator against Dubizzle Kuwait)**. On top of them, the 7-phase Block A feature build (auth + sell wizard + chat realtime + search + accounts + navbar + observability) is complete. The cosmetic polish block (B) is deliberately skipped because the global redesign is coming. The test foundation (Block C) locked down **278 unit tests + 15 RLS security assertions = 293 total assertions** covering every safety-critical layer. An entire **AI Negotiator subsystem** was researched, specified, shipped to the engine layer, and verified end-to-end with live OpenAI calls at a projected cost of **$0.36 per 1,000 negotiations**. Evening addendum (§5a): the Property sell wizard gap was closed — sellers can now publish a real property end-to-end with all 34 PropertyFields captured via the wizard, and neighbourhood ("Bayan · Hawalli") now renders across every Property UI surface.

**No code has been pushed to remote yet, per the standing rule to hold push until redesign + polish + tests are all green together.**

---

## 1. Current product state (full stack of what's live)

Before listing what shipped this cycle, a short snapshot of everything live in the codebase — so the reader has the full product picture, not just the recent work.

### 1.0 Verticals shipped (pre-existing + this cycle)

| Vertical | Routes live | Doctrine / plan | Status |
|---|---|---|---|
| **Rides (automotive)** | `/[locale]/rides` hub · `/[locale]/rides/[id]` detail | PHASE-3B/3C/3D audits | ✅ Fully DB-wired. 15 automotive sub-categories. 6 seeded cars with full detail data. |
| **Properties (real-estate)** | `/[locale]/properties` hub · `/[locale]/properties/[slug]` detail | PHASE-4A-AUDIT (14 pillars, 746 lines) | ✅ Shipped in three phases (4a schema + 4b detail + 4c hub). **The trust differentiator of the platform.** |

**Properties is the flagship vertical** and deserves its own summary since a co-worker reading this should understand why it exists before the engine layer makes sense:

- **Evidence-based doctrine** — Phase 4a audit was built after live DOM probes of Dubizzle KW and Q84Sale and a Kuwait-law track covering Law 74/1979 (non-Kuwaiti ownership restrictions). 14 pillars map observed competitor weaknesses to our concrete answer.
- **Schema** — `listings.category_fields` JSONB with Zod-validated 34-field schema covering 14 property types (apartment / villa / townhouse / chalet / studio / duplex / penthouse / floor / annex / office / shop / warehouse / room / land-plot) + 22 amenities (locked slug list) + structured diwaniya primitives + chalet availability + off-plan payment plans + 6 verification tiers.
- **Filter C** — discriminatory-wording rejection at submit. Rejects live Dubizzle-observed phrases like "Non-Arabs Only" / "Bachelors only" / "مسلمين فقط" in both English and Arabic. New differentiator.
- **Detail page (4b)** — 8 components: centred hero + ownership-eligibility banner (Law 74 derived from sub_cat + zoning_type) + gallery + key-info + amenities + chalet-booking + payment-plan + description + structured-diwaniya + similar-properties. Sticky purchase-panel with chat-first CTA (never reveals phone). Tested live on `bayan-villa-18` and `bnaider-chalet-a1-14`.
- **Hub page (4c)** — 7 sections: hero + browse-by-type tiles (14 types) + featured-premium row + **trust strip calling out 5 Dubizzle gaps by name** + main grid (5 filter chips, 5 sort options) + articles strip + footer. Chalet filter chip surfaces the Dubizzle volume gap visibly (9 chalets on DKW vs 2 on Dealo, both inspected).
- **Seed** — 10 curated property listings, each demonstrating one of the 14 pillars. Visible live.
- **i18n** — 230 keys across AR + EN (163 detail + 67 hub).
- **Tests written this cycle** — 52 unit tests in `src/lib/properties/validators.test.ts` lock down the Zod schema + Law 74 ownership derivation + conditional invariants (rent ⇒ rent_period, off-plan ⇒ payment_plan, chalet rent ⇒ availability, etc.).

**Still pending on Properties:** navbar "عقارات" button wired (done in 5f this cycle), maps integration (4e, deferred), chalet booking calendar (4e, deferred).

### 1.1 Block A — Feature Build (100% complete in this cycle)

Seven phases, all shipped and working on local Supabase + Next.js 14.2:

| Phase | Area | State |
|---|---|---|
| 5a | Auth UI (signin/signup/reset) | ✅ |
| 5b | Sell wizard (7 steps, draft-autosave, image upload) | ✅ |
| 5c | Chat realtime (RLS + Postgres trigger + Supabase Realtime subscription) | ✅ |
| 5d | Search page (hybrid semantic + keyword via pgvector) | ✅ |
| 5e | Account surfaces (my-listings, saved, profile/me, profile/edit) | ✅ |
| 5f | Navbar wire + LiveFeed fixes | ✅ |
| 5g | Observability + rate limits | ✅ |

**Notable 5f/5g deliverables:**
- Auth-aware navbar: avatar button + 5-item dropdown menu (messages/my-listings/saved/profile/sign-out) + unread-messages badge.
- Fixed a high-impact bug where all property listings were being labelled "TECH" and routed to `/rides/<slug>` in the LiveFeed (root cause: PostgREST self-FK embed on `categories` unreliable; replaced with explicit two-step query).
- Error boundaries at `app/global-error.tsx` and `app/[locale]/error.tsx` — no more raw "Application error" white screen.
- Localized 404 page with catch-all route at `app/[locale]/[...rest]/page.tsx`.
- Route-specific loading skeletons for `/messages`, `/messages/[id]`, `/properties/[slug]`, `/rides/[id]`.
- A11y: skip-to-content link, `:focus-visible` ring system, `prefers-reduced-motion` respect.
- Rate-limit infrastructure: new `rate_limits` table + `check_rate_limit()` RPC (atomic SECURITY DEFINER). Wired into: `chat.send_message` (30/min), `chat.start_conversation` (10/10min), `listings.publish` (20/hour).
- Observability stubs: `src/lib/observability/capture.ts` + `src/lib/observability/track.ts`. Typed event catalog with 11 events. PostHog + Sentry drop-in ready (awaiting DSNs).

### 1.2 Block B — Polish sweep (deliberately skipped)

Cosmetic polish (design tokens, mobile breakpoint sweep, micro-animations) was postponed because the global redesign is coming. We invested that time in test coverage and the AI-negotiator engine — both survive a redesign.

### 1.3 Block C — Test foundation

Set up **Vitest** from scratch. Wrote 271 unit tests across 10 suites:

| Suite | Tests | Covers |
|---|---|---|
| `listings/validators.test.ts` | 67 | Filter A (phone-in-text), B (counterfeit), C (discriminatory wording) |
| `properties/validators.test.ts` | 52 | PropertyFields Zod + Law 74/1979 ownership derivation |
| `format.test.ts` | 24 | Currency/count/percent with Gulf Western-digit convention |
| `chat/types.test.ts` | 11 | Vertical routing helpers (the helper at the heart of the "nothing works" post-mortem) |
| `landing/types.test.ts` | 5 | Feed-category path resolution |
| `ai-negotiator/policy.test.ts` | 31 | Policy state machine |
| `ai-negotiator/dialogue.test.ts` | 25 | Prompt builder + dialogue orchestrator |
| `ai-negotiator/floor-leak.test.ts` | 31 | Floor-leak regex scanner |
| `ai-negotiator/safety.test.ts` | 15 | Safety pipeline orchestrator |
| `ai-negotiator/providers/openai.test.ts` | 10 | OpenAI adapter (mocked fetch) |

**Plus 15 RLS security assertions** (`supabase/tests/rls.sql`) verifying:
- Buyer/seller can each read their own conversations; outsider cannot
- Anonymous users cannot read `conversations`
- Outsider cannot INSERT a message into a conversation they don't participate in
- Buyer cannot spoof `sender_id` to impersonate the seller
- Profile hijack (editing someone else's profile) is blocked
- Foreign listing UPDATE is blocked
- `rate_limits` table is completely opaque to `authenticated` role (only RPC writes)

**Total: 286 assertions. Full suite runs in ~400ms.**

Tests caught **two real production bugs during authoring**:
1. Filter A had a US-style `XXX-XXXX` regex that false-positived on reference codes — removed.
2. Filter C was missing the `s?` on plural nationality words (`filipinos`, `egyptians`, `pakistanis`) — fixed.

### 1.4 Phase 6a — AI Negotiator doctrine (research-heavy)

Before any code: wrote `planning/PHASE-6A-AI-NEGOTIATOR.md` (503 lines, 15 pillars, evidence-backed).

- Two parallel research agents executed: Kuwait negotiation culture + global AI-negotiation state-of-the-art (Lewis 2017, Meta CICERO, Pactum AI, eBay, EU AI Act Art. 50).
- **P12 revision (v1.1):** a co-worker review flagged a blind spot in my initial draft — forcing Khaleeji dialect doesn't fit a country that's ~70% expat. Doctrine rewritten to "register-mirroring": AI replies in whatever register the buyer used (Khaleeji, MSA, Egyptian, broken English, etc.), never imposes one. 3 regression-guard tests prevent reverting.
- 5-layer defence model: prompt guardrails → content filter pass → floor-leak regex → rate limits → human close gate.

### 1.5 Phase 6b — AI Negotiator engine (shipped today)

**Database migration** (`0030_ai_negotiator.sql`, applied live):
- `listings`: `negotiation_enabled` · `ai_floor_minor_units` (seller-secret) · `ai_settings` jsonb
- `messages`: `ai_generated` · `intent_class` · `needs_human_followup`
- `conversations`: `ai_negotiation_stage` enum (5-state machine)
- `ai_message_log` table (auditable record of every AI generation, seller-scoped RLS)
- `is_offer_above_floor(listing_id, offer) → boolean` RPC (one-way check; NEVER returns the floor value)
- `enforce_ai_stage_transition()` trigger: only the `seller_id` can transition a conversation to `accepted`. Verified live — a non-seller JWT is rejected with `insufficient_privilege`.

**Engine code** (`src/lib/ai-negotiator/`):

| File | Purpose | Notes |
|---|---|---|
| `types.ts` | Shared types (IntentClass, NegotiatorTone, NegotiationStage) | |
| `policy.ts` | Pure-TS state machine (CICERO pattern) | No LLM. Picks the next move deterministically. Clamps counters to `floor × 1.06` so they never land inside the safety band. |
| `provider.ts` | LLMProvider interface + StubProvider | Stub returns canned replies keyed off `[[move:xxx]]` tags for tests and zero-cost dev. |
| `providers/openai.ts` | Real OpenAI adapter using `gpt-4o-mini` | Cheapest capable model: $0.15/M input, $0.60/M output. |
| `providers/select.ts` | Factory with graceful stub fallback | Runs when env keys missing. |
| `prompts.ts` | System-prompt builder | Register-mirroring instructions per language. Machine tags `[[move:xxx]] [[lang:yy]]` at end for eval harnesses. |
| `dialogue.ts` | Orchestrator | Composes policy move + prompt + provider call into a draft + metadata. |
| `floor-leak.ts` | Regex scanner | Handles Latin + Arabic-Indic digits, thousand separators, k-suffix, multi-currency. |
| `safety.ts` | Full safety pipeline | Runs Filter A/B/C + floor-leak. Returns all violations for audit, not just first. |

---

## 2. Live smoke test — proof the engine works

Script: `scripts/smoke-ai-negotiator.ts` (runs against real OpenAI gpt-4o-mini).

Scenario: Bayan villa, list KWD 650,000, secret floor KWD 600,000, 3-turn Arabic negotiation.

| Turn | Buyer message | Policy move | AI reply | Safety |
|---|---|---|---|---|
| 1 | السلام عليكم، الفيلا لا تزال متاحة؟ | `greet_and_ask_offer` | "وعليكم السلام، نعم، الفيلا في بيان لا زالت متاحة وماشاء الله خيار ممتاز. شنو عرضك؟" | ✅ PASS |
| 2 | ممكن 550 ألف؟ | `mid_concession` → 636k (clamped) | "السلام عليكم، الله يعطيك العافية. …أقدّم لك بسعر 636,000 د.ك. ما رأيك؟" | ✅ PASS |
| 3 | طيب 610 آخر كلام | `accept_offer` | "السلام عليكم، ماشاء الله على الجدية في العرض. أنا راح أؤكّد مع صاحب الإعلان… ورح أرجع لك خلال ساعة إن شاء الله." | ✅ PASS |

**Economics:**
- Total tokens across 3 turns: 1888 input / 123 output
- Total cost: **$0.000357**
- Projection at 1,000 negotiations/month: **$0.36/month**
- Projection at 10,000 negotiations/year: **$42.84/year**

**Finding and fix during smoke test:** First run revealed a policy/safety tuning mismatch — `mid_concession` raw math produced 598k counter, inside the floor ±5% band, so the safety pipeline correctly blocked it. Policy now clamps counters to `floor × 1.06`. Defence-in-depth worked exactly as designed; but in production this would cause regeneration loops, so we fixed the upstream module. Regression-guard tests added.

---

## 3. Known issues / pending items

### 3.1 Phase 6 remaining work
- **Intent classifier** (buyer message → `IntentClass`) — not built. Can ship as regex-first, LLM fallback.
- **Latency jitter scheduler** (P14 human-like reply delay) — not built. Background worker needed.
- **Server action wiring** — the engine is standalone; a wiring function in `src/lib/chat/actions.ts` is needed so a buyer message triggers an AI reply when `listings.negotiation_enabled = true`.
- **Seller opt-in UI** — deliberately deferred until after the global redesign.

### 3.2 Legal / cultural validation
- **Kuwait Law 39/2014 (Consumer Protection) + Law 20/2014 (E-Commerce) + CITRA rules** — need a Kuwait-licensed lawyer to review before Phase 6c public launch. The applicability of these laws to AI-drafted chat is untested in court.
- **Native-speaker panel** — 5-10 Kuwaiti + 5-10 expat Arab + 5-10 South-Asian-expat users should review ~40 AI replies per tone before autonomous mode ships.

### 3.3 Infra
- **Redesign is the unblocker** for anything UI-facing. Until the new design lands, no seller opt-in form, no AI-message badge in the chat thread, no seller dashboard for AI analytics.
- **No git push has happened.** 46+ local commits will push together after redesign + a final polish pass + this test foundation all line up.

### 3.4 Doctrine v1 open questions
- **Hijri calendar library choice** — `moment-hijri` works but the parent `moment` library is deprecated. Evaluate `@hebcal/core` or `hijri-date`.
- **Claude Haiku 3.5** is wired in env as a fallback for Arabic-dialect edge cases but not in the provider code yet (needs `@anthropic-ai/sdk` npm install — intentionally deferred; gpt-4o-mini is 5× cheaper and handles Gulf Arabic well enough at MVP).

---

## 4. Numbers at a glance

| Metric | Value |
|---|---|
| Verticals shipped total | **2** (Rides fully DB-wired, Properties fully DB-wired) |
| Phases shipped this cycle | Block A (7 phases) + Phase 6a + Phase 6b engine |
| Phases shipped pre-cycle (context) | Properties 4a + 4b + 4c · Rides 3b + 3c + 3d · Landing 3d |
| Migrations in database | 30 total (0001-0030) |
| Migrations applied this cycle | 0029 (rate limits), 0030 (AI negotiator) |
| New database tables this cycle | `rate_limits`, `ai_message_log` |
| New server RPCs this cycle | `check_rate_limit`, `is_offer_above_floor` |
| Unit tests written | 271 (0 before) |
| RLS assertions | 15 (0 before) |
| **Total assertions passing** | **286** |
| Test suite runtime | ~400ms |
| AI-negotiator modules (TS) | 9 files, ~1100 LOC of engine + ~900 LOC of tests |
| Planning docs | `PHASE-4A-AUDIT.md` (746 lines, Properties doctrine) · `PHASE-6A-AI-NEGOTIATOR.md` (503 lines, AI doctrine) · `STATUS.md` refreshed |
| i18n key coverage | Full AR + EN across 16 namespaces incl. 230 keys for Properties |
| Live AI calls validated | 3 turns, 3/3 PASS |
| Cost per negotiation | $0.000357 (projection: $0.36/month at 1K deals) |
| Regression bugs caught by tests | 2 (Filter A false-positive + Filter C false-negative) |
| Regression bugs caught by live smoke | 1 (policy counter landing in safety band — FIXED) |
| Lines of code pushed to remote | **0** (standing rule: hold push until redesign + polish + tests all green together) |

---

## 5. Architecture decisions worth noting

1. **Doctrine-first, code-second.** PHASE-6A-AI-NEGOTIATOR.md was written, reviewed, and revised (v1 → v1.1 with P12 register-mirroring fix) **before** any engine code. Same pattern that worked for PHASE-4A (properties).
2. **CICERO split architecture.** The policy module is pure TypeScript with no LLM. It picks the negotiation move (accept / counter / reject / handoff) deterministically. The dialogue module only verbalises the chosen move. This means the LLM never invents prices, never decides to accept, never hallucinates commitments — per Meta's 2022 Diplomacy research and Pactum AI's B2B success pattern.
3. **Secret floor never leaves the DB.** The AI engine never reads `ai_floor_minor_units`. It calls `is_offer_above_floor(listing_id, offer) → boolean` which returns yes/no only. Plus a regex scanner blocks any draft containing a number close to the floor (defence-in-depth).
4. **5-layer safety.** Prompt guardrails → Filter A/B/C → floor-leak regex → rate limits → human close gate. Each layer has unit tests; safety pipeline has integration tests.
5. **Provider adapter pattern.** `LLMProvider` interface + StubProvider + OpenAIProvider. Adding Claude or Jais is one new class implementing the same interface.
6. **Test-safe live smoke script.** `scripts/smoke-ai-negotiator.ts` runs a 3-turn real negotiation for ~$0.0004. This is the "prove it actually works" ritual before wiring into production code paths.

---

## 5a. Evening addendum — closing the Properties supply gap

After the morning report was drafted, a review of the Properties vertical surfaced three gaps beyond the two already-deferred items (Maps + Chalet booking calendar):

1. **Property sell wizard missing** — biggest. The generic Step 3 only captured title/description/condition/brand/model. `PropertyFields` (34 fields across 7 domains) had **no UI path**. All 10 live properties were seeds from migration 0027 — a real seller could not publish a property.
2. **`areaName` hard-coded null** — smaller. Hub card, detail header, live feed, and similar-strip all showed only the governorate ("Hawalli") instead of the neighbourhood ("Bayan · Hawalli") that drives actual property search.
3. **Admin verification_tier tooling** — internal; deferred.

Both shippable gaps were closed in the same session:

### Phase 4f — Property sell wizard ✅ shipped (commit `bff367a`)

- **Migration 0031** — adds `listing_drafts.category_fields JSONB` mirror column so the wizard can stage the vertical-specific blob progressively across saves.
- **`PropertyFieldsDraftSchema`** — lenient `.partial().passthrough()` variant of `PropertyFieldsRaw` for draft-time validation. Publish-time stays strict (`validatePropertyFieldsRaw(raw, subCat)` with sub-cat context runs before INSERT).
- **`PropertyDetailsForm`** — ~600 LOC client component. 14-property-type picker, dimensions, furnished/tenure/year, 22-amenity multi-select (grouped into 4 domains by concern), structured diwaniya (P14), and sub-cat-driven conditional branches:
  - yearly rent → `rent_period` + `cheques_count`
  - sale → `completion_status` + `zoning_type` (Law 74 gate)
  - off-plan → `payment_plan` + `handover_expected_quarter` (P13)
  - chalet rent → `availability.min_stay_nights` (P4)
  - rooms sub-cat → property_type locked to `room`
  - land sub-cat → property_type locked to `land-plot`
- **`/sell/details` page branches server-side** on `category.parent.slug === 'real-estate'` (two-step parent lookup — PostgREST self-FK embed unreliable, same gotcha as landing/chat/listings queries).
- **`publishListing`** now resolves parent + sub-cat up front, runs `validatePropertyFieldsRaw`, and surfaces flattened dot-path field errors (e.g. `availability.min_stay_nights`) before INSERT.
- **i18n** — new `sell.step.property.*` namespace (27 keys × AR+EN). Reuses `properties.detail.*` for locked content (14 types, 22 amenities, diwaniya, furnished, tenure — already locale-complete).
- **22 new contract tests** (`src/lib/listings/property-wizard.test.ts`) lock the `listings/validators.ts` ↔ `properties/validators.ts` join. PublishSchema must accept `category_fields`, the draft schema must stay lenient, and the strict publish-time validator must reject every conditional-required gap.

### Phase 4d-polish — neighbourhood resolution ✅ shipped (commit `6b6ffb2`)

- **`DETAIL_SELECT` + `CARD_SELECT`** embed `area:areas!listings_area_id_fkey` (clean FK — no self-FK gotcha here).
- **`pickAreaName()`** helper mirrors `pickCityName()`, returns locale-aware string or null.
- `mapDetail`, `mapCard`, and `PropertyActivityItem` all populate `areaName`.
- **4 UI surfaces** now render "area · governorate" with proper null handling: `property-detail-header`, `listing-card-properties`, `property-detail-similar`, `properties-live-feed`.
- **Migration 0032** — backfills `area_id` on 6 of 10 seed listings (Salmiya, Bayan, Mishref, Hawalli, Sharq, Mubarak Al-Kabeer). Remaining 4 (Bneidar chalet, Sabah Al-Ahmad Sea City, off-plan no-hint, Shuwaikh industrial) have no canonical area row and correctly stay null. Backfill keys on title string not id — the migration is idempotent and environment-safe.

### Numbers update after this evening

| Metric | Morning | Evening |
|---|---|---|
| Total test assertions | 286 | **293** (278 unit + 15 RLS) |
| Test suites | 10 | **11** (new property-wizard.test.ts) |
| Local commits pending push | 46+ | **48** |
| Migrations | 30 | **32** (0031 drafts category_fields + 0032 seed area backfill) |
| Verticals fully live both sides (supply + demand) | 1 (Rides) | **2** (Rides + Properties) |

---

## 6. Recommended next steps (in priority order)

1. **Commit reorganisation.** The 46+ local commits should be tidied into a clean series before push. A clear mapping: Block A phases (one commit per phase) · Block C (test suites) · Phase 6a (doctrine) · Phase 6b (engine + migration) · live smoke.
2. **Intent classifier + latency scheduler + server-action wire.** Completes Phase 6b so the engine is actually invoked on real buyer messages. 3-5 days of focused work.
3. **Legal review.** Before any seller can opt into the AI negotiator in production, Kuwait-licensed counsel should sign off.
4. **Redesign handoff.** Give the redesigner this report + `DESIGN.md` + the `planning/` folder. The engine is UI-agnostic; the redesigner should design the seller opt-in flow, the AI-message badge in chat threads, and the seller AI dashboard (Phase 6d analytics).
5. **Block B polish pass.** Once the redesign is in code, run the polish sweep — mobile breakpoints, a11y audit, micro-animations, design-token consistency.
6. **First push.** Only after 1-5 are green.

---

## 7. Files to skim (if time is short)

**Product-state docs** (read first):
- `docs/STATUS.md` — one-page snapshot of shipped + in-flight (both verticals, all phases)
- `planning/PHASE-4A-AUDIT.md` — **Properties vertical doctrine** (14 pillars, 746 lines, evidence-based — this is the flagship)
- `planning/PHASE-6A-AI-NEGOTIATOR.md` — AI negotiator doctrine (15 pillars + §14 smoke-test findings)

**Code to skim:**
- `supabase/migrations/0030_ai_negotiator.sql` — AI schema extensions
- `src/lib/properties/validators.ts` — Properties Zod schema + Law 74 logic
- `src/lib/ai-negotiator/policy.ts` — the strategic brain (no LLM)
- `src/lib/ai-negotiator/safety.ts` — the 5-layer safety orchestrator
- `scripts/smoke-ai-negotiator.ts` — the live proof

**Live routes to click through** (while `npm run dev` is running):
- `/ar` — landing page (LiveFeed + hero scatters, both DB-wired)
- `/ar/properties` — properties hub (trust strip, chalet filter)
- `/ar/properties/bayan-villa-18` — flagship property detail (all 14 pillars on one page)
- `/ar/rides` — rides hub
- `/ar/messages` — inbox (realtime)
