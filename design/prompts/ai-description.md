# AI Description Generator (V3 — Gated)

**Purpose:** Help sellers draft an INITIAL product description from structured fields + photos. User edits before publishing.
**Status:** 🔴 **V3 GATED — DO NOT DEPLOY WITHOUT GO/NO-GO FRAMEWORK PASS.**

**Authority:**
- DECISIONS.md Decision 9 — Human-Written monitoring strategy
- AI-FEATURES.md Section 11 — V3 Go/No-Go decision framework
- Decision date: End of Month 9

---

## Why This Prompt Exists in Pre-Code

We publish this prompt **now** so V3 launch (if approved) is not blocked by prompt design. Implementation deferred; specification committed.

**Ship only if ALL criteria met:**

1. V1+V2 AI adoption rate < 40% across category/brand/condition accepts
2. User interviews (n ≥ 20) show description writing is top-3 pain point
3. "Human-Written" badge visible on > 60% of listings
4. Avg description length > 50 words
5. "Lazy User" classification < 20% of weekly listings
6. Active sellers explicitly request feature (> 30% survey affirmative)

**If ANY of these trigger, VETO:**
- V1+V2 AI adoption > 50%
- Premium/luxury sellers reject AI features in interviews
- Positioning research shows human touch is key buyer value
- Avg description length dropping month-over-month
- "Lazy User" > 30%
- Competitor AI description creates market backlash

---

## Metadata

| Field | Value |
|---|---|
| Model | `gpt-4o-mini` |
| Temperature | `0.4` (some natural variation) |
| Max input tokens | 2,000 |
| Max output tokens | 500 |
| Avg tokens/call | ~800 in · ~200 out |
| Avg cost/call | **$0.00024** |
| Latency p50 | 1,200ms |
| Latency p95 | 2,500ms |
| Rate limit | 10 calls/seller/day |

---

## System Prompt

```
You are helping a seller draft an INITIAL description for their listing on Dealo Hub.

YOUR ROLE:
You draft a 2-3 sentence starting point. The seller will edit it to add personality, stories, and specifics before publishing. Your output is NEVER published as-is.

WRITING STYLE RULES:
- Tone: factual, honest, conversational
- Length: 60-150 words (strict)
- Voice: first-person from seller's perspective ("اشتريته قبل سنة", "I bought this last year")
- NO exaggeration, NO sales language, NO clichés
- NO fake urgency ("آخر قطعة", "last one")
- NO guarantees about condition you can't verify from input
- NO price talk (seller sets price separately)

LOCALE:
- If locale='ar': write in casual Gulf Arabic (not formal MSA)
- If locale='en': write in casual natural English
- Digits: ALWAYS Western (1234) — even in Arabic text
- Do NOT mix locales mid-sentence

BANNED PHRASES (all locales):
- "for serious buyers only" / "للجادّين فقط"
- "negotiable" / "قابل للتفاوض" (price mode is separate field)
- "urgent sale" / "للبيع السريع"
- "contact for details" / "للاستفسار كلمني" (phone bypass)
- "original quality" / "درجة أولى" (counterfeit marker)
- Marketing adjectives: "amazing", "incredible", "premium", "luxurious", "stunning", "رائع", "مذهل"

REQUIRED STRUCTURE (2-3 sentences):
1. What the item is (1 sentence, based on extracted fields)
2. Condition + any included accessories (1 sentence, from fields)
3. (OPTIONAL) Gentle prompt for the seller to add their own touch (1 sentence)

The 3rd sentence should INVITE the seller to add personality — NOT complete the description.

EXAMPLES of good closing invitations:
- "أضف تفاصيل شخصية: تاريخ الشراء، سبب البيع، أي ملاحظات خاصة."
- "Add your personal notes: when you bought it, why you're selling, anything special about it."

Output schema:
{
  "description": "2-3 sentences, 60-150 words, in user's locale",
  "word_count": integer,
  "warnings": string[]  // flag any input fields that were null/unclear
}

If essential input is missing (no category, no condition, no photos):
{
  "description": "[Too little information to draft a description. Please fill in the category, condition, and title first.]",
  "word_count": 0,
  "warnings": ["missing_input"]
}
```

## User Message Template

```json
{
  "category": "{{listing.category_slug}}",
  "subcategory": "{{listing.subcategory_slug}}",
  "title": "{{listing.title}}",
  "condition": "{{listing.condition}}",
  "brand": "{{listing.brand}}" | null,
  "model": "{{listing.model}}" | null,
  "color": "{{listing.color}}" | null,
  "has_box": {{listing.has_box}},
  "has_accessories": {{listing.has_accessories}},
  "locale": "ar" | "en"
}
```

---

## Output Schema (TypeScript)

```typescript
interface AIDescriptionResult {
  description: string;   // 60-150 words
  word_count: number;
  warnings: string[];    // e.g., ["missing_brand", "missing_condition"]
}
```

---

## Test Cases (for V3 pre-launch validation)

### CASE 1 — Electronics, Arabic

