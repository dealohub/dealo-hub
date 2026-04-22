# Phase 7a v2 — Dealo Electronics: Doctrine, Schema, Verification

> **Author:** Claude Code · **Date:** 2026-04-22 · **Supersedes:** PHASE-7A-ELECTRONICS v1 (2026-04-20)
> **Depends on:** migrations 0015–0030 · `src/lib/properties/` module (pattern) · `src/lib/rides/` module (pattern)
> **Strategically aligned with:** `DECISIONS.md` · `LAUNCH-STRATEGY.md` (trust-first asymmetric strategy) · `PHASE-4A-AUDIT.md` (properties doctrine — quality bar)
> **Research tracks executed:** Gulf live DOM observation (research-7a-v2/01), Global benchmark synthesis (research-7a-v2/02), Kuwait cultural signals generalised to GCC (research-7a-v2/03)

---

## Executive Summary

Across four live-observed Gulf C2C platforms (Dubizzle KW, Q84Sale, OpenSooq KW, Haraj SA), the structured-data floor for used electronics is exceptionally low. None capture IMEI, battery health, region spec, carrier lock, or warranty end-date as structured fields. Dubizzle's mobile-phone detail surfaces six labels total (Brand, Price Type, Condition, Model, Description, Location). Counterfeit listings — "COPY A" on Dubizzle, "شبيه الاصلي" on OpenSooq — pass trust checks and render alongside genuine inventory with identical badging. On OpenSooq's iPhone 17 Pro Max page, more than half the "similar listings" are priced under 50 KWD against a legitimate 300–600 KWD cluster. See `research-7a-v2/01-GULF-LIVE-OBSERVATION.md` for DOM-level evidence.

The global market has already solved the pieces the Gulf has not. Swappa (`research-7a-v2/02-GLOBAL-BENCHMARKS.md`) gates every listing against GSMA IMEI and splits carrier compatibility into distinct categories rather than filters. Back Market locks a 4-tier cosmetic grade with a 12-month warranty floor. Reebelo decouples cosmetic grade from battery tier as orthogonal dimensions — the cleanest UX in the category. StockX enforces a catalog-first listing flow: sellers pick a canonical SKU rather than writing free-text titles, which eliminates the vast majority of ambiguous-listing disputes. None of these patterns require authentication-on-pickup for used phones — a primitive that has never worked at scale anywhere in the world.

GCC buyers arrive on a C2C marketplace pre-trained by a high retail trust baseline. Apple Store at The Avenues, X-cite, Eureka, Best Al-Yousifi, Sharaf DG, Jumbo, Jarir, eXtra and Virgin all operate 14-day returns, extended-warranty programs and brand-authorised service centres. Carriers — Zain/STC/Ooredoo (KW), du/Etisalat (UAE), STC/Mobily/Zain (KSA), Ooredoo/Vodafone (Qatar) — sell most flagship phones on unlocked installment plans. A genuine shop-stamped receipt is a load-bearing trust artefact; "مبدل شاشة" (screen replaced) is a market-normalised disclosure, not an exception; "badal" (device-for-device trade) is a pan-GCC transaction pattern no global platform serves. See `research-7a-v2/03-KUWAIT-CULTURAL.md` — generalised to the wider Gulf in this doctrine.

Dealo Electronics wins on trust, not volume. Fewer listings. Every device resolvable to a canonical SKU. Every IMEI unique on Dealo for its lifetime. Every repair disclosed at component granularity. Every counterfeit-vocabulary listing rejected at submit. Purchase provenance structured, receipt upload standard, warranty tiered. Nine evidence-cited pillars drive the schema below. v1 is superseded.

---

## 0. Research methodology + evidence

Three parallel research tracks ran before this document was finalised. What we can claim, and what we flag.

