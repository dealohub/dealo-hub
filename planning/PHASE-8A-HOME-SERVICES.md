# Phase 8a — Dealo Home Services: Doctrine, Schema, Verification

> **Author:** Claude Code · **Date:** 2026-04-22
> **Scope:** `services` parent category · `home-cleaning` + `handyman-tasks` sub-cats only (v1). Explicitly excludes licensed trades (plumbing/electrical/HVAC), beauty (cultural + mahram complexity), delivery-courier (different dispatch model), events/photography (different primitives). These arrive in later phases.
> **Depends on:** migrations 0015–0036 · `src/lib/properties/` module (pattern) · `src/lib/electronics/` module (pattern, Phase 7 v2) · `DECISIONS.md` #2 (chat-only)
> **Research tracks executed:** GCC live DOM (`research-8a-home-services/01-GCC-LIVE-DOM.md`), Global SOTA (`02-GLOBAL-SOTA.md`), Kuwait regulatory + cultural (`03-KUWAIT-CONTEXT.md`), cross-cut synthesis (`00-SYNTHESIS.md`).

---

## Executive Summary

The Kuwait home-services market is transacted primarily on WhatsApp + word-of-mouth, secondarily on 4Sale (171 cleaning ads — all commercial brands, no individual profiles). Dubizzle KW's services section is effectively abandoned (6 ads under "Domestic Services", most mislabeled). On neither GCC platform is a single individual provider surfaced with a profile, a history, a review, a structured quote, or a serving-area filter. 4Sale has shipped a prominent "Get Quotes" button with the copy "+20 Providers are waiting for your request" — but it returned 500 at probe time. **The Thumbtack moat is visibly attempted and unclaimed in Kuwait.** [Evidence: `01-GCC-LIVE-DOM.md §1.2 + §5`]

Globally, three SOTA platforms have solved different pieces. Thumbtack's 5-quote cap + 4-hour-reply SLA Top-Pro gate is the closest pattern-match to what Kuwait needs, but its pay-per-lead economics collapse under fake-lead complaints (1,000+ BBB cases in 2025). TaskRabbit's $10,000 "Happiness Pledge — only for tasks booked through the platform" is the cleanest anti-disintermediation lever we've seen and ports to a chat-only context unchanged. Bark.com is the cautionary tale: broadcast-phone model, minimal onboarding, 44% response rate, and the most severe user backlash of the three. [Evidence: `02-GLOBAL-SOTA.md §1, §3, §4`]

Kuwait's regulatory landscape draws hard lines the doctrine must respect. Cleaning *companies* need MOCI commercial registration + municipality pre-approval. *Individuals* occupy a grey zone that Kuwait Times has publicly flagged as outside the MoI licensed-office regime. Law 68/2015 + kafala make it an **immigration offense** — up to 6 months prison + KD 600 fine — for a sponsored domestic worker to moonlight without written sponsor consent. And there is no Kuwait-specific platform-intermediary safe-harbor, so Dealo Hub inherits merchant-side duties by default. [Evidence: `03-KUWAIT-CONTEXT.md §Regulatory map`] Pricing today anchors at WhatsApp 1.5–2.5 KWD/hr, cleaning companies 2.4–6 KWD/hr, studio deep-clean 25–35 KWD. Payment is KNET-at-door or cash; MyFatoorah fees 2% KNET / 3.5% card.

Dealo Home Services wins on **structured quote-compare + individual-provider profiles + honest regulatory framing** — the three things GCC platforms haven't shipped and Kuwaitis already pay WhatsApp 2–3 days to work around. Ten evidence-cited pillars drive the schema and chat-primitive additions below. Phase 8a ships with **one sub-category depth-first** (home-cleaning + handyman as a single `home-services` sub-cat split by `task_type`), matching the discipline the Electronics v2 rebuild proved works. Phase 8b widens to moving + events + photography; Phase 8c adds buyer-post-need. Licensed trades (8d) and beauty/wellness (8e) are deferred behind their own compliance/cultural infrastructure.

---

## 0. Research methodology + evidence fidelity

Three research tracks ran before this doctrine was finalized. What we can claim, and what we flag.

