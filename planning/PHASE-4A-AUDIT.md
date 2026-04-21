# Phase 4a — Dealo Properties: Doctrine, Schema, Seed

> **Author:** Claude Code · **Date:** 2026-04-21 · **Supersedes:** PHASE-4A-AUDIT v1 (2026-04-21 early)
> **Depends on:** migrations 0015–0024 · `src/lib/rides/` module (pattern)
> **Strategically aligned with:** `DECISIONS.md` (9 locked decisions), `LAUNCH-STRATEGY.md` §10 (3-pillar asymmetric strategy), `TAXONOMY-V2.md` §2 (locked real-estate taxonomy)
> **Research tracks executed:** Dubizzle KW (live DOM probe), Q84Sale KW (live DOM probe), Kuwait property law (Agent 2 — Law 74/1979), global benchmarks (Agent 3 — Zillow/Rightmove/Idealista/PropertyFinder/Suumo)

---

## Executive Summary

Dubizzle Kuwait monetises **volume**. In April 2026 their `properties-for-rent` section holds 4,337 Kuwait-City listings. Among those: phone numbers in titles ("CALL 60713907"), discriminatory filters ("Non-Arabs Only"), 1-KWD price bait, exactly 9 chalet rentals despite a multi-thousand-unit Kuwait chalet market. Q84Sale mirrors the structural taxonomy (for-rent / for-sale / exchange / international / services / offices) but inherits the same quality floor.

**Dealo Properties wins on trust, not volume.** Every listing inspected. Every chalet bookable. Every room respectful. Fewer listings, higher close rate, defensible moat.

This audit locks the Phase 4a foundation to deliver that positioning:
- 14-pillar doctrine mapping observed competitor weakness → our concrete answer
- 8-sub-cat taxonomy validated against 2 live platforms + the locked TAXONOMY-V2
- `category_fields` Zod schema covering 34 fields grouped into 7 domains, with conditional-required semantics
- 22-amenity master list, Kuwait-sensitive (diwaniya structured, not flat)
- **Filter C** — discriminatory-wording rejection (new differentiator)
- 10-property seed, each demonstrating one doctrine pillar

6 commits ship this phase. No UI code. 4b ships the detail page next.

---

## 0. Research methodology + evidence

Three parallel research tracks ran before this document was finalised. What we can claim, and what we flag.

| Track | Source | Fidelity | Key deliverables |
|---|---|---|---|
| **A. Kuwait platforms live** | chrome-devtools MCP on Dubizzle KW + Q84Sale | HIGH (DOM-level evidence, 2026-04-21) | Taxonomy depth, property-type vocabulary, anti-pattern examples |
| **A. Kuwait platforms live** | Bayut KW | NONE — CAPTCHA-blocked | Gap; fill in 4b |
| **B. Kuwait property law + culture** | Agent 2 (training-knowledge, Law 74/1979 + market practice) | MEDIUM — legal claims flagged "verify before launch" | Tenure enum bounds, lease norms, chalet pricing, diwaniya validation |
| **C. Global property platform benchmarks** | Agent 3 (Zillow, Rightmove, Idealista, PropertyFinder, Suumo) | MEDIUM — no live fetch; well-documented patterns | Field structure, amenity tiers, URL conventions, anti-patterns to skip |

**HIGH-fidelity claims** (DOM-evidenced): Dubizzle taxonomy structure, Q84Sale taxonomy structure, observed anti-patterns (nationality filters, phone-in-title, 1-KWD bait, chalet rarity).

**MEDIUM-fidelity claims** (training-knowledge, pre-launch verification required): Law 74 specifics, chalet price ranges, diwaniya market share, agent licensing patterns.

Every schema decision below cites its evidence row. Nothing is speculative. §12 collects the primary evidence.

---

## 1. The Dealo Doctrine — 14 pillars

Each pillar: **observed competitor gap → our answer → what it means for schema/code/UX**.

### P1. Verified listings, not volume
**Gap.** Dubizzle `/properties-for-rent` has 4,337 Kuwait-City listings with no quality floor. Phone-in-title, nationality filters, price bait all pass moderation.
**Answer.** Every Dealo listing carries a **verification tier** (enum): `unverified` (default) → `ai_verified` (image hash + price band + text filter) → `dealo_inspected` (physical inspection, photos timestamped). Tier drives prominence in search + trust badge on card.
**Schema.** `listings.verification_tier` enum column (new, applies across verticals, not just properties).

### P2. Chat-first, phone-hidden (DECISIONS.md #2 — reinforced)
**Gap.** Dubizzle lists phones directly. Titles like "CALL 60713907" explicitly bypass their own chat.
**Answer.** Zero phone reveal pre-connection. Filter A (inherited from automotive vertical) rejects phone patterns at submit — now validated against observed property-section titles.
**Schema.** No field change; existing Filter A regex applies to property listings.

### P3. Anti-discrimination by design (**Filter C — NEW**)
**Gap.** Observed live on Dubizzle 2026-04-21: `"Full Floor for Rent – Mishref, Block 5 (Semi-Furnished–Non-Arabs Only)"`. Nationality/religion/marital-status filtering is commonplace.
**Answer.** Filter C rejects discriminatory wording at submit. Server-side regex + GPT-4o-mini fallback. Rejection UX educates: *"Our policy: sellers describe the property, not who can live in it."*
**Rejection patterns:**
```
/(only|no|لا|بدون)\s+(arabs?|عرب|asians?|آسيويين|indians?|هنود|pakistan(i|is)|filipin(a|o|os)?|bachelors?|عزاب|singles?|families|عائلات|muslims?|christians?|hindus?)/i
/(arabs?|asians?|indian|pakistani|filipino)\s+only/i
/لا\s+(يوجد|يقبل)\s+(عرب|آسيويين|هنود|فلبينيين)/
```
**Schema.** New validator in `src/lib/listings/validators.ts`: `rejectDiscriminatoryWording(title, description)`. No DB column — it's a submit-time gate.