| Track | Source | Fidelity | Key deliverables |
|---|---|---|---|
| **A. Gulf live observation** | `research-7a-v2/01-GULF-LIVE-OBSERVATION.md` — chrome-devtools MCP on Dubizzle KW, Q84Sale, OpenSooq KW, Haraj SA | HIGH (DOM-level, 2026-04-21) | Structured-field gap matrix across 4 platforms; counterfeit anti-patterns; trust-signal taxonomy |
| **B. Global benchmarks** | `research-7a-v2/02-GLOBAL-BENCHMARKS.md` — WebSearch + WebFetch of Swappa, Back Market, Reebelo, eBay AG, StockX, Mercari, Gazelle, Apple Trade-In | HIGH (URL-cited); some help-centre pages JS-gated → cached snippets | 4-tier cosmetic taxonomy verbatim; IMEI gatekeeping primitives; catalog-first listing pattern; authentication-on-pickup infeasibility finding |
| **C. GCC cultural** | `research-7a-v2/03-KUWAIT-CULTURAL.md` — generalised across KW/UAE/KSA/Qatar/Bahrain/Oman | HIGH on retail policies + Arabic counterfeit vocabulary; MEDIUM on badal mechanics and repair-tier taxonomy; LOW on stolen-IMEI registries | Receipt culture, carrier installment patterns, repair-tier 4-way taxonomy, counterfeit vocabulary (7 Arabic + 6 English terms), badal as first-class transaction pattern |

**HIGH-fidelity claims:** Gulf structured-field gaps (DOM-evidenced), Arabic counterfeit terminology, Apple country-locked warranty for iPhones, catalog-first listing flow (StockX), orthogonal cosmetic/battery model (Reebelo), 12-month warranty floor (Back Market).

**MEDIUM-fidelity claims:** Badal mechanics (inferred from listing prose across Q84Sale/Dubizzle), repair-tier language hierarchy (observed at Hawalli repair shops + market parlance), carrier installment unlock defaults (observationally consistent, not formally documented across all six states).

**LOW-fidelity claims:** Public stolen-IMEI registries in each GCC state (search did not surface consumer-queryable tools; defer to internal uniqueness as the primary moat).

Every schema decision below cites its evidence row. The three research files are the primary evidence appendix; this doctrine references them by section.

---

## 1. The Dealo Electronics Doctrine — 9 pillars

Each pillar: **observed failure → concrete Dealo behaviour → component that enforces it**.

### P1. Catalog-first listing (no free-text title)

**Failure.** Dubizzle and Q84Sale accept free-text titles. Observed live (`research-7a-v2/01`, §Dubizzle): "iPhone 16 plus (COPY A)", "ايفون 13pro max جيجا 256 زيرو ضريبه مصر", "Samsung Galaxy S24 Ultra 256GB Telegram lD: @Hamzausain". Free text breaks search, invites counterfeit wording, and forces buyers to parse AR/EN code-switched slang. StockX eliminated this class of dispute with a catalog-first pattern (`research-7a-v2/02`, §StockX).

**Behaviour.** Seller picks a canonical `device_slug` from `device_catalog`. Storage, colour and variant are dependent dropdowns keyed off the slug. Listing title is derived from the catalog row, not authored. Free-text surfaces in `description_ar` / `description_en` only — never in the title.

**Component.** New `device_catalog` table (not shipped v2 — §7). In v2 the `device_slug` is a validated string constrained to an allowlist of seeded flagship slugs; expansion to a full catalog is out of scope and ships in Phase 7f.

### P2. IMEI / serial uniqueness on Dealo (lifecycle-tracked)

**Failure.** Zero of four Gulf platforms capture IMEI as a structured field (`research-7a-v2/01`, cross-platform table). No GCC state operates a consumer-queryable stolen-device registry that Dealo can rely on (`research-7a-v2/03`, §3). Stolen devices routinely re-surface after a wipe.

**Behaviour.** `imei` required on every cellular sub-category. Luhn-15 validated at submit. **One IMEI = one active Dealo listing at any time; one IMEI = one historical chain of Dealo ownership records.** Re-listing a device that was previously listed on Dealo requires sign-off from the prior seller (transfer-of-ownership step). **No external GSMA lookup in v2** — the internal uniqueness graph is the moat and is cheaper than any external partnership.

**Component.** `listings.category_fields.imei` (string, private, Luhn-15 validated). New `imei_ledger` table deferred to Phase 7f; v2 enforces uniqueness via a unique partial index on the JSONB path. IMEI never appears in public listing photos or in the public payload — it is surfaced only to the seller's owner UI and to moderation.

### P3. Orthogonal cosmetic grade + battery health