**Input:**
```json
{
  "category": "electronics",
  "subcategory": "phones-tablets",
  "title": "iPhone 14 Pro Max 256GB",
  "condition": "excellent_used",
  "brand": "Apple",
  "model": "iPhone 14 Pro Max",
  "color": "أسود",
  "has_box": true,
  "has_accessories": true,
  "locale": "ar"
}
```

**Expected output (example — actual LLM output will vary):**
```json
{
  "description": "للبيع iPhone 14 Pro Max سعة 256 جيجا باللون الأسود، بحالة ممتازة. الجهاز يأتي مع الصندوق والملحقات الأصلية. أضف تفاصيلك الشخصية: تاريخ الشراء، سبب البيع، حالة البطارية، أو أي ملاحظات تود مشاركتها.",
  "word_count": 39,
  "warnings": []
}
```

**Why this is good:**
- Factual, no exaggeration
- Uses Western digits (256, 14)
- Invites seller to add personality (battery %, reason for selling)
- Does NOT fabricate details (no price claim, no "like new", no warranty claim)

---

### CASE 2 — Luxury bag, Arabic

**Input:**
```json
{
  "category": "luxury",
  "subcategory": "luxury-bags",
  "title": "Louis Vuitton Neverfull MM",
  "condition": "like_new",
  "brand": "Louis Vuitton",
  "model": "Neverfull MM",
  "color": "Brown",
  "has_box": true,
  "has_accessories": false,
  "locale": "ar"
}
```

**Expected output:**
```json
{
  "description": "للبيع حقيبة Louis Vuitton Neverfull MM بني اللون، بحالة كالجديدة. متوفرة مع الصندوق الأصلي. شارك تفاصيل الشراء، سنة الإصدار، وأي وثائق أصالة قد تكون متوفرة.",
  "word_count": 27,
  "warnings": ["missing_accessories"]
}
```

**Why this is good:**
- No brand exaggeration, no "authentic" claim (authenticity is separate field)
- Invites seller to add authenticity docs
- No "mint condition" — uses structured "like new" translation

---

### CASE 3 — Furniture, English

**Input:**
```json
{
  "category": "furniture",
  "subcategory": "living-room",
  "title": "Modern 6-piece sofa set",
  "condition": "good_used",
  "brand": null,
  "model": null,
  "color": "beige",
  "has_box": false,
  "has_accessories": false,
  "locale": "en"
}
```

**Expected output:**
```json
{
  "description": "Modern 6-piece sofa set in beige, in good used condition after 2-3 years of normal use. Fabric is clean, cushions are firm. Add your notes: purchase date, dimensions, reason for selling, and any specific wear to mention.",
  "word_count": 39,
  "warnings": []
}
```

---

### CASE 4 — Baby car seat, Arabic

**Input:**
```json
{
  "category": "baby-kids",
  "subcategory": "strollers-car-seats",
  "title": "Baby car seat 0-12 months",
  "condition": "like_new",
  "brand": null,
  "model": null,
  "color": "رمادي",
  "has_box": false,
  "has_accessories": true,
  "locale": "ar"
}
```

**Expected output:**
```json
{
  "description": "للبيع كرسي سيارة للأطفال من 0 إلى 12 شهر، باللون الرمادي، بحالة كالجديدة. يأتي مع الملحقات الأصلية. أضف معلومات السلامة: سنة الاستخدام، هل تعرّض لأي حوادث، تاريخ انتهاء الصلاحية.",
  "word_count": 32,
  "warnings": []
}
```

**Why this is good:**
- Safety-specific prompts for baby category (accident history, expiration)
- Informative without manufacturing claims

---

### CASE 5 — Missing input (edge case)

**Input:**
```json
{
  "category": null,
  "subcategory": null,
  "title": "",
  "condition": null,
  "brand": null,
  "model": null,
  "color": null,
  "has_box": false,
  "has_accessories": false,
  "locale": "ar"
}
```

**Expected output:**
```json
{
  "description": "[معلومات غير كافية لصياغة وصف. يرجى تعبئة الفئة والحالة والعنوان أولاً.]",
  "word_count": 0,
  "warnings": ["missing_input"]
}
```

---

### CASE 6 — Home fitness, Arabic

**Input:**
```json
{
  "category": "home-fitness",
  "subcategory": "treadmills-cardio",
  "title": "Treadmill for home use",
  "condition": "excellent_used",
  "brand": "NordicTrack",
  "model": null,
  "color": null,
  "has_box": false,
  "has_accessories": true,
  "locale": "ar"
}
```

**Expected output:**
```json
{
  "description": "للبيع جهاز جري NordicTrack للاستعمال المنزلي، بحالة ممتازة. متوفر مع الملحقات. أضف تفاصيل مهمة: عدد ساعات التشغيل التقريبية، الأبعاد، وهل المشتري يحتاج مساعدة في النقل (الجهاز ثقيل عادة).",
  "word_count": 32,
  "warnings": ["missing_color"]
}
```

**Why this is good:**
- Category-specific hints (hours of use, dimensions, pickup logistics)
- Acknowledges bulky item context

---

### CASE 7 — Sealed beauty, English

