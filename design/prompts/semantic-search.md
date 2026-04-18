# Semantic Search — Query Understanding Prompt

**Purpose:** Interpret natural-language user queries + expand intent for better search results (Feature 2 in AI-FEATURES.md).
**Scale:** Called on every search query. Must be fast + cheap.

---

## Metadata

| Field | Value |
|---|---|
| Model | `gpt-4o-mini` |
| Temperature | `0.2` (slightly creative for synonyms) |
| Max input tokens | 500 |
| Max output tokens | 300 |
| Avg tokens/call | ~300 in · ~150 out |
| Avg cost/call | **$0.000135** |
| Latency p50 | 300ms |
| Latency p95 | 800ms |
| Caching | 24h TTL per normalized query string |

**Note:** For most queries we rely on the cheaper embedding-based search only (via `text-embedding-3-small`). This query-understanding prompt is optional — invoked only when:
- Query has < 3 exact matches via keyword search
- Query uses colloquial Arabic (e.g., "جوال زين")
- User explicitly opts into "Smart Search" indicator (future feature)

---

## System Prompt

```
You are a search query interpreter for Dealo Hub, a C2C marketplace in the Gulf.

A user typed a search query. Your job: extract structured intent so the search engine can return relevant listings.

SUPPORTED SIGNALS to extract:
- product_type — what item are they looking for?
- condition_preference — new / used / any (if implied)
- price_hint — if they mentioned "cheap", "budget", "premium", etc.
- brand_preference — specific brand mentioned
- intent — buy / browse / compare (if clear)
- synonyms — alternative search terms for better recall

RULES:
- Return ONLY JSON matching the schema below
- Keep interpretation SHORT and specific
- Do NOT over-expand (limit synonyms to 5 max)
- Preserve Gulf dialect tone in interpretation
- If query is very short (1-2 words) and clear, minimal interpretation needed
- If query is gibberish or unrelated to shopping, flag as "unclear"

COMMON GULF SEARCH PATTERNS:

"جوال" / "موبايل" → phone / smartphone
"قديم" → used (not "old" as negative)
"زين" / "ممتاز" → good condition preference
"رخيص" / "بسعر حلو" → low price preference
"أصلي" → authentic / original
"مستعمل" → used (standard)
"نظيف" → clean / well-maintained condition
"مقفّل" / "مغلق" → sealed / new
"للاستعجال" / "للبيع السريع" → urgent sale (ignore as search signal)

English patterns:
"cheap" → low price
"like new" → like_new condition
"mint" → excellent condition
"genuine" → authentic

OUTPUT SCHEMA:

{
  "product_type": string | null,  // "iPhone", "sofa", "treadmill"
  "condition_preference": "new" | "used" | "like_new" | "any" | null,
  "price_hint": "low" | "mid" | "high" | null,
  "brand_preference": string | null,  // "Apple", "Chanel"
  "intent": "buy" | "browse" | "compare" | null,
  "synonyms": string[],  // up to 5 alternative terms for better recall
  "interpreted_as": string,  // 1-sentence Arabic summary for "we understood this as..." UI
  "confidence": 0-1,
  "unclear": boolean  // true if query can't be interpreted
}
```

## User Message Template

```json
{
  "query": "{{user_query}}",
  "locale": "ar" | "en"
}
```

---

## Output Schema (TypeScript)

```typescript
interface SearchQueryInterpretation {
  product_type: string | null;
  condition_preference: 'new' | 'used' | 'like_new' | 'any' | null;
  price_hint: 'low' | 'mid' | 'high' | null;
  brand_preference: string | null;
  intent: 'buy' | 'browse' | 'compare' | null;
  synonyms: string[];          // max 5
  interpreted_as: string;      // for UI display
  confidence: number;          // 0-1
  unclear: boolean;
}
```

---

## Test Cases

### CASE 1 — Gulf colloquial query

**Input:** `{"query": "جوال قديم زين", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": "موبايل / جوال",
  "condition_preference": "used",
  "price_hint": null,
  "brand_preference": null,
  "intent": "buy",
  "synonyms": ["هاتف", "موبايل", "iPhone", "Samsung", "smartphone"],
  "interpreted_as": "موبايل مستعمل بحالة جيدة",
  "confidence": 0.88,
  "unclear": false
}
```

**Interpretation:** "جوال" = phone, "قديم" = used, "زين" = good condition. Combined = "used phone in good condition".

---

### CASE 2 — Specific brand + model

**Input:** `{"query": "iPhone 14 Pro Max", "locale": "en"}`

**Expected:**
```json
{
  "product_type": "iPhone 14 Pro Max",
  "condition_preference": "any",
  "price_hint": null,
  "brand_preference": "Apple",
  "intent": "buy",
  "synonyms": ["iPhone 14 Pro", "apple phone", "iphone pro max"],
  "interpreted_as": "iPhone 14 Pro Max (any condition)",
  "confidence": 0.95,
  "unclear": false
}
```

---

### CASE 3 — Price-sensitive query

**Input:** `{"query": "شنطة شانيل رخيصة", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": "حقيبة Chanel",
  "condition_preference": "used",
  "price_hint": "low",
  "brand_preference": "Chanel",
  "intent": "buy",
  "synonyms": ["Chanel bag", "شانيل bag", "حقيبة يد فاخرة"],
  "interpreted_as": "حقيبة Chanel بسعر منخفض (مستعملة غالباً)",
  "confidence": 0.90,
  "unclear": false
}
```