**Failure.** Dubizzle and Q84Sale collapse condition to a 2-value enum (New/Used). OpenSooq ships a 4-tier ladder — Brand New / Used-Excellent / Used-Good / Damaged — which is best-in-class in the GCC (`research-7a-v2/01`, §OpenSooq) but still bundles battery health into prose. Reebelo's model keeps cosmetic and battery orthogonal (`research-7a-v2/02`, §Reebelo); Back Market and Swappa converge on 4-tier cosmetic (`research-7a-v2/02`, §Back Market + §Swappa). Sellers across Q84Sale already disclose battery in titles ("بطارية 92%", "بطاريه ٧٢") — the field is wanted; the platform fails to capture it.

**Behaviour.** Two independent fields:
- `cosmetic_grade` — 4-tier enum: `premium` / `excellent` / `good` / `fair`. All grades must be 100% functional; Premium = zero signs of wear.
- `battery_health_pct` — integer 0–100 with an optional `battery_tier` derived label (`new_100` / `elevated_90` / `standard_80` / `below_80` / `not_tested`). Seller may upload a short video showing Settings → Battery → Battery Health in one unbroken take (`research-7a-v2/03`, §8 — spoofing evidence justifies video option).

**Component.** `listings.category_fields.cosmetic_grade` enum + `battery_health_pct` int + `battery_evidence_video_url` optional string. Validated by Zod refinement in `src/lib/electronics/validators.ts`.

### P4. 4-way repair disclosure per component

**Failure.** Dubizzle and Q84Sale treat repair history as free text. Kuwaiti/Gulf repair parlance already operates a 4-tier ladder (`research-7a-v2/03`, §7): **أصلية** (OEM original), **أصلي مبدل** (OEM part, third-party install), **مبدل عالي الجودة** (premium aftermarket — ZY/GX/JK tier), **مبدل خارجي** (generic aftermarket). Buyers interrogate screen status diagnostically ("شاشة أصلية؟"); absence of disclosure when a part was changed is considered deceptive. Per-component disclosure (screen vs battery vs back glass vs camera) is the norm in WhatsApp negotiation.

**Behaviour.** Per-component enum across four parts:
- `repair.screen` — `original` / `oem_replaced` / `aftermarket_premium` / `aftermarket_generic` / `unknown`
- `repair.battery` — same 5 values
- `repair.back_glass` — same 5 values
- `repair.camera` — same 5 values

"Unknown" is an explicit seller escape hatch (P9) — the honest answer when the device came used from a prior owner.

**Component.** `listings.category_fields.repair` — structured sub-object in JSONB. Zod `RepairSchema` nested under `ElectronicsFieldsRaw`.

### P5. Purchase provenance enum with GCC retailer hierarchy

**Failure.** Free-text "zero tax Egypt" / "Apple Avenues receipt" disclosures in titles across all four observed platforms (`research-7a-v2/01`). GCC buyers materially distinguish between locally-retail-sourced devices (warranty valid in-country) and imported/grey-market units (no local warranty — `research-7a-v2/03`, §6). Apple's One-Year Limited Warranty on iPhones is country-of-purchase-bound; an iPhone bought in the US is not under Apple Kuwait's or Apple UAE's warranty even if imported cleanly.

**Behaviour.** `purchase_provenance` enum with a GCC retailer hierarchy:
- `apple_store` — Apple-operated store (Apple Avenues KW; Apple UAE outlets; etc.)
- `authorized_retailer` — X-cite / Eureka / Best Al-Yousifi (KW); Sharaf DG / Jumbo / Virgin (UAE); Jarir / eXtra / Extra (KSA); Virgin / Jaidah (Qatar); Sharaf DG (Bahrain, Oman); and equivalent authorised resellers
- `carrier` — Zain / STC / Ooredoo (KW); du / Etisalat (UAE); STC / Mobily / Zain (KSA); Ooredoo / Vodafone (Qatar); Batelco (Bahrain); Omantel / Ooredoo (Oman)
- `imported` — grey-market / personal-import / travel purchase; no local warranty implication
- `gift_or_unknown` — seller did not purchase directly

No `region_spec` enum. Regional implication is derived implicitly from `purchase_provenance`: `imported` → "No local Apple/brand warranty" banner; all others → standard GCC warranty window applies (until end-date lapses).

**Component.** `listings.category_fields.purchase_provenance` enum. `src/lib/electronics/warranty.ts` derives the display banner from provenance + `warranty_tier`.

