# Fraud Detection — Text Analysis Prompt

**Purpose:** Analyze listing title + description for scam/fraud indicators (Feature 1 in AI-FEATURES.md).
**Authority:** DECISIONS.md Decision 7 (hybrid GPT-4o-mini + GPT-4o strategy)
**Integrates with:** `planning/COMPETITOR-DUBIZZLE.md` (anti-Dubizzle moat)
**Reference patterns:** [`kuwait-scam-patterns.md`](./kuwait-scam-patterns.md)

---

## Metadata

| Field | V1 Value | V2 Value |
|---|---|---|
| Model | `gpt-4o-mini` | `gpt-4o` |
| Temperature | `0` (deterministic) | `0` |
| Max input tokens | 2,000 | 2,000 |
| Max output tokens | 500 | 500 |
| Avg tokens/call | 600 in · 150 out | 600 in · 200 out |
| Avg cost/call | **$0.0001** | **$0.0035** |
| Latency p50 | 400ms | 1,200ms |
| Latency p95 | 1,000ms | 2,500ms |
| Called on | Every new listing | Every new listing + every admin review |

---

## V1 System Prompt (gpt-4o-mini)

```
You are a fraud analyst for Dealo Hub, a C2C marketplace in Kuwait and the Gulf.

Your job: analyze ONE listing's text content and output a structured fraud risk assessment.

You must detect scam patterns common in the Gulf C2C context. Focus on:

1. ADVANCE-FEE FRAUD — requests for deposits, advance payment, "transfer first then I reserve"
   Arabic: "حوّلي مقدم", "ادفع عربون", "احجز بـ X دينار"
   English: "send a deposit", "pay advance to reserve"

2. PHONE NUMBER IN BODY — embedded phone to bypass platform chat
   Patterns like: "كلمني على 9XXXXXXX", "contact WhatsApp +965...", "للتواصل: 6XXXXXXX"
   Regex tip: (\+?965)?[\s-]?[0-9]{4}[\s-]?[0-9]{4}

3. OFF-PLATFORM REDIRECT — pushing user to WhatsApp/Instagram/external sites
   Arabic: "راسلني على واتساب", "تواصل خارج التطبيق"
   English: "message me on WhatsApp", "contact me outside"

4. FAKE OFFICIAL AUTHORITY — claiming to be from ministry, bank, police
   Arabic: "وزارة الداخلية", "مصادرة", "مزاد رسمي"
   English: "government auction", "seized goods", "ministry employee"

5. URGENCY MANIPULATION — artificial deadlines + no-negotiation demands
   Arabic: "آخر قطعة", "لحد الليلة", "جاد الرجاء عدم المفاوضة"
   English: "last piece", "tonight only", "serious buyers no negotiation"

6. COUNTERFEIT LUXURY TELLS (if category is luxury)
   Arabic: "طبق الأصل", "مثل الأصلي تماماً", "درجة أولى"
   English: "first copy", "mirror copy", "AAA replica", "original quality"

7. CRYPTO PAYMENT DEMAND — insisting on irreversible crypto
   "USDT", "TRC20", "Bitcoin", "عملة رقمية"

8. STOLEN/UNDOCUMENTED GOODS TELLS
   Arabic: "بدون فاتورة", "بدون صندوق", "للمستعجل بدون أسئلة"
   English: "no receipt", "no questions asked"

9. VISA/LABOR SERVICES IN PRODUCT CATEGORIES
   Arabic: "أسوي لك إقامة", "تأشيرة", "عقد عمل"
   English: "visa service", "residency processing"

10. PHISHING LINKS — external URLs in description

11. EMOTIONAL MANIPULATION / CHARITY GUILT
   "أحتاج المبلغ لعلاج ولدي", "سبب البيع: ظروف صحية"
   (moderate severity alone — escalate only with other flags)

RULES:
- Output ONLY valid JSON matching the schema below
- Temperature 0: be consistent
- When unsure, set confidence low rather than guessing severity
- Do NOT flag non-scams based on style/grammar alone
- Do NOT confuse a poor listing with a fraudulent one
- Gulf Arabic dialects are common — do not flag based on dialect
- Emoji usage alone is not a fraud signal

For each pattern detected, return:
- pattern_id (from the numbered list above, or "other")
- severity (0-100, your confidence this is fraud)
- evidence (exact quote from listing, max 100 chars)

Then compute overall risk_score as: max severity across flags (not sum).

Output schema:
{
  "risk_score": 0-100,
  "flags": [
    {
      "pattern_id": "advance_fee" | "phone_in_body" | "off_platform" | "fake_authority" | "urgency" | "counterfeit" | "crypto" | "stolen_goods" | "visa_service" | "phishing_link" | "emotional_manipulation" | "other",
      "severity": 0-100,
      "evidence": "exact quote"
    }
  ],
  "reasoning": "1-2 sentence summary in English",
  "confidence": 0-1
}

If no flags detected, return: {"risk_score": 0, "flags": [], "reasoning": "No fraud signals detected.", "confidence": 0.9}
```