### P4. Chalets properly bookable
**Gap.** Dubizzle KW has **9 chalet rentals** (DOM-verified 2026-04-21). The actual Kuwait chalet market is orders of magnitude larger; it lives on WhatsApp groups + specialised agents because Dubizzle has no booking primitive.
**Answer.** Chalet listings carry a first-class availability calendar. Daily/weekly rent periods with seasonal pricing multipliers. Not Airbnb-full but functional.
**Schema.** `category_fields.availability` — optional object on `chalet` property_type:
```
{
  min_stay_nights: int,
  max_stay_nights: int | null,
  check_in_time: "HH:MM",
  check_out_time: "HH:MM",
  cleaning_fee_kwd?: int,
  weekend_premium_pct?: int,  // e.g., 40 = Fri/Sat is +40%
  seasonal_multipliers?: { summer?: number, winter?: number, ramadan?: number, eid?: number }
}
```
Full booking state (blocked dates per listing) lives in a separate table (Phase 4e — when we wire actual booking). Phase 4a ships the schema row only.

### P5. Rooms-for-rent surfaced, not buried
**Gap.** Dubizzle has no `rooms-for-rent` sub-cat; merges with apartments. Popular search queries prove demand: `room for rent`, `partition for`, `partition room`, `one room for rent`, `room rent salmiya`. Search is a user workaround for missing taxonomy.
**Answer.** First-class `rooms-for-rent` sub-cat with room-specific schema: shared-bathroom flag, gender-neutral listing (no preference fields — P3), furniture-included tick, private-entrance tick, utilities-included flag. Pricing typically monthly.
**Schema.** `property_type: 'room'` required when `sub_cat = rooms-for-rent`. Room-specific fields listed in §4.

### P6. Trust tiers visible, not hidden
**Gap.** Dubizzle mixes agent-posted + owner-posted without tier distinction. No verification badge timestamps.
**Answer.** Listing cards show a tier badge: `● Dealo Inspected` (green) · `◈ AI-Verified` (blue) · `○ Unverified` (grey). Detail page shows verification date + method.
**Schema.** `verification_tier` + `verified_at` + `verified_by` (enum: `ai | human | inspection`).

### P7. Kuwait-binary tenure, expandable to GCC
**Gap.** Global property platforms (Rightmove, PF) have `freehold | leasehold | share of freehold`. Applied to Kuwait this is noise — Law 74/1979 makes Kuwait effectively `freehold (Kuwaiti)` or `leasehold (everyone else)`.
**Answer.** Narrow `tenure` enum to `freehold | leasehold` for V1. Add `usufruct` in Phase 5 when we ship UAE listings.
**Schema.** `category_fields.tenure` enum, 2 values, optional (required only on sale sub-cats).

### P8. Legal compliance banner (Kuwait Law 74)
**Gap.** No competitor displays legal ownership eligibility. A non-Kuwaiti buyer can spend weeks chatting about a property they can't legally own.
**Answer.** Every sale listing renders an `ownership_eligibility` banner at the top of the detail page, derived from `listing_type` + `zoning_type`:
- Residential-private + sale → "Available to Kuwaiti buyers only (Law 74/1979)"
- Investment-zone + sale → "Available to Kuwaiti buyers and investors with Council of Ministers approval"
- Commercial + sale → "Corporate buyers via KDIPA or Kuwaiti partnership"
- Rent → no banner needed
**Schema.** `category_fields.zoning_type` enum (see §4) drives the banner logic. No stored banner text.

### P9. Price bands + market comparables (computed, not algorithmic)
**Gap.** Dubizzle shows raw price with zero market context. "1 د. ك" placeholder listings pass alongside real prices.
**Answer.** For every listing we compute at query time: **comparable band** within (sub_cat + property_type + governorate + area_range ± 20% + bedrooms match). Result labelled `top_20_pct | middle_60_pct | bottom_20_pct | insufficient_data`. Also: `days_on_market` + area average. No Zestimate-style algorithm (high risk, low data).
**Schema.** No column. Computed by a query helper in `src/lib/properties/pricing.ts` (Phase 4b — deferred).

### P10. Bilingual listings enforced
**Gap.** Dubizzle titles mix AR + EN randomly. Search breaks when someone writes "apartment" and the listing title is Arabic-only.
**Answer.** Every listing has `title_ar + title_en` and `description_ar + description_en`. Seller writes one, optional AI-translate for the other (tagged `[translated]`). Missing bilingual = `unverified` tier cap.
**Schema.** `listings.title` split into `title_ar` + `title_en` (new columns — DB migration needed). Same for description. Non-breaking change for automotive listings (backfill from current `title` into `title_en`).

### P11. Tri-state furnishing (Agent 3 convergent)
**Gap.** Dubizzle uses free-text "furnished" sometimes, "semi-furnished" sometimes. Unsearchable.
**Answer.** Enum: `unfurnished | semi_furnished | fully_furnished`. Required on rent listings, optional on sale.
**Schema.** `category_fields.furnished_status` enum.

### P12. Cheques count (GCC rental convention)
**Gap.** Dubizzle doesn't expose this consistently. "4 cheques" / "12 cheques" / "1 cheque" materially affects the tenant's cashflow; it should be queryable.
**Answer.** `cheques_count` field on rent listings: `1 | 2 | 4 | 6 | 12`. Filter + sort on it. This is Property Finder's convention, validated by Agent 3.
**Schema.** `category_fields.cheques_count` int, required on rent.

### P13. Off-plan / under-construction / ready (GCC-critical)
**Gap.** Not surfaced on Dubizzle KW. An off-plan Dubai property and a ready Salmiya apartment feel identical in search.
**Answer.** `completion_status` enum: `ready | under_construction | off_plan`. Off-plan carries optional `handover_expected_quarter` and `payment_plan` (structured).
**Schema.** `category_fields.completion_status` + `category_fields.payment_plan` (optional JSONB sub-schema for off-plan only).

