# Photo-to-Listing Extraction (V1 Minimal)

**Purpose:** Extract structured product info from uploaded photos to pre-fill listing form (Feature 3 in AI-FEATURES.md).
**Scope (Decision 8):** V1 Minimal = category + luxury brand + condition ONLY. Description NEVER generated.
**Kill criterion (Sprint 5 / Week 11-12):** ≥75% category · ≥70% brand · ≥65% condition — else defer to V2.

---

## Metadata

| Field | Value |
|---|---|
| Model | `gpt-4o-mini` (vision-capable) |
| Temperature | `0` |
| Max input tokens | 8,000 (includes 2-3 base64 images) |
| Max output tokens | 500 |
| Avg tokens/call | ~4,000 in · ~200 out |
| Avg cost/call | **$0.00072** |
| Latency p50 | 2,500ms |
| Latency p95 | 5,000ms |
| Called on | First photo upload in listing creation flow (Step 2.5) |

---

## V1 System Prompt

```
You are a product classifier for Dealo Hub, a C2C marketplace in Kuwait and the Gulf.

Your job: analyze uploaded photos of ONE product and extract STRUCTURED attributes only. You do NOT write listing descriptions or titles — that's the seller's job. You extract objective facts visible in the photos.

V1 SCOPE — extract these 3 fields ONLY:

1. CATEGORY — from the 10 Dealo Hub categories:
   - electronics (phones, laptops, TVs, gaming, cameras, smart watches)
   - furniture (sofas, beds, tables, decor)
   - luxury (designer bags, luxury watches, fine jewelry)
   - baby-kids (strollers, car seats, kids toys, baby clothes)
   - games-hobbies (video games consoles, board games, collectibles)
   - sports-outdoor (camping, bicycles, sportswear)
   - home-fitness (treadmills, weights, exercise bikes)
   - home-appliances (kitchen, laundry, refrigeration)
   - beauty (sealed cosmetics, beauty devices)
   - general (anything else)

2. BRAND — ONLY IF category is 'luxury'. For other categories, always return null.
   Recognize: Chanel, Louis Vuitton, Hermès, Gucci, Prada, Dior, Celine, Bottega Veneta,
   Rolex, Cartier, Patek Philippe, Audemars Piguet, Omega, IWC, Tag Heuer, Hublot,
   Tiffany & Co., Van Cleef & Arpels, Bulgari, Chopard, Graff

3. CONDITION — visual assessment:
   - new — appears sealed, in original packaging
   - new_with_tags — has visible tags/labels attached
   - like_new — essentially new, no visible wear
   - excellent_used — minor signs of use, no damage
   - good_used — visible wear but functional
   - fair_used — significant wear, still functional

RULES:
- Return ONLY JSON matching the schema below
- For each field, include a confidence score 0-1
- If confidence < 0.75 (category), < 0.80 (brand), < 0.70 (condition) — return null for that field
  (low confidence suggestions are silently skipped in UI — DO NOT include them)
- DO NOT speculate about: price, authenticity, model numbers, specifications
- DO NOT write Arabic titles, descriptions, or marketing copy
- DO NOT infer category from seller context — only from visible product
- If photos show MULTIPLE items, identify the PRIMARY item (largest/most prominent)
- If photos are unclear, low quality, or non-product — return all fields as null
- NEVER make up a brand. If brand is not clearly visible, return null

FIELD-SPECIFIC GUIDANCE:

For category detection:
- Electronics: visible screen, brand logo (Apple/Samsung), cables, packaging
- Luxury bag: designer logo visible (CC, LV monogram), quality hardware, serial tag
- Furniture: scale context (room background), material visible
- Home fitness: gym equipment shapes — treadmills, dumbbells, benches
- Baby-kids: child-specific items (car seats, strollers, baby clothes)

For brand (luxury only):
- Must see CLEAR brand indicator: logo, stamped metal, authentic serial plate
- Do NOT identify brand from shape alone (many imitations exist)
- Common stamping: "MADE IN FRANCE" / "MADE IN ITALY" on leather
- If you see a brand indicator that MIGHT be fake (blurry logo, wrong font), still report it — downstream authenticity check handles that

For condition:
- Look at: corners (wear), stitching (fraying), leather (cracks), screens (scratches)
- Electronics: signs of scuffs, screen protectors, battery swelling
- Cars/bulky items not in V1 scope — skip
- "like_new" means indistinguishable from new in photos
- When in doubt between two adjacent grades, choose the LOWER (conservative)

Output schema:
{
  "category": "electronics" | "furniture" | "luxury" | "baby-kids" | "games-hobbies" | "sports-outdoor" | "home-fitness" | "home-appliances" | "beauty" | "general" | null,
  "category_confidence": 0-1 (null if category is null),
  "subcategory": string | null (e.g., "phones-tablets", "luxury-bags"),
  "brand": string | null (ONLY if category === "luxury"),
  "brand_confidence": 0-1 (null if brand is null),
  "condition": "new" | "new_with_tags" | "like_new" | "excellent_used" | "good_used" | "fair_used" | null,
  "condition_confidence": 0-1 (null if condition is null),
  "notes": "optional brief reasoning, max 150 chars, for admin debugging"
}

If you cannot confidently identify anything (unclear photos, non-product image):
{"category": null, "category_confidence": null, "subcategory": null, "brand": null, "brand_confidence": null, "condition": null, "condition_confidence": null, "notes": "unclear photos — manual fill required"}
```

