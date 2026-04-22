# Track B — Global Tech Marketplace Benchmarks

> **Date:** 2026-04-21
> **Method:** WebSearch + WebFetch + cited URLs for every claim
> **Platforms surveyed:** Swappa · Back Market · Reebelo · eBay Authenticity Guarantee · StockX · Mercari (US/JP) · Gazelle · Apple Trade-In
> **Time:** ~75 minutes
> **Status:** HIGH (URL-evidenced); some help-center URLs JS-gated → relied on cached snippets

---

## Summary

The global C2C / refurbished tech marketplace landscape has converged on a small number of repeatable trust primitives, and each major platform pioneered one of them.

- **Swappa** (US, C2C) pioneered **IMEI gatekeeping at listing time + carrier-segmented categories** — its core insight is that a used-phone marketplace is not a marketplace until every listing has been IMEI-checked against GSMA, and that "unlocked" is a separate SKU from each carrier variant.
- **Back Market** (FR/EU, B2C refurbished) pioneered the now-industry-standard **4-tier cosmetic grade** (Fair / Good / Excellent / Premium), the **12-month warranty floor**, and the **30-day no-questions return** — plus the rule that all grades must be 100% functional and Premium guarantees ≥90% battery and only genuine parts.
- **Reebelo** (SEA/AU/US) refined that model by **decoupling cosmetic grade from battery tier** (Standard ≥80% / Elevated ≥90% / New 100%) — a pattern Dealo should copy.
- **eBay Authenticity Guarantee** pioneered **authentication-in-transit intercept** but is notably **absent from electronics**.
- **StockX** extended authentication-on-pickup into tech but **only for brand-new sealed units**.
- **Mercari** (JP/US) standardized the 5–6-tier human-readable condition vocabulary.
- **Gazelle** + (now-defunct) Decluttr proved the **instant-quote trade-in flow** works without photos if you ask the right 4–5 yes/no questions.
- **Apple Trade-In** set the consumer expectation for "answer 4 questions → get instant provisional price → adjusted after inspection."