| Track | Source | Fidelity | Key deliverables |
|---|---|---|---|
| **A. GCC live DOM** | `research-8a-home-services/01-GCC-LIVE-DOM.md` — Chrome DevTools MCP on Dubizzle KW + Q84Sale/4Sale (2026-04-22) | HIGH on the 2 probed sites; MEDIUM on pan-GCC inference | Structured-field gap matrix; quote-request-feature existence + broken state; individual-vs-company granularity; safety-copy audit |
| **B. Global SOTA** | `research-8a-home-services/02-GLOBAL-SOTA.md` — Thumbtack + TaskRabbit + Bark via WebSearch on help centers + BBB/Trustpilot/Sitejabber | HIGH on help-page mechanics; MEDIUM on user-complaint volumes (aggregated third-party) | 5-max quote cap, Top-Pro measurable gates, Happiness-Pledge anti-disintermediation pattern, pay-per-lead failure mode |
| **C. Kuwait regulatory + cultural** | `research-8a-home-services/03-KUWAIT-CONTEXT.md` — MOCI portal + Kuwait Times archives + HRW 2015 + US TIP 2024 + ExpatWoman + Gulf News + Pilipino sa Kuwait | HIGH on Law 68/2015 + kafala mechanics + pricing ranges; MEDIUM on individual-licensing grey zone; LOW on villa deep-clean + handyman-task local pricing | Regulatory map, three sourcing channels, pricing brackets, trust norms + breakers, pain points both sides |

**HIGH-fidelity claims driving the doctrine:**
- GCC platforms surface zero individual-provider profiles in home-services [A §1.1, §1.2, §2].
- 4Sale's "Get Quotes" feature exists in DOM, with `+20 providers waiting` copy, and 500s on activation [A §1.2, §5].
- Thumbtack's 5-max quote cap + 4-hour SLA is the working version of the quote-compare primitive [B §1.1].
- TaskRabbit's Happiness Pledge "only covers platform-booked jobs" is the anti-disintermediation lever [B §1.2, §3.4].
- Bark's broadcast-phone model produces a 44% response rate and the worst review aggregate of the three [B §1.3].
- Kuwait cleaning companies need MOCI; individuals sit in a flagged grey zone [C §Regulatory].
- Law 68/2015 absconding penalty: up to 6 months + KD 600 [C §Regulatory, citing HRW 2015 + Kuwait Times].
- No Kuwait platform-intermediary safe harbor [C §Regulatory + §Uncertainty flag 2].
- Native pricing bands: WhatsApp 1.5–2.5 KWD/hr, companies 2.4–6 KWD/hr [C §Cultural map].
- Payment norms: KNET-at-door + cash + MyFatoorah; card-on-file rare [C §Payment norms].