## V1 User Message Template

User message is an OpenAI vision API format with up to 3 image attachments:

```typescript
messages: [
  { role: 'system', content: PHOTO_TO_LISTING_PROMPT },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Analyze this product.' },
      { type: 'image_url', image_url: { url: photo1Url, detail: 'low' } }, // 'low' = 512px max
      { type: 'image_url', image_url: { url: photo2Url, detail: 'low' } },
      { type: 'image_url', image_url: { url: photo3Url, detail: 'low' } },
    ],
  },
],
```

**Why `detail: 'low'`:** 85 tokens/image vs 765 tokens/image for `detail: 'high'` — 9x cheaper. Classification accuracy at low detail is sufficient for V1 Minimal scope.

---

## Output Schema (TypeScript)

```typescript
const CategorySlug = [
  'electronics', 'furniture', 'luxury', 'baby-kids', 'games-hobbies',
  'sports-outdoor', 'home-fitness', 'home-appliances', 'beauty', 'general',
] as const;

const Condition = [
  'new', 'new_with_tags', 'like_new',
  'excellent_used', 'good_used', 'fair_used',
] as const;

interface PhotoToListingResult {
  category: typeof CategorySlug[number] | null;
  category_confidence: number | null; // 0-1

  subcategory: string | null;

  brand: string | null;           // ONLY for luxury category
  brand_confidence: number | null;

  condition: typeof Condition[number] | null;
  condition_confidence: number | null;

  notes: string; // ≤150 chars
}
```

---

## Confidence Threshold Logic (UI Behavior)

Per Decision 8 — silently skip low-confidence suggestions instead of showing them:

```typescript
const SHOW_THRESHOLDS = {
  category: 0.80,   // show AISuggestionCard if ≥ 0.80
  brand:    0.80,   // show AISuggestionCard if ≥ 0.80
  condition:0.75,   // show AISuggestionCard if ≥ 0.75
};

function shouldShowSuggestion(field: 'category' | 'brand' | 'condition', confidence: number | null): boolean {
  if (confidence === null) return false;
  return confidence >= SHOW_THRESHOLDS[field];
}
```

User does NOT see "low confidence" warnings. They just fill the field manually. Good UX.

---

## Pre-Launch Accuracy Gate (Sprint 5 / Week 11-12)

Per MASTER-PLAN Section 4 + Decision 8 — hard gate before shipping.

**Test dataset:** 20 real Kuwait product photos, stratified:
- 4 P0 electronics (iPhones, laptops, TVs, gaming)
- 4 P0 furniture (sofas, dining tables, chairs, beds)
- 3 P0 luxury (Chanel bag, Rolex watch, LV wallet)
- 3 P0 baby-kids (car seat, stroller, baby clothes)
- 2 P1 home-fitness (treadmill, dumbbells)
- 2 P1 home-appliances (washing machine, refrigerator)
- 2 Unclear/edge cases (tests null-handling)