### P6. Structured warranty tier + optional end-date + receipt upload

**Failure.** All four Gulf platforms render warranty as free text (`research-7a-v2/01`, cross-platform table). Back Market set the global floor at 12 months (`research-7a-v2/02`, §Back Market). Receipt with shop stamp is the primary Gulf trust artefact (`research-7a-v2/03`, §12) — X-cite, Eureka, Best Al-Yousifi, Apple KSA consumer-law pages all require original proof of purchase for warranty claims.

**Behaviour.** Three fields:
- `warranty_tier` enum — `none` / `seller_doa_7d` / `seller_30d` / `manufacturer_active`
- `warranty_expires_at` optional ISO date — required when `warranty_tier = manufacturer_active`
- `receipt_image_url` optional string — upload field on the sell wizard; surfaces a "Receipt on file" badge on the detail page when present

**Component.** `listings.category_fields.warranty_tier` + `warranty_expires_at` + `receipt_image_url`. Zod superRefine enforces the expiry-required-when-active rule. Receipt-QR verification partnerships (cross-reference against X-cite / Apple receipt databases) are explicitly out of scope for v2 (§7).

### P7. Counterfeit vocabulary blocklist — 13 terms, hard-reject at submit

**Failure.** "COPY A" lives on Dubizzle; "شبيه الاصلي" classified Brand New on OpenSooq (`research-7a-v2/01`, §OpenSooq). Arabic counterfeit vocabulary is rich and specific (`research-7a-v2/03`, §10): six tier-labelled terms from `كوبي` (generic copy) through `ماستر كوبي` (top-tier counterfeit running Android themed as iOS). v1 shipped a 6-term blocklist. v2 widens to 13.

**Behaviour.** Submit-time regex gate rejects any listing whose title or description matches the blocklist. Educational rejection UX: *"Dealo doesn't permit counterfeit or replica listings. If this is a genuine device, please remove the term and resubmit."*

**Blocklist (13 terms):**

Arabic (7):
`كوبي` · `هاي كوبي` · `ماستر كوبي` · `فيرست هاي كوبي` · `شبيه الاصلي` · `تقليد` · `درجة ثانية` (when paired with a brand name)

English (6):
`1st copy` · `first copy` · `master copy` · `high copy` · `high quality copy` · `AAA` (when paired with a brand name) — plus generic English umbrella terms `replica` · `clone` · `knockoff` folded into the same regex union (total 13 distinct seller-typed patterns; the regex compiles all tokens).

**Component.** `src/lib/electronics/filters.ts` exporting `COUNTERFEIT_PATTERNS` + `rejectCounterfeitVocabulary(title, description)`. Compiled once, applied at submit. GPT-4o-mini fallback identical to Filter C (properties P3) — ≈ $0.002 per submission.

### P8. Badal (device-for-device trade) as a first-class listing type

**Failure.** Badal (بدل) is a pan-GCC transaction pattern — device-for-device swap plus cash difference (الفرق) — documented in live Q84Sale and Dubizzle prose ("للبدل مع", "بدل ايفون ١٥ برو مع فرق") (`research-7a-v2/03`, §5). Formal retailers (Gait, Alpha Store, Jarir, X-cite, Zain, Ooredoo, STC) have co-opted the concept under "trade-in" branding, but no C2C platform — global or Gulf — models it natively. Informal badal deals currently happen entirely on WhatsApp; the listing is a hook.

**Behaviour.** New `listing_type` value: `badal`. A badal listing declares:
- The device offered (structured via P1 + P3 + P4 + P5 + P6)
- `badal_target` — desired target device (free-text in v2; structured against `device_catalog` in v3)
- `badal_cash_delta_kwd` — signed integer representing the seller's offered or requested cash difference (positive = seller pays, negative = seller receives)
- `badal_cash_delta_tolerance_pct` — optional int, % band around the delta the seller will accept

Badal handshake UX (in-app IMEI double-verification + acknowledgment of mutual inspection) is out of scope for v2 and deferred to Phase 7g (§7). v2 ships the listing type and filterable surface only.

**Component.** `listings.listing_type` enum extended to include `badal` (was `rent` / `sale` for properties; now also `trade` for rides and `badal` for electronics). `listings.category_fields.badal` sub-object.

### P9. Human-centred UX (plain language, visual examples, escape hatches)