## V1 User Message Template

```json
{
  "title": "{{listing.title}}",
  "description": "{{listing.description}}",
  "category_slug": "{{listing.category_slug}}",
  "price_minor_units": {{listing.price_minor_units}},
  "currency_code": "{{listing.currency_code}}",
  "seller": {
    "account_age_days": {{seller.account_age_days}},
    "phone_verified": {{seller.phone_verified}},
    "prior_listings_count": {{seller.prior_listings_count}},
    "prior_reports_count": {{seller.prior_reports_count}}
  }
}
```

---

## Output Schema (JSON)

```typescript
interface FraudTextResult {
  /** Overall risk 0-100. MAX across flags, not sum. */
  risk_score: number;

  /** Individual detected patterns */
  flags: Array<{
    pattern_id:
      | 'advance_fee'
      | 'phone_in_body'
      | 'off_platform'
      | 'fake_authority'
      | 'urgency'
      | 'counterfeit'
      | 'crypto'
      | 'stolen_goods'
      | 'visa_service'
      | 'phishing_link'
      | 'emotional_manipulation'
      | 'other';
    severity: number; // 0-100
    evidence: string; // ≤100 chars
  }>;

  /** Short English reasoning for audit logs */
  reasoning: string;

  /** Confidence in the analysis 0-1 */
  confidence: number;
}
```

---

## Risk Score → Action Mapping

Results are combined with rules-based behavioral scoring (see `src/lib/fraud/score.ts`):

| Total Score | fraud_status | Visible to buyer? |
|---|---|---|
| 0–30 | `clean` | ✅ Yes, with "AI Safety Checked" badge |
| 31–69 | `flagged` | ✅ Yes, with warning banner (Section 19 DESIGN.md) |
| 70–100 | `held` | ❌ No — admin review queue |

---

## V2 Upgrade (Month 4-6)

**Model:** GPT-4o (not mini)
**Cost impact:** ~25x per call ($0.0035 vs $0.0001) but volume still small
**Improvements:**
- Better Arabic dialect understanding (Gulf-specific humor, slang)
- Multi-pattern context awareness (combines related signals into coherent narrative)
- Counterfeit detection from image + text cross-reference (V2 includes photo analysis)
- Custom fine-tuned prompt from V1 flagged/resolved cases

**Gate for V2 upgrade:** monthly cost at V1 scale < $50 AND catch rate < 70% on held cases.

---

## Test Cases

### CASE 1 — Clean electronics listing (should NOT flag)

**Input:**
```json
{
  "title": "iPhone 13 Pro 256GB - بحالة ممتازة",
  "description": "آيفون 13 برو للبيع. اشتريته قبل سنتين، بحالة ممتازة، كل شي يشتغل تمام. البطارية 87%. السبب للبيع: طلعت أخر إصدار. الجهاز معاه الصندوق والشاحن.",
  "category_slug": "electronics",
  "price_minor_units": 85000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 180, "phone_verified": true, "prior_listings_count": 3, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 0,
  "flags": [],
  "reasoning": "Normal used-electronics listing. Seller provides reason for selling, battery info, accessories included. No scam indicators.",
  "confidence": 0.95
}
```

---

### CASE 2 — Advance fee fraud (MUST flag)

**Input:**
```json
{
  "title": "iPhone 15 Pro Max جديد مغلق",
  "description": "آيفون 15 برو ماكس 512 جيجا جديد مغلق بالكرتون. السعر 120 دينار فقط. حوّلي مقدم 30 دينار وراح أحجز لك الجهاز، باقي المبلغ عند الاستلام. جاد فقط.",
  "category_slug": "electronics",
  "price_minor_units": 120000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 2, "phone_verified": false, "prior_listings_count": 0, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 85,
  "flags": [
    {
      "pattern_id": "advance_fee",
      "severity": 85,
      "evidence": "حوّلي مقدم 30 دينار وراح أحجز لك الجهاز"
    }
  ],
  "reasoning": "Classic advance-fee scam: seller asks for deposit before 'reserving' item. Combined with implausibly low price for iPhone 15 Pro Max (market ~400 KWD) and new unverified account.",
  "confidence": 0.92
}
```

---

### CASE 3 — Phone number in body (MUST flag)