**Thresholds (ALL required):**
- Category accuracy ≥ 75% (15/20 correct)
- Luxury brand accuracy ≥ 70% (within 3 tests)
- Condition accuracy ≥ 65% (±1 grade tolerance, 13/20 correct)

**If ANY fails:** defer feature entirely to V2. No partial launch.

---

## Test Cases (Golden Set)

### CASE 1 — iPhone 14 Pro Max, clean photos

**Input:** 3 photos of an iPhone with screen on, back visible, side profile
**Expected:**
```json
{
  "category": "electronics",
  "category_confidence": 0.95,
  "subcategory": "phones-tablets",
  "brand": null,
  "brand_confidence": null,
  "condition": "excellent_used",
  "condition_confidence": 0.80,
  "notes": "Apple iPhone visible, minor signs of use on side"
}
```

---

### CASE 2 — Chanel Classic Flap (luxury)

**Input:** 3 photos showing Chanel logo, quilted leather, gold hardware
**Expected:**
```json
{
  "category": "luxury",
  "category_confidence": 0.98,
  "subcategory": "luxury-bags",
  "brand": "Chanel",
  "brand_confidence": 0.92,
  "condition": "like_new",
  "condition_confidence": 0.78,
  "notes": "Classic Flap Bag with CC logo visible, minimal wear"
}
```

---

### CASE 3 — Rolex Submariner (luxury)

**Input:** 3 photos: dial close-up, caseback, bracelet
**Expected:**
```json
{
  "category": "luxury",
  "category_confidence": 0.97,
  "subcategory": "luxury-watches",
  "brand": "Rolex",
  "brand_confidence": 0.90,
  "condition": "excellent_used",
  "condition_confidence": 0.75,
  "notes": "Rolex Submariner identified from dial + crown logo, minor bezel wear"
}
```

---

### CASE 4 — Living room sofa

**Input:** 2 photos: sofa in a living room, close-up of fabric
**Expected:**
```json
{
  "category": "furniture",
  "category_confidence": 0.95,
  "subcategory": "living-room",
  "brand": null,
  "brand_confidence": null,
  "condition": "good_used",
  "condition_confidence": 0.70,
  "notes": "L-shaped fabric sofa, visible signs of use on cushions"
}
```

---

### CASE 5 — Treadmill (Home Fitness)

**Input:** 2 photos: treadmill in a home room, display close-up
**Expected:**
```json
{
  "category": "home-fitness",
  "category_confidence": 0.93,
  "subcategory": "treadmills-cardio",
  "brand": null,
  "brand_confidence": null,
  "condition": "excellent_used",
  "condition_confidence": 0.72,
  "notes": "Home treadmill, belt appears in good condition"
}
```

---

### CASE 6 — Baby car seat

**Input:** 3 photos of a car seat, brand name partially visible
**Expected:**
```json
{
  "category": "baby-kids",
  "category_confidence": 0.96,
  "subcategory": "strollers-car-seats",
  "brand": null,
  "brand_confidence": null,
  "condition": "like_new",
  "condition_confidence": 0.82,
  "notes": "Child car seat, clean fabric, minimal wear"
}
```

---

### CASE 7 — Unclear photos (edge case)

**Input:** Blurry photo of a table covered with multiple items
**Expected:**
```json
{
  "category": null,
  "category_confidence": null,
  "subcategory": null,
  "brand": null,
  "brand_confidence": null,
  "condition": null,
  "condition_confidence": null,
  "notes": "unclear photos — manual fill required"
}
```

---

### CASE 8 — First-copy luxury (challenging)

**Input:** A Chanel-style bag with slightly off logo alignment, poor stitching visible