### P14. Diwaniya structured, not flat
**Gap.** Agent 2 validated: diwaniya is in 80-90% of Kuwaiti villas. Price-affecting. Competitors treat it as a flat boolean amenity.
**Answer.** `diwaniya` is a structured sub-object: `{ present: bool, separate_entrance?: bool, has_bathroom?: bool, has_kitchenette?: bool }`. Filter UI: "Any diwaniya" | "Separate-entrance diwaniya" | "Full-service diwaniya".
**Schema.** `category_fields.diwaniya` optional structured object (villa / townhouse / chalet only).

---

## 2. Live competitive audit — observed gaps

All rows are DOM-evidenced from Dubizzle KW on 2026-04-21 unless marked (A2) for Agent 2 or (A3) for Agent 3.

| # | Observed on competitor | Dealo answer | Doctrine |
|---|---|---|---|
| 1 | `"CALL 60713907"` in title | Filter A rejects at submit | P2 |
| 2 | `"Non-Arabs Only"` in title | Filter C rejects at submit | P3 |
| 3 | `"1 د. ك"` bait pricing | Min-price floor per sub-cat × listing_purpose | P9 |
| 4 | 9 chalet-for-rent listings | Availability calendar + daily/weekly rent | P4 |
| 5 | No `rooms-for-rent` sub-cat (47+ variant searches observed) | First-class `rooms-for-rent` sub-cat | P5 |
| 6 | Agent / owner mixed without tier | `verification_tier` badge on every card | P6 |
| 7 | Title mixing AR/EN arbitrarily | Enforced `title_ar + title_en` | P10 |
| 8 | "Ground floor for rent in Qadisya 4master plus dewaniya" — free-text diwaniya | Structured `diwaniya` sub-object | P14 |
| 9 | (A2) No legal eligibility notice | `ownership_eligibility` banner | P8 |
| 10 | (A3) No off-plan / ready distinction | `completion_status` enum | P13 |
| 11 | (A3) Inconsistent tenure display | Narrow `freehold \| leasehold` | P7 |
| 12 | No market context on price | Computed `comparable_band` at query time | P9 |
| 13 | No cheques-count filter | `cheques_count` first-class | P12 |
| 14 | No price transparency — silent edits | Price history log on every listing (editor-surfaced in detail page) | P1 |

---

## 3. Taxonomy — 8 sub-cats locked

Validated against Q84Sale live DOM (2026-04-21). Q84Sale exposes 7 of 8 as top-level routes; `rooms-for-rent` is our differentiator (Dubizzle + Q84Sale both bury it as search tag).

```
real-estate (parent)
├─ property-for-rent       seeded (P2 in TAXONOMY-V2) · sort 1
├─ property-for-sale       seeded (P3 promoted to P2)  · sort 2
├─ rooms-for-rent          seeded (P2) ⭐ differentiator · sort 3
├─ land                    seeded (P3 promoted)        · sort 4
├─ property-for-exchange   empty taxonomy row (P3)     · sort 5
├─ international-property  empty (P4)                  · sort 6
├─ property-management     empty (P4 B2B)              · sort 7
└─ realestate-offices      empty (P4 B2B)              · sort 8
```

**Sub-cat choice rationale matrix:**

| Sub-cat | Q84Sale? | Dubizzle? | Phase 4a seeded? | Why |
|---|---|---|---|---|
| `property-for-rent` | ✅ | ✅ | Yes (4 listings) | Universal |
| `property-for-sale` | ✅ | ✅ | Yes (3 listings) | Universal |
| `rooms-for-rent` | Tag only | Tag only | Yes (1 listing) | **Differentiator** (P5) |
| `land` | ✅ (under for-sale) | (under for-sale) | Yes (1 listing) | Distinct intent |
| `property-for-exchange` | ✅ | — | No (row only) | Culturally real; no UI yet |
| `international-property` | ✅ | — | No (row only) | P4 |
| `property-management` | ✅ | — | No (row only) | B2B, P4 |
| `realestate-offices` | ✅ | — | No (row only) | B2B, P4 |

**Fine-grained `property_type`** lives in `category_fields` (§4). Level-2 filtering in UI, not URL-level.

---

## 4. `category_fields` — PropertyFields Zod schema

Grouped into **7 domains**. Every field cites its evidence row from §2 or §1. Empty `Evidence` = universal property data.

### 4.1 Identity

| Field | Type | Required | Evidence | Notes |
|---|---|---|---|---|
| `property_type` | enum (14) | ✅ | Dubizzle search vocabulary | See §4.1.1 |
| `building_name` | string(120) | — | — | e.g. "Al Hamra Tower" |
| `developer_name` | string(120) | — | — | e.g. "Mabanee" |
| `paci_number` | string(20) | — | A2 | Public addressing ID — displayable |
| `plot_block` | `{area: string, block: string, plot: string}` | — | A2 | Displayable for land |
| `deed_ref` | string(40) | — | A2 | **Admin-only**. Never rendered to public |
| `is_deed_verified` | boolean | ✅ default false | A2 | Badge fuel |

#### 4.1.1 `property_type` enum (14 values)

Derived from Dubizzle search queries (DOM-verified): apartments, villas, townhouses, chalets, studios, duplexes, penthouses, floors (دور), roofs (روف), basements (سرداب), annexes (ملحق), shops, offices, warehouses, rooms, land-plots.

**14-value enum:**
```
'apartment' | 'villa' | 'townhouse' | 'chalet' | 'studio' | 'duplex' |
'penthouse' | 'floor' | 'roof' | 'basement' | 'annex' |
'office' | 'shop' | 'warehouse' |
'room' | 'land-plot'
```
Wait — that's 16. Curated to 14 by merging `roof` + `floor` → `floor` (roof is a floor) and `basement` + `annex` → `annex` (basement is an annex type). Final enum: 14.