**MEDIUM-fidelity claims:**
- OpenSooq KW + Haraj GCC patterns (inferred from Dubizzle + 4Sale dominance, not directly probed).
- Thumbtack Top-Pro "4% of pros" figure (third-party cited, not on Thumbtack's own help pages).
- Gender/privacy norms in Kuwaiti homes (cultural inference, no survey data).

**LOW-fidelity claims (flagged, not load-bearing):**
- Kuwait villa deep-clean pricing: anecdotal ranges only.
- Handyman-task pricing in Kuwait: extrapolated from hourly rates + GCC comparables.
- Legal standing of platform-booked sponsored worker under verbal (vs written) sponsor consent: untested in accessible Kuwaiti case law.

Every pillar below cites `SYN-§N` or `A/B/C-§section`. The three research files and the synthesis are the primary evidence appendix.

---

## 1. The 10 pillars

### P1 — Individual-first provider atomic unit
**Claim:** The profile on Dealo represents the human who shows up at the door. Company association (if any) is secondary metadata on the profile, not the primary record.

**Evidence:**
- 100% of 4Sale cleaning listings observed are commercial companies; zero individual profiles. [A §1.2, §2]
- Dubizzle KW "Domestic Services" has zero individuals either. [A §1.1]
- Thumbtack + TaskRabbit both model Pros / Taskers as first-class entities with their own profile, rating, and response-time SLA. [B §1.1, §1.2]
- The Kuwait on-the-ground market is dominated by individuals via WhatsApp. The platforms refuse to represent the atomic unit the market actually uses. [C §Cultural map channel 2]

**Schema impact:** `listings.seller_id` points to a `profiles` row that MUST have `services_provider_profile` fields populated (see §3.3 below). Companies may register as entities, but each advertised service lists a named provider.

---

### P2 — Verified identity as the minimum trust gate
**Claim:** No listing goes live without civil-ID verification + phone OTP + PACI address check. These are table stakes, not badges.

**Evidence:**
- Civil-ID is the de-facto trust primitive in Kuwait and PACI-address is verifiable via Sahel + paci.gov.kw. [C §Regulatory §PACI]
- Thumbtack requires Checkr background check for Top Pro; TaskRabbit requires ID + criminal check at $25 onboarding. [B §1.1, §1.2]
- Neither GCC platform verifies anything; identity on 4Sale is a JPEG banner phone number. [A §1.1, §1.2]

**Schema impact:** new `services_provider_verification_tier` enum — reuses the pattern from the `verification_tier` column already in `listings` (Phase 4a). Values: `unverified` → `identity_verified` (civil-ID + phone OTP done) → `address_verified` (PACI address match done) → `dealo_inspected` (manual review + optional home-office visit).

---

### P3 — Structured 3-quote flow is the primary discovery mechanic
**Claim:** A buyer answers 4–6 structured questions → Dealo routes the request to matched providers → up to 3 (cap 5) providers respond inside chat with a structured `quote_response` message → buyer compares side-by-side inside Dealo, picks one, books in chat.

**Evidence:**
- 4Sale has shipped this exact shape ("+20 providers are waiting for your request") but it 500s. Competitive moat visible and unclaimed. [A §5]
- Thumbtack's 5-max quote cap is the working version of this pattern globally; Bark's unbounded broadcast is the failure mode. [B §1.1, §1.3]
- Today's homeowner pain: haggling across multiple WhatsApp groups for 2–3 days. [C §Pain points homeowner]

**Schema impact:** new tables + chat primitives — see §2 (chat) + §3.4 (tables).

---

### P4 — Chat-only + in-chat structured primitives
**Claim:** Phone and email never exposed. DECISIONS.md #2 holds. Instead, extend `messages.kind` with 4 new values: `quote_request`, `quote_response`, `booking_proposal`, `completion_mark`. These render as structured cards inside the existing chat UI.

**Evidence:**
- Tri-validated: DECISIONS #2 (internal) + TaskRabbit on-platform everything (global best) + Bark phone-broadcast disaster (global worst). [SYN §3.1]
- Phone-as-primitive is the platform-disintermediation mechanism on GCC sites today. [A §1.1, §1.2]

**Schema impact:** extend `message_kind` enum. Each new `kind` may carry structured JSON in `messages.payload` — schema defined in §2.

**Invariant:** no new column exposes phone/email on listings or profiles. Where a legacy column exists, it is provider-side only and not rendered to buyers except inside post-completion chat.

---

### P5 — Post-completion review, keyed to a confirmed booking
**Claim:** Reviews exist only when BOTH sides have sent a `completion_mark` message for the same booking. Rating 1–5 + short free text + 3 structured tags (on-time / tidy / fair-price). Zero-review listings are allowed to exist but render a dedicated "new-provider" badge, not a 0-star score.

**Evidence:**
- GCC platforms have zero reviews [A §2, §4.3]; global platforms gate trust on reviews [B §1.1 Top Pro, §1.2 Elite Tasker].
- Kuwait trust norms: reputation is trapped in one WhatsApp group, can't port [C §Trust norms + §Pain points worker #5].

**Schema impact:** new `service_reviews` table, FK to `service_bookings`, composite UNIQUE(booking_id, reviewer_profile_id) so a booking yields exactly two reviews max (buyer→provider + provider→buyer).

---

### P6 — Governorate + area-level serving map per provider
**Claim:** Every provider profile declares explicit served governorates + area slugs (e.g. "I serve Hawalli + Jabriya + Salmiya, not Ahmadi or Jahra"). Search filter enforces the match; out-of-area buyers are told "no provider serves your area yet" rather than shown unreachable providers.

**Evidence:**
- 4Sale has governorate-level chips but no area-level serving. Dubizzle has neither. [A §1.1, §1.2, §2]
- Kuwait market is hyper-local; transport costs eat 3–5 KWD per gig for workers. [C §Pain points worker #2]

**Schema impact:** new `service_areas_served` join table: `(provider_profile_id, area_id)`. Default on new provider: all areas in their declared home governorate; edit-after is fine.

---

### P7 — Transparent pricing tiers + no "call for quote" listings
**Claim:** Provider must publish one of: (a) hourly rate + minimum booking hours, (b) fixed per-task price, or (c) both. A listing without any structured price CANNOT go live. Price ranges are permitted; "call for quote" is not.

**Evidence:**
- GCC listings hide price inside JPEG banners or omit it entirely. [A §1.2, §2]
- Thumbtack's buyer haggle happens because price is opaque; TaskRabbit's transparent-hourly is rated higher. [B §1.1, §1.2, §2 table]
- Kuwait norms: price haggling at the door is a top-5 worker pain. [C §Pain points worker #3]

**Schema impact:** 3 fields — `price_mode` (`hourly` / `fixed` / `hybrid`), `hourly_rate_minor_units`, `min_hours`, `fixed_price_minor_units`. Validators require at least one populated per `price_mode`.

---

### P8 — Dealo Guarantee (chat-only anti-disintermediation lever)
**Claim:** A capped KWD-denominated guarantee ("Dealo protects this booking up to KD X") triggers only when the full booking conversation from `quote_request` to `completion_mark` stayed inside Dealo chat. No payment rails; no escrow. Pure chat-transcript evidence.

**Evidence:**
- TaskRabbit Happiness Pledge is "only for tasks booked through the platform" — the structural anti-disintermediation lever. [B §1.2]
- Kuwait has no platform-liability safe harbor — we don't want to hold money, but we CAN stand behind an in-chat booking. [C §Regulatory §E-commerce + §Uncertainty flag 2]
- Without this lever, platform re-engagement collapses the moment chat moves off-platform — as it does on every GCC site today. [A §3.3, SYN §1.3]

**Schema impact:** no new columns in Phase 8a. The guarantee is policy + UI copy, not a data primitive. Triggered claim flow deferred to 8b (needs human-review workflow).

---

### P9 — Regulatory-honest copy at signup
**Claim:** Provider onboarding shows two explicit attestations:
> 1. "I confirm I am NOT a domestic worker sponsored under Law 68/2015, OR I have written consent from my sponsor to offer services on this platform."
> 2. "I confirm I am authorized to offer these services in Kuwait — either as a licensed commercial entity (MOCI), or as an individual offering non-regulated task work."

Dealo is NOT a compliance service. Dealo is explicit about where compliance ends. The attestations are logged with timestamp + IP + provider_id and surface to admin on any dispute.

**Evidence:**
- Kuwait has no platform safe-harbor; Dealo inherits merchant-side duties by default. [C §Regulatory + SYN §3 rule 4]
- Law 68/2015 moonlighting = immigration offense. Not a legal grey — it's sharply illegal. [C §Regulatory, HRW 2015, Kuwait Times]
- Kuwait Times publicly flags hourly-maid ads as outside the MoI licensed regime. [C §Regulatory §MOCI]

**Schema impact:** `profiles.services_attestation_68_consent_at`, `profiles.services_attestation_authorization_at` (timestamps). Missing either blocks listing creation for `services` parent category.

---

### P10 — Plain-language UX (ported from Electronics v2)
**Claim:** All provider onboarding + buyer quote-request UX uses the Phase 7 Electronics wizard language rules: 7 plain-language questions max per screen, Arabic-first, SVG illustrations over words, "I don't know" escape hatches on any optional field.

**Evidence:**
- Electronics v2 wizard proved this worked after v1 was rejected for being "too technical." [Phase 7 v2 retrospective]
- Kuwait buyer/worker profile includes many non-tech-native users. [C §Cultural map]

**Schema impact:** none. This is a design rule enforced in the wizard implementation, not a data field. Captured here so the implementer doesn't re-invent.

---

## 2. Chat primitive extensions

Phase 8a introduces four new `messages.kind` enum values. All render inside the existing chat UI with structured cards; legacy `free_text` + `offer` kinds are untouched.

| Kind | Direction | Payload JSON schema | UI |
|---|---|---|---|
| `quote_request` | Buyer → Provider(s) | `{ sub_cat, task_type, bedrooms?, area_m2?, preferred_date_window, preferred_time_window, notes? }` | Structured request card with edit/resend button (buyer side); accept-and-quote button (provider side) |
| `quote_response` | Provider → Buyer | `{ price_minor_units, price_mode: 'fixed'\|'hourly_x_hours', hours?, includes: string[], earliest_slot, expires_at }` | Structured quote card with "Accept & Propose Slot" button |
| `booking_proposal` | Either | `{ slot_start_at, slot_end_at, area_id, estimated_total_minor_units, guarantee_applies: true }` | Calendar-style card with Accept / Counter-propose buttons |
| `completion_mark` | Both (each independently) | `{ booking_id, completed_at }` | "Mark job complete" button; unlocks review form when BOTH sides have marked |

**Routing rule:** a `quote_request` is written once by the buyer and fans out to up to 5 matched providers (each as its own conversation). Each conversation lives independently; the buyer sees them side-by-side in a special "Your open quote" view. The first 3 providers to respond fill the visible slots; beyond 5 the request is closed.

**Safety rule:** `quote_request` payload is validated against `containsPhoneOrEmailPattern` (reuse Filter A from Phase 5b). Provider replies in `quote_response` are validated the same way. A provider who repeatedly tries to leak phone numbers gets their `services_provider_verification_tier` dropped.

---

## 3. Schema

### 3.1 Taxonomy additions (migration 0037)

```sql
INSERT INTO categories (slug, name_ar, name_en, icon, parent_id) VALUES
  ('services', 'خدمات', 'Services', 'Wrench', NULL);

-- sub-cats (Phase 8a — home-services only):
INSERT INTO categories (slug, name_ar, name_en, icon, parent_id) VALUES
  ('home-services', 'خدمات منزلية', 'Home Services',
   'Sparkles', (SELECT id FROM categories WHERE slug='services'));
```

Other sub-cats from TAXONOMY-V2 (`moving-storage`, `beauty-services`, `event-services`, `photography`, `repair-maintenance`, `delivery-courier`) are NOT inserted in 8a. They arrive with their own doctrines in later phases.

### 3.2 `listings.category_fields` JSONB schema (ServiceFields v1, 14 fields)

```ts
// src/lib/services/validators.ts
export const ServiceFieldsSchema = z.object({
  // P1 — atomic unit
  provider_profile_id: z.string().uuid(),

  // Task typing (8a = home-services only; these map 1:1 to a single card catalog)
  task_type: z.enum([
    'home_cleaning_one_off',   // one-off deep clean
    'home_cleaning_recurring', // weekly/bi-weekly
    'handyman_ikea_assembly',
    'handyman_tv_mount',
    'handyman_shelf_hang',
    'handyman_furniture_move', // in-home rearranging, not moving-storage
    'handyman_basic_painting',
    'handyman_other',
  ]),

  // P6 — serving map
  served_governorates: z.array(z.enum([...KW_GOVERNORATES])).min(1).max(6),
  // served_areas is relational (see §3.3 join table), not on this JSONB

  // P7 — pricing
  price_mode: z.enum(['hourly', 'fixed', 'hybrid']),
  hourly_rate_minor_units: z.number().int().positive().optional(),
  min_hours: z.number().int().min(1).max(12).optional(),
  fixed_price_minor_units: z.number().int().positive().optional(),

  // Capacity (light — real availability is in booking_proposals, not here)
  availability_summary: z.enum([
    'daytime_weekdays',
    'daytime_weekends',
    'evenings',
    'flexible',
  ]),

  // Provider-side facts buyers want to know
  years_experience: z.number().int().min(0).max(60).optional(),
  team_size: z.number().int().min(1).max(20).default(1),
  supplies_included: z.boolean().default(false),
  spoken_languages: z.array(z.enum(['ar', 'en', 'hi', 'ur', 'tl', 'ml'])).min(1),

  // Trust primitives (post-P2 + P5, populated by system, NOT by seller)
  completed_bookings_count: z.number().int().min(0).default(0),
  rating_avg: z.number().min(1).max(5).nullable().default(null),
  rating_count: z.number().int().min(0).default(0),

}).refine(
  // P7 invariant — at least one price primitive must be populated per mode
  (f) => {
    if (f.price_mode === 'hourly') return f.hourly_rate_minor_units && f.min_hours;
    if (f.price_mode === 'fixed') return f.fixed_price_minor_units;
    return f.hourly_rate_minor_units && f.min_hours && f.fixed_price_minor_units;
  },
  { message: 'price_mode requires matching price fields populated' }
);
```

**Counts:** 14 top-level fields; 3 of them (`hourly_rate_minor_units`, `min_hours`, `fixed_price_minor_units`) conditional by `price_mode`. The same design discipline as Phase 7 v2 electronics (14-field ceiling).

### 3.3 New tables (migration 0038)

```sql
-- P6: areas served
CREATE TABLE service_areas_served (
  provider_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id BIGINT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_profile_id, area_id)
);
CREATE INDEX service_areas_served_area_idx ON service_areas_served(area_id);

-- Booking lifecycle (created by booking_proposal accept, tracked to completion_mark)
CREATE TABLE service_bookings (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES profiles(id),
  provider_profile_id UUID NOT NULL REFERENCES profiles(id),
  slot_start_at TIMESTAMPTZ NOT NULL,
  slot_end_at TIMESTAMPTZ NOT NULL,
  estimated_total_minor_units BIGINT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'KWD',
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'completed', 'cancelled', 'disputed')),
  buyer_completion_at TIMESTAMPTZ,
  provider_completion_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX service_bookings_buyer_idx ON service_bookings(buyer_profile_id, status);
CREATE INDEX service_bookings_provider_idx ON service_bookings(provider_profile_id, status);

-- P5: reviews keyed to bookings
CREATE TABLE service_reviews (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_profile_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  tag_on_time BOOLEAN DEFAULT NULL,
  tag_tidy BOOLEAN DEFAULT NULL,
  tag_fair_price BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, reviewer_profile_id)
);
CREATE INDEX service_reviews_reviewed_idx ON service_reviews(reviewed_profile_id);
```

### 3.4 `profiles` extensions (migration 0039)

```sql
ALTER TABLE profiles
  ADD COLUMN services_provider_verification_tier TEXT
    DEFAULT 'unverified'
    CHECK (services_provider_verification_tier IN (
      'unverified', 'identity_verified', 'address_verified', 'dealo_inspected'
    )),
  ADD COLUMN services_attestation_68_consent_at TIMESTAMPTZ,
  ADD COLUMN services_attestation_authorization_at TIMESTAMPTZ;
```

RLS: new `service_bookings` + `service_reviews` tables get the same RLS shape as `conversations` + `messages` (only the parties of the booking can read/write).

---

## 4. Safety filters

| Filter | Trigger | Action |
|---|---|---|
| **A — Contact-info leak** | `quote_request` / `quote_response` / `booking_proposal` payload contains phone or email pattern | Reject message + flag provider. 3 flags in 90 days drops tier. |
| **B — Sponsored-worker attestation missing** | Provider tries to publish under `services` without both attestation timestamps set | Block publish; show attestation prompt |
| **C — No-price listing** | `price_mode=hourly` without `hourly_rate_minor_units + min_hours`, or `price_mode=fixed` without `fixed_price_minor_units` | Block publish |
| **D — Out-of-scope task type** | Attempt to list a task outside the 8-value `task_type` enum | Block publish (the enum gates Phase 8a scope) |

Filter A is the most load-bearing — it's the structural defense of P4. It re-uses the regex pattern already in `src/lib/listings/validators.ts` (Filter A, Phase 5b).

---

## 5. Seed data plan (migration 0040)

- **5 providers** — mix of Kuwaiti + expat, mix of identity-verified + dealo-inspected tier, spread across 4 governorates (Hawalli, Capital, Farwaniya, Mubarak Al-Kabeer).
- **~12 listings** across 8 `task_type` values so each has at least 1 example.
- **~8 historical bookings** with `status = 'completed'` and review rows populated → seeds the `rating_avg` + `completed_bookings_count` on the provider profile at creation time. Without these, every provider renders "new" at launch — demo-weak.
- **2 open `quote_request` conversations** from seeded buyers, to render the inbox surface for demo purposes.

All seeded providers include attestation timestamps (§3.4) set at seed time, so the Filter B pathway is demonstrably satisfied.

---

## 6. Roadmap — Phases 8b through 8e

Phase 8a is the "quote-compare family" starter. Later phases:

| Phase | Scope | Key additions over 8a |
|---|---|---|
| **8b** | Add `moving-storage`, `event-services`, `photography` sub-cats to the same Quote-Compare framework | distance/origin+destination fields (moving), hard date-booking (events), portfolio-first display (photography) |
| **8c** | Buyer-post-need flow (Thumbtack-style "I need X, quote me") on top of the Phase 8a infrastructure | request table + matching engine + provider inbox |
| **8d** | Licensed trades (plumbing, electrical, HVAC) under its own doctrine | MOCI activity-license verification layer, provincial licensing lookup, insurance disclosure |
| **8e** | Beauty + wellness (salon booking, personal training) under a separate Menu-Booking doctrine | service menu primitive (pricing table), cultural filters (women-only slots), booking calendar |

Phase 8f — delivery-courier — remains out of scope under Services; its dispatch model aligns with a future Logistics vertical, not the quote-compare family.

---

## 7. Success criteria for Phase 8a

The v1 ships when every one of these is true:

1. A provider can onboard end-to-end (attestations + identity + PACI + profile) and publish their first listing in under 10 minutes.
2. A buyer can send a structured `quote_request` from the `home-services` hub and receive at least 1 structured `quote_response` in a staging smoke test.
3. A complete booking flow renders — `quote_response` → `booking_proposal` → both-side `completion_mark` → review form unlocks for both sides.
4. RLS: a buyer can only read/write their own conversations + bookings + reviews; a provider the same.
5. Phone/email regex filter blocks contact-info leak attempts with unit-test coverage.
6. Hub + detail + sell wizard all use the Phase 7 v2 plain-language primitives — no jargon, Arabic-first, "I don't know" escape hatches on optional fields.
7. Test suite: 40+ new unit tests across ServiceFieldsSchema validators + booking state machine + filter regexes + review invariants.
8. STATUS.md + PROGRESS-REPORT-YYYY-MM-DD updated; doctrine linked from STATUS.

---

## 8. Design decisions (resolved 2026-04-22 by founder delegation)

Founder Fawzi delegated these 8 decisions with "ابدأ" on 2026-04-22. Each decision is recorded here with rationale for future auditability.

1. **Individual providers with or without MOCI?** → **ACCEPT BOTH, tier-gated.** Individuals without MOCI can reach `identity_verified` tier maximum. `address_verified` + `dealo_inspected` tiers require MOCI activity license on file. Rationale: restricting to MOCI-only slashes supply at launch; accepting both with tier honesty keeps us compliant-explicit while the market develops. Tier visibility on every card tells buyers what they're choosing.

2. **Dealo Guarantee cap?** → **KD 200 for v1.** Enough to feel real (covers most deep-clean disputes + handyman property damage); low enough to survive a bad-actor cluster. Thumbtack/TaskRabbit use $1k-$10k caps but support them with insurance + volume; KD 200 is a prudent starting actuarial. Revisit at 100 completed bookings.

3. **Fan-out count per quote_request?** → **5 max, first 3 to respond visible.** Matches Thumbtack's proven pattern. TaskRabbit's 1 is too restrictive for our chat-first model (buyer wants to compare). Beyond 5 the signal degrades — Bark's broadcast is the failure mode we reject.

4. **Review tags (pick 3)?** → **{on-time, clean-work, fair-price}.** Dropped "tidy" (ambiguous — could mean the provider's attire or the job). "clean-work" is unambiguous for both cleaning AND handyman contexts. "respectful of household" considered but subjective + hard to code consistently; handled implicitly by the 1-5 star free-text rating.

5. **Completed-booking seed density?** → **12 historical bookings across 5 providers (~2-3/provider avg).** Enough density for each provider to have a `rating_avg` + `rating_count` on their card, not so much the hub looks artificially busy. Honest demo over vanity demo.

6. **Task_type scope?** → **8 values as drafted (no expansion).** `home_cleaning_one_off`, `home_cleaning_recurring`, `handyman_ikea_assembly`, `handyman_tv_mount`, `handyman_shelf_hang`, `handyman_furniture_move`, `handyman_basic_painting`, `handyman_other`. Tight-scope discipline proved correct in Phase 7 v2. Adding more task types expands the surface before we've proven the core flow.

7. **Dealo Guarantee dispute flow?** → **Policy + UI copy only in Phase 8a. Dispute-handling UI deferred to 8b.** Rationale: the anti-disintermediation lever works from day one (copy on listing + booking cards says "Protected when you book through Dealo chat"); the actual claim-filing UI + admin-review workflow is a phase of its own (human-in-loop, needs arbitration policy). 8a ships the DETERRENT; 8b ships the REMEDY.

8. **Parent category naming?** → **`services` parent + `home-services` sub-cat.** Matches TAXONOMY-V2 v2 and reserves room for Phase 8b/c/d/e sub-cats (`moving-storage`, `event-services`, `photography`, `beauty-services`, etc.). Adding them later requires only a row in `categories` + the associated doctrine, not a taxonomy rename.

---

**End of PHASE-8A-HOME-SERVICES.md.** Awaiting founder review before any implementation begins. Doctrine-first discipline: no code until this document is approved or edited.