**Input:**
```json
{
  "category": "beauty",
  "subcategory": "sealed-fragrances",
  "title": "Chanel No.5 100ml",
  "condition": "new",
  "brand": "Chanel",
  "model": null,
  "color": null,
  "has_box": true,
  "has_accessories": false,
  "locale": "en"
}
```

**Expected output:**
```json
{
  "description": "Chanel No.5 100ml, new and sealed in original packaging. Includes the original box. Add purchase details: where you bought it, purchase date, and a photo of the serial code on the box for authenticity.",
  "word_count": 37,
  "warnings": []
}
```

**Why this is good:**
- Emphasizes sealed (compliance with Beauty category rules)
- Prompts for authenticity proof

---

### CASE 8 — Gaming console, mixed language safety

**Input:**
```json
{
  "category": "electronics",
  "subcategory": "gaming",
  "title": "PlayStation 5 + 3 games",
  "condition": "excellent_used",
  "brand": "Sony",
  "model": "PlayStation 5",
  "color": null,
  "has_box": true,
  "has_accessories": true,
  "locale": "ar"
}
```

**Expected output:**
```json
{
  "description": "للبيع PlayStation 5 مع 3 ألعاب، بحالة ممتازة. الجهاز يأتي مع الصندوق والملحقات الأصلية. أضف تفاصيل: أسماء الألعاب، عدد ذراعات التحكم، مدة الاستخدام.",
  "word_count": 25,
  "warnings": []
}
```

**Why this is good:**
- Preserves English brand "PlayStation 5" in Arabic context (natural usage)
- Western digits preserved
- Prompts for specifics sellers often forget (how many controllers, which games)

---

## Anti-Pattern Test Cases (should NEVER appear in output)

AI must NEVER produce these phrasings. If it does, the prompt is broken:

| Phrase | Why Banned |
|---|---|
| "في حالة ممتازة كأنها جديدة لا تفرق عن الأصلي" | Marketing exaggeration |
| "فرصة لا تتكرر" | Fake urgency |
| "سعر مغري جداً" | Price talk (not our field) |
| "100% authentic guaranteed" | Fabricated warranty |
| "Must go this week!" | Urgency manipulation |
| "Serious buyers only" | Gate-keeping language |
| "DM me for price" | Off-platform redirect |

---

## UI Integration Principles (if ever deployed)

### Opt-in, never default

```tsx
// In listing creation flow, description step
<label className="text-body-small text-muted-steel">
  الوصف
</label>
<textarea name="description" />

{/* Helper button — opt-in only */}
<button className="text-caption text-warm-amber underline self-start mt-2">
  💡 ساعدني بصياغة وصف أولي
</button>
```

The button appears **below** an empty textarea. User must actively choose.

### Always editable

When AI suggestion arrives, it populates the textarea. User must edit before publishing. If user publishes **without editing** for N consecutive listings, log as "Lazy User" signal.

### Badge consequences

Listings where user edits the AI draft heavily retain "Human-Written" badge. Listings published verbatim from AI lose the badge.

Logic:
```typescript
const humanWritten = await computeHumanWrittenScore({
  ai_draft: aiDraftText,
  published_text: publishedText,
  similarity: levenshteinRatio(aiDraftText, publishedText),
});

// > 80% similarity = AI-written, no badge
// 40-80% = Mixed, show badge with "Human-Edited" variant
// < 40% or no AI use = full "Human-Written" badge
```

---

## Decommission Protocol

If at any quarterly review the V3 NO-GO criteria are triggered AFTER launch:

1. Disable the UI button immediately
2. Keep existing listings as-is
3. Document reason in `planning/DECISIONS.md`
4. Re-evaluate at next quarterly review

**Do not silently degrade.** Decommission visibly.

---

## Integration Code Sketch (V3 only — do NOT implement now)

```typescript
// src/lib/ai/description.ts
// WARNING: Gated behind V3 Go/No-Go framework pass
// Do NOT import or call until framework evaluation complete at Month 9

import OpenAI from 'openai';
import { z } from 'zod';
import { AI_DESCRIPTION_PROMPT } from './prompts';

const DescriptionResultSchema = z.object({
  description: z.string().min(0).max(1000),
  word_count: z.number(),
  warnings: z.array(z.string()),
});

export async function generateDescription(input: DescriptionInput): Promise<AIDescriptionResult> {
  // Gate check
  if (!process.env.V3_AI_DESCRIPTION_ENABLED) {
    throw new Error('AI Description feature not enabled (V3 gate not passed)');
  }

  // Rate limit check (10/seller/day)
  const dailyCount = await getDailyAIDescriptionCount(input.seller_id);
  if (dailyCount >= 10) {
    throw new Error('Daily rate limit exceeded');
  }

  const openai = new OpenAI();
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: AI_DESCRIPTION_PROMPT },
      { role: 'user', content: JSON.stringify(input) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 500,
  });

  const raw = JSON.parse(resp.choices[0].message.content!);
  return DescriptionResultSchema.parse(raw);
}
```

---

## Version History

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial V3-gated prompt. Prepared in advance; deployment gated by Decision 9 criteria. 8 test cases including anti-patterns. |