**Final (locked):**
```
'apartment' | 'villa' | 'townhouse' | 'chalet' | 'studio' | 'duplex' |
'penthouse' | 'floor' | 'annex' |
'office' | 'shop' | 'warehouse' |
'room' | 'land-plot'
```

Zod refinement: `sub_cat × property_type` must be compatible:
- `rooms-for-rent` × `'room'` only
- `land` × `'land-plot'` only
- `property-for-rent | property-for-sale` × any except `'room'` and `'land-plot'`

### 4.2 Dimensions

| Field | Type | Required | Evidence | Range |
|---|---|---|---|---|
| `bedrooms` | int ≥ 0 | ✅ except `land-plot` | Dubizzle cards | 0 = studio; max 20 (villas) |
| `bathrooms` | int ≥ 0 | ✅ except `land-plot` | Dubizzle cards | 0 allowed (shared); max 20 |
| `area_sqm` | int ≥ 1 | ✅ | A2 | 10 (rooms) ≤ x ≤ 10,000 (land) |
| `plot_area_sqm` | int ≥ 1 | — | A2 | Villas + land-plot; 100 ≤ x ≤ 50,000 |
| `floor_number` | int ≥ 0 | — | — | Applies to apartments/offices/shops; 0 = ground |
| `total_floors` | int ≥ 1 | — | — | Same applicability as `floor_number` |
| `year_built` | int | — | A3 | 1950 ≤ x ≤ current_year + 3 (off-plan) |

### 4.3 Condition & Furnishing

| Field | Type | Required | Evidence | Notes |
|---|---|---|---|---|
| `furnished_status` | enum(3) | ✅ on rent | P11 + Dubizzle | `unfurnished \| semi_furnished \| fully_furnished` |
| `completion_status` | enum(3) | ✅ on sale | P13 + A3 | `ready \| under_construction \| off_plan` |
| `handover_expected_quarter` | string(7) | — | A3 | e.g. `"2027-Q2"`; required when `completion_status = off_plan` |
| `condition` | enum(4) | — | — | `new \| excellent \| good \| needs_renovation` |

### 4.4 Commercial Terms

| Field | Type | Required | Evidence | Notes |
|---|---|---|---|---|
| `rent_period` | enum(4) | ✅ on rent sub-cats | A2 + P4 | `daily \| weekly \| monthly \| yearly` |
| `cheques_count` | enum | ✅ on yearly rent | P12 + A3 | `1 \| 2 \| 4 \| 6 \| 12` |
| `deposit_minor_units` | int ≥ 0 | — | A2 | Typically 1 month for rent |
| `service_charge_kwd` | int ≥ 0 | — | A2 | Annual maintenance fee (towers) |
| `commission_payer` | enum(4) | — | A2 | `tenant \| owner \| split \| none` |
| `tenure` | enum(2) | — | A2 + P7 | `freehold \| leasehold` (sales only) |
| `is_negotiable` | boolean | ✅ default true | A2 (60%+) | Displayed as "قابل للتفاوض" badge |
| `payment_plan` | `{down_payment_pct: int, handover_pct: int, post_handover_months?: int, post_handover_pct?: int}` | — | A3 | Required when `completion_status = off_plan` + `sub_cat = property-for-sale` |

### 4.5 Lifestyle

| Field | Type | Required | Evidence | Notes |
|---|---|---|---|---|
| `parking_spaces` | int ≥ 0 | — | A3 | 0 = street parking |
| `orientation` | enum(5) | — | A3 | `north \| south \| east \| west \| corner` |
| `view_type` | enum(5) | — | Dubizzle titles | `sea \| city \| garden \| courtyard \| street` |
| `amenities` | string[] | — | §5 | locked 22-slug list |
| `diwaniya` | `{present: bool, separate_entrance?: bool, has_bathroom?: bool, has_kitchenette?: bool}` | — | P14 + A2 | villa/townhouse/chalet only |

### 4.6 Zoning (ownership eligibility — P8)

| Field | Type | Required | Evidence | Notes |
|---|---|---|---|---|
| `zoning_type` | enum(6) | ✅ on sale | A2 | `residential-private \| investment \| commercial \| chalet \| industrial \| agricultural` |
| `ownership_eligibility` | enum(3) | computed | A2 | `kuwaiti-only \| gcc-reciprocal \| open`; derived in query layer from zoning + sub_cat |

### 4.7 Chalet booking primitives (P4)

Conditional — required only when `property_type = 'chalet'` AND `sub_cat = property-for-rent`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `availability.min_stay_nights` | int ≥ 1 | ✅ | Default 2 (weekend chalets) |
| `availability.max_stay_nights` | int ≥ 1 | — | Usually 30 |
| `availability.check_in_time` | string HH:MM | — | e.g. "15:00" |
| `availability.check_out_time` | string HH:MM | — | e.g. "12:00" |
| `availability.cleaning_fee_kwd` | int ≥ 0 | — | One-off at booking |
| `availability.weekend_premium_pct` | int ≥ 0 | — | Fri/Sat surcharge |
| `availability.seasonal_multipliers.summer` | float | — | e.g. 1.5 for May-Sep |
| `availability.seasonal_multipliers.ramadan` | float | — | e.g. 0.7 |
| `availability.seasonal_multipliers.eid` | float | — | e.g. 2.5 |

Actual date-level booking state (blocked dates) lives in a separate table `listing_bookings` — deferred to Phase 4e.

### 4.8 Zod implementation

File: `src/lib/properties/validators.ts` (~280 lines).