**Note:** "رخيصة" implies used — new Chanel bags are rarely "cheap" — so interpretation adds "used" hint.

---

### CASE 4 — Category-level query

**Input:** `{"query": "أثاث غرفة النوم", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": "أثاث غرفة نوم",
  "condition_preference": "any",
  "price_hint": null,
  "brand_preference": null,
  "intent": "browse",
  "synonyms": ["سرير", "خزانة ملابس", "كمودينو", "غرفة نوم كاملة"],
  "interpreted_as": "أثاث غرفة نوم (استعراض الفئة)",
  "confidence": 0.92,
  "unclear": false
}
```

---

### CASE 5 — Sealed / new query

**Input:** `{"query": "عطر مقفّل", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": "عطر",
  "condition_preference": "new",
  "price_hint": null,
  "brand_preference": null,
  "intent": "buy",
  "synonyms": ["perfume", "fragrance", "عطر جديد", "sealed cologne"],
  "interpreted_as": "عطر جديد مختوم",
  "confidence": 0.94,
  "unclear": false
}
```

---

### CASE 6 — Unclear query

**Input:** `{"query": "شي حلو", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": null,
  "condition_preference": null,
  "price_hint": null,
  "brand_preference": null,
  "intent": null,
  "synonyms": [],
  "interpreted_as": "لم نفهم البحث — جرّب تحديد المنتج",
  "confidence": 0.1,
  "unclear": true
}
```

---

### CASE 7 — Home fitness query

**Input:** `{"query": "treadmill cheap used", "locale": "en"}`

**Expected:**
```json
{
  "product_type": "treadmill",
  "condition_preference": "used",
  "price_hint": "low",
  "brand_preference": null,
  "intent": "buy",
  "synonyms": ["running machine", "cardio machine", "exercise bike"],
  "interpreted_as": "Used treadmill, budget-friendly",
  "confidence": 0.92,
  "unclear": false
}
```

---

### CASE 8 — Typo tolerance

**Input:** `{"query": "ايفون ١٤", "locale": "ar"}` (Arabic digits + informal)

**Expected:**
```json
{
  "product_type": "iPhone 14",
  "condition_preference": "any",
  "price_hint": null,
  "brand_preference": "Apple",
  "intent": "buy",
  "synonyms": ["ايفون 14", "iphone 14", "apple phone"],
  "interpreted_as": "iPhone 14",
  "confidence": 0.93,
  "unclear": false
}
```

**Note:** User types Arabic numerals (١٤), but we preserve the product identity. Display uses Western digits regardless.

---

### CASE 9 — Multi-item query

**Input:** `{"query": "بيبي كار سيت وعربانة", "locale": "ar"}`

**Expected:**
```json
{
  "product_type": "كرسي سيارة للأطفال وعربة",
  "condition_preference": "any",
  "price_hint": null,
  "brand_preference": null,
  "intent": "buy",
  "synonyms": ["car seat", "stroller", "عربة أطفال", "baby gear"],
  "interpreted_as": "مستلزمات الأطفال: كرسي سيارة وعربة",
  "confidence": 0.85,
  "unclear": false
}
```

---

### CASE 10 — Brand + condition

**Input:** `{"query": "Rolex like new", "locale": "en"}`

**Expected:**
```json
{
  "product_type": "Rolex watch",
  "condition_preference": "like_new",
  "price_hint": null,
  "brand_preference": "Rolex",
  "intent": "buy",
  "synonyms": ["luxury watch", "Submariner", "Datejust"],
  "interpreted_as": "Rolex watch in like-new condition",
  "confidence": 0.96,
  "unclear": false
}
```

---

## Integration in Search Pipeline

```typescript
// src/lib/search/semantic.ts
import { createClient } from '@/lib/supabase/server';
import { interpretQuery, embedQuery } from '@/lib/ai';

export async function searchListings(query: string, filters: Filters, locale: Locale) {
  // Step 1: Try keyword search first (cheap)
  const keywordResults = await keywordSearch(query, filters);
  if (keywordResults.length >= 10) return { results: keywordResults, interpreted: null };

  // Step 2: Try embedding search
  const queryEmbedding = await embedQuery(query);  // text-embedding-3-small
  const semanticResults = await semanticSearch(queryEmbedding, filters);

  // Step 3: If semantic results < 3, invoke query interpretation
  let interpretation = null;
  if (semanticResults.length < 3 && query.length > 3) {
    interpretation = await interpretQuery(query, locale);  // GPT-4o-mini

    if (interpretation && !interpretation.unclear) {
      // Re-embed with expanded synonyms
      const expandedQuery = `${query} ${interpretation.synonyms.join(' ')}`;
      const expandedEmbedding = await embedQuery(expandedQuery);
      const expandedResults = await semanticSearch(expandedEmbedding, filters);

      return { results: expandedResults, interpreted: interpretation };
    }
  }

  // Hybrid: merge keyword + semantic, dedupe, rank
  return {
    results: mergeAndRank(keywordResults, semanticResults),
    interpreted: interpretation,
  };
}
```

---

## Version History

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | V1 prompt with 10 test cases covering Gulf dialect + brand queries. Used only as fallback when embedding results < 3. |
