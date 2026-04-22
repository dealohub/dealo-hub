# Phase 7a v2 — Synthesis Brief

> **Date:** 2026-04-21
> **Inputs:** [01-GULF-LIVE-OBSERVATION.md](./01-GULF-LIVE-OBSERVATION.md) · [02-GLOBAL-BENCHMARKS.md](./02-GLOBAL-BENCHMARKS.md) · [03-KUWAIT-CULTURAL.md](./03-KUWAIT-CULTURAL.md)
> **Purpose:** identify what to rebuild in Phase 7 Electronics, with rebuild options for the founder to choose

---

## 1. Honest assessment of Phase 7 v1 (what shipped)

| Claim made in v1 doctrine | Reality |
|---|---|
| "live observation 2026-04-21 of Dubizzle KW + Q84Sale" | ❌ I did not actually fetch DOM. Inferred from training. |
| "12 evidence-cited pillars" | ❌ Most claims are MEDIUM at best; some are unverified. |
| "Kuwait MOC IMEI blacklist" | ⚠️ Track C confirms NO public CITRA registry exists. v1 implied one does. |
| "Kuwait Apple warranty country-lock" | ✅ Track C verified — this one was correct. |
| "Counterfeit terms list" | ⚠️ List was thin (`1st copy`, `replica`, `master copy`, `تقليد`, `كوبي`, `ماستر كوبي`). Track C found more: `هاي كوبي`, `فيرست هاي كوبي`, `شبيه الاصلي`, `درجة ثانية`. |
| "28 fields × 5 domains schema" | ⚠️ Workable shell, but missing: orthogonal cosmetic+battery split, repair-tier 4-way taxonomy per component, badal type, receipt provenance hierarchy, vouch graph, IMEI lifecycle uniqueness. |
| Hub page "5-section MVP" | ❌ MVP single-file. Properties has 8 components. Properties hub has LiveFeed, articles strip, type tiles with imagery. v1 hub is bare. |
| Detail page "MVP single file" | ❌ Same problem. Properties detail = 8 components composed, mine = 1 file. |
| 6 seed listings | ⚠️ Functional but: 1-2 per sub-cat is thin; no badal example; no installment-with-carrier example; no "imported / grey-market" example to demonstrate provenance disclosure pillar. |

**Bottom line:** Phase 7 v1 ships a working plumbing layer — schema, validators, sell wizard, route, sitemap, detail+hub pages, seeds. **What it doesn't ship is the depth that made Properties (Phase 4a) the flagship differentiator.** It doesn't out-class Dubizzle on the dimensions that matter.

---

## 2. What the 3 research tracks agree on

Cross-referencing all 3 reports, **the 6 most important pillars converge:**

### A. Structured IMEI / serial — required, GSMA-checked, lifecycle-tracked

