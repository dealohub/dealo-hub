# Prompt Library — Dealo Hub AI Pipeline

**Version:** 1.0 · **Last Updated:** April 18, 2026
**Reference:** `design/AI-FEATURES.md` · `planning/DECISIONS.md` Decisions 6 & 7

---

## Purpose

Source-of-truth for all LLM prompts used by Dealo Hub.

**Change discipline:**
- Every prompt has a version number + changelog
- Changes require updated test cases passing before deploy
- Prompts are code — treat them as such

---

## Index

| Prompt | Model (V1) | Model (V2) | Status | File |
|---|---|---|---|---|
| **Fraud text analysis** | `gpt-4o-mini` | `gpt-4o` | V1 production | [`fraud-detection.md`](./fraud-detection.md) |
| **Photo-to-Listing extraction** | `gpt-4o-mini` (vision) | `gpt-4o` (vision) | V1 (Minimal) | [`photo-to-listing.md`](./photo-to-listing.md) |
| **Semantic search query** | `gpt-4o-mini` | — | V1 (Basic) | [`semantic-search.md`](./semantic-search.md) |
| **AI description generation** | `gpt-4o-mini` | — | V3 gated (Decision 9) | [`ai-description.md`](./ai-description.md) |
| **Kuwait scam patterns** | — | — | Reference catalog | [`kuwait-scam-patterns.md`](./kuwait-scam-patterns.md) |

---

## Model Allocation (Decision 7)

```
GPT-4o-mini ($0.15/1M input + $0.60/1M output) — 90% of traffic
  ├─ Fraud text analysis (V1 minimal)
  ├─ Photo-to-Listing extraction
  ├─ Semantic search query interpretation
  └─ AI description generation (V3)

GPT-4o ($2.50/1M input + $10/1M output) — 10% critical
  ├─ Fraud full analysis (V2 upgrade)
  ├─ Luxury authentication analysis (V2)
  └─ Dispute resolution analysis (V2)

text-embedding-3-small ($0.02/1M tokens) — semantic indexing
  └─ Listing embeddings for search + duplicate detection
```

---

## Prompt Authoring Conventions

### 1. Structure

Every prompt file contains:

```
# [Prompt Name] — [Purpose]

## Metadata
- Model, Version, Cost per call, Max tokens

## System Prompt
The actual instructions to the LLM

## User Message Template
Placeholders like {title}, {photos}, {description}

## Output Schema
Full JSON schema with example output

## Test Cases
Real examples with expected outputs

## Integration Notes
How to call from code, error handling, fallback

## Version History
```

### 2. Language

**Prompts are in English** (better LLM instruction adherence) but handle content in Arabic + English.

Exception: User-facing output that gets shown without translation should match user locale.

### 3. Output Constraints

- Always request **JSON output** via `response_format: { type: "json_object" }` (for OpenAI)
- Always include explicit `{ "confidence": 0-1 }` where reasoning is non-trivial
- Always include fallback text: "If unsure, return null rather than guessing"

### 4. Token Budget

Hard caps per prompt type:

| Type | Max Input | Max Output |
|---|---|---|
| Fraud text analysis | 2,000 | 500 |
| Photo-to-Listing | 8,000 (includes images) | 500 |
| Semantic search | 500 | 300 |
| AI description | 2,000 | 500 |

**Why:** prevents runaway costs + ensures responses stay focused.

### 5. Testing

Every prompt ships with:
- 5+ "should flag" test cases (for detectors)
- 5+ "should not flag" test cases (false positive prevention)
- Expected JSON output per case

**Rule:** do not merge a prompt change if test cases fail or are not updated.

---

## Integration Pattern (TypeScript)

```typescript
// Typical call pattern
import OpenAI from 'openai';
import { FRAUD_TEXT_PROMPT, FraudTextResultSchema } from '@/lib/prompts';

const openai = new OpenAI();

async function analyzeFraudText(title: string, description: string, metadata: {...}) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: FRAUD_TEXT_PROMPT },
      { role: 'user', content: JSON.stringify({ title, description, metadata }) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,        // deterministic for fraud detection
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content;
  const parsed = FraudTextResultSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    // Log + fail-open (per Decision 8 fail-open strategy)
    console.error('[fraud-ai] Invalid output schema', parsed.error);
    return { risk_score: 0, flags: [], reasoning: 'ai_parse_error', fallback: true };
  }

  return parsed.data;
}
```

---

## Prompt Evolution Process

1. **Propose:** Draft change in a Git branch with rationale
2. **Test:** Run against all documented test cases
3. **Shadow mode:** Deploy alongside current prompt, compare outputs for 1 week
4. **Evaluate:** Compute agreement rate + human review of divergences
5. **Promote or Rollback:** Based on shadow-mode data
6. **Version bump:** Update prompt version + changelog

---

## Cost Monitoring

Track per prompt (via OpenAI dashboard + PostHog custom event):

- Total calls / day
- Avg tokens input / output
- Avg cost per call
- Failure rate (parse errors, API errors)

**Monthly budget per prompt type** (from AI-FEATURES.md kill switches):

| Prompt | Launch budget | Alert at | Kill at |
|---|---|---|---|
| Fraud text | $20 | $50 | $100 |
| Photo-to-Listing | $5 | $15 | $30 |
| Semantic search | $3 | $10 | $25 |
| AI description (V3) | $10 | $30 | $50 |

---

## Shared Input Conventions

### Listing context payload

Most prompts receive a standardized `listing_context` object:

```json
{
  "listing_id": 12345,
  "title": "iPhone 14 Pro Max",
  "description": "...",
  "category_slug": "electronics",
  "price_minor_units": 145000,
  "currency_code": "KWD",
  "condition": "excellent_used",
  "seller": {
    "account_age_days": 120,
    "phone_verified": true,
    "prior_listings_count": 8,
    "prior_reports_count": 0
  }
}
```

### Locale-aware output

```json
{
  "output_ar": "...",
  "output_en": "...",
  "primary_locale": "ar"
}
```

---

## Safety & Compliance

- **Never log user PII** in prompt debug output
- **Never store prompts with phone numbers** exposed — redact before logging
- **All prompts disclose they are AI** — never anthropomorphize in user-facing output
- **Arabic bias testing:** every prompt tested with Gulf dialect samples, not just MSA

---

*For implementation status see `AI-FEATURES.md` phasing matrix. For decision rationale see `DECISIONS.md`.*