**Failure.** v1 sell wizard assumed sellers knew what "IMEI" meant, what "Luhn-15" implies, and could rate cosmetic condition against a text-only 4-tier ladder. Gulf sellers are heterogeneous — a 22-year-old tech student and a 55-year-old reselling a family device are both realistic users. Back Market (`research-7a-v2/02`, §Back Market) ships a per-grade "What will my device look like?" explainer with short text + illustrative photos; Swappa runs a pre-publish IMEI verification modal that shows the result inline before moderation.

**Behaviour.** Sell-wizard copy rules:
- Every jargon term (IMEI, Face-ID, OEM, eSIM) is followed by an inline help popover in plain AR + plain EN.
- Every enum value (cosmetic grade, repair tier, battery tier) is accompanied by a short example photo and a one-sentence plain-language description.
- Every non-trivial field offers an explicit "I don't know" / "Prefer not to say" escape hatch. `unknown` is a first-class value in the repair enum (P4). `not_tested` is a first-class battery tier.
- IMEI lookup explanation: "IMEI is the 15-digit number that identifies your phone. Dial *#06# to see it." — rendered next to the field.
- All field labels bilingual (AR + EN) — no jargon island.

**Component.** `app/[locale]/sell/electronics/` sell-wizard branch. Copy lives in `messages/en.json` and `messages/ar.json` under the `sellWizard.electronics` namespace. Visual examples are static assets in `public/electronics/examples/` keyed by enum value.

---

## 2. Taxonomy — 6 sub-cats locked

Validated against Q84Sale and OpenSooq live DOM (`research-7a-v2/01`). Q84Sale exposes 16+ siblings under Electronics; OpenSooq splits Parts, Accessories and Smart Watches. We collapse the long tail into six sub-categories that cover observed demand and support the pillar schema.

```
electronics (parent)
├─ phones                    seeded v2 · sort 1 · full schema applies
├─ tablets                   seeded v2 · sort 2 · phones schema minus cellular-required IMEI on Wi-Fi-only SKUs
├─ laptops                   seeded v2 · sort 3 · serial instead of IMEI; battery + repair apply
├─ smartwatches              seeded v2 · sort 4 · cellular variants require IMEI; Wi-Fi variants use serial
├─ audio                     seeded v2 · sort 5 · AirPods / headphones / speakers; serial optional
└─ gaming-consoles           seeded v2 · sort 6 · PS5 / Xbox / Switch / Steam Deck; serial required
```

**Sub-cat choice rationale matrix:**

| Sub-cat | Gulf observed? | Phase 7 v2 seeded? | IMEI required? | Why |
|---|---|---|---|---|
| `phones` | ✅ all 4 platforms | Yes (per seed plan) | Always | Universal + highest fraud surface |
| `tablets` | ✅ OpenSooq, Q84Sale | Yes | Cellular variants only | Cellular SKUs share phone moat; Wi-Fi-only uses serial |
| `laptops` | ✅ all 4 | Yes | No (serial) | Repair + battery pillars apply |
| `smartwatches` | ✅ OpenSooq dedicated; Q84Sale sibling | Yes | Cellular only | Apple Watch cellular = IMEI-bearing |
| `audio` | ✅ OpenSooq accessories | Yes | No | AirPods serial (each earbud has one) + counterfeit-prone |
| `gaming-consoles` | ✅ Q84Sale sibling; Dubizzle bundled | Yes | No (serial) | StockX-validated category (`research-7a-v2/02`) |

**Out of this v2 taxonomy:** cameras, TVs/audio-video furniture, VIP phone numbers, accounts & subscriptions (Netflix / gaming accounts), parts (screens / batteries as standalone items), accessories (chargers / cables / covers). These are real Gulf categories (OpenSooq evidence) and land in Phase 7h+.

---

## 3. ElectronicsFieldsRaw v2 — the schema

14 fields across 5 domains. Every field cites its pillar. Conditional-required semantics land in a Zod `superRefine` keyed on `sub_cat` + `listing_type`.

### 3.1 Identity (3)