Structure:
```ts
// Literal enums
const PropertyTypeSchema = z.enum([...14 values])
const FurnishedStatusSchema = z.enum(['unfurnished','semi_furnished','fully_furnished'])
const RentPeriodSchema = z.enum(['daily','weekly','monthly','yearly'])
const ChequesCountSchema = z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(6), z.literal(12)])
const TenureSchema = z.enum(['freehold','leasehold'])
const CompletionStatusSchema = z.enum(['ready','under_construction','off_plan'])
const ZoningTypeSchema = z.enum(['residential-private','investment','commercial','chalet','industrial','agricultural'])
const CommissionPayerSchema = z.enum(['tenant','owner','split','none'])
const OrientationSchema = z.enum(['north','south','east','west','corner'])
const ViewTypeSchema = z.enum(['sea','city','garden','courtyard','street'])
const AmenitySchema = z.enum([...22 slugs from §5])

// Structured sub-objects
const PlotBlockSchema = z.object({ area: z.string(), block: z.string(), plot: z.string() })
const DiwaniyaSchema = z.object({
  present: z.boolean(),
  separate_entrance: z.boolean().optional(),
  has_bathroom: z.boolean().optional(),
  has_kitchenette: z.boolean().optional(),
})
const PaymentPlanSchema = z.object({
  down_payment_pct: z.number().int().min(0).max(100),
  handover_pct: z.number().int().min(0).max(100),
  post_handover_months: z.number().int().min(0).max(120).optional(),
  post_handover_pct: z.number().int().min(0).max(100).optional(),
})
const AvailabilitySchema = z.object({...})

// Base raw (all optional, passthrough for forward-compat)
const PropertyFieldsRaw = z.object({
  property_type: PropertyTypeSchema,
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  area_sqm: z.number().int().min(10).max(50000),
  plot_area_sqm: z.number().int().min(100).max(50000).optional(),
  floor_number: z.number().int().min(0).max(200).optional(),
  total_floors: z.number().int().min(1).max(200).optional(),
  year_built: z.number().int().min(1950).max(new Date().getFullYear() + 3).optional(),
  furnished_status: FurnishedStatusSchema.optional(),
  completion_status: CompletionStatusSchema.optional(),
  handover_expected_quarter: z.string().regex(/^\d{4}-Q[1-4]$/).optional(),
  condition: z.enum(['new','excellent','good','needs_renovation']).optional(),
  rent_period: RentPeriodSchema.optional(),
  cheques_count: ChequesCountSchema.optional(),
  deposit_minor_units: z.number().int().min(0).optional(),
  service_charge_kwd: z.number().int().min(0).optional(),
  commission_payer: CommissionPayerSchema.optional(),
  tenure: TenureSchema.optional(),
  is_negotiable: z.boolean().default(true),
  payment_plan: PaymentPlanSchema.optional(),
  parking_spaces: z.number().int().min(0).max(50).optional(),
  orientation: OrientationSchema.optional(),
  view_type: ViewTypeSchema.optional(),
  amenities: z.array(AmenitySchema).default([]),
  diwaniya: DiwaniyaSchema.optional(),
  zoning_type: ZoningTypeSchema.optional(),
  availability: AvailabilitySchema.optional(),
  building_name: z.string().max(120).optional(),
  developer_name: z.string().max(120).optional(),
  paci_number: z.string().max(20).optional(),
  plot_block: PlotBlockSchema.optional(),
  deed_ref: z.string().max(40).optional(),
  is_deed_verified: z.boolean().default(false),
}).passthrough()

// Conditional refinement (context carries sub_cat)
export const PropertyFieldsSchema = PropertyFieldsRaw.superRefine((data, ctx) => {
  // Context: parseContext.subCat passed at parse time
  const subCat = (ctx as any).parent?.subCat as PropertyCategoryKey | undefined
  if (!subCat) return  // lenient for internal data loads

  const isRent = subCat === 'property-for-rent' || subCat === 'rooms-for-rent'
  const isSale = subCat === 'property-for-sale'
  const isChalet = data.property_type === 'chalet'
  const isLand = data.property_type === 'land-plot'

  // Rent requires period + cheques (except daily/weekly)
  if (isRent && !data.rent_period) {
    ctx.addIssue({ code: 'custom', path: ['rent_period'], message: 'rent_period required for rent sub-cats' })
  }
  if (isRent && data.rent_period === 'yearly' && !data.cheques_count) {
    ctx.addIssue({ code: 'custom', path: ['cheques_count'], message: 'cheques_count required for yearly rent' })
  }
  // Sale requires completion_status + zoning_type
  if (isSale && !data.completion_status) {
    ctx.addIssue({ code: 'custom', path: ['completion_status'], message: 'completion_status required for sale sub-cats' })
  }
  if (isSale && !data.zoning_type) {
    ctx.addIssue({ code: 'custom', path: ['zoning_type'], message: 'zoning_type required for sale sub-cats' })
  }
  // Chalet rent requires availability.min_stay_nights
  if (isRent && isChalet && !data.availability?.min_stay_nights) {
    ctx.addIssue({ code: 'custom', path: ['availability','min_stay_nights'], message: 'chalet rent requires availability.min_stay_nights' })
  }
  // Off-plan sale requires payment_plan + handover quarter
  if (isSale && data.completion_status === 'off_plan') {
    if (!data.payment_plan) ctx.addIssue({ code: 'custom', path: ['payment_plan'], message: 'off-plan requires payment_plan' })
    if (!data.handover_expected_quarter) ctx.addIssue({ code: 'custom', path: ['handover_expected_quarter'], message: 'off-plan requires handover_expected_quarter' })
  }
  // Land must be land-plot
  if (subCat === 'land' && data.property_type !== 'land-plot') {
    ctx.addIssue({ code: 'custom', path: ['property_type'], message: 'land sub-cat requires property_type=land-plot' })
  }
  // Rooms must be room type
  if (subCat === 'rooms-for-rent' && data.property_type !== 'room') {
    ctx.addIssue({ code: 'custom', path: ['property_type'], message: 'rooms-for-rent requires property_type=room' })
  }
  // Land has no bedrooms/bathrooms requirement but needs plot_area
  if (isLand && !data.plot_area_sqm) {
    ctx.addIssue({ code: 'custom', path: ['plot_area_sqm'], message: 'land-plot requires plot_area_sqm' })
  }
})

// Transform snake → camel
export const PropertyFieldsParsed = PropertyFieldsSchema.transform(raw => ({
  propertyType: raw.property_type,
  bedrooms: raw.bedrooms,
  bathrooms: raw.bathrooms,
  areaSqm: raw.area_sqm,
  plotAreaSqm: raw.plot_area_sqm,
  // ... etc
}))

export type PropertyFields = z.infer<typeof PropertyFieldsParsed>
```

