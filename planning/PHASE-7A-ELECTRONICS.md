# Phase 7a — Dealo Electronics: Doctrine, Schema, Seed

> **Author:** Claude Code · **Date:** 2026-04-21 · **Sister docs:** PHASE-3B-AUDIT (Rides), PHASE-4A-AUDIT (Properties), PHASE-6A-AI-NEGOTIATOR
> **Depends on:** migrations 0015 (`category_fields` JSONB), 0026 (`verification_tier`), `src/lib/properties/` module (pattern)
> **Strategically aligned with:** `DECISIONS.md` (chat-only contact, AI-protected listings), `LAUNCH-STRATEGY.md` §10 (trust over volume)

---

## Executive Summary

Electronics is the second-highest-velocity C2C category in Kuwait after Automotive — phones especially. Dubizzle Kuwait's `electronics` section runs ~3 100 active listings on a normal weekday (April 2026), Q84Sale roughly half that. **Both platforms have the same structural failures we documented for Properties** (phone-in-title, 1-KWD bait, no spec verification) **plus three category-specific ones**:

1. **Counterfeit AirPods, iPhones, and watches** posted with stolen Apple marketing photos. Buyers discover at handover — too late.
2. **Region-locked / carrier-locked devices** sold without disclosure. Buyer pays 250 KWD for an iPhone that won't activate on Zain.
3. **Battery health undisclosed.** Sellers post "iPhone 13 Pro 256GB excellent" — battery is at 71%, replacement is 65 KWD at Apple Kuwait, deal goes south.

**Dealo Electronics positioning: every spec verified, every battery disclosed, every IMEI scannable.** Fewer listings, higher trust-per-listing.

This audit locks the Phase 7a foundation:
- 12-pillar doctrine mapping observed market weakness → concrete answer
- 6-sub-cat taxonomy (already in DB seed via migration 0001) validated for fit
- `category_fields` Zod schema covering 28 fields grouped into 5 domains
- Sub-cat-specific conditional-required semantics (phones need IMEI, laptops need cycles, cameras need shutter count, …)
- Reuses Filter B (counterfeit terms) from luxury — already shipping in `validators.ts`
- 6-listing seed at Phase 7e, one per sub-cat, each demonstrating one doctrine pillar

3 commits ship this phase: 7a (doctrine + schema + tests), 7b (sell-wizard branch), 7c+7d (detail + hub pages), 7e (seeds).

---

## 0. Research methodology + evidence

| Source | Fidelity | What it told us |
|---|---|---|
| Dubizzle Kuwait `/electronics/mobile-phones` | HIGH (live observation 2026-04-21) | iPhone listings dominate; "battery health" mentioned in description but rarely structured; "original" / "أصلي" used to deny counterfeit but unverifiable |
| Q84Sale Kuwait `/electronics` | HIGH (live observation 2026-04-21) | Mirrors Dubizzle's category tree; same anti-patterns |
| Apple Kuwait warranty practice | MEDIUM (Apple support docs + Kuwait market knowledge) | Apple warranty is country-locked. Phones bought outside Kuwait (US, UAE, China grey market) carry no Apple Kuwait warranty. Battery service is country-locked too |
| Kuwait MOC IMEI blacklist | MEDIUM (CITRA published policy) | Stolen-phone IMEI blacklist exists; phones flagged stop accepting Kuwait SIM cards. Dealo can't query the blacklist programmatically yet, but can require IMEI-last-4 disclosure so buyers can manually check at any Apple/Samsung store |
| eBay + Swappa US (global benchmark) | MEDIUM (well-documented patterns) | Battery health %, IMEI prefix, condition grade taxonomy (mint/excellent/good/fair/parts), photo guidelines |
| StockX (luxury-tech overlap) | LOW (general knowledge) | Authentication-on-pickup workflow — informs our Dealo-Inspected tier UX for high-value tech |

**HIGH-fidelity claims** lock the doctrine. **MEDIUM** claims drive the field shape but should be revisited if a buyer/seller flags a mismatch. **LOW** claims are aspirational only — we won't ship a process around StockX-style escrow until volume justifies it.

---

## 1. The 12 doctrine pillars

Each pillar maps to (a) an observed competitor failure, (b) a concrete Dealo behaviour, and (c) a system component that enforces it.

### P1 — Spec accuracy is non-negotiable

**Failure observed:** Sellers list "iPhone 14 256GB" when device is 128GB. Buyer discovers at handover.

**Dealo answer:** Storage / RAM / screen-size are **structured fields**, not free text. Filterable on hub. Surfaced in a fixed spec table on detail. Mismatch with photo's IMEI lookup = listing flagged for review.

**Enforced by:** `ElectronicsFieldsRaw` Zod schema (storage_gb, ram_gb, screen_size_inches as numbers, validated ranges).