| Field | Type | Required | Pillar | Notes |
|---|---|---|---|---|
| `device_slug` | string, catalog-constrained | ✅ | P1 | e.g. `iphone-15-pro-max-256gb`. v2 allows a seeded allowlist; full `device_catalog` is Phase 7f. |
| `storage_gb` | int enum | ✅ on phones/tablets/laptops | P1 | `64 / 128 / 256 / 512 / 1024 / 2048` |
| `color` | string(40) | — | P1 | Dependent dropdown off `device_slug` |

### 3.2 Specs (2 — minimal, the catalog carries the rest)

| Field | Type | Required | Pillar | Notes |
|---|---|---|---|---|
| `ram_gb` | int | ✅ on laptops | P1 | Laptops only; phones/tablets derive from catalog |
| `sim_type` | enum | ✅ on phones | P1 | `single` / `dual_physical` / `esim_only` / `hybrid` |

### 3.3 Condition (3)

| Field | Type | Required | Pillar | Notes |
|---|---|---|---|---|
| `cosmetic_grade` | enum | ✅ | P3 | `premium` / `excellent` / `good` / `fair` |
| `battery_health_pct` | int 0-100 | ✅ on phones/tablets/laptops/smartwatches | P3 | `not_tested` allowed as sentinel (-1 or null) |
| `repair` | structured sub-object | ✅ on phones/tablets/laptops | P4 | `{ screen, battery, back_glass, camera }` each a 5-value enum including `unknown` |

### 3.4 Provenance (4)

| Field | Type | Required | Pillar | Notes |
|---|---|---|---|---|
| `imei` | string (Luhn-15) | ✅ on cellular sub-cats | P2 | Private; unique on Dealo; never in public photos |
| `serial_number` | string | ✅ on non-cellular | P2 | Serial for laptops / Wi-Fi iPads / gaming consoles |
| `purchase_provenance` | enum | ✅ | P5 | `apple_store` / `authorized_retailer` / `carrier` / `imported` / `gift_or_unknown` |
| `receipt_image_url` | string | — | P6 | Optional upload; renders "Receipt on file" badge |

### 3.5 Trade (2)

| Field | Type | Required | Pillar | Notes |
|---|---|---|---|---|
| `warranty_tier` | enum | ✅ default `none` | P6 | `none` / `seller_doa_7d` / `seller_30d` / `manufacturer_active` |
| `warranty_expires_at` | ISO date | conditional | P6 | Required when `warranty_tier = manufacturer_active` |
| `accessories_included` | string[] | — | P6 | multi-select: `original_box` · `charger` · `cable` · `earphones` · `sim_tray_tool` · `warranty_card` |
| `badal` | sub-object | ✅ when `listing_type = badal` | P8 | `{ target, cash_delta_kwd, cash_delta_tolerance_pct? }` |

**Total fields:** 14 core + conditional (repair sub-object has 4 parts; accessories is a multi-select; badal is conditional). Shape intentionally smaller than v1 (which claimed 28). Simpler wins.

**Conditional requirements (Zod superRefine summary):**

- `sub_cat = phones` OR `tablets` with cellular → `imei` required
- `sub_cat = laptops` OR `audio` OR `gaming-consoles` → `serial_number` required, `imei` forbidden
- `sub_cat = smartwatches` → branching: cellular SKUs (catalog flag) require `imei`; Wi-Fi-only require `serial_number`
- `listing_type = badal` → `badal.target` + `badal.cash_delta_kwd` required
- `warranty_tier = manufacturer_active` → `warranty_expires_at` required (ISO date, future-dated)
- `purchase_provenance = imported` → detail page renders "No local warranty" banner regardless of `warranty_tier` unless seller attaches receipt

---

## 4. Filter pipeline

Listings traverse three submit-time filters. Filter A and Filter C are inherited from prior phases (A: phone/email in title — automotive; C: discriminatory wording — properties). Filter D is new for electronics.

### Filter A (inherited)
Rejects phone numbers, WhatsApp handles, Telegram IDs and email addresses in title/description. Observed live on Dubizzle (`research-7a-v2/01`, §Dubizzle: "hani37988@gmail.com" as a listing title, "Telegram lD: @Hamzausain" in a Samsung ad).

### Filter C (inherited)
Rejects discriminatory wording — nationality, religion, marital filters. Not electronics-specific but applies to all listings.

### Filter D — Counterfeit vocabulary blocklist (NEW, P7)

**Scope.** All electronics listings.