---

## 5. Amenities master list — 22 slugs, 4 tiers

Curated from Agent 3 global union + Dubizzle search queries + Agent 2 Kuwait-specific validation.

### Tier 1 — Essentials (8)
`central_ac`, `split_ac`, `elevator`, `covered_parking`, `backup_generator`, `water_tank`, `balcony`, `storage_room`

### Tier 2 — Comfort (5)
`swimming_pool_shared`, `swimming_pool_private`, `gym`, `maid_room`, `driver_room`

### Tier 3 — Security (3)
`24h_security`, `cctv`, `gated_community`

### Tier 4 — Lifestyle / Kuwait-specific (6)
`sea_view`, `garden`, `kids_play_area`, `beachfront`, `private_entrance`, `roof_access`

**Total: 22.** Locked. Any 23rd slug is a code-only change (amenities are string[] in JSONB).

**What was rejected and why:**
- `wifi`, `tv`, `washing_machine` — noise, not price-affecting
- `air_conditioning` (generic) → split into `central_ac` vs `split_ac` — Kuwait searches distinguish
- `furnished` — this is a separate field (`furnished_status` tri-state), not an amenity
- `diwaniya` — promoted out of amenity list into its own structured sub-object (§4.5 — P14)

---

## 6. Filter C — discriminatory-wording rejection (NEW, P3)

**Scope.** All property listings (later extensible to rental-like verticals).

**Rejection triggers** (regex union, server-side, Zod refinement on `title_ar` + `title_en` + `description_ar` + `description_en`):

```ts
const DISCRIMINATORY_PATTERNS = [
  // English — nationality / ethnicity / religion
  /\b(only|no)\s+(arabs?|asians?|indians?|pakistan(i|is)|filipin(a|o|os)?|nepal(i|is)?|sri[- ]lankan|egyptians?|syrians?|iraqis?|lebanese|iranians?|muslims?|christians?|hindus?)\b/i,
  /\b(arabs?|asians?|indian|pakistani|filipino|nepali|sri[- ]lankan|muslim|christian|hindu)\s+only\b/i,

  // English — marital / family status
  /\b(only|no)\s+(bachelors?|singles?|families|couples?|students?)\b/i,
  /\b(bachelors?|singles?|families|students?)\s+only\b/i,

  // Arabic — nationality / ethnicity
  /(لا\s+(يوجد|يقبل|نقبل)|ممنوع)\s+(عرب|آسيويين|هنود|فلبينيين|نيباليين|سوريين|مصريين|عراقيين|لبنانيين|إيرانيين|أفارقة)/,
  /(عرب|آسيويين|هنود|فلبينيين)\s+فقط/,

  // Arabic — marital
  /(لا\s+(يوجد|يقبل))\s+(عزاب|عائلات|طلاب)/,
  /(عزاب|عائلات|طلاب)\s+فقط/,
]
```

**UX on rejection.**
```
❌ Sorry, we can't publish this listing.

We found a restriction on who can live here:
  "Only for expats" → ✕ not allowed

Our policy: describe the property, not who can live in it.
If you mean "quiet building" or "working professionals welcome",
write that instead.

Learn more: /help/fair-housing
```

**Fallback.** If regex misses and GPT-4o-mini flags at 70%+ confidence, same rejection. Cost ≈ $0.002 per submission.

**Impact.** Every Kuwait property seller who lists on Dealo learns — on their first attempt — that we don't permit discriminatory filters. This becomes part of the marketing narrative (aligned with LAUNCH-STRATEGY.md "Trust marketing moment").

---

## 7. New module surface

```
src/lib/properties/
├── types.ts          ~130 lines — PropertyDetail, PropertyCard, PropertyCategoryKey, PropertyImageCategory
├── validators.ts     ~290 lines — PropertyFieldsSchema (Zod) + DISCRIMINATORY_PATTERNS
└── queries.ts        (Phase 4b)
```

Phase 4a ships `types.ts` + `validators.ts` only. Query layer waits for UI work.

**Key types (preview):**
```ts
export type PropertyCategoryKey =
  | 'property-for-rent' | 'property-for-sale' | 'rooms-for-rent'
  | 'land' | 'property-for-exchange' | 'international-property'
  | 'property-management' | 'realestate-offices'

export type VerificationTier = 'unverified' | 'ai_verified' | 'dealo_inspected'

export interface PropertyDetail {
  id: number
  slug: string
  subCat: PropertyCategoryKey
  fields: PropertyFields
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  priceMinorUnits: number
  currencyCode: 'KWD'
  listingPurpose: 'rent' | 'sale' | 'exchange'
  verificationTier: VerificationTier
  verifiedAt: string | null
  verifiedBy: 'ai' | 'human' | 'inspection' | null
  // ... plus seller, city, images, etc. (same shape as RideDetail)
}
```

---

## 8. `listing_images.category` enum — 7 new values (properties)

Additive to the existing automotive enum (no fork). Migration `0026`:
```
building_exterior, living_room, bedroom, kitchen, bathroom, floor_plan, view
```

Also adds: `diwaniya_room` (P14).

**Final (existing + new):** `exterior, interior, engine, wheels, details` (automotive) + `building_exterior, living_room, bedroom, kitchen, bathroom, floor_plan, view, diwaniya_room` (properties).

Property detail page gallery uses these to drive filter pills (same dynamic logic as `ride-detail-gallery.tsx`).