**Input:**
```json
{
  "title": "PS5 + ألعاب",
  "description": "سوني 5 مع 3 ألعاب. للجدية كلمني واتساب 99887766 أو اتصال 66554433.",
  "category_slug": "electronics",
  "price_minor_units": 145000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 15, "phone_verified": true, "prior_listings_count": 1, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 60,
  "flags": [
    {
      "pattern_id": "phone_in_body",
      "severity": 60,
      "evidence": "كلمني واتساب 99887766 أو اتصال 66554433"
    }
  ],
  "reasoning": "Listing includes explicit Kuwait phone numbers in description, bypassing platform chat (Decision 2 violation).",
  "confidence": 0.98
}
```

---

### CASE 4 — Counterfeit luxury (MUST flag)

**Input:**
```json
{
  "title": "حقيبة شانيل درجة أولى ممتازة",
  "description": "Chanel Classic Flap Bag طبق الأصل، مستحيل تفرقها عن الأصلية. جلد حقيقي، خياطة ممتازة. للبيع بسعر مناسب جداً.",
  "category_slug": "luxury",
  "price_minor_units": 45000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 30, "phone_verified": true, "prior_listings_count": 2, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 80,
  "flags": [
    {
      "pattern_id": "counterfeit",
      "severity": 80,
      "evidence": "طبق الأصل، مستحيل تفرقها عن الأصلية"
    }
  ],
  "reasoning": "Seller explicitly states item is a replica ('طبق الأصل' = exact copy). Hard violation of luxury category authenticity policy.",
  "confidence": 0.97
}
```

---

### CASE 5 — Fake authority (MUST flag)

**Input:**
```json
{
  "title": "سيارة مصادرة للبيع بسعر رمزي",
  "description": "من ضمن سيارات مصادرة من وزارة الداخلية. التوكيل جاهز، السعر رمزي 1500 دينار فقط. للمستعجل وأول من يتواصل يأخذها.",
  "category_slug": "general",
  "price_minor_units": 1500000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 5, "phone_verified": false, "prior_listings_count": 0, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 95,
  "flags": [
    {
      "pattern_id": "fake_authority",
      "severity": 90,
      "evidence": "سيارات مصادرة من وزارة الداخلية"
    },
    {
      "pattern_id": "urgency",
      "severity": 40,
      "evidence": "للمستعجل وأول من يتواصل"
    }
  ],
  "reasoning": "Fake authority framing — Kuwait ministries do not sell via C2C platforms. Combined with implausible 'symbolic price' and urgency tactics. High-confidence scam.",
  "confidence": 0.95
}
```

---

### CASE 6 — Crypto payment (MUST flag)

**Input:**
```json
{
  "title": "Rolex Submariner original",
  "description": "Rolex Submariner 2020 model, excellent condition. Payment only accepted in USDT TRC20 or Bitcoin. No cash.",
  "category_slug": "luxury",
  "price_minor_units": 4500000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 1, "phone_verified": false, "prior_listings_count": 0, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 88,
  "flags": [
    {
      "pattern_id": "crypto",
      "severity": 85,
      "evidence": "Payment only accepted in USDT TRC20 or Bitcoin"
    }
  ],
  "reasoning": "Crypto-only payment for high-value luxury item + brand-new unverified account = classic irreversible-payment scam pattern.",
  "confidence": 0.93
}
```

---

### CASE 7 — Legitimate pickup-only listing (should NOT flag)

**Input:**
```json
{
  "title": "طقم صالة 6 قطع - استلام شخصي",
  "description": "طقم صالة موديرن بحالة ممتازة، استخدام سنتين. القماش نظيف، ما فيه خدوش. الاستلام من السالمية فقط لأن القطعة كبيرة. السعر آخر 180 دينار.",
  "category_slug": "furniture",
  "price_minor_units": 180000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 90, "phone_verified": true, "prior_listings_count": 4, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 0,
  "flags": [],
  "reasoning": "Legitimate furniture listing. Pickup-only is standard for bulky items. No scam indicators.",
  "confidence": 0.96
}
```

---

### CASE 8 — Off-platform redirect (MUST flag, moderate)

**Input:**
```json
{
  "title": "PlayStation 5 + 5 games",
  "description": "PS5 bundle with 5 top games. السعر مناسب وقابل للنقاش. أنا ما أدخل المنصة كثير، راسلني على إنستقرام @scammer_account للتفاصيل والصور الإضافية.",
  "category_slug": "electronics",
  "price_minor_units": 120000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 10, "phone_verified": true, "prior_listings_count": 1, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 55,
  "flags": [
    {
      "pattern_id": "off_platform",
      "severity": 55,
      "evidence": "راسلني على إنستقرام @scammer_account"
    }
  ],
  "reasoning": "Seller pushes transaction off-platform to Instagram, bypassing platform safety + audit trail.",
  "confidence": 0.88
}
```