**Rejection triggers** (regex union, server-side, Zod refinement on `title_ar` + `title_en` + `description_ar` + `description_en`):

13 distinct tokens compiled into two regex groups:

- Arabic (7): `كوبي` · `هاي كوبي` · `ماستر كوبي` · `فيرست هاي كوبي` · `شبيه الاصلي` · `تقليد` · `درجة ثانية` (the last requires a brand-name co-occurrence for precision).
- English (6): `1st copy` · `first copy` · `master copy` · `high copy` · `high quality copy` · `AAA` (co-occurring with a known brand). Umbrella terms `replica` · `clone` · `knockoff` fold into the same union.

**UX on rejection.**
```
We can't publish this listing.

Dealo doesn't permit counterfeit, replica or imitation
device listings. We found the phrase "master copy" in
your title.

If this is a genuine device: please remove the phrase
and resubmit.
If this is a replica: Dealo is not the right marketplace.

Learn more: /help/counterfeit-policy
```

**Fallback.** GPT-4o-mini flags at 70%+ confidence if regex misses (identical cost envelope to properties Filter C, ≈ $0.002 per submission).

**Impact.** Every Gulf C2C seller who lists on Dealo learns on first attempt that replicas are rejected. This becomes the counter-positioning story against OpenSooq (where "شبيه الاصلي" was classified as Brand New — `research-7a-v2/01`) and Dubizzle (where "COPY A" is live inventory).

---

## 5. Verification tiers

Inherited from the Properties doctrine (PHASE-4A-AUDIT P1 + P6), extended for electronics-specific evidence.

| Tier | Visual | Meaning to buyer | Criteria to attain |
|---|---|---|---|
| `unverified` | grey dot | No Dealo verification. Buy with ordinary caution. | Default on submit |
| `ai_verified` | blue diamond | Images pass perceptual-hash check; price within sanity band; counterfeit filter clean; IMEI unique on Dealo; receipt image OCR-parseable if uploaded | Automatic at submit if all gates pass |
| `dealo_inspected` | green check | A Dealo agent has physically verified the device — IMEI confirmed, cosmetic grade inspected, battery screenshot witnessed live, receipt verified against retailer where possible | Manual. Triggered on request for listings ≥ 200 KWD equivalent. |

Buyer-facing tier badge renders on listing cards and detail pages. `verified_at` (timestamp) and `verified_by` (enum: `ai` / `human` / `inspection`) are inherited columns on `listings`.

**What v2 does not promise.** Authentication-on-pickup for used phones. `research-7a-v2/02` establishes that no global platform runs this at scale: StockX restricts to sealed-new, eBay AG excludes tech, Back Market and Reebelo are B2C-refurbisher-only. Dealo offers IMEI + photo + optional inspection + optional escrow — in that order — never an authentication-intercept promise on used cellular.

---

## 6. IMEI lifecycle

The single highest-leverage Dealo moat in electronics.

**Submit-time checks:**
1. **Format validation.** Luhn-15 checksum on phone IMEI. Rejection on invalid.
2. **Active-duplicate check.** Query `listings` for any other *active* listing whose `category_fields.imei` matches. Reject with: *"This IMEI is already on an active Dealo listing. If that listing is yours, pause it before creating a new one. If not, contact support — this may be a duplicate or impersonation."*
3. **Historical chain check.** Query historical Dealo ownership records. If this IMEI was previously listed by a different seller, require an in-app "transfer of ownership" acknowledgement from the prior seller before the new listing publishes.
4. **Counterfeit IMEI heuristic.** IMEIs beginning with certain known-bogus TAC ranges (well-documented in GSMA literature for flagged counterfeits) trigger a manual review flag.

**What v2 deliberately does not do.** External GSMA lookup. A commercial GSMA data partnership is expensive and not a v2 priority — our internal uniqueness graph is a stronger signal in the GCC than any external blocklist (`research-7a-v2/03`, §3: no public CITRA registry exists and cross-carrier IMEI blocking within Kuwait is not reliably enforced at consumer level; the equivalent is true across most GCC states).

**Storage.** `imei` lives in `listings.category_fields.imei` (JSONB, private). Public payload for buyers contains `imei_status` (enum: `verified_unique` / `pending_review` / `not_required`) but never the raw IMEI. The raw value is visible only to the seller (in their own dashboard), to Dealo moderation staff, and to law-enforcement subpoena response.