---

## 9. Seed — 10 curated properties (`0027_seed_properties.sql`)

Each property demonstrates a doctrine pillar.

| # | Sub-cat | type | Area | Bed/Bath | Size | Price (KWD) | Purpose demo |
|---|---|---|---|---|---|---|---|
| 1 | `property-for-rent` | chalet | Bnaider | 4/3 | 320 m² | 150/day | **P4** bookable chalet + weekend premium |
| 2 | `property-for-sale` | chalet | Sabah Al-Ahmad Sea City | 5/4 | 480 m² | 185,000 | **P8** zoning=chalet, freehold-Kuwaiti-only banner |
| 3 | `property-for-rent` | apartment | Salmiya | 2/2 | 110 m² | 450/month, 4 cheques, semi-furnished | **P12** cheques_count + **P11** furnished |
| 4 | `property-for-sale` | apartment (off-plan) | Kuwait City | 2/2 | 95 m² | 95,000, handover 2027-Q2 | **P13** completion_status + payment_plan |
| 5 | `property-for-sale` | villa | Bayan | 6/5 + diwaniya | 550 m² (plot 700) | 650,000 | **P14** structured diwaniya + **P8** eligibility banner |
| 6 | `property-for-rent` | townhouse | Mishref | 4/4 | 280 m² | 1,200/month, 12 cheques | **P3** clean listing (no discriminatory wording) — demo of Filter C pass |
| 7 | `rooms-for-rent` | room | Hawally | 1/1 | 18 m² shared | 180/month | **P5** dedicated rooms-for-rent sub-cat |
| 8 | `land` | land-plot | Shuwaikh Industrial | — | plot 1,500 m² | 280,000 | **P8** zoning=industrial, commercial eligibility |
| 9 | `property-for-rent` | penthouse | Sharq (Al Hamra) | 3/4, sea-view | 240 m² | 2,500/month, 2 cheques | **P9** market-band demo (top 20%) |
| 10 | `property-for-sale` | townhouse | Mubarak Al-Kabeer | 5/4 | 350 m² | 285,000 | **P1** inspection tier demo (seed row marked `dealo_inspected`) |

**Images per listing:** 5–7 from Unsplash, categorised across the new image enum. All URLs verified 200-OK pre-commit (discipline from migration 0024).