### P2 — Counterfeit defence

**Failure observed:** Knock-off AirPods, fake iPhones, replica Apple Watches sold as "original / أصلي".

**Dealo answer:** Filter B (already built for luxury) extended to electronics. Words like "1st copy", "replica", "high copy", "تقليد", "ماستر كوبي" reject the listing at submit. The seller of a real device gets through; the counterfeit seller doesn't.

**Enforced by:** `containsCounterfeitTerm()` from `src/lib/listings/validators.ts` applied at publish for the electronics parent.

### P3 — IMEI / serial disclosure

**Failure observed:** Stolen phones blacklisted by Kuwait MOC sold to unsuspecting buyers. Buyer's SIM stops working day 2.

**Dealo answer:** **For phones, smart-watches with cellular, and tablets**, the wizard requires `imei_last_4` as a structured field. Surfaced on detail page so buyer can walk into any operator and verify status before paying.

**Enforced by:** Zod `superRefine` — phone sub-cat requires imei_last_4.

### P4 — Battery health % for everything battery-powered

**Failure observed:** "iPhone 13 excellent" with battery at 71%. Buyer pays full price for a device needing immediate battery service.

**Dealo answer:** Phones, tablets, laptops, smart-watches, gaming handhelds all carry a `battery_health_pct` field (0-100). Buyers see a colored bar (green ≥85, amber 70-84, red <70). Listings without it carry a "Battery health undisclosed" warning chip — strong nudge.