---

### CASE 9 — Legitimate luxury (should NOT flag)

**Input:**
```json
{
  "title": "Louis Vuitton Neverfull MM - مع الوصل",
  "description": "شنطة LV Neverfull MM اشتريتها من باريس في 2022. الحالة ممتازة جداً، استعمال معتدل. متوفر: الفاتورة الأصلية، الصندوق، dust bag، والبطاقة. Serial: SF1234. السعر 320 دينار.",
  "category_slug": "luxury",
  "price_minor_units": 320000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 365, "phone_verified": true, "prior_listings_count": 8, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 0,
  "flags": [],
  "reasoning": "Legitimate luxury resale: seller provides receipt, box, serial number, and purchase context. Established account with positive history.",
  "confidence": 0.95
}
```

---

### CASE 10 — Multi-pattern escalation (MUST flag high)

**Input:**
```json
{
  "title": "iPhone 15 Pro مصادر من الجمارك",
  "description": "من ضمن أجهزة جمارك الكويت، السعر رمزي 80 دينار. حوّل 20 دينار مقدم حجز لحسابي وراح ينرسلك الجهاز. لآخر الليلة فقط. ادفع USDT أو حوالة بنكية.",
  "category_slug": "electronics",
  "price_minor_units": 80000,
  "currency_code": "KWD",
  "seller": {"account_age_days": 1, "phone_verified": false, "prior_listings_count": 0, "prior_reports_count": 0}
}
```

**Expected output:**
```json
{
  "risk_score": 98,
  "flags": [
    {"pattern_id": "fake_authority", "severity": 90, "evidence": "من ضمن أجهزة جمارك الكويت"},
    {"pattern_id": "advance_fee", "severity": 85, "evidence": "حوّل 20 دينار مقدم حجز لحسابي"},
    {"pattern_id": "crypto", "severity": 80, "evidence": "ادفع USDT أو حوالة بنكية"},
    {"pattern_id": "urgency", "severity": 50, "evidence": "لآخر الليلة فقط"}
  ],
  "reasoning": "Maximum-severity multi-pattern scam: fake customs authority + advance fee + crypto + artificial urgency + new unverified account. Auto-hold for admin review.",
  "confidence": 0.99
}
```

---

## False-Positive Guards (should NOT trigger)

These phrases often appear in legitimate listings and **must not be flagged**:

| Phrase | Why it's legitimate |
|---|---|
| "للاستفسار" | Simple "for inquiries" — not off-platform redirect |
| "السعر نهائي" | Firm pricing, not urgency manipulation |
| "استلام من الموقع" | Standard pickup arrangement |
| "بدون تفاوض" | Fixed price preference, not fraud |
| "الجهاز ما عليه أي شي" | Item in perfect condition claim |
| "مع الكرتون والملحقات" | Legitimate "with box and accessories" |
| "السبب للبيع: ..." | Normal explanation of reason for selling |

---

## Error Handling (Fail-Open)

Per DECISIONS.md fail-open strategy — if prompt fails:

```typescript
catch (err) {
  // Log to Sentry
  sentry.captureException(err);

  // Return fail-open default
  return {
    risk_score: 0,
    flags: [],
    reasoning: 'AI check unavailable — fallback to rules-based only',
    confidence: 0,
    fallback: true, // tag so admin queue can re-run later
  };
}
```

**Principle:** Never block legitimate listings because AI is down.

---

## Integration Code Sketch

```typescript
// src/lib/ai/fraud/text-analysis.ts
import OpenAI from 'openai';
import { z } from 'zod';
import { FRAUD_V1_SYSTEM_PROMPT } from './prompts';

const FraudResultSchema = z.object({
  risk_score: z.number().min(0).max(100),
  flags: z.array(z.object({
    pattern_id: z.string(),
    severity: z.number().min(0).max(100),
    evidence: z.string().max(200),
  })),
  reasoning: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export async function analyzeFraudText(payload: FraudAnalysisInput) {
  const openai = new OpenAI();

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FRAUD_V1_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500,
    });

    const raw = JSON.parse(resp.choices[0].message.content!);
    const parsed = FraudResultSchema.safeParse(raw);

    if (!parsed.success) {
      console.error('[fraud-ai] Schema mismatch', parsed.error);
      return { risk_score: 0, flags: [], reasoning: 'parse_error', confidence: 0, fallback: true };
    }

    return parsed.data;
  } catch (err) {
    console.error('[fraud-ai] API error', err);
    return { risk_score: 0, flags: [], reasoning: 'api_error', confidence: 0, fallback: true };
  }
}
```

---

## Version History

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial V1 prompt. 11 fraud patterns. 10 test cases (5 scam, 5 clean). Cost $0.0001/call. |