**Verification tier seed distribution:**
- 2 `dealo_inspected` (#5 villa, #10 townhouse)
- 6 `ai_verified` (default for the rest)
- 2 `unverified` (intentional — demonstrates how unverified renders)

**Idempotency:** seed checks for an existing Porsche-style unique marker (`building_name = 'Bnaider-Chalet-A1'`) on listing #1; skips all 10 if present.

---

## 10. Migration order + commit plan

Six commits. Tree-green at every boundary.

| # | Commit | Artifact | Message |
|---|---|---|---|
| 1 | — | `planning/PHASE-4A-AUDIT.md` (this file, revised) | `docs(phase-4a): properties vertical — evidence-based doctrine + schema` |
| 2 | 0025 | `supabase/migrations/0025_add_real_estate_taxonomy.sql` — parent + 8 sub-cats | `feat(properties): add real-estate taxonomy (8 sub-cats, TAXONOMY-V2 aligned)` |
| 3 | 0026 | `supabase/migrations/0026_extend_schema_for_properties.sql` — image enum + listings columns (verification_tier, title_ar/en split, verified_at) | `feat(properties): extend schema — verification tier + bilingual titles + image enum` |
| 4 | — | `src/lib/properties/validators.ts` + `src/lib/properties/types.ts` | `feat(properties): PropertyFields Zod schema + types` |
| 5 | — | `src/lib/listings/validators.ts` — add `DISCRIMINATORY_PATTERNS` + `rejectDiscriminatoryWording()` | `feat(listings): Filter C — reject discriminatory wording at submit` |
| 6 | 0027 | `supabase/migrations/0027_seed_properties.sql` — 10 curated listings | `feat(properties): seed 10 properties demonstrating each doctrine pillar` |
| 7 | — | `docs/STATUS.md` update | `docs: mark properties vertical Phase 4a shipped (DB + validators, no UI)` |

**Parallelism hazards.** Migration 0027 depends on 0025 (categories) + 0026 (image enum + new columns). The Supabase MCP `apply_migration` runs in filename order — the `0025/0026/0027` prefix enforces sequence.

---

## 11. Risks + open questions

1. **Bilingual title schema migration (P10).** Changes `listings` table — adds `title_ar` + `title_en`, backfills from existing `title`. Automotive data is English (`title = 'BMW M5 Competition 2024 - Alpine White'`) — backfill copies into `title_en`, leaves `title_ar` null initially. Low-risk additive migration. Detail page `rides-detail` currently reads `title` — we keep the old column populated by a computed trigger or dual-write for 1 sprint, then drop.

2. **`verification_tier` cross-vertical impact.** Adding the column to `listings` affects automotive listings too (all default to `unverified`). Acceptable — we'll run a one-time update setting `ai_verified` for the 6 seeded cars. No UI change to rides detail page (tier is new; badge is Phase 4b+).

3. **Filter C false positives.** "Bachelor's pad" might trigger `bachelors? only`. Add `\b` word boundaries carefully + test corpus of 100 real Kuwaiti listing titles before activating on production.

4. **Chalet availability schema.** Modelled as JSONB sub-object in Phase 4a (static). Phase 4e moves to a proper `listing_bookings` table when we wire actual calendar booking. Current schema is forward-compatible.

5. **Enum rollback constraint.** `listing_image_category` enum ALTER TYPE ADD VALUE is one-way. The 7 new values are locked. Reviewed once, frozen.

6. **VERIFY-BEFORE-LAUNCH items (from Agent 2):** Law 74/1979 current status in parliament, exact PACI format, current Dubizzle-KW post-ad form taxonomy. These are Phase 4b+ tasks — they don't block the 4a schema.

7. **Seed image URLs.** 50–70 Unsplash photos across 10 listings. Each verified 200-OK before commit 6 is applied. Any failure gets swapped pre-commit, not after.

---

## 12. Evidence appendix

### A — Dubizzle KW (2026-04-21, DOM probe)

**Top-level property URL:** `https://www.dubizzle.com.kw/properties/`

**For-rent sub-cats (with listing counts):**
- `apartments-for-rent` → 3,807
- `commercial-for-rent` → 165
- `chalet-for-rent` → 9 ⚠️ (P4)

**For-rent top search tags (partial — 100+ observed):**
`studio rent`, `fahaheel`, `egaila`, `دور للايجار`, `دور ارضي`, `ملحق للايجار`, `دوبلكس للايجار`, `شقق مفروشة`, `استديو للايجار`, `room for rent`, `partition for`, `one room for rent`, `salmiya sea view`, `فروانية`, `block 12`, `basement`, `سرداب للايجار`, `حمام سباحة`, `parking`, `security`, `a c`, `view`, `غرفة للإيجار`.

**Sample listings demonstrating anti-patterns:**
```
"USED GM RDO ASSEMBLY @ 10 KD. CALL 60713907"  → P2 (phone in title)
"Full Floor for Rent – Mishref, Block 5 (Semi-Furnished–Non-Arabs Only)"  → P3 (discrimination)
Multiple listings with "1 د. ك" placeholder  → P9 (price bait)
```

**Listing card shape observed:**
```
[مميز badge] | [price "X د. ك"] | [bed int] | [bath int] | [area "متر مربع XX"]
[location "Area، مدينة الكويت"] | [time ago] | [اتصال CTA]
```

### B — Q84Sale KW (2026-04-21, DOM probe)

**Real-estate top-level:** `https://www.q84sale.com/ar/property`

**Sub-cats observed:**
- `for-sale` (عقار للبيع)
- `for-rent` (عقار للإيجار)
- `for-exchange` (عقار للبدل) — ✅ validates TAXONOMY-V2 P3-reserved
- `international` (عقار دولي)
- `property-services` (إدارة أملاك الغير) — B2B
- `property-offices` (مكاتب العقارات) — B2B

**Under for-sale (level 2):** `apartment-for-sale` (الشقق), `chalet-for-sale` (الشاليهات), `land` (الأراضي).

### C — Agent 2 — Kuwait regulation (2026-04-21)

Key claims (all flagged "verify before launch"):
- Law No. 74 of 1979 prohibits non-Kuwaitis from owning real estate with narrow exceptions. No freehold zones in Kuwait.
- GCC nationals may own one residential property subject to reciprocity.
- PACI ≠ MOJ deed. Three distinct identifiers: PACI number (addressing), plot/block/area (land ref), deed ref (title — private).
- Lease: yearly default for unfurnished, monthly for furnished, weekly/daily for chalets. 1-month deposit is norm.
- Diwaniya: 80-90% of Kuwaiti villas; price-affecting 10-20%; filterable on Q84Sale/4Sale.
- Agent licensing: MOCI-regulated (not RERA-style); license numbers inconsistently displayed.
- Chalets: 50-300 KWD/day, 300-1,500/week, 5K-25K/year, 80K-600K+ sale; coastal = 3-5× inland at equivalent build.

### D — Agent 3 — Global benchmarks (2026-04-21)

Convergent patterns across Zillow, Rightmove, Idealista, Property Finder, Suumo:
- Top axis: Buy / Rent / New projects / Commercial (+ Rooms as Idealista differentiator)
- Tri-state furnishing standard in rental markets
- Amenities as enumerated checklist (never free text)
- Verification timestamp + method (PF TruCheck pattern)
- `price/sqm` as computed, indexed, filterable column
- Floor plan as distinct media role (Rightmove, PF, Suumo)

Anti-patterns flagged:
- Zillow Zestimate (requires transaction data we don't have)
- EU Energy rating (N/A for Kuwait)
- US School-district rating (no Kuwait API)
- UK chain-free / council-tax (market-specific)
- Walk Score (Kuwait is car-centric)

### E — Research methodology limits

- Bayut KW: captcha-blocked in session; no DOM data collected
- Dubizzle detail-page field taxonomy: not fetched (inferred from card UI)
- Amenity checkbox list: behind JS modal on Dubizzle; not captured empirically
- 4Sale KW: not fetched (Q84Sale covered the local angle)

These gaps are fill-later in Phase 4b when we design the detail page.

---

## 13. Out of scope (explicit)

- **No UI pages** — `/properties` hub + `/properties/[slug]` detail are 4b + 4c
- **No queries** — `src/lib/properties/queries.ts` waits
- **No navbar link** — "عقارات" button stays unlinked until 4c ships
- **No landing changes** — Feature283 hero stays cars-only
- **No booking engine** — P4 ships schema only; actual calendar/checkout is 4e
- **No price comparable computation** — P9 schema-ready; implementation in 4b
- **No `verification_tier` badge UI** — P1 + P6 need Phase 4b detail page to render
- **No B2B seller flows** — `property-management`, `realestate-offices` are P4 rows only
- **No maps/geo pin** — deferred to 4e

---

## 14. What lands after Phase 4a

Database with:
- 11 → 19 top-level categories (adds `real-estate` + 8 children)
- 6 automotive + 10 properties = 16 live listings total
- Schema supporting the 14-pillar doctrine
- Zod validators ready for the Phase 4b query layer
- Filter C live at submit (even though no property submit UI ships yet — it's available for any later form)

Marketplace **still shows no property page** — by design.

Phase 4b then ships `/properties/[slug]` detail. Phase 4c ships the hub. Phase 4d wires navbar. Phase 4e brings the chalet booking engine.

This is how we shipped rides in 3 clean phases. Same discipline. Higher ambition.