**Photos.** IMEI must not appear in any listing photo. Sell-wizard upload validator runs OCR on each photo and flags frames where a 15-digit number matches the declared IMEI. Flagged photos block publish until replaced.

---

## 7. Out of scope for v2 (explicit)

Deferred features with their target phase:

| Feature | Why deferred | Phase |
|---|---|---|
| Full `device_catalog` table (>50 models) | Seeded allowlist is sufficient for v2; full catalog requires spec-sheet curation across five brands × multi-year back-catalog | 7f |
| `sold_comps` rolling 90-day median pricing banner | Requires completed-transaction data we don't have yet; premature optimisation | 7g |
| Badal handshake UX (in-app mutual IMEI verification + meetup acknowledgment flow) | Cultural depth deserves its own design pass; v2 ships the listing type only | 7g |
| Vouch graph (verified users vouch for new sellers — diwaniya trust primitive) | Requires social graph primitives not yet in Dealo | 8 |
| Receipt QR verification partnerships (X-cite / Apple / Sharaf DG receipt cross-reference) | Business-development effort, not engineering; no partner MoU yet | 8 |
| External GSMA IMEI lookup | Commercial partnership cost not justified; internal uniqueness is stronger signal | 8 |
| Refurbisher trade-in partners (carrier trade-in handoff) | Separate B2B integration; not C2C | 9 |
| Escrow / "Buy with Confidence" opt-in | Haraj's "اشتر بثقة" is a proven pattern but payments infrastructure lives in Phase 10 | 10 |
| Seller verification tier beyond current single tier (Verified User / Verified Business split) | Observed on OpenSooq + Haraj; valuable but cross-vertical | 8 |
| Public prohibited-items policy + suspended-accounts ledger | Haraj pattern; policy authoring is a Trust & Safety effort | 8 |

---

## 8. Definition of done

Phase 7a v2 is complete when:

1. `planning/PHASE-7A-ELECTRONICS-V2.md` (this file) is committed and replaces v1 as the source of truth. v1 is marked superseded in a header banner.
2. `src/lib/electronics/validators.ts` exports `ElectronicsFieldsSchema` (Zod) covering all 14 fields across 5 domains with conditional-required superRefine logic matching §3.
3. `src/lib/electronics/filters.ts` exports `COUNTERFEIT_PATTERNS` (13 tokens compiled) and `rejectCounterfeitVocabulary(title, description)` validator. Unit tests assert all 13 Arabic + English tokens trigger rejection and a corpus of 20 clean titles pass.
4. `src/lib/electronics/types.ts` exports `ElectronicsDetail`, `ElectronicsCard`, `ElectronicsCategoryKey`, `ElectronicsFields` types matching the schema.
5. Zod unit tests cover: IMEI Luhn-15 accept/reject, conditional IMEI requirement on phones, conditional serial requirement on laptops, warranty expiry required when `manufacturer_active`, badal target required when `listing_type = badal`, counterfeit filter rejects every token in the blocklist.
6. Seed migration produces at minimum one listing per sub-category (6 total) demonstrating: one badal listing (P8), one `imported` provenance listing (P5 — renders "no local warranty" banner), one `manufacturer_active` warranty listing with receipt upload (P6), one "aftermarket screen replaced + original battery" listing (P4), one `dealo_inspected` tier listing (P1 + §5).
7. Sell wizard branch at `app/[locale]/sell/electronics/` implements the catalog-first flow (P1) with inline help popovers on every jargon term (P9) and escape hatches on non-trivial fields (P9).
8. Detail page at `app/[locale]/tech/[slug]/page.tsx` renders the verification-tier badge, the warranty banner derived from `purchase_provenance` + `warranty_tier`, and the repair-disclosure strip (4 components × 5 tiers).
9. Hub page at `app/[locale]/tech/page.tsx` surfaces the 6 sub-categories, highlights verified-tier listings, and displays seed inventory without placeholder content.
10. No explicit promise of authentication-on-pickup anywhere in the UI. Trust primitives limited to the four stacked in order: IMEI uniqueness + photo compliance + optional inspection + (future) escrow.

Marketplace shows the Electronics vertical at parity with Properties depth after these land. Phase 7b+ ships the deferred items in §7.

---

*End of doctrine v2.*
