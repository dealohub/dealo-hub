# AI Features Specification — Dealo Hub
### AI-Assisted, Human-Curated — The Anti-Dubizzle Playbook

**Date:** April 18, 2026
**Version:** 1.0
**Philosophy:** AI-Assisted, NOT AI-First
**Model Strategy:** GPT-4o-mini (90% volume) + GPT-4o (10% critical)
**Status:** Specification — not yet implemented

---

## Table of Contents

1. [Philosophy & Positioning](#1-philosophy--positioning)
2. [The 5 AI Features (Priority Ranked)](#2-the-5-ai-features)
3. [Feature 1: AI Fraud Detection 🔴 PRIORITY #1](#feature-1-ai-fraud-detection)
4. [Feature 2: Semantic Search 🟠 PRIORITY #2](#feature-2-semantic-search)
5. [Feature 3: Photo-to-Listing (V1 Minimal + V2 Full) 🟠 PRIORITY #3](#feature-3-photo-to-listing-ai-assisted--priority-3--v1-minimal--v2-full)
6. [Feature 4: Smart Pricing 🟡 PRIORITY #4](#feature-4-smart-pricing)
7. [Feature 5: AI Description Generator 🟡 PRIORITY #5](#feature-5-ai-description)
8. [Consolidated Cost Model](#8-consolidated-cost-model)
9. [Phasing Matrix (V1/V2/V3)](#9-phasing-matrix)
9.5. [Telemetry Infrastructure (V1)](#95-telemetry-infrastructure-v1)
10. [Integration with Existing Planning Stack](#10-integration-with-existing-planning-stack)
11. [V3 AI Description — Go/No-Go Framework](#11-v3-ai-description--explicit-gono-go-framework)
12. [Appendix: Prompt Library](#12-appendix-prompt-library)

---

## 1. Philosophy & Positioning

### The Core Distinction

**Dubizzle (AI-First):** AI writes the listing. Human clicks "publish."
**Dealo Hub (AI-Assisted):** AI suggests. Human curates. Human publishes.

### Why This Matters

**Scenario:** Seller uploads 8 photos of a Hermès Birkin bag.

| Platform | What Happens |
|---|---|
| **Dubizzle "Sell with AI"** | AI generates a 2-paragraph description using a template. Same tone as 842,000 other listings. No personality. Luxury buyer distrusts because it reads "machine-written." |
| **Dealo Hub "AI-Assisted"** | AI extracts brand, model, color, condition. AI pre-fills fields. Seller reviews, adds personal story ("Gifted to me in 2019, carried to 3 weddings"), confirms authenticity, publishes. |

**The result:**
- Dubizzle = commodity listings at scale
- Dealo Hub = curated listings with personality (especially wins for premium/luxury)

### Public-Facing Messaging

**For sellers:**
> "الذكاء الاصطناعي يساعدك، ما يبيع عنك. كل إعلان من إنسان."
> "AI helps you. You sell. Every listing is human-signed."

**For buyers:**
> "إعلاناتنا مكتوبة بإنسان، محمية بذكاء اصطناعي."
> "Human-written listings. AI-protected marketplace."

### The 4 AI Principles

1. **Never hide AI usage.** Every AI-assisted action has a clear UI indicator.
2. **Always show confidence.** AI outputs come with confidence scores; low confidence = human fallback.
3. **Humans override defaults.** Every AI suggestion can be ignored, edited, or reversed.
4. **AI is invisible for safety, visible for convenience.** Fraud detection runs silently. Photo-to-Listing is obvious.

---

## 2. The 5 AI Features

**Reordered priority (Fraud #1, Search #2) — Updated April 18 to include V1 Minimal Photo-to-Listing:**

| # | Feature | Purpose | V1 Status | Annual Cost (low) | Dubizzle Gap |
|---|---|---|---|---|---|
| **1** | 🔴 **AI Fraud Detection** | Trust moat, safety | **V1 (partial)** | $300-1,200 | **Huge** |
| 2 | 🟠 **Semantic Search** | UX revolution | **V1 (basic)** | $60-240 | Moderate |
| 3 | 🟠 **Photo-to-Listing** | Competitive parity | **V1 (Minimal) + V2 (Full)** | $180-400 | Match |
| 4 | 🟡 **Smart Pricing** | Seller UX | V2 | $60-180 | Match |
| 5 | 🟡 **AI Description** | Convenience | V3 (gated — see Section 11) | $30-60 | Match |

**V1 Scope Change (April 18 decision):** Photo-to-Listing promoted from V2-only to V1 Minimal + V2 Full.
**Rationale:** Dubizzle's "Sell with AI" made AI-assisted listing creation a market baseline expectation (842K listings generated). V1 without any equivalent = competitive disadvantage. V1 Minimal scope preserves "Human-Written" positioning by excluding description generation.

---

## Feature 1: AI Fraud Detection 🔴 PRIORITY #1

### Purpose & Differentiation

**The Core Insight:** Dubizzle has moderation, but it's reactive — they respond to reports after damage is done. Their public reviews mention scam experiences constantly. **No marketplace in the GCC markets itself as "AI-Protected."**

**Dealo Hub's Opportunity:** Ship a visible, proactive AI fraud layer. Make trust the product, not an afterthought.

### The 5 Types of Fraud We Detect

```
┌─────────────────────────────────────────────────────────────┐
│                  DEALO HUB FRAUD DETECTION                    │
│                                                               │
│  Type                    Signal                    Action     │
│  ────────────────────────────────────────────────────────    │
│  1. Stolen Photos        Reverse image search     Block      │
│  2. Scam Text Patterns   GPT-4o analysis          Flag       │
│  3. Price Anomaly        Statistical outliers     Warn       │
│  4. Duplicate Listings   Embedding similarity     Dedup      │
│  5. Behavioral Red Flags New acct + high-value    Review     │
└─────────────────────────────────────────────────────────────┘
```

### Marketing Story (External)

> **"First AI-Protected Marketplace in the GCC"**
>
> Every listing passes through 5 AI safety checks before going live:
> - ✓ Photo authenticity verified
> - ✓ Scam patterns detected
> - ✓ Price sanity checked
> - ✓ Duplicates prevented
> - ✓ Seller behavior analyzed

This messaging goes on homepage, category pages, and transaction emails. Dubizzle can't claim this without an 18-month rebuild.

---

### User Flow — Seller-Side

```
┌─────────────────────────────────────────────────────────────┐
│  Seller creates listing                                      │
│  Fills title, uploads 8 photos, sets price...                │
│                                                               │
│  Clicks [نشر الإعلان]                                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  🔄 جاري فحص الإعلان...                                      │
│                                                               │
│  ✓ صور أصلية (0 متطابقات)                                   │
│  ✓ النص واضح                                                 │
│  ⏳ فحص السعر...                                             │
│  ─ ─ ─                                                        │
│                                                               │
│  This screen shown for 3-8 seconds                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
   ┌──────────────────┐     ┌──────────────────┐
   │  CLEAN → Publish  │     │  FLAGGED → Warn   │
   └──────────────────┘     └──────────────────┘
```

### User Flow — Buyer-Side (Invisible by Default)

Normal buyers never see fraud warnings on listings (they're pre-filtered). If they visit an edge-case listing:

```
┌─────────────────────────────────────────────────────────────┐
│  [Listing Detail Page]                                       │
│                                                               │
│  iPhone 14 Pro Max 256GB                                     │
│  السالمية · قبل ساعتين                                       │
│                                                               │
│  KWD 145.000  💬 قابل للتفاوض                                │
│                                                               │
│  [تواصل مع البائع]    [♡]    [🚩]                            │
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                        │
│  🛡️ إشارات الأمان                                             │
│                                                               │
│  ✓ صور أصلية                                                 │
│  ✓ السعر ضمن المتوسط (KWD 130-160)                           │
│  ✓ بائع موثّق (عضو منذ 6 شهور)                                │
│  ✓ محتوى الإعلان يبدو طبيعياً                                  │
│                                                               │
│  [معرفة كيف نحمي المعاملات ↗]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Only when flags exist, warnings appear subtly:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ إشارة تحذير                                                │
│                                                               │
│  السعر (KWD 80) أقل بكثير من متوسط السوق                      │
│  (KWD 130-160). تحقق جيداً قبل الشراء.                        │
│                                                               │
│  [📖 نصائح للشراء الآمن]                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### Technical Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     FRAUD DETECTION PIPELINE                     │
└────────────────────────────────────────────────────────────────┘

  ┌─────────────┐
  │  New        │
  │  Listing    │─────┐
  └─────────────┘     │
                      │
                      ▼
  ┌───────────────────────────────────────┐
  │  Layer 1: Reverse Image Search        │  <100ms per image
  │  ─────────────────────────────────    │  Google Vision API
  │  - Check each image against           │  $1.50 / 1000 images
  │    known stolen photo DB               │
  │  - Check against our own listings     │  Caches hits locally
  │    (duplicates)                        │
  └───────────────┬───────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────────────┐
  │  Layer 2: Text Pattern Analysis       │  ~500 tokens GPT-4o
  │  ─────────────────────────────────    │  $2.50/1M tokens
  │  - GPT-4o scan of title+description   │  ~$0.0013 per listing
  │  - Detects: scam phrases, phone       │
  │    numbers in body, WhatsApp pump,    │
  │    payment-request patterns            │
  └───────────────┬───────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────────────┐
  │  Layer 3: Price Anomaly Detection     │  Pure SQL + pgvector
  │  ─────────────────────────────────    │  Free
  │  - Find similar listings (embedding)  │
  │  - Compare to median + IQR            │
  │  - Flag if <50% or >200% of median    │
  └───────────────┬───────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────────────┐
  │  Layer 4: Embedding Duplicate Check   │  OpenAI embeddings
  │  ─────────────────────────────────    │  $0.02/1M tokens
  │  - Embed title+description            │  ~$0.00002 per listing
  │  - Cosine similarity > 0.95 = dupe    │
  └───────────────┬───────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────────────┐
  │  Layer 5: Behavioral Scoring          │  Rules engine
  │  ─────────────────────────────────    │  Free (pure logic)
  │  - Account age < 7 days? +10 risk     │
  │  - First listing > KWD 500? +15 risk  │
  │  - No phone verified? +20 risk        │
  │  - Already 3+ reports? +30 risk       │
  │  - Luxury category + no video? +25    │
  └───────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  RISK SCORE    │
         │  0-100 total   │
         └────────┬───────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌──────┐ ┌──────┐ ┌──────┐
    │ 0-30 │ │31-69 │ │70+   │
    │ CLEAN│ │ WARN │ │ HOLD │
    │ pub  │ │ pub+ │ │ admin│
    │      │ │ flag │ │ queue│
    └──────┘ └──────┘ └──────┘
```

### Data Model Additions

```sql
-- Add to listings table
ALTER TABLE listings ADD COLUMN fraud_score INT DEFAULT 0;
ALTER TABLE listings ADD COLUMN fraud_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN fraud_checked_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN fraud_status TEXT DEFAULT 'pending';
-- 'pending' | 'clean' | 'flagged' | 'held' | 'rejected' | 'approved_manual'

-- New fraud_events table for audit
CREATE TABLE fraud_events (
  id            BIGSERIAL PRIMARY KEY,
  listing_id    BIGINT REFERENCES listings(id),
  user_id       UUID REFERENCES profiles(id),
  event_type    TEXT, -- 'stolen_image' | 'scam_text' | 'price_anomaly' | 'duplicate' | 'behavior'
  severity      INT,  -- 0-100
  details       JSONB,
  resolved_by   UUID REFERENCES profiles(id), -- admin user
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Image hash cache for reverse search
CREATE TABLE image_hashes (
  id            BIGSERIAL PRIMARY KEY,
  perceptual_hash TEXT UNIQUE,   -- pHash from image
  listing_id    BIGINT REFERENCES listings(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_image_hashes_phash ON image_hashes (perceptual_hash);

-- Embeddings for duplicate detection
CREATE TABLE listing_embeddings (
  listing_id    BIGINT PRIMARY KEY REFERENCES listings(id),
  embedding     vector(1536),  -- OpenAI text-embedding-3-small
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_listing_embeddings ON listing_embeddings
  USING ivfflat (embedding vector_cosine_ops);
```

### Fallback Strategy

```
If OpenAI API fails     → Skip Layer 2, mark as "unreviewed text"
If Google Vision fails  → Skip Layer 1, rely on hash check only
If pgvector unavailable → Skip Layer 4, mark as "unchecked dedup"
If all AI fails         → Fallback to rule-based only (Layer 5)
                          Publish with "⚠️ AI Check Pending" badge
                          Re-run when services restore
```

**Principle:** Never block a listing because AI is down. Always fail-open with clear signals to buyers.

---

### UI Components

Link to DESIGN.md Section 14 (Trust Signal Hierarchy) — these integrate there.

#### Component 1: `FraudCheckProgress` (Seller-side, during submission)

```tsx
<div className="flex flex-col gap-3 p-6 rounded-2xl bg-deep-layer">
  <h3 className="text-heading-3 font-semibold">جاري فحص الإعلان...</h3>

  <ul className="flex flex-col gap-2">
    {checks.map(check => (
      <li key={check.id} className="flex items-center gap-2">
        {check.status === 'checking' && (
          <Spinner className="size-4 text-warm-amber" />
        )}
        {check.status === 'passed' && (
          <CheckIcon className="size-4 text-success-sage" />
        )}
        {check.status === 'failed' && (
          <AlertIcon className="size-4 text-caution-flax" />
        )}
        <span className="text-body-small">{check.label}</span>
      </li>
    ))}
  </ul>
</div>
```

#### Component 2: `SafetySignalsStack` (Buyer-side, on listing detail)

```tsx
<section className="
  flex flex-col gap-3 p-4
  bg-success-sage/5 rounded-xl
  border border-success-sage/20
">
  <h4 className="
    flex items-center gap-2
    font-semibold text-body text-charcoal-ink
  ">
    <ShieldIcon className="size-4 text-success-sage" />
    إشارات الأمان
  </h4>

  <ul className="flex flex-col gap-2">
    <li className="flex items-start gap-2">
      <CheckIcon className="size-3.5 text-success-sage shrink-0 mt-0.5" />
      <span className="text-body-small">صور أصلية (لم تظهر في إعلانات أخرى)</span>
    </li>
    {/* ... more signals */}
  </ul>

  <Link
    href="/safety"
    className="text-caption text-warm-amber underline"
  >
    كيف نحمي المعاملات؟
  </Link>
</section>
```

#### Component 3: `FraudWarningBanner` (Buyer-side, when flags exist)

```tsx
<div className="
  flex items-start gap-3 p-4
  bg-caution-flax/5 rounded-xl
  border-s-4 border-caution-flax
">
  <AlertTriangleIcon className="size-5 text-caution-flax shrink-0" />
  <div className="flex flex-col gap-1">
    <h4 className="font-semibold text-body text-charcoal-ink">
      إشارة تحذير
    </h4>
    <p className="text-body-small text-muted-steel">
      {warning.message}
    </p>
    <Link href="/safety/tips" className="text-caption text-warm-amber underline mt-1">
      📖 نصائح للشراء الآمن
    </Link>
  </div>
</div>
```

#### Component 4: `AdminFraudQueue` (Internal tool)

Simple dashboard at `/admin/fraud` showing held listings with:
- Listing preview
- Flags triggered
- Fraud score breakdown
- [Approve] [Reject] [Request Changes] actions

### Animation States

- **Checking:** Spinner + progressive checkmark reveal (staggered 300ms per check)
- **Passed all:** Green burst animation + smooth fade to publish state
- **Flagged:** Amber pulse on flag icon + warning reveal slide-in
- **Held for review:** Warning icon + calm messaging (no alarm)

---

### Cost Analysis

**Per listing creation:**

| Check | API | Cost per listing |
|---|---|---|
| Reverse image search | Google Vision | $0.015 (10 images × $0.0015) |
| Text pattern analysis | GPT-4o | $0.0013 (500 tokens) |
| Embedding for dedup | OpenAI text-embed-3-small | $0.00002 |
| Price anomaly | pgvector (free) | $0 |
| Behavioral score | In-house | $0 |
| **Total per new listing** | | **~$0.017** |

**Monthly volume projections:**

| Listings/month | Monthly cost | Annual cost |
|---|---|---|
| 500 (Month 1-2) | $8.50 | $100 |
| 1,500 (Month 3-6) | $25.50 | $300 |
| 5,000 (Month 6-12) | $85 | $1,020 |
| 15,000 (Year 2) | $255 | $3,060 |

**Scaling thresholds:**
- < 1,000 listings/month: fully automated, no ops cost
- 1,000-5,000: 1 admin review per 100 flagged (Fawzi does this)
- 5,000+: part-time moderator needed (~$500/month)

---

### Success Metrics

**Primary KPI:** Fraud rate (listings removed after publication / total listings)
- **Target:** <0.5% (industry average ~3-5%)

**Secondary KPIs:**
- False positive rate (clean listings incorrectly flagged): < 5%
- Average fraud check time: < 5 seconds
- Reports from buyers ratio (user-reported/total): < 0.1%
- Scam-related support tickets: < 1/week at 1,000 MAU

**A/B Test Ideas:**
- Test 1: Show "SafetySignalsStack" prominently vs hidden by default → measure contact rate
- Test 2: Show fraud check progress to seller vs silent processing → measure completion rate
- Test 3: "AI Protected" homepage badge vs no badge → measure new signup rate

### Phase

**V1 (Launch):**
- ✅ Reverse image search (Google Vision)
- ✅ Basic text pattern detection (GPT-4o-mini, not full)
- ✅ Price anomaly (pgvector)
- ✅ Behavioral scoring rules
- ⏸️ SafetySignalsStack UI shown to buyers
- ⏸️ FraudCheckProgress UI shown to sellers
- ❌ Full duplicate detection (V2)
- ❌ Admin queue dashboard (use Supabase dashboard manually in V1)

**V2 (Month 4-6):**
- ✅ Full GPT-4o text analysis (upgrade from mini)
- ✅ Duplicate detection via embeddings
- ✅ Admin queue dashboard
- ✅ Appeal flow
- ✅ "AI-Protected" public marketing

**V3 (Month 7-9):**
- ✅ Cross-listing behavioral patterns
- ✅ Image deepfake detection
- ✅ Luxury authentication AI (bag/watch authentication models)

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| False positives block legitimate sellers | High | High | Aggressive review in first 3 months, adjust thresholds weekly, never auto-reject in V1 |
| Fraud costs exceed budget | Low | Medium | Hard cap at $200/month, auto-fallback to rules-only |
| Google Vision API downtime | Medium | Low | Cache previous checks, fail-open |
| Sophisticated fraudsters bypass AI | Medium | Medium | Layer with human review for high-value listings (luxury, electronics >KWD 500) |
| "AI-protected" marketing creates legal liability | Medium | Medium | Legal disclaimer: "AI checks are supplementary, not guarantees. Buyer due diligence required." |
| AI misses culturally-specific scams (Arabic patterns) | High | Medium | Manually curate prompt library with local scam examples, update monthly |

---

## Feature 2: Semantic Search 🟠 PRIORITY #2

### Purpose & Differentiation

**The query that changes everything:** User types `"جوال قديم زين"` → finds iPhone listings.

**Dubizzle's search:** Keyword-based. Types "قديم زين" → finds literally those words.
**Dealo Hub's search:** Semantic. Understands intent. Returns relevant items even if exact words don't match.

**Gap size:** Moderate. Dubizzle has decent search. Our goal isn't to outperform drastically — it's to feel magical enough that users prefer us.

### User Flow

```
┌────────────────────────────────────────────────────────────┐
│  [🔍  جوال قديم زين بسعر معقول]                    [بحث]   │
└────────────────────────────────────────┬───────────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                          ▼                               ▼
               ┌──────────────────┐          ┌──────────────────┐
               │  Embedding       │          │  Keyword match    │
               │  (semantic)      │          │  (exact)          │
               └────────┬─────────┘          └────────┬─────────┘
                        │                              │
                        └──────────┬───────────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────────┐
                     │  Hybrid ranking              │
                     │  (semantic 70% + keyword 30%)│
                     └─────────────┬───────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────┐
│  نتائج ذكية (8)          [ترتيب: الأنسب ▾]                  │
│  ✨ نتائج مبنية على فهم طلبك                                │
│                                                              │
│  [Listing] iPhone 12 128GB - حالة ممتازة                    │
│  [Listing] Samsung S21 - رخيص                                │
│  [Listing] iPhone 11 Pro - بسعر معقول                       │
│  ...                                                         │
└────────────────────────────────────────────────────────────┘
```

### ASCII Mockup: Search Bar with AI Indicator

```
┌──────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔍  ابحث عن منتج، ماركة، أو صف ما تبحث عنه...   ✨ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                    ▲      │
│                                          AI icon shows    │
│                                          semantic enabled │
└──────────────────────────────────────────────────────────┘
```

When typing, show AI interpretation:

```
┌──────────────────────────────────────────────────────────┐
│  🔍  جوال قديم زين                                   ✨   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 💡 فهمت بحثك كـ:                                    │  │
│  │    "موبايل مستعمل بحالة جيدة"                       │  │
│  │    [استخدم هذا الفهم] [عدّل]                        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Technical Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  SEMANTIC SEARCH PIPELINE                    │
└────────────────────────────────────────────────────────────┘

INDEX PHASE (on listing publish):

  ┌─────────────┐
  │ New listing │
  └──────┬──────┘
         │
         ▼
  ┌────────────────────────────┐
  │ Concat: title + desc +     │
  │   category + brand + area  │
  └──────────┬─────────────────┘
             │
             ▼
  ┌────────────────────────────┐
  │ OpenAI                     │
  │ text-embedding-3-small     │
  │ → vector(1536)             │
  └──────────┬─────────────────┘
             │
             ▼
  ┌────────────────────────────┐
  │ Supabase pgvector          │
  │ INSERT INTO                 │
  │   listing_embeddings       │
  └────────────────────────────┘


QUERY PHASE (on user search):

  ┌─────────────┐
  │ User query  │
  │ "جوال قديم" │
  └──────┬──────┘
         │
         ▼
  ┌────────────────────────────┐
  │ OpenAI embedding           │  ~$0.000001
  │ → vector(1536)             │  per query
  └──────────┬─────────────────┘
             │
             ▼
  ┌────────────────────────────┐
  │ pgvector cosine similarity │
  │ SELECT ... ORDER BY         │
  │   embedding <=> query_embed │
  │ LIMIT 20                    │
  └──────────┬─────────────────┘
             │
             ▼
  ┌────────────────────────────┐
  │ Merge with keyword results │
  │ (Postgres FTS)              │
  │ 70% semantic + 30% keyword  │
  └──────────┬─────────────────┘
             │
             ▼
  ┌────────────────────────────┐
  │ Return to user              │
  │ Render ListingGrid          │
  └────────────────────────────┘
```

### UI Components

Link to DESIGN.md Section 12 (Search & Filter System) — these replace/augment existing search.

Components needed:
- `SemanticSearchInput` — enhanced version with AI indicator
- `QueryInterpretation` — shows "we understood this as..."
- `SearchResultsHeader` — badge "Smart Results (8)"
- `FallbackNotice` — "keyword search only" when AI fails

### Cost Analysis

| Metric | Value |
|---|---|
| Embedding per listing (indexing) | $0.000002 (100 tokens × $0.02/1M) |
| Embedding per search query | $0.000001 |
| pgvector storage | Free (included Supabase) |
| Monthly cost at 5,000 listings + 50,000 searches | $0.05 + $0.10 = **$0.15** |

**This feature is effectively free.** The cost is engineering time, not API spend.

### Success Metrics

- Search result click-through rate (> 25% for top 3 results)
- Zero-result queries (< 10%)
- Search-to-contact conversion (> 8%)
- User satisfaction with "smart search" (qualitative NPS)

**A/B Test:** Semantic vs keyword only — measure contact rate post-search.

### Phase

**V1:**
- Basic pgvector indexing on all listings
- Simple cosine similarity search
- Hybrid ranking (semantic + keyword)

**V2:**
- Query understanding ("what did you mean?" UI)
- Multi-language query support (ar → en listings)
- Personalized ranking based on history

**V3:**
- Image search ("find similar to this photo")
- Voice search
- Visual filters (colors, styles)

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Embedding quality poor for Arabic | Test with text-embedding-3-large fallback ($0.13/1M, 6x more expensive but better Arabic) |
| Cold start (no embeddings yet) | Embed all listings on publish; for V1 launch, batch-embed 220 seed listings before open beta |
| Query interpretation confuses users | Make AI indicator subtle; allow opt-out to keyword search |
| Vector index performance degrades at scale | Re-index monthly, use ivfflat with tuned parameters |

---

## Feature 3: Photo-to-Listing (AI-Assisted) 🟠 PRIORITY #3 — V1 MINIMAL + V2 FULL

### Purpose & Differentiation

**Dubizzle:** "Sell with AI" generates full listings in 30 seconds. User clicks publish. All listings sound identical.

**Dealo Hub:** "AI-Assisted" extracts structured info (category, condition, brand). Human writes personality into description.

**The key positioning:** On our platform, 80% of listings will still be primarily human-written. AI handles the tedious structured-data extraction (what's the category? what condition?) while the seller writes the story.

### V1 Minimal Scope — Strict Lock

**ONLY 3 fields detected in V1:**

| Field | V1 | V2 | Confidence Threshold |
|---|---|---|---|
| **Category** (main + sub) | ✅ Yes | Enhanced | ≥ 0.80 to show suggestion |
| **Brand** (luxury category only) | ✅ Yes | All categories | ≥ 0.80 |
| **Condition** (4 levels) | ✅ Yes | 6 levels | ≥ 0.75 |
| Color | ❌ No | ✅ Yes | — |
| Model | ❌ No | ✅ Yes | — |
| Suggested title | ❌ No | ✅ Yes | — |
| **Description** | ❌ **Never** (positioning lock) | ❌ **Never** | — |

**Below threshold:** Silently skip suggestion. User fills manually. No "low confidence" friction shown.

**Description generation is explicitly NEVER in this feature.** See Feature 5 for description, gated to V3 with strict go/no-go criteria.

### User Flow

```
Step 1: Upload Photos
┌────────────────────────────────────────┐
│  [+ أضف صور]                            │
│  ┌───┬───┬───┐                          │
│  │img│img│img│                          │
│  └───┴───┴───┘                          │
│  [تحليل الصور بالذكاء الاصطناعي ✨]     │
└──────────────┬─────────────────────────┘
               │
               ▼ (3-5 seconds)
┌────────────────────────────────────────┐
│  ✨ الذكاء الاصطناعي اقترح:              │
│                                         │
│  الفئة:      إلكترونيات > موبايلات       │
│              [✓ قبول] [✎ تغيير]         │
│                                         │
│  الحالة:     مستعمل - حالة ممتازة        │
│              [✓ قبول] [✎ تغيير]         │
│                                         │
│  الماركة:    Apple                       │
│              [✓ قبول] [✎ تغيير]         │
│                                         │
│  العنوان المقترح:                         │
│  "iPhone 14 Pro Max 256GB - حالة ممتازة" │
│  [استخدم هذا] [اكتب عنواني]              │
│                                         │
│  💡 الوصف: نحن نترك لك كتابة الوصف       │
│  بشخصيتك. اذكر: تاريخ الشراء، استخدامك،   │
│  سبب البيع، وأي تفاصيل خاصة.             │
└────────────────────────────────────────┘

Step 2: Human writes description
┌────────────────────────────────────────┐
│  الوصف:                                  │
│  ┌────────────────────────────────────┐ │
│  │ اشتريت هذا الجهاز قبل سنة.         │ │
│  │ استخدمته يومياً، بحالة ممتازة.     │ │
│  │ السبب للبيع: أخذت جديد.             │ │
│  │                                     │ │
│  │ الصندوق والشاحن متوفرون.            │ │
│  └────────────────────────────────────┘ │
│                                         │
│  [💡 احتجت مساعدة في الكتابة؟          │
│   Feature 5 coming later]                │
└────────────────────────────────────────┘
```

### ASCII: Post-Publish Badge

After publish, listings are labeled to show provenance:

```
┌────────────────────────────────────────┐
│ [Image]                                 │
│                                         │
│ iPhone 14 Pro Max 256GB                 │
│ السالمية · قبل ساعتين                   │
│                                         │
│ KWD 145.000  💬 قابل للتفاوض            │
│                                         │
│ ─────────────────────────────          │
│ ✍️ مكتوب بيد البائع                     │  ← Badge if mostly human
│                                         │
└────────────────────────────────────────┘
```

**Positioning win:** Compare to Dubizzle's listings which would say nothing (hiding AI usage). Dealo Hub openly distinguishes.

### Technical Architecture

```
┌────────────────────────────────────────────────────────┐
│              PHOTO-TO-LISTING PIPELINE                   │
└────────────────────────────────────────────────────────┘

  User uploads 3-10 photos
         │
         ▼
  ┌────────────────────────┐
  │ GPT-4o-mini with vision│  3 images @ ~2000 tokens each
  │ Structured prompt      │  = ~6000 tokens
  │                        │  Cost: ~$0.001 per extraction
  └──────────┬─────────────┘
             │
             ▼ Returns JSON:
  ┌────────────────────────────────┐
  │ {                              │
  │   "category_slug": "electronics", │
  │   "subcategory": "smartphones",│
  │   "brand": "Apple",            │
  │   "model": "iPhone 14 Pro Max",│
  │   "color": "Space Black",      │
  │   "condition": "excellent_used",│
  │   "suggested_title": "...",    │
  │   "confidence": {              │
  │     "category": 0.95,          │
  │     "brand": 0.89,             │
  │     "condition": 0.72          │
  │   }                            │
  │ }                              │
  └──────────┬─────────────────────┘
             │
             ▼
  ┌────────────────────────┐
  │ Pre-fill form          │
  │ Show confidence badges │
  │ Low confidence = ?     │
  └────────────────────────┘
```

### Prompt (reference, full version in Appendix)

```
System: You are a product classifier for a Gulf Arab C2C marketplace.
Analyze the provided photos and extract structured product information.

Return JSON with:
- category_slug (from provided taxonomy)
- subcategory
- brand (if visible)
- model (if visible)
- color
- condition: new | new_with_tags | like_new | excellent_used | good_used | fair_used
- suggested_title (concise, Arabic preferred, 60 chars max)
- confidence (0-1 for each field)

Do NOT:
- Write full descriptions (that's the seller's job)
- Speculate about features not visible
- Make up prices
- Assess authenticity
```

### UI Components

Link to DESIGN.md Section 18 (Listing Creation Flow) — integrate as new Step 2.5.

Components:
- `AIPhotoAnalyzer` — orchestrates upload + analysis
- `AISuggestionCard` — per-field suggestion with accept/reject
- `ConfidenceBadge` — shows AI certainty
- `HumanWrittenBadge` — shown on listings where AI wasn't used

### Cost Analysis (V1 Minimal)

| Metric | Value |
|---|---|
| Tokens per analysis (V1 Minimal) | ~4,000 input (2 images @ 2K) + 200 output |
| Cost per listing (V1) | $0.0006 (input) + $0.00012 (output) = **$0.00072** |
| Cost per listing (V2 Full, later) | $0.0013 |
| Monthly at 500 listings (V1 launch) | $0.36 |
| Monthly at 1,500 listings | $1.10 |
| Monthly at 5,000 listings | $3.60 |

**This feature is still effectively free** at scale we care about. The cost driver is still fraud detection's reverse-image search, not structured extraction.

### Engineering Effort (V1 Minimal)

| Task | Hours |
|---|---|
| Extend fraud API to return extraction (shared endpoint) | 3 |
| Structured extraction prompt + JSON schema | 2 |
| Loading state UI ("جاري تحليل الصور...") | 2 |
| AISuggestionCard component × 3 (category/brand/condition) | 3 |
| Accept/reject UX with confidence badges | 2 |
| Low-confidence fallback (silently skip suggestion) | 1 |
| Integrate into listing form as Step 2.5 | 2 |
| Testing with 20 real Kuwait product photos | 2 |
| **Total V1 Minimal** | **17 hours** |

**V2 Full upgrade effort (later):** ~25 additional hours for color, model, title suggestion, and enhanced confidence tuning.

### Success Metrics

- AI suggestion acceptance rate (V1 targets):
  - Category: 70%+ accepted
  - Brand (luxury): 60%+ accepted
  - Condition: 50%+ accepted
- Listing creation time (target: 50% reduction vs. pure manual for V1 sellers using AI flow)
- Listings with "Human-Written" badge (target: maintain 60%+ long-term)
- Post-publish edit rate on AI fields (indicator of AI quality)

**A/B Test:** AI-assist offered vs not — measure publish conversion rate.

### Phase

**V1 Minimal:** Category + Brand (luxury only) + Condition — ships in Sprint 5 (Week 13-14)
**V2 Full:** Color + Model + Suggested Title — Month 4-6 expansion

### 🔴 Pre-Launch Kill Criterion (MUST READ)

**Hard gate in Sprint 5 (Week 11-12 testing):**

Before shipping Photo-to-Listing to production, run accuracy test with **20 real Kuwait product photos** covering all V1 categories.

**Accuracy thresholds:**
- **Category accuracy ≥ 75%** — REQUIRED
- **Brand accuracy (luxury) ≥ 70%** — REQUIRED
- **Condition accuracy ≥ 65%** — REQUIRED

**If ANY threshold fails:**
1. ❌ **Defer Photo-to-Listing to V2** — do not ship a weak feature
2. ✅ Ship fraud detection + semantic search without it
3. 📋 Document failure modes (which categories misclassify?)
4. 🔄 Re-test in Month 4 with improved prompts + GPT-4o upgrade option

**Why this gate matters:** A weak AI feature creates more friction than none. "AI thinks this is Electronics?" when it's Home Fitness = user annoyed, positioning weakened. Better to ship without AI than ship bad AI.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI miscategorizes rare items | Show confidence scores, low confidence = silent skip |
| Sellers accept AI blindly, erode "human-curated" brand | Description explicitly excluded; telemetry tracks depth (see Section 9.5) |
| GPT-4o-mini vision quality insufficient for Gulf items | **Pre-launch accuracy gate (above)** — defer to V2 if below threshold |
| Bias toward English brand names | Prompt includes Arabic brand aliases, Gulf-specific training (dishdashas, local tech) |
| Sprint 5 overload (fraud + photo + trust) | Shift luxury auth UI polish to Sprint 6 — documented in MASTER-PLAN |

---

## Feature 4: Smart Pricing 🟡 PRIORITY #4

### Purpose & Differentiation

**Problem:** First-time sellers price blindly. They price too high (listing dies) or too low (leaves money on table).

**Solution:** Show real-time price context: "Similar iPhone 14 Pro Max listings sell for KWD 130-160 (avg KWD 142)."

**Dubizzle:** Has this in their "Sell with AI" flow.
**Dealo Hub:** Does it with more granularity (by condition, area) and shows as helpful reference, not pressure.

### User Flow

```
In listing creation Step 4 (Price):

┌─────────────────────────────────────────────┐
│  السعر                                       │
│                                              │
│  [        145        ] KWD                   │
│                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│  💡 إعلانات مشابهة في السوق                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         KWD 130 ─── 160              │   │
│  │ [━━━━━━●━━━━━━━━━━━━]                │   │
│  │         145 (متوسط السوق)             │   │
│  │                                      │   │
│  │ بناءً على 8 إعلانات مشابهة باعت       │   │
│  │ خلال 30 يوم الماضية                    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  سعرك ضمن المتوسط ✓                          │
└─────────────────────────────────────────────┘
```

**If price is far off:**
```
┌─────────────────────────────────────────────┐
│  ⚠️ سعرك (KWD 250) أعلى بكثير                │
│     من المتوسط (KWD 130-160)                 │
│                                              │
│  قد يأخذ الإعلان وقتاً أطول للبيع.            │
│  أنت حر في تحديد السعر.                      │
└─────────────────────────────────────────────┘
```

### Technical Architecture

Pre-compute pricing stats nightly (no real-time AI cost):

```sql
-- Materialized view, refreshed daily
CREATE MATERIALIZED VIEW category_pricing_stats AS
SELECT
  category_id,
  condition,
  country_code,
  currency_code,
  percentile_cont(0.25) WITHIN GROUP (ORDER BY price_minor_units) AS p25,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY price_minor_units) AS median,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY price_minor_units) AS p75,
  COUNT(*) AS sample_size
FROM listings
WHERE status = 'sold' AND sold_at > NOW() - INTERVAL '30 days'
GROUP BY category_id, condition, country_code, currency_code
HAVING COUNT(*) >= 3;  -- minimum sample size

-- Refresh nightly via cron
REFRESH MATERIALIZED VIEW category_pricing_stats;
```

**For rare items with <3 comparables:** Fallback to pgvector similar-listing search (uses existing embeddings from Feature 2, free).

### UI Components

Link to DESIGN.md Section 18 (Listing Creation Flow).

Components:
- `PriceSuggestionWidget` — inline component in price step
- `PriceRangeBar` — visual histogram
- `PriceAnomalyBadge` — subtle warning if >2 standard deviations off

### Cost Analysis

| Metric | Value |
|---|---|
| API cost | $0 (pure SQL) |
| GPT-4o-mini fallback for rare items | ~$0.0001 per query |
| Monthly total | <$5 |

### Success Metrics

- % of listings priced within suggested range (target: 60%+)
- Time-to-sold for priced-in-range vs out-of-range
- Seller NPS for pricing UX

### Phase

**V2 only.** Need critical mass of sold listings (300+ per category) for meaningful comparables.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Insufficient sold listings in niche categories | Show "No comparables yet" gracefully |
| Sellers game the suggested range | Not a real concern — range is directional guidance |
| Luxury items have wide price variance | Category-specific logic (skip feature for luxury in V2, add in V3) |

---

## Feature 5: AI Description Generator 🟡 PRIORITY #5

### Purpose & Differentiation

**The least differentiated feature.** Most marketplaces offer this. **We offer it as optional assistance — never default.**

**Positioning:** "If you're stuck, AI can help draft. You edit and sign your listing."

### User Flow

```
In listing creation, description step:

┌─────────────────────────────────────────────┐
│  الوصف:                                      │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │  [empty textarea]                      │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [💡 ساعدني بكتابة وصف أولي ✨]             │  ← Optional button
└─────────────────────────────────────────────┘

If clicked:

┌─────────────────────────────────────────────┐
│  🔄 جاري كتابة وصف...                        │
│                                              │
│  [3-5 second wait]                           │
└─────────────────────────────────────────────┘

Result:

┌─────────────────────────────────────────────┐
│  الوصف (مقترح):                              │
│  ┌────────────────────────────────────────┐ │
│  │ iPhone 14 Pro Max 256GB باللون الأسود. │ │
│  │ حالة ممتازة، لا توجد خدوش ظاهرة.         │ │
│  │ البطارية تعمل بنسبة 91%. الصندوق       │ │
│  │ الأصلي والشاحن متوفرون.                 │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [استخدم هذا] [إعادة كتابة] [امحي وابدأ]    │
│                                              │
│  💡 نصيحة: أضف لمستك الشخصية — سبب البيع،   │
│  ذكريات، تفاصيل فريدة                        │
└─────────────────────────────────────────────┘
```

### Technical Architecture

Simple GPT-4o-mini call with structured context:

```
Input:
- Photos (first 3)
- Title
- Category
- Condition
- Brand (if detected by Feature 3)
- Color (if detected)

Output:
- 2-3 sentence description in locale (Arabic default)
- Tone: factual, honest, no exaggeration
- Length: 60-150 words
```

Full prompt in Appendix.

### UI Components

Link to DESIGN.md Section 18.

Components:
- `AIDescriptionHelper` — button + reveal
- `AISuggestionTextarea` — special textarea with "AI suggested" indicator
- `RegenerateButton` — retry with different style

### Cost Analysis

| Metric | Value |
|---|---|
| Tokens per generation | ~1,500 input + 300 output |
| Cost per description | $0.0003 |
| Monthly at 1,500 uses | $0.45 |

### Success Metrics

- Usage rate: target 20-30% (not 80%+ — that'd mean we're over-relying)
- Edit rate after use: target 70%+ (seller adds personal touch)
- User satisfaction vs. blank textarea: qualitative

### Phase

**V3 only.** Explicitly deferred because:
- Lowest priority differentiator
- Builds dependency on AI we don't want
- Focus V1/V2 on fraud + search + structured extraction
- Can add in V3 when we have 6+ months of data on what works

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI descriptions sound generic | Low usage rate target (20-30%), not default |
| Erodes "Human-Written" brand | UI strongly encourages editing, "Human-Written" badge |
| Sellers use AI for deceptive descriptions | Flagged by Feature 1 Fraud Detection |

---

## 8. Consolidated Cost Model

### Monthly Cost by Scale (Updated April 18 — includes V1 Photo-to-Listing Minimal)

| Feature | 500 listings/mo | 1,500 | 5,000 | 15,000 |
|---|---|---|---|---|
| Fraud Detection | $9 | $26 | $85 | $255 |
| Semantic Search | $0.15 | $0.50 | $1.50 | $4 |
| **Photo-to-Listing** (V1 Minimal → V2 Full) | **$0.36** | **$1.10** | **$3.60** | **$11** |
| Smart Pricing (V2) | $0 (V1) / $1 (V2) | $2 | $5 | $12 |
| AI Description (V3 gated) | $0 (V1-V2) / $0.15 | $0.45 | $1.50 | $5 |
| **Total V1** | **$10** | **$28** | **$90** | **$270** |
| **Total Full Stack (V1+V2+V3)** | **$11** | **$31** | **$100** | **$296** |

### V1 Launch Scale Projections

At 500-1,500 listings/month (realistic launch trajectory): **$25-55/month AI cost** including Photo-to-Listing Minimal.

### Annual Cost Projections

| Period | Avg Monthly Listings | V1 Annual AI Cost |
|---|---|---|
| Month 1-3 (V1 launch) | 500 | **$120-180** |
| Month 4-6 (V1+V2 partial) | 1,500 | **$350-500** |
| Month 7-9 (V2 full) | 3,000 | **$600-800** |
| **Year 1 Total** | — | **$400-800** |
| Year 2 | 5,000 | $1,200 |
| Year 3 | 15,000 | $3,500 |

**Year 1 V1 AI cost: $400-800 fits comfortably within $10K budget.**

### Budget Checkpoints (Kill Switches)

- **Month 4:** If AI monthly cost > $75 and no clear ROI → reduce to fraud detection only
- **Month 6:** If AI monthly cost > $200 and WAU < 500 → freeze new features, strip back to rules-only
- **Month 9:** If AI monthly cost > $400 and still <$1K MRR → consider open-source alternatives (Llama via Groq for 90% workloads)

### V1 Photo-to-Listing Specific Kill Switch

- **Week 11-12:** Accuracy below thresholds → defer feature entirely to V2
- **Month 3:** If acceptance rate < 40% across all 3 fields → turn feature off, investigate UX

---

## 9. Phasing Matrix

| Feature | V1 (Months 1-3) | V2 (Months 4-6) | V3 (Months 7-9) |
|---|---|---|---|
| **Fraud Detection** | Reverse image ✓<br>Basic text (4o-mini) ✓<br>Rules engine ✓<br>Price anomaly ✓ | Full GPT-4o upgrade<br>Duplicate detection<br>Admin dashboard<br>Public "AI-Protected" marketing | Behavioral patterns<br>Deepfake detection<br>Luxury auth AI |
| **Semantic Search** | Basic pgvector ✓<br>Hybrid ranking ✓ | Query understanding<br>Multi-language<br>Personalization | Image search<br>Voice search<br>Visual filters |
| **Photo-to-Listing** | **✅ Minimal:**<br>Category ✓<br>Brand (luxury) ✓<br>Condition ✓ | Full Minimal scope<br>Color + Model<br>Title suggestion | Luxury-specific fields<br>Accessories detection |
| **Smart Pricing** | ❌ Not in V1 | Median + range display<br>Category-specific | Dynamic adjustment<br>Personal history |
| **AI Description** | ❌ Not in V1 | ❌ Still deferred | **Gated — see Section 11**<br>Go/No-Go criteria |
| **Telemetry** | **✅ AI usage tracking** ✓ | Weekly founder email reports | Adoption dashboard |

### V1 AI Scope Summary (Updated April 18)

**What ships in V1:**
- Reverse image search (Google Vision)
- Basic scam text detection (GPT-4o-mini)
- Price anomaly detection (pgvector)
- Behavioral rules engine
- Semantic search (basic pgvector + embeddings)
- **Photo-to-Listing Minimal (category + luxury brand + condition)** — NEW in V1
- **AI usage telemetry infrastructure** — NEW in V1
- Fraud event logging + admin Supabase dashboard access

**V1 Engineering Effort:** ~70-80 hours added (concentrated in Sprints 5-6)
- Fraud detection: ~25h
- Semantic search: ~10h
- Photo-to-Listing Minimal: ~17h
- Telemetry infrastructure: ~3h
- UI components + states: ~15h
- Testing + accuracy gates: ~5h

**V1 AI Monthly Cost:** $25-55 at launch scale (500-1,500 listings/mo)

**Sprint 5 Rebalancing:** Luxury authentication UI polish shifted from Sprint 5 to Sprint 6 to accommodate Photo-to-Listing Minimal + telemetry.

---

## 9.5 Telemetry Infrastructure (V1)

**Purpose:** Track AI usage granularly from Day 1. Data drives V3 decisions (especially AI Description go/no-go).

### Design Principle

> **"Track behavior, not just binary events."**

"Used AI = yes/no" is insufficient. We need to distinguish power users (healthy), lazy users (brand risk), and skeptics (low adoption).

### Schema Additions (Sprint 5)

```sql
-- Add to listings table
ALTER TABLE listings ADD COLUMN ai_category_suggested       BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_category_accepted        BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_category_confidence      NUMERIC(3,2);
ALTER TABLE listings ADD COLUMN ai_brand_suggested          BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_brand_accepted           BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_brand_confidence         NUMERIC(3,2);
ALTER TABLE listings ADD COLUMN ai_condition_suggested      BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_condition_accepted       BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN ai_condition_confidence     NUMERIC(3,2);
ALTER TABLE listings ADD COLUMN time_to_publish_seconds     INT;
ALTER TABLE listings ADD COLUMN description_char_count      INT;
ALTER TABLE listings ADD COLUMN post_publish_edit_count     INT DEFAULT 0;

-- Behavior derived fields (computed)
-- ai_any_accepted = category OR brand OR condition
-- is_quick_publish = time_to_publish_seconds < 120 AND description_char_count < 50
-- is_deep_listing = description_char_count > 150
```

### User Behavior Classification

```
Classification logic (batch, daily):

IF ai_any_accepted = true
   AND description_char_count >= 80
   AND time_to_publish > 180 seconds
   → "Power User" (healthy adopter)

IF ai_any_accepted = true
   AND description_char_count < 50
   AND time_to_publish < 120 seconds
   → "Lazy User" (🔴 brand risk flag)

IF ai_any_accepted = false
   AND description_char_count >= 80
   → "Skeptic / Artisan" (low adoption but quality)

IF ai_suggested = true AND ai_any_accepted = false
   → "Rejector" (AI quality issue signal)
```

### 4-Tier Threshold System

Track weekly via Supabase dashboard. Alert at tier transitions.

| AI Adoption Rate | Signal | Action |
|---|---|---|
| **< 15%** | AI features not valuable | Re-evaluate UX, possibly AI useless |
| **15-40%** | 🟢 **Healthy power-user pattern** | Continue, monitor monthly |
| **40-60%** | 🟡 Warning zone | Investigate: are listings "Lazy User" type? |
| **> 60%** | 🔴 **Critical — brand at risk** | Reduce AI visibility, add friction, re-position |

**30% = middle of healthy zone.** Our default alarm threshold for founder weekly review.

### Dashboard Queries (V1 — Supabase SQL, no custom UI)

```sql
-- Weekly AI adoption rate
SELECT
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) AS total_listings,
  COUNT(*) FILTER (WHERE ai_category_accepted OR ai_brand_accepted OR ai_condition_accepted) AS ai_any_used,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ai_category_accepted OR ai_brand_accepted OR ai_condition_accepted) / NULLIF(COUNT(*), 0), 1) AS ai_adoption_pct
FROM listings
WHERE created_at > NOW() - INTERVAL '12 weeks'
GROUP BY week
ORDER BY week DESC;

-- User behavior distribution (weekly)
SELECT
  DATE_TRUNC('week', created_at) AS week,
  COUNT(*) FILTER (WHERE ai_any_accepted AND description_char_count >= 80 AND time_to_publish_seconds > 180) AS power_users,
  COUNT(*) FILTER (WHERE ai_any_accepted AND description_char_count < 50 AND time_to_publish_seconds < 120) AS lazy_users,
  COUNT(*) FILTER (WHERE NOT ai_any_accepted AND description_char_count >= 80) AS artisans,
  COUNT(*) AS total
FROM listings
WHERE created_at > NOW() - INTERVAL '12 weeks'
GROUP BY week
ORDER BY week DESC;
```

### V2 Enhancements

- Weekly auto-email to founder with adoption rate + tier alert
- Visualized dashboard (not just SQL)
- Cohort analysis (by seller tenure)

### Implementation Effort

**V1 (Sprint 5):** ~3 hours
- Schema migration: 30 min
- Event logging in listing form: 1.5 hours
- SQL dashboard queries + bookmarks: 1 hour

---

## 10. Integration with Existing Planning Stack

### Impact Map

This specification intersects with **3 planning documents** and **1 design document**. Each needs specific updates.

### `planning/MASTER-PLAN.md` — Updates Needed

**Section 2 (MVP Scope):** Add V1 AI features to "Must-Have"
- AI Fraud Detection (partial) — reverse image + basic text
- Semantic Search (basic) — pgvector + embeddings

**Section 4 (Technical Milestones):** Update sprint plan
- Sprint 3 (Week 9-10): add pgvector setup in DB layer
- Sprint 5 (Week 13-14): add fraud detection pipeline
- Sprint 6 (Week 15-16): add semantic search integration

**Section 7 (Budget):** Add AI line items
- OpenAI API: $100-200/month from Month 4
- Google Vision API: $50/month from Month 2
- Total AI monthly: ~$150-250 starting Month 4
- **Total AI annual V1: ~$1,200-1,800** (within existing $10K budget buffer)

**Section 10 (Immediate Actions Week 1):** Add
- [ ] OpenAI account setup
- [ ] Google Cloud Vision API enable
- [ ] Supabase pgvector extension enable
- [ ] Draft fraud detection prompt library

### `planning/LAUNCH-STRATEGY.md` — Updates Needed

**Competitor section:** Add Dubizzle as #1 (from COMPETITOR-DUBIZZLE.md)

**Positioning messaging:**
- Add "AI-Protected Marketplace" as secondary tagline
- Add "Human-Written Listings" positioning for premium feel
- Update hero copy to emphasize trust + human-curated

**Launch Week 1 playbook:** Add
- Audit Dubizzle's Kuwait listings (fraud analysis manually)
- Document 10 common Kuwait scam patterns for AI training prompts

### `DESIGN.md` — Updates Needed

**NEW SECTION (add between current 15 and 16):**
`## 15.5 AI Integration Points`

Subsections:
- AI visibility principles (when visible, when invisible)
- `FraudCheckProgress` component spec
- `SafetySignalsStack` component spec
- `AISuggestionCard` component spec (for Photo-to-Listing)
- `AIDescriptionHelper` component spec
- `SemanticSearchInput` component spec
- AI loading states (shimmer variants)
- AI error states ("AI temporarily unavailable" graceful messaging)

**Section 12 (Search & Filter System):** Update
- Replace current search with semantic-enabled version
- Add ✨ indicator to search input
- Add "Smart Results" header on search results page

**Section 14 (Trust Signal Hierarchy):** Add 2 new signals
- Position 3.5: `AI Safety Checked` — auto-added by fraud pipeline
- Position 7.5: `Human-Written` — added when AI description not used

**Section 18 (Listing Creation Flow):** Update
- Add Step 2.5: AI Analysis (after photos, before details)
- Update Step 3: pre-fill from AI suggestions
- Update Step 4 (Price): add Smart Pricing widget (V2 placeholder)
- Add optional AI description helper button in description field

**Section 19 (Empty, Loading & Error States):** Add
- AI loading states (checking animation, extraction animation)
- AI error states (fallback messaging, retry CTAs)

**Section 24 (Component Inventory):** Add 10 new components
- [ ] `FraudCheckProgress`
- [ ] `SafetySignalsStack`
- [ ] `FraudWarningBanner`
- [ ] `AdminFraudQueue`
- [ ] `SemanticSearchInput`
- [ ] `QueryInterpretation`
- [ ] `AIPhotoAnalyzer`
- [ ] `AISuggestionCard`
- [ ] `HumanWrittenBadge`
- [ ] `PriceSuggestionWidget`
- [ ] `AIDescriptionHelper`

### `planning/DECISIONS.md` — Updates Needed

**Add as Decision 6 (new):**
> "AI Integration Philosophy: AI-Assisted (human-curated), not AI-First (machine-generated)"

**Add as Decision 7 (new):**
> "AI Model Strategy: GPT-4o-mini for 90% volume, GPT-4o for 10% critical (fraud, luxury, disputes)"

### `planning/GCC-READINESS.md` — No changes needed
All AI features work in any locale. Just ensure embeddings use multilingual model.

### Summary Table of File Impacts (Updated April 18 — includes V1 Photo-to-Listing + Telemetry)

| File | Lines Changed (Est.) | Priority |
|---|---|---|
| `MASTER-PLAN.md` | ~80 (added V1 AI scope + Sprint 5 rebalance + pre-launch gates) | High |
| `LAUNCH-STRATEGY.md` | ~50 (Dubizzle #1 + AI-Protected + Human-Written positioning) | High |
| `DESIGN.md` | ~200 (new Section 15.5 + Step 2.5 + trust signals + telemetry UI) | High |
| `DECISIONS.md` | ~80 (4 new decisions: 6, 7, 8, 9) | Medium |
| `GCC-READINESS.md` | 0 | None |
| **Total estimated** | **~410 lines across 4 files** | |

### Implementation Sequence (When Approved)

```
Step 1: Approve this spec (AI-FEATURES.md)
Step 2: Update DECISIONS.md — add Decision 6 & 7
Step 3: Update MASTER-PLAN.md — budget + sprints
Step 4: Update LAUNCH-STRATEGY.md — competitor section + positioning
Step 5: Update DESIGN.md — new Section 15.5 + amendments
Step 6: Week 1 implementation begins
```

---

## 11. V3 AI Description — Explicit Go/No-Go Framework

**Critical decision framework for the most risky AI feature.**

Feature 5 (AI Description Generator) is the feature with highest potential to erode "Human-Written" positioning. Therefore it is **gated behind explicit evidence-based criteria**, not opinion or ambition.

### Decision Date: **End of Month 9**

Do not evaluate before Month 9. Telemetry data is too noisy in first 6 months.

### ✅ GO Criteria (ALL must be true)

Ship AI Description in V3 only if:

1. **V1+V2 AI adoption rate < 40%** (Category + Brand + Condition combined acceptance)
   - Proof: Supabase dashboard quarterly average
2. **User interviews (n≥20) show description writing as top-3 pain point**
   - Proof: structured interviews with both power sellers and casual sellers
3. **Human-Written badge visible on > 60% of listings**
   - Proof: listings without AI description acceptance = badge eligible
4. **Average description length > 50 words**
   - Proof: SQL query on listings table
5. **"Lazy User" classification < 20% of weekly listings**
   - Proof: telemetry dashboard tier analysis
6. **Active sellers (>2 listings) explicitly request feature in surveys**
   - Proof: founder survey result ≥30% "I want AI help with descriptions"

### ❌ NO-GO Criteria (ANY triggers veto)

Block AI Description if even one is true:

1. **V1+V2 AI adoption rate > 50%** (over-reliance already present)
2. **Premium/luxury sellers explicitly reject AI features in interviews** (positioning risk)
3. **Positioning research shows "human touch" is key buyer value** (market signal)
4. **Average description length dropping month-over-month** (quality erosion)
5. **"Lazy User" classification > 30%** (brand erosion)
6. **Competitor AI description generates market backlash** (avoid association)

### If GO: Launch Plan

- V3 Sprint 1: Core generator UI (optional button, never default)
- V3 Sprint 2: "Regenerate" + tone variants
- V3 Sprint 3: Edit encouragement UI
- Ongoing: monitor "Lazy User" tier monthly — if crosses 30%, pull feature

### If NO-GO: Alternative Plan

- Keep description field 100% human-written
- Consider lightweight "writing tips" instead (static guidance, no AI):
  - "💡 اذكر تاريخ الشراء"
  - "💡 اذكر سبب البيع"
  - "💡 اذكر إذا الصندوق متوفر"
- Re-evaluate at Month 15 (Year 2 Q1)

### Documentation Commitment

This decision framework is binding. Any V3 AI Description launch must explicitly reference this document and show evidence against each criterion.

---

## 12. Appendix: Prompt Library

### Prompt 1: Fraud Text Analysis (GPT-4o-mini)

```
System:
You are a fraud analyst for a Gulf Arab C2C marketplace. Analyze
listing text for scam patterns common in the Kuwait/GCC context.

Common scam patterns to detect:
- Requests for payment before product delivery
- WhatsApp pump messages ("احولّي على الحساب")
- Fake urgency ("آخر قطعة", "عرض ينتهي الليلة")
- Requests to contact outside platform ("كلمني على 999xxxx")
- Financial fraud offers ("قرض بدون فوائد")
- Requests for bank/card info
- Pyramid/MLM schemes
- Counterfeit goods indicators (very low price for luxury brand)

Listing details:
Title: {title}
Description: {description}
Price: {price} {currency}
Category: {category}
Seller account age (days): {account_age_days}

Return JSON:
{
  "risk_score": 0-100,
  "flags": ["flag_name_1", "flag_name_2"],
  "reasoning": "brief explanation"
}
```

### Prompt 2: Photo-to-Listing Extraction (GPT-4o-mini Vision)

```
System:
You are a product classifier for Dealo Hub, a Gulf marketplace.
Analyze the provided photos of a product being sold and extract
structured information. Do NOT write a full description — that's
the seller's job. Focus on factual attributes only.

Available categories: {category_list}
Available conditions: new | new_with_tags | like_new | excellent_used | good_used | fair_used

Return JSON with confidence scores (0-1) for each field:
{
  "category_slug": "...",
  "subcategory": "...",
  "brand": "..." | null,
  "model": "..." | null,
  "color": "...",
  "condition": "...",
  "suggested_title": "concise Arabic title, 60 chars max",
  "confidence": {
    "category": 0.95,
    "brand": 0.89,
    "condition": 0.72
  },
  "notes": "anything the seller should verify"
}

Constraints:
- Use Arabic brand names where common (أبل > Apple)
- Never speculate about authenticity (luxury items)
- Never suggest a price
- Low confidence fields: return null instead of guessing
```

### Prompt 3: AI Description (GPT-4o-mini)

```
System:
You are helping a seller draft an initial description for their
product listing on Dealo Hub. Write a factual, honest 2-3 sentence
description in Arabic. Do not exaggerate. Do not use sales language.

Input:
- Category: {category}
- Title: {title}
- Condition: {condition}
- Brand: {brand}
- Color: {color}
- Model: {model}

Output:
- 2-3 sentences in Arabic
- Focus on what's visible in photos
- Mention condition honestly
- Mention if box/accessories included (ask seller to verify)
- End with friendly encouragement for seller to add personal details

Max 150 words. Use Western digits (123 not ١٢٣).
```

### Prompt 4: Query Understanding (Semantic Search)

```
System:
You are a search query interpreter for a Gulf Arab marketplace.
A user typed a query. Extract:
1. Likely product type
2. Condition (if implied)
3. Price range (if implied)
4. Locations (if mentioned)

User query: "{query}"

Return JSON:
{
  "interpreted_as": "natural language interpretation in Arabic",
  "product_type": "...",
  "condition": "used | new | any",
  "price_range_kwd": [min, max] | null,
  "location": "..." | null,
  "confidence": 0-1
}
```

---

## 13. Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial AI features specification. AI-Assisted philosophy. 5 features ranked (Fraud #1). GPT-4o-mini/GPT-4o hybrid strategy. |
| 2026-04-18 | 1.1 | **Photo-to-Listing promoted V2 → V1 Minimal (category + luxury brand + condition only).** Added pre-launch accuracy gate (≥75% required, else defer). Added Section 9.5: Telemetry Infrastructure with 4-tier thresholds + behavior classification. Added Section 11: V3 AI Description Go/No-Go framework. Updated cost model: V1 $25-55/mo, Year 1 total $400-800. Sprint 5 rebalance: luxury auth UI polish shifted to Sprint 6. |

---

*This specification is a living document. Ship V1 scope, measure usage, iterate based on evidence — not ambition.*

*Related docs: `planning/COMPETITOR-DUBIZZLE.md` · `planning/MASTER-PLAN.md` · `DESIGN.md`*