- **Gulf evidence:** zero of four Gulf platforms capture it (Track A)
- **Global evidence:** Swappa pioneered this; it's the single most defensible C2C-tech moat (Track B)
- **Kuwait evidence:** no public CITRA stolen registry → Dealo's own IMEI uniqueness check is *more* reliable than any external lookup (Track C)
- **Concrete Dealo behaviour:** required field for cellular categories, Luhn-15 validated, GSMA-checked at submit, **one IMEI = one active Dealo listing ever** (re-listing requires prior seller's transfer-of-ownership signature). Free public lookup tool as marketing asset.

### B. Orthogonal cosmetic grade + battery tier (Reebelo model)

- **Gulf evidence:** OpenSooq's 4-tier condition (Brand New / Used-Excellent / Used-Good / Damaged) is best-in-class in GCC; Dubizzle/Q84Sale stuck at New/Used (Track A)
- **Global evidence:** Reebelo decouples cosmetic from battery (Standard ≥80% / Elevated ≥90% / New 100%) — cleanest UX in the entire global market (Track B)
- **Kuwait evidence:** sellers already disclose battery in titles ("بطارية 92%"); buyers already demand screenshots in WhatsApp (Track C)
- **Concrete Dealo behaviour:** 4 cosmetic grades + separate battery tier enum + battery_health_pct numeric (validated against tier) + **video evidence option** (anti-spoof from MacRumors evidence)

### C. Carrier compatibility as category split, not filter

- **Gulf evidence:** nobody captures it (Track A)
- **Global evidence:** Swappa's category split (Unlocked vs Carrier-locked SKU) is the gold standard (Track B)
- **Kuwait evidence:** carrier-locked phones uncommon in KW because installment devices ship unlocked. BUT installment-status (months remaining) is material — carrier retains interest until paid off (Track C)
- **Concrete Dealo behaviour:** carrier_lock enum (unlocked / zain / stc / ooredoo / other) + carrier_lock_verified bool (true when screenshot uploaded) + new field `installment_remaining_months` (optional int) + provenance enum that includes "carrier installment"

### D. Warranty as TIER not binary, with retail provenance

- **Gulf evidence:** all four platforms = free-text warranty (Track A)
- **Global evidence:** Back Market's 12-month minimum sets the bar; warranty-as-tier (none / 7-day DoA / 30-day / 12-month) is the cleanest model (Track B)
- **Kuwait evidence:** retail provenance hierarchy is the ACTUAL trust signal — "from Apple Avenues + box + receipt" beats any spec (Track C)
- **Concrete Dealo behaviour:** `warranty_tier` enum + `warranty_expires_at` date + `purchase_provenance` enum (apple_avenues / xcite / eureka / yousifi / gait / alpha_store / carrier_zain / carrier_ooredoo / carrier_stc / other_authorized / imported_grey) + receipt upload field + "Avenues Receipt Verified" badge.

### E. Counterfeit-term rejection at submit (widened blocklist)

- **Gulf evidence:** "COPY A" lives on Dubizzle, "شبيه الاصلي" classified Brand New on OpenSooq (Track A)
- **Global evidence:** every refurbished/B2C platform pre-screens for this; C2C platforms that don't get sued (Track B implied)
- **Kuwait evidence:** Arabic vocabulary is rich and specific — `كوبي` / `هاي كوبي` / `ماستر كوبي` / `فيرست هاي كوبي` / `تقليد` / `شبيه الاصلي` / `درجة ثانية` (Track C)
- **Concrete Dealo behaviour:** widen Filter B counterfeit blocklist with all 7 Arabic terms above; auto-reject at submit; flag for review

### F. Pricing transparency: median sold comps + anomaly warning

- **Gulf evidence:** OpenSooq iPhone 17 Pro Max page has 8+ listings under 50 KWD next to legit 600+ KWD; nobody warns buyers (Track A)
- **Global evidence:** Swappa shows "12 active listings, median sold KWD 185, your ask KWD 220 (+19%)" live as seller types (Track B)
- **Kuwait evidence:** counterfeit detection heuristic = price <40% of Apple Avenues retail for current-gen flagship = likely counterfeit (Track C)
- **Concrete Dealo behaviour:** new `device_catalog` table + new `sold_comps` rolling-90d index keyed on `model_slug × cosmetic_grade × battery_tier × carrier_lock`. Price banner on listing form ("Median 90d: KWD 185"). Auto-warning on detail page when listing is >25% below median.

---

## 3. NEW pillars only one track surfaced (also worth adopting)

### From Track A (Gulf):
- **Two-tier seller verification** — Verified User vs Verified Business (OpenSooq + Haraj). Better than Dealo's current single tier.
- **Delivery-by-seller boolean as field AND filter** — OpenSooq's only.
- **Public prohibited-items list + suspended-accounts ledger** — Haraj's only. Low-effort high-trust.
- **Escrow / Buy-with-Confidence opt-in per listing** — Haraj's "اشتر بثقة".

### From Track B (Global):
- **Catalog-first listing flow (StockX pattern)** — seller picks model from canonical `device_catalog` → storage/color/carrier are dependent dropdowns → only THEN can set price. **No free-text title field.** Eliminates 80% of ambiguous-listing disputes.
- **Pre-publish IMEI verification modal (Swappa)** — show result inline ("Clean — ready for activation on Zain" or "Blocked by original carrier") before listing enters moderation.
- **Per-grade "What will my device look like?" explainer (Back Market)** — short text + illustrative photo per grade on listing form + product page.
- **Battery-health refund guarantee language (Reebelo)** — "automatic full refund within 30 days if battery below tier".
- **Apple's 4-question instant trade-in quote** — zero-photo provisional pricing.

### From Track C (Kuwait cultural):
- **Badal as a first-class listing type** — device + desired-target + cash-difference range + structured handshake meetup flow. **No global or Gulf platform has this.** Pure Kuwait-cultural moat.
- **Vouch graph** — verified users vouch for new sellers ("vouched by 3 members including 2 you know"). Operationalizes diwaniya trust primitive in-product.
- **Repair-tier 4-way taxonomy per component** (original / OEM-replaced / high-quality aftermarket / generic aftermarket) — Hawalli/Salmiya repair-shop ladder is not boolean.
- **Receipt provenance verification with QR cross-reference** — partner with X-cite / Eureka / Apple to verify QR codes on uploaded receipts → "Avenues Receipt Verified" badge.
- **Doctrine voice rewrites** — "اسأل عنه" / "معاك للآخر" / "مضمون من وين؟" — speak Kuwaiti, don't translate Western patterns.

---

## 4. Pillars to RECONSIDER (originally in v1, evidence now contradicts)

| v1 pillar | Why reconsider | Replacement |
|---|---|---|
| 2-tier condition (New/Used) | OpenSooq shipped 4-tier; Reebelo split cosmetic/battery (cleaner) | 4 cosmetic + separate battery tier |
| Single "warranty" boolean | Industry has moved to warranty-as-tier | warranty_tier enum + purchase_provenance enum |
| Free-text title field | StockX's catalog-first approach eliminates 80% of disputes | model_slug FK → canonical device_catalog table |
| "IMEI helpful, not required" | Swappa proves required-IMEI is the moat | Required for all cellular categories, GSMA-checked |
| "Authentication-on-pickup hint" | StockX = sealed only. eBay AG = no tech. **Logistically unviable for Kuwait C2C** | Don't promise. Replace with IMEI + photo + optional escrow + seller-verification-tier |
| Single "condition" dropdown | Same issue as above | Orthogonal cosmetic + battery (Reebelo) |

---

## 5. Rebuild options — for founder to choose

### Option A — Full rebuild (deep)
Hard-reset Phase 7 entirely. Write new `PHASE-7A-ELECTRONICS-V2.md` doctrine (15+ pillars, all evidence-cited), redesign schema (28 fields → ~40 with orthogonal cosmetic/battery + 4-way repair taxonomy + provenance enum + badal listing type + IMEI uniqueness + sold_comps), rebuild sell wizard (catalog-first flow, no free-text title), rebuild detail page as 6-8 components matching Properties depth, rebuild hub with type tiles + featured + LiveFeed-equivalent + trust strip + grid + articles strip, expand seeds to 12+ with badal/installment/imported variants, add new tables (`device_catalog`, `sold_comps`, `vouches`).

- **Effort:** 3-5 days of focused work
- **Result:** Electronics matches Properties depth and becomes a flagship like Properties

### Option B — Incremental rebuild (medium)
Keep working plumbing (schema shell, sell wizard branch, route, sitemap, hub/detail page skeletons). Layer the missing depth on top:
- Widen counterfeit blocklist (1 hour)
- Add orthogonal cosmetic+battery to schema + UI (4 hours)
- Add purchase_provenance enum + receipt upload field (3 hours)
- Add badal listing type (1 day)
- Expand detail page from 1 file to 6 components matching Properties pattern (1 day)
- Expand hub with type tiles + LiveFeed + trust strip with verified evidence (1 day)
- Add 6 more seeds (badal, installment, grey-market, repair-disclosed) (2 hours)

- **Effort:** 3-4 days
- **Result:** v2 polished but architecture inherits from v1 (some paths feel grafted)

### Option C — Document-only update (light)
Rewrite `PHASE-7A-ELECTRONICS.md` to reflect actual research-cited claims. Mark v1 limitations explicitly. Defer code rebuild to a later phase. Schema stays as-is.

- **Effort:** 4 hours
- **Result:** Honest doctrine, but the user-facing experience stays at v1 quality

### Option D — Hybrid (recommended by me, but you decide)
Take the **doctrine + schema** from Option A as the source of truth (new `PHASE-7A-ELECTRONICS-V2.md` + new validators tests). Then **incrementally upgrade the UI**: detail page first (highest user impact), then sell wizard (catalog-first flow), then hub. Seeds expand alongside.

- **Effort:** 4-6 days, but each commit ships visible improvement
- **Result:** Honest doctrine immediately, depth lands in 4 visible commits

---

## 6. What I need from you

Pick one (or describe a different shape):
1. **Option A — full rebuild** (hard reset, 3-5 days, result matches Properties)
2. **Option B — incremental** (3-4 days, layered on existing)
3. **Option C — doc-only** (4 hours, code stays)
4. **Option D — hybrid** (doctrine first, UI in commits)

Or modify scope further:
- Trim/expand pillar set
- Skip badal (or make it Phase 7b)
- Skip device_catalog table (use free-text + dynamic comps later)
- Skip vouch graph (Phase 8)
- Skip receipt-QR partnership (Phase 8)

I will not write or change any code until you approve a direction.