**Enforced by:** Schema field + UI bar on detail. Not strictly required (some sellers genuinely can't read it on Android) but absent ⇒ visible warning.

### P5 — Region / carrier lock disclosure

**Failure observed:** US-spec iPhones (eSIM-only, no physical SIM) sold to Kuwait buyers who need physical SIM. Carrier-locked phones from Zain sold to STC subscribers.

**Dealo answer:** `region_spec` enum (`gcc | us | eu | jp | other`) + `carrier_lock` enum (`unlocked | zain | stc | ooredoo | other`). Surfaced as chips on the detail page. Region "other" with no further explanation triggers a buyer-side warning.

**Enforced by:** Schema enums + detail page renders both as visible chips, not buried.

### P6 — Original receipt + warranty status

**Failure observed:** Apple Kuwait warranty is country-locked. Grey-market US iPhones sold as "with warranty" — Apple Kuwait won't honour.

**Dealo answer:** `warranty_status` enum (`active_kuwait | active_international | expired | none`) + `purchase_country` enum + boolean `has_original_receipt`. Detail page shows a **Trust Panel** with all three side-by-side.

**Enforced by:** Schema fields + dedicated detail-page section.

### P7 — Box + accessories transparency

**Failure observed:** "BNIB iPhone 15" turns out to be open-box with no charger. Listing didn't lie outright but didn't disclose either.

**Dealo answer:** `box_status` enum (`bnib | open_box | no_box`) + `accessories_included` array (charger / cable / earphones / case / box-only). Affects pricing 10-15% and buyers know it — exposing it builds trust.

**Enforced by:** Schema + detail-page accessories chip row.

### P8 — Repair history disclosure

**Failure observed:** Phone screen replaced with aftermarket part (cheaper, looks identical). Buyer discovers when face-ID / true-tone fails.

**Dealo answer:** `repair_history` array (`screen_replaced | battery_replaced | back_glass_replaced | logic_board_replaced | none`) + boolean `original_apple_parts` for Apple devices. Honest sellers are rewarded with the visible badge "All original parts".

**Enforced by:** Schema fields + a dedicated visual chip on detail.

### P9 — Condition grade taxonomy (not free text)

**Failure observed:** "Excellent condition" means different things to different sellers. Buyer expects mint, gets visible scratches.

**Dealo answer:** Locked 5-grade scale: `mint | excellent | good | fair | for_parts`. Each grade has a consumer-facing definition rendered next to the badge ("Mint = no visible wear, like new").

**Enforced by:** Existing `ConditionEnum` in listings validators — already used elsewhere. We add a stricter electronics-tier mapping that translates between the seller-facing 6-condition enum and the buyer-facing 5-grade enum. Net result: same data layer, sharper UX.

### P10 — Photo guidelines for verification

**Failure observed:** Sellers post Apple's marketing renders. Buyer can't tell if seller actually owns the device.

**Dealo answer:** **Power-on photo** (device on, time + Wi-Fi visible) + **IMEI photo** (Settings → About → IMEI shown) + **battery health screenshot** (Settings → Battery → Battery Health for iPhone) recommended on the wizard. Listings with these get a "Verified photos" chip.

**Enforced by:** Wizard UX nudge (not blocking) + `verification_tier` upgrade path: AI-verified for listings with structured spec match between photo OCR and declared fields.

### P11 — Trade-in friendly

**Failure observed:** "iPhone 13 → iPhone 15 + 200 KWD top-up" deals happen daily but neither Dubizzle nor Q84Sale models them. Trade chats happen in DM, fall through.

**Dealo answer:** `accepts_trade` boolean + `trade_for_models` text (free text — too open-ended to enum). The detail page surfaces a "Open to trade" badge. Future Phase: structured trade-in flow.

**Enforced by:** Schema boolean + detail-page badge.

### P12 — Bilingual technical terms — keep brand+model latin

**Failure observed:** "آيفون 15 برو ماكس" reads weird; buyers search "iPhone 15 Pro Max" anyway. Dubizzle force-translates and tanks SEO.

**Dealo answer:** Brand + model fields stay latin even on Arabic listings. Title may carry both. Wizard validates the brand field is one of a known list (Apple, Samsung, Sony, Xiaomi, Nintendo, Sony PlayStation, Microsoft Xbox, Asus, Dell, HP, Lenovo, MacBook, ...).

**Enforced by:** Schema enum + wizard.

---

## 2. The 6 sub-categories — taxonomy fit

The DB already seeds 6 sub-cats under the `electronics` parent (migration 0001). They map cleanly to Kuwait market reality:

| Slug | Arabic | Why it stands alone (not merged) |
|---|---|---|
| `phones-tablets` | موبايلات وأجهزة لوحية | Highest volume; IMEI + battery + region lock fields apply |
| `laptops-computers` | لابتوبات وكمبيوترات | CPU + GPU + battery cycles + storage type — different shape entirely |
| `tvs-audio` | تلفزيونات وصوتيات | Screen size + resolution + smart OS + speaker watts |
| `gaming` | ألعاب فيديو وأجهزة | Console gen + controllers + games-included list |
| `smart-watches` | ساعات ذكية وإكسسوارات | Size mm + cellular + battery health |
| `cameras` | كاميرات ومعدات تصوير | Sensor + lens mount + shutter count |

**No merges, no splits.** The 6 sub-cats give us enough field divergence to justify per-sub-cat conditional schemas without the complexity of the Properties 8-sub-cat tree.

---

## 3. `ElectronicsFieldsRaw` — the schema

All 28 fields in 5 logical domains. Snake-case at the DB layer (mirrors `listings.category_fields`); `toElectronicsFields()` transforms to camelCase for consumers (mirror of `toPropertyFields`).

### Domain 1 — Identity (5 fields)

| Field | Type | Required | Notes |
|---|---|---|---|
| `device_kind` | enum | always | One of the 6 sub-cat-aligned kinds (phone, tablet, laptop, desktop, tv, soundbar, console, smart_watch, camera, lens, accessory) — finer than sub-cat for filtering |
| `brand` | text | always | Free text, max 60 chars; consumer-facing |
| `model` | text | always | Free text, max 80 chars |
| `year_of_release` | number | optional | 1980–current |
| `serial_or_imei_last_4` | text | conditional (P3) | Last 4 digits only; never store full IMEI |

### Domain 2 — Specs (8 fields, sub-cat-driven)

| Field | Type | Notes |
|---|---|---|
| `storage_gb` | number | Phones / tablets / laptops / consoles |
| `ram_gb` | number | Phones / tablets / laptops |
| `cpu` | text | Laptops / desktops (free text, max 80) |
| `gpu` | text | Laptops / desktops / cameras |
| `storage_type` | enum | `ssd | hdd | nvme | hybrid | emmc` — laptops |
| `screen_size_inches` | number | TVs / laptops / tablets |
| `resolution` | enum | `hd | fhd | 2k | 4k | 8k` — TVs / monitors |
| `connectivity` | array | `wifi | wifi6 | bluetooth | 5g | lte | ethernet | usb_c | thunderbolt` |

### Domain 3 — Condition + provenance (7 fields)

| Field | Type | Notes |
|---|---|---|
| `condition_grade` | enum | `mint | excellent | good | fair | for_parts` (P9) |
| `battery_health_pct` | number | 0–100 (P4); optional but absence triggers UI warning |
| `battery_cycles` | number | Laptops; 0–2000 |
| `repair_history` | array | `screen | battery | back_glass | logic_board | sensor | none` (P8) |
| `original_parts` | boolean | Apple-spec only; informs the "All original parts" badge |
| `box_status` | enum | `bnib | open_box | no_box` (P7) |
| `accessories_included` | array | `charger | cable | earphones | case | stand | box_only | original_packaging` |

### Domain 4 — Provenance + warranty (4 fields)

| Field | Type | Notes |
|---|---|---|
| `purchase_country` | enum | `kw | sa | ae | qa | bh | om | us | eu | jp | other` (P6) |
| `warranty_status` | enum | `active_kuwait | active_international | expired | none` (P6) |
| `warranty_expires_at` | date | optional ISO date when status active |
| `has_original_receipt` | boolean | (P6) |

### Domain 5 — Lock + locale + trade (4 fields)

| Field | Type | Notes |
|---|---|---|
| `region_spec` | enum | `gcc | us | eu | jp | other` (P5) |
| `carrier_lock` | enum | `unlocked | zain | stc | ooredoo | other` (P5) — phones only |
| `accepts_trade` | boolean | (P11) |
| `trade_for_models` | text | optional, free text describing acceptable trades |

### Conditional-required logic

Per `ElectronicsFieldsRaw.superRefine` consumer:

| Sub-cat | Required additional fields |
|---|---|
| `phones-tablets` | `serial_or_imei_last_4`, `storage_gb`, `region_spec`. If `device_kind = phone` → also `carrier_lock`. |
| `laptops-computers` | `storage_gb`, `ram_gb`, `cpu`, `screen_size_inches` |
| `tvs-audio` | `screen_size_inches` (TVs), `resolution` (TVs) |
| `gaming` | `device_kind` ∈ {console, handheld_console, accessory} ; `storage_gb` for consoles |
| `smart-watches` | `device_kind = smart_watch`, `battery_health_pct` |
| `cameras` | `device_kind` ∈ {camera, lens, accessory}; `lens_mount` for lenses |

A camera lens has its own `lens_mount` enum (`canon_ef | canon_rf | sony_e | nikon_f | nikon_z | m43 | leica_m | other`) — added later in the schema as a 5th-domain extension specific to lenses; not all 28-field cameras use it.

---

## 4. Filter pipeline reuse

| Filter | Existing? | Applied to electronics? |
|---|---|---|
| Filter A (phone-in-text) | YES (Sprint 2) | YES — same regex, same gate |
| Filter B (counterfeit terms) | YES (luxury Sprint 2) | **YES — extended.** Was previously triggered only on luxury subtree; we widen to electronics parent |
| Filter C (discriminatory wording) | YES (Phase 4a) | NO — properties-only; electronics doesn't have a fair-housing analog |

So the only filter change is widening Filter B's trigger condition from "luxury parent only" to "luxury OR electronics parent" — a one-line edit in `publishListing` that we'll ship as part of Phase 7a tests.

---

## 5. Verification tier — what each tier means for electronics

Reuses the cross-vertical `verification_tier` enum from migration 0026.

| Tier | Trigger | Buyer-facing meaning |
|---|---|---|
| `unverified` | Default | "Listing not yet verified" |
| `ai_verified` | Photos pass OCR check (IMEI photo matches declared `serial_or_imei_last_4`, battery-health screenshot matches declared `battery_health_pct`) | "AI verified spec accuracy" |
| `dealo_inspected` | Manual handover at Dealo location, full power-on test, original-parts confirmation via Apple GSX or vendor diagnostic | "Dealo-inspected — power tested + parts verified" |

Phase 7a does NOT ship the AI-photo-OCR pipeline — that's a future phase. We ship the schema fields and the badge-render logic so when the OCR worker lands, the data path is ready.

---

## 6. Out-of-scope for Phase 7

Explicitly deferred to keep the phase shippable:

1. **AI photo OCR worker** (auto-promote `unverified` → `ai_verified` based on photo content). Schema is ready; the worker is its own multi-day project with cost discipline.
2. **Trade-in matching engine** (turn "trade for iPhone 15" into a structured search). Phase 7b.
3. **Spec compare bar** (side-by-side compare for laptops / phones). Already in the global queue (`/rides/compare` was the prototype); we'll generalise once both verticals need it.
4. **IMEI blacklist API** (Kuwait MOC). Not publicly available; manual verification is the workaround.
5. **Bundle pricing** ("phone + AirPods + watch" as one ad). Use the standard listing flow; structured bundling is Phase 8+.

---

## 7. Definition of done

Phase 7a ships when:

- [ ] `planning/PHASE-7A-ELECTRONICS.md` (this doc) committed.
- [ ] `src/lib/electronics/types.ts` + `validators.ts` defined with the 28 fields, 5 domains, 6-sub-cat conditional refinements.
- [ ] Filter B's trigger widened to include the electronics parent in `publishListing`.
- [ ] Vitest suite covering: every required field on every sub-cat, every enum bound, every conditional refinement, fall-through to `for_parts` grade, brand/model latin retention.
- [ ] No new migration needed — `category_fields` JSONB already exists since Phase 3 and accepts the new shape unchanged.
- [ ] Co-worker progress entry in STATUS.md.

Phase 7b (sell wizard) + 7c (detail page) + 7d (hub) + 7e (seeds) ship in subsequent commits.

---

**End of Phase 7a doctrine.**