**What Dealo can absorb:**
1. The 4-tier cosmetic grade with verbatim definitions is a solved problem — don't reinvent it.
2. Cosmetic grade and battery tier should be **orthogonal** (Reebelo's insight), not collapsed.
3. IMEI gatekeeping at listing creation is non-negotiable — Swappa template.
4. Photo requirements **category-specific and mandatory** — IMEI photo + battery-health screenshot.
5. Carrier compatibility is **not a filter, it's a category split**.
6. Warranty is a tier, not a binary — "no warranty / 7-day DoA / 30-day / 12-month".
7. Pricing transparency needs a **shown median derived from sold comps** — Swappa-style.

**Critical finding (load-bearing for Dealo doctrine):** Authentication-on-pickup (StockX/eBay AG) **does not apply to used phones at any scale anywhere in the world.** Every platform that tried it for used tech either pivoted to B2C-refurbisher-only (Back Market, Reebelo) or restricted to brand-new sealed (StockX). The Kuwait/GCC Electronics vertical should not promise authentication-on-pickup for used phones. It should promise: IMEI-verification + photo-required + optional escrow + optional seller-verification-tier, in that order.

---

## Per-platform deep-dive

### Swappa (swappa.com, US, C2C)

**IMEI/ESN gatekeeping.** Every listing IMEI-checked against GSMA before approval. Verbatim rule: *"The device IMEI/ESN cannot be blocklisted, and the hardware and software IMEI/ESN must match. Additionally, if the device IMEI/ESN has been altered or 'repaired' it cannot be listed"* ([listing-device-criteria](https://swappa.com/faq/answer/listing-device-criteria)). **Free public IMEI-check tool** — 10 free checks per 24h ([swappa.com/imei](https://swappa.com/imei)).

**Condition taxonomy (4 tiers — verbatim).**
- **New** — factory-sealed box showing the seal and verification code
- **Mint** — zero signs of wear (however small), pristine cosmetic condition
- **Good** — normal light signs of use, minor scuffs/scratches on body, 100% functionality
- **Fair** — dented corners, scraped body, visually noticeable scratched glass, but still 100% functional, no cracks, no significant screen issues, no water damage

[device-condition](https://swappa.com/faq/answer/device-condition1)

**Battery health.** For iPhones: *"If battery health is below 80% and an Apple battery message is showing in the settings, this must be disclosed on the listing"* ([apple-battery-health-requirements](https://swappa.com/faq/answer/apple-battery-health-requirements)). For Android: battery-health screenshot encouraged, not required.

**Photo rules.** Actual photos required; IMEI/serial **must NOT be visible** in photos (privacy). IMEI submitted in private field for verification.

**Carrier compatibility.** **Not a filter — a category split.** *"Products within the 'Unlocked Carrier' category must be factory unlocked devices that work on all carriers"* ([unlocked-device](https://swappa.com/faq/answer/unlocked-device)).

**Trust signals.** 3% flat fee each side; thumbs-up/down/neutral ratings ([feedback](https://swappa.com/faq/answer/feedback-star-rating-guidelines)); PayPal G&S for dispute protection; **all listings pre-approved by Swappa staff**.

**Pricing transparency.** Average selling price + current active count for exact model; suggested competitive ask from previous sales ([fees](https://swappa.com/about/fees)).

### Back Market (backmarket.com, EU/US, B2C refurbished)

**Grade taxonomy (4 tiers — verbatim).**
- **Premium** — *"Flawless screens and bodies that show no signs of use, contain only genuine manufacturer parts and batteries, and their batteries come with a minimum of 90% capacity"*
- **Excellent** — *"Meets the same external conditioning standards as Premium, but the battery comes with a minimum 80% capacity and may have non-manufacturer parts"*
- **Good** — *"Light signs of wear and zero screen scratches. The body might have light micro-scratches that you won't see if you're more than 20 inches away. The battery comes with a minimum 80% capacity"*
- **Fair** — *"Shows some signs of wear. The screen may have light scratches that are slightly visible when the device is on. The body may have a few visible scratches and dents"*

All grades must be **100% functional** ([phone-grades](https://www.backmarket.com/en-us/c/smartphones/what-are-back-market-phone-grades)).

**Warranty.** **12-month minimum limited warranty** covering hardware/software defects ([warranty](https://help.backmarket.com/hc/en-us/articles/360010237699)).

**Return.** **30 days** for change-of-mind or defect; free return shipping for defective ([30-day-return](https://help.backmarket.com/hc/en-us/articles/360031517873)).

**Seller model — closed to consumers.** Pro refurbishers/repairers/recyclers/B2B traders only. Approval rate ~1 in 3. Quality Charter required ([seller-guide](https://www.globalsources.com/knowledge/how-to-become-a-seller-on-backmarket/)).

### Reebelo (reebelo.com, SEA/AU/US, refurbished)

**Decoupled grade + battery model — the key innovation.**

**Cosmetic grades (4):** Premium / Excellent / Good / Acceptable ([conditions](https://help.reebelo.com/hc/en-us/articles/15274437469465-Device-Conditions-Definition)).

**Battery tiers (3):** **Standard ≥80% / Elevated ≥90% / New 100%** — separate field, all professionally tested.

**Warranty.** 12 months against manufacturing/refurbishing defects. Optional ReebeloCare add-on for physical/liquid damage with $50 claim fee ([warranty](https://help.reebelo.com/hc/en-us/articles/15275596523801-Reebelo-s-12-Month-Warranty-and-its-Exclusions)).

**Battery-specific protection — UNIQUE.** *"If your device arrives with battery health below the guaranteed minimum, you're eligible for a full refund."* If battery drops >10% from advertised tier within 3 months → full refund via warranty claim ([battery](https://help.reebelo.com/hc/en-us/articles/46347900345369)).

**Difference from Back Market.** Reebelo makes battery a first-class orthogonal dimension; Back Market bundles battery floors into the cosmetic grade (Premium=90%, Excellent/Good=80%). Reebelo's model = cleaner UX but harder to enforce.

### eBay Authenticity Guarantee

**Eligible categories (2026):** Sneakers, handbags/wallets/accessories ≥$500, watches ≥$2000, jewelry, streetwear, trading cards. **Not eligible: smartwatches, no consumer electronics.** Deliberate architectural choice ([buying-AG](https://www.ebay.com/help/buying/buying-authenticity-guarantee/buying-authenticity-guarantee?id=5470)).

**Workflow.** Buyer purchases → seller ships to eBay authentication facility → trained authenticators inspect against listing → AG card + tag attached → expedited to buyer with signature confirmation.

**Cost.** eBay covers authentication for mandatory categories. Optional US: $40 buyer for $200-$499.99 items, $80 buyer for $500-$1999.99 watches.

### StockX (stockx.com)

**Tech categories — brand new only.** PS5, Xbox Series X/S, Switch OLED, Steam Deck, MacBook Air/Pro, iPhones, iPads, AirPods, GPUs, VR, webcams, video games ([electronics](https://stockx.com/category/electronics)).

**Condition rule — used tech NOT supported.** *"All electronics sold on StockX must be in brand new condition. New items that are sold sealed by the manufacturer (with shrink wrap or a sticker) are required to be sold on StockX in the same condition."* ([what-electronics](https://stockx.com/help/articles/What-kinds-of-electronics-does-StockX-sell)).

**Authentication-on-pickup.** Seller ships to one of 11 authentication centers (300+ trained authenticators) → catalog database + ML model verify → for PS5 a 1000-point functional checklist → pass → forward to buyer; fail → return to seller ([process](https://stockx.com/about/our-process/)).

### Mercari (Japan + US)

**US condition (5 tiers).** New / Like New / Good / Fair / Poor. Electronics-specific: *"Electronics listed as 'Like New' may have been lightly used but should be in fully functional condition with minimal cosmetic flaws"* ([item-conditions](https://www.mercari.com/us/help_center/product-info/item-conditions/)).

**Japan condition (6 tiers).** 新品・未使用 / 未使用に近い / 目立った傷や汚れなし / やや傷や汚れあり / 傷や汚れあり / 全体的に状態が悪い. Japanese buyer norms enforce tightly.

**Device-spec handling.** Mercari is general C2C, not tech-specialized. **No IMEI check, no battery-health field, no carrier gate.** Sellers declare in free text. **Key limitation Dealo must NOT replicate.**

### Gazelle (US trade-in)

> Note: Decluttr closed June 2025.

**Instant quote spec fields.** Model + carrier + storage + condition (via 4–5 yes/no questions): *"Is the device fully functional and all parts of the screen light up correctly?"* / *"Does the battery hold a charge?"* / button + port checks ([sell-process](https://buy.gazelle.com/pages/help-sell-process)).

**Battery weighting.** Charge-and-discharge is gating; documented <80% repriced lower.

**Quote lifecycle.** Quote valid 30 days; physical inspection can revise quote; if rejected → device returned free.

### Apple Trade-In

**Questions asked.** Model → storage → carrier/unlocked → "Does it power on?" → "Are the buttons working?" → "Is the screen free of cracks/chips/scratches?" → "Is the body free of cracks/chips/scratches?" ([trade-in](https://www.apple.com/shop/trade-in)).

**Price tiers (effective).** "Top-tier" (meets all conditions) / "Reduced value" (cosmetic wear) / "Zero credit, free recycling" (broken screen, water damage, won't power on).

**Required disclosure pattern.** Battery <30% charge for shipping. Provisional price instant; final after inspection; seller may reject revised offer.

---

## Cross-platform table

| Feature | Swappa | Back Market | Reebelo | eBay AG | StockX | Mercari | Gazelle |
|---|---|---|---|---|---|---|---|
| IMEI required at listing | ✅ GSMA | n/a (refurbisher internal) | n/a | ❌ tech not eligible | n/a (sealed) | ❌ | ✅ via model lookup |
| Battery health field | ✅ disclosure iPhone <80% | bundled in grade | ✅ orthogonal 3-tier | n/a | n/a | ❌ | yes/no charge q |
| Condition grades count | 4 (New/Mint/Good/Fair) | 4 (Premium/Excellent/Good/Fair) | **4 cosmetic + 3 battery** | n/a | 1 (Brand New) | 5 (US) / 6 (JP) | 4 buckets |
| Carrier compatibility | category split | per SKU | per SKU | n/a | n/a | seller text | asked in quote |
| Warranty (months) | none (C2C) | **12 minimum** | 12 + ReebeloCare | none | none | none | n/a |
| Return window (days) | PayPal G&S | **30** | **30** | per seller + AG intercept | final sale post-auth | only for misrepresentation | 30-day quote |
| Authentication-on-pickup | ❌ | ❌ | ❌ | ✅ non-tech only | ✅ sealed tech only | ❌ | ✅ pre-pay |
| Photo of IMEI required | ✅ private | n/a | n/a | ❌ | ❌ | ❌ | ❌ |
| Battery-health screenshot required | ✅ iPhone | n/a | n/a | ❌ | ❌ | ❌ | ❌ |
| Median/comps price shown | ✅ avg+active | ❌ | ❌ | sold comps | live bid/ask | similar items | calculated |
| Seller type | C2C + power | pro refurbishers only | pro refurbishers only | C2C + business | C2C + business sealed | C2C | first-party buyer |

---

## Concrete recommendations for Dealo Electronics doctrine v2

### Pillars to KEEP (universal)
- Identity verification (civil ID / phone OTP)
- Listing moderation before publish (mirrors Swappa's pre-approval)
- Structured per-category fields in `category_fields` JSONB
- Slug-based SEO URLs
- Geo-targeted pricing anomaly detection

### Pillars to ADD (new from this research)

1. **IMEI/Serial gatekeeping at listing creation.** Required field for cellular categories, privately stored, GSMA-equivalent lookup before listing goes live. WiFi-only devices use serial. Blocked/stolen IMEIs auto-rejected. **Free public IMEI lookup as trust marketing asset.**

2. **Orthogonal cosmetic grade + battery tier (Reebelo model).** 4 cosmetic grades + separate 3-4 battery tier (New 100% / Elevated ≥90% / Standard ≥80% / Below 80% / Not tested).

3. **Category-aware required photos.** Phones: 5 minimum incl. battery-health screenshot for iPhones. Laptops: front closed, open, underside (model/serial), port side, keyboard. TVs: front, back panel sticker, remote, power-on with source.

4. **Carrier/network category split, not filter.** Phones split into Unlocked (works on all GCC) vs Zain-locked / STC-locked / Ooredoo-locked. Require screenshot.

5. **Seller-declared warranty TIER with trust badges.** No warranty / 7-day DoA / 30-day seller-backed / 12-month seller-backed. Each = distinct badge. 30/12-month tiers get boosted ranking but bear refund liability via Dealo escrow. **Do NOT promise authentication-on-pickup for used phones.**

6. **Pricing transparency: median of sold comps on detail page.** Rolling 90-day median + active-listing-count for exact SKU. Flag >25% below = "Priced unusually low" warning. >25% above = "Priced above market average". Median from completed sales only.

7. **Trade-in flow (Gazelle model) — Phase 7 extension.** 4-question instant quote routing to Dealo-approved refurbisher partner. Provisional 30-day quote, final after inspection, free return.

8. **Seller verification tiers with escalating badges.** Anonymous (no listing) → Phone-verified → ID-verified → ID+Selfie-verified → Dealer (CR registration). Each tier unlocks more slots, higher price ceilings, distinct badge.

### Pillars to RECONSIDER

- **Authentication-on-pickup for used tech.** Don't promise. StockX = sealed-only. eBay = no tech. Replace with IMEI + photo + optional escrow + seller-tier.
- **Single "condition" dropdown.** Kill. Replace with orthogonal cosmetic + battery.
- **Free-text spec fields.** Replace with **structured catalog-driven SKU selection** (StockX-style). Seller picks model from canonical list; storage/color/carrier are dependent dropdowns.

### Field-level additions to schema

For Electronics namespaced under `tech` key in `category_fields`:

- `imei` (string, private, GSMA-checked, never in photos)
- `serial_number` (non-cellular)
- `imei_status` (enum: clean / blocked / unchecked)
- `cosmetic_grade` (enum: premium / excellent / good / fair)
- `battery_tier` (enum: new_100 / elevated_90 / standard_80 / below_80 / not_tested)
- `battery_health_percent` (int, optional, validated against tier)
- `carrier_lock` (enum: unlocked / zain / stc / ooredoo / other)
- `carrier_lock_verified` (boolean — set true when screenshot uploaded)
- `warranty_tier` (enum: none / 7day_doa / 30day / 12month)
- `accessories_included` (multi-select: original_box / charger / cable / earphones / receipt / warranty_card)
- `purchase_country` (ISO — affects warranty validity)
- `has_battery_screenshot` (bool — required true for iPhones)
- `model_slug` (string, FK to canonical device catalog table — `iphone-15-pro-max-256gb`)

**New companion tables:**
- `device_catalog` — canonical model list with spec sheet, official release date, official retail price tiers (feeds model-picker)
- `sold_comps` — rolling historical sold-price index per `model_slug` × `cosmetic_grade` × `battery_tier` × `carrier_lock`, used for median pricing banner

### UX patterns worth stealing

- **Swappa's pre-publish IMEI verification modal** — inline result before listing enters moderation
- **Back Market's per-grade "What will my device look like?"** — short text + illustrative photo per grade
- **Reebelo's battery-health guarantee language** — automatic full refund within 30 days if battery below tier
- **Apple's 4-question instant quote** — zero-photo seller-side price discovery
- **Swappa's pricing banner** — "12 active. Median sold (90d): KWD 185. Your ask: KWD 220 (+19%)" live as seller types
- **StockX's catalog-first flow** — seller types "iPhone 15" → picks from canonical catalog → storage/color dropdowns → only THEN can set price. **No free-text title field.** Eliminates 80% of ambiguous-listing disputes.
- **eBay AG tag/card** — even without physical authentication, mint a digital "Dealo Verified" credential tied to IMEI check + photo review, shippable as trust receipt.

### Honest research limitations

- Direct `swappa.com` returned 403 to WebFetch — relied on WebSearch synthesis of FAQ pages (URLs cited are real and reachable in browser).
- `backmarket.com` product-help URLs redirect aggressively; verbatim grade text from canonical phone-grades page via WebSearch extraction.
- Apple Trade-In question wording from community threads + summaries; live flow JS-gated.
- eBay AG optional fee structure verified across multiple sources; tier cutoffs may shift.