**Expected output should NOT claim this is authentic:**
```json
{
  "category": "luxury",
  "category_confidence": 0.85,
  "subcategory": "luxury-bags",
  "brand": "Chanel",
  "brand_confidence": 0.55,
  "condition": "like_new",
  "condition_confidence": 0.70,
  "notes": "Chanel-style quilted bag — brand indicators present but authenticity not verified"
}
```

**Why:** We report what's claimed (brand logo visible) but with low confidence. The fraud detection pipeline handles authenticity separately — V1 Photo-to-Listing is not an authentication tool.

---

### CASE 9 — Non-product photo (edge case)

**Input:** Screenshot of a product listing from another website
**Expected:**
```json
{
  "category": null,
  "category_confidence": null,
  "subcategory": null,
  "brand": null,
  "brand_confidence": null,
  "condition": null,
  "condition_confidence": null,
  "notes": "appears to be a screenshot, not an original product photo — manual fill required"
}
```

Also triggers reverse image search which handles stolen photo detection separately.

---

### CASE 10 — Sealed cosmetics (Beauty category)

**Input:** Photos of unopened perfume box, clear branding
**Expected:**
```json
{
  "category": "beauty",
  "category_confidence": 0.92,
  "subcategory": "sealed-fragrances",
  "brand": null,
  "brand_confidence": null,
  "condition": "new",
  "condition_confidence": 0.90,
  "notes": "Sealed fragrance box, plastic wrapping intact"
}
```

Note: brand detection for beauty not part of V1 (only luxury). Even if branding is visible, brand field returns null.

---

## Prompt Biases to Test Against

During Sprint 5 accuracy gate testing, verify:

| Risk | Test |
|---|---|
| Anglo brand bias | Test with Arabic-only product packaging (e.g., Arab perfume brands) |
| Urban product bias | Test with traditional Gulf items (dishdashas, bakhoor, traditional jewelry) |
| New vs used bias | Ensure condition grading isn't biased toward "like_new" for visually appealing photos |
| Brand recognition false positive | Test with obvious counterfeits — should flag lower brand_confidence |
| Category leakage | Ensure non-luxury brands don't trigger luxury category (e.g., Samsung ≠ luxury) |

---

## Integration Code Sketch

```typescript
// src/lib/ai/photo-to-listing.ts
import OpenAI from 'openai';
import { z } from 'zod';
import { PHOTO_TO_LISTING_PROMPT } from './prompts';

const PhotoResultSchema = z.object({
  category: z.string().nullable(),
  category_confidence: z.number().nullable(),
  subcategory: z.string().nullable(),
  brand: z.string().nullable(),
  brand_confidence: z.number().nullable(),
  condition: z.string().nullable(),
  condition_confidence: z.number().nullable(),
  notes: z.string().max(200),
});

export async function extractListingFromPhotos(photoUrls: string[]) {
  const openai = new OpenAI();

  // Use up to 3 photos
  const photos = photoUrls.slice(0, 3).map(url => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'low' as const },
  }));

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PHOTO_TO_LISTING_PROMPT },
        { role: 'user', content: [{ type: 'text', text: 'Analyze this product.' }, ...photos] },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500,
    });

    const raw = JSON.parse(resp.choices[0].message.content!);
    return PhotoResultSchema.parse(raw);
  } catch (err) {
    console.error('[photo-to-listing] Failed', err);
    // Fail-open — return all nulls so user fills manually
    return { category: null, category_confidence: null, subcategory: null, brand: null, brand_confidence: null, condition: null, condition_confidence: null, notes: 'ai_error' };
  }
}
```

---

## V2 Upgrade Path (Month 4-6)

**Additional fields extracted:**
- `color`
- `model` (e.g., "iPhone 14 Pro Max 256GB Space Black")
- `suggested_title` (60 chars max, Arabic preferred)

**Model bump:** Continue on GPT-4o-mini if accuracy ≥ 80% overall. Upgrade to GPT-4o for luxury category only (higher stakes).

**Image detail bump:** `detail: 'high'` for luxury category (9x cost but better brand/condition accuracy).

---

## Version History

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | V1 Minimal scope: category + luxury brand + condition only. 10 test cases. Pre-launch accuracy gate defined. |
