# Dealo Hub — Decision Matrix
### تحليل مفصّل للقرارات الـ 5 الأساسية في MVP Scope

**Date:** April 18, 2026
**Status:** Draft v1.0 — Awaiting Founder Approval

---

## كيف تُقرأ هذه الوثيقة

كل قرار يتبع نفس الـ template:
1. **السؤال الأساسي** وأهميته
2. **جدول مقارنة** للخيارات مع Pros/Cons
3. **Impact Matrix** — التأثير على 4 محاور: UX, Tech Complexity, Trust, Revenue
4. **التوصية** مع التبرير الصريح

**Scoring:** كل محور يُقيّم من 1 (سيئ) إلى 5 (ممتاز). Total = أعلى = أفضل.

---

## Decision 1: Listing Expiration Model
### كم مدة صلاحية الـ listing قبل ما ينتهي؟

**لماذا مهم:** يحدد freshness الـ marketplace، cadence رجوع sellers، حجم stale data في الـ DB.

### الخيارات

| # | Option | Pros | Cons |
|---|---|---|---|
| **A** | 30 يوم auto-expire + تجديد manual | ✅ Freshness عالية<br>✅ يجبر seller يرجع للـ app<br>✅ DB نظيف<br>✅ Standard في C2C apps | ❌ Friction لـ casual sellers<br>❌ قد يفقد listings جيدة لو seller مشغول |
| **B** | Listings "دائمة" حتى seller يحذفها | ✅ Zero friction<br>✅ يناسب items valuable (سيارات، عقار) | ❌ Stale data تتراكم<br>❌ Marketplace يبان "ميت"<br>❌ يصعّب search relevance |
| **C** | 60 يوم + auto-renewal اختياري | ✅ وسط بين A و B<br>✅ يقلل nag frequency | ❌ 60 يوم طويل للـ electronics/fashion<br>❌ complexity أعلى في UI |
| **D** | مدة متغيّرة حسب category (30d/60d/90d) | ✅ مرن<br>✅ يحترم طبيعة كل سوق | ❌ تعقيد تقني<br>❌ صعب شرحه للـ users<br>❌ V1 killer |

### Impact Matrix

| Option | UX | Tech | Trust | Revenue | **Total** |
|---|---|---|---|---|---|
| A — 30d auto-expire | 4 | 5 | 5 | 4 | **18** ⭐ |
| B — Never expire | 5 | 4 | 2 | 2 | 13 |
| C — 60d + auto-renew | 4 | 3 | 4 | 3 | 14 |
| D — Per-category | 3 | 1 | 4 | 3 | 11 |

### 💡 التوصية النهائية: **Option A+ — 30 يوم + Manual Renewal + Archive Revival**

**Full lifecycle:**

```
Day 0      │ Live ────────────────────────────┐
Day 27     │ ├─ 🔔 Notification #1 "3 أيام باقية" │
Day 29     │ ├─ 🔔 Notification #2 "يوم واحد باقي" │ 30 days live
Day 30     │ ├─ Status: expired (auto)        │
           │ │  Hidden from search & browse    │
Day 30-36  │ │  🎯 Archive mode — revivable   │ 7 days archive
           │ │  "Renew in 1 click" CTA         │
Day 37     │ └─ Soft delete (kept 90d for disputes)
```

**التبرير:**
- **UX:** 2 notifications (Day 27 + Day 29) لا spam — friction صحّي
- **Tech:** cron job واحد + 2 fields (expires_at, archived_at) — ~6 ساعات total
- **Trust:** قوي — "live" listing = "seller active" (verifiable)
- **Quality floor:** dead listings تموت فعلاً. Renewal manual فقط يمنع zombie marketplace
- **Revenue hook:** "جدّد + featured placement بـ KD 2" — أول paid feature في Phase 2

**Tech footprint:**
```sql
-- listings schema additions
expires_at       TIMESTAMPTZ NOT NULL,      -- listed_at + 30 days
archived_at      TIMESTAMPTZ,               -- set when status='archived'
renewed_count    INT NOT NULL DEFAULT 0,    -- analytics
last_renewed_at  TIMESTAMPTZ,
status           status_enum                -- live | archived | deleted
```

**Notifications infra needed (Sprint 5):** in-app + email + (optional) WhatsApp notification.

**Decision locked:** Manual renewal, no auto-renew. Exception: paid "featured listings" in V2 can opt into auto-renew as a premium feature.

---

## Decision 2: Phone Number Visibility
### هل يظهر رقم هاتف البائع للمشتري مباشرة، أم محادثة داخلية فقط؟

**لماذا مهم:** هذا القرار يحدد **الـ core moat** ضد OpenSooq/Q84sale. أيضاً يؤثر على safety, spam, retention.

### الخيارات

| # | Option | Pros | Cons |
|---|---|---|---|
| **A** | Phone ظاهر من البداية (OpenSooq style) | ✅ Zero friction للـ contact<br>✅ Familiar للـ Gulf users | ❌ Spam WhatsApp hell<br>❌ Privacy nightmare<br>❌ زي المنافسين تماماً — لا differentiation |
| **B** | In-app chat only, phone مخفي تماماً | ✅ أقوى differentiator<br>✅ Anti-spam<br>✅ يحمي privacy<br>✅ يخلق defensible moat | ❌ Friction للـ users المعتادين<br>❌ يحتاج chat quality عالية<br>❌ Education effort |
| **C** | Chat-first، phone opt-in من seller | ✅ وسط معقول<br>✅ حرية للـ seller | ❌ حل نصف-نصف<br>❌ معظم sellers راح يختارون "show phone" عادةً |
| **D** | Phone يظهر بعد N messages من chat | ✅ Qualification filter للـ serious buyers<br>✅ Data للـ analytics | ❌ Complex logic<br>❌ غير متوقع للـ users |

### Impact Matrix

| Option | UX | Tech | Trust | Revenue | **Total** |
|---|---|---|---|---|---|
| A — Phone visible | 4 | 5 | 1 | 2 | 12 |
| B — Chat-only hidden | 3* | 4 | 5 | 5 | **17** ⭐ |
| C — Seller opt-in | 4 | 4 | 3 | 3 | 14 |
| D — After N messages | 3 | 2 | 4 | 4 | 13 |

*UX score لـ Option B = 3 initially، لكن يرتفع لـ 5 بعد user education + quality chat experience.

### 💡 التوصية: **Option B — Chat-only, phone completely hidden**

**التبرير:**
- **الـ Moat:** OpenSooq ما يقدر يغير هذا بدون تدمير مدلول منتجهم الحالي. Dealo Hub يدخل السوق كـ "الخيار الآمن"
- **Retention:** chat history يخلق lock-in — user ما يقدر ينقل conversations لـ WhatsApp بسهولة
- **Data:** analytics عن conversation quality, response times, conversion rate — invaluable للـ product iteration
- **Revenue futures:** المسار الطبيعي لـ in-app payments في Phase 2 — لو chat موجود، escrow أسهل نضيفه
- **Safety narrative:** كبير في marketing — "محادثة آمنة، بدون رقم يطلع لأي أحد"

**⚠️ تحذير:** نجاح Option B يعتمد على جودة chat experience. يجب:
- Real-time (Supabase Realtime) مع online/offline indicators
- Push notifications موثوقة
- Media sharing (images) inline
- Message search في archive
- Block + Report inline
- Translation optional (ar ↔ en) في Phase 2

**Migration path:** في Phase 3 (لما يصير payments)، phone share لا يزال optional بس عبر "share contact" button صريح within chat.

---

## Decision 3: Price Mode (3 Modes — Fixed / Negotiable / Best Offer)
### كيف يعرض السعر ويتفاوض عليه buyer و seller؟

**لماذا مهم:** يؤثر على search/filter UX، على quality الـ listings، على user psychology.

### الخيارات

| # | Option | Pros | Cons |
|---|---|---|---|
| **A** | سعر إلزامي دائماً | ✅ Clean data<br>✅ Filter/sort by price يعمل مضبوط<br>✅ يجبر seller يقيّم | ❌ يمنع "negotiate only" listings<br>❌ قد يُحبط sellers متردّدين |
| **B** | سعر إلزامي + checkbox "قابل للتفاوض" | ✅ Best of both worlds<br>✅ Signal واضح للـ buyer<br>✅ Data ما تنفقد | ❌ UI slightly busier |
| **C** | "السعر للتواصل" مسموح | ✅ Zero friction<br>✅ يناسب العقار والسيارات الفاخرة | ❌ Filter by price مكسور<br>❌ Spam-prone ("للتواصل" = fishing) |
| **D** | Price range (min-max) | ✅ يعكس negotiation reality | ❌ Confusing<br>❌ غير مألوف في الخليج |

### Impact Matrix

| Option | UX | Tech | Trust | Revenue | **Total** |
|---|---|---|---|---|---|
| A — Required | 4 | 5 | 4 | 3 | 16 |
| B — Required + negotiable flag | 5 | 5 | 5 | 4 | **19** ⭐ |
| C — Optional "contact for price" | 3 | 3 | 2 | 2 | 10 |
| D — Price range | 3 | 4 | 3 | 3 | 13 |

### 💡 التوصية النهائية: **3 Price Modes في V1 — Minimal Implementation**

بدل binary (negotiable yes/no)، ندعم 3 modes مع minimal state machine:

| Mode | Seller Input | Buyer Sees | CTA | Chat Behavior |
|---|---|---|---|---|
| 🔒 **Fixed** | "السعر: 50 KWD، ثابت" | "KWD 50 · ثابت" | `Contact Seller` | Chat عن التسليم/meetup فقط |
| 💬 **Negotiable** | "السعر: 50 KWD، قابل للتفاوض" | "KWD 50 · قابل للتفاوض" | `Contact Seller` | Open haggling في chat |
| 🎯 **Best Offer** | "أرحب بالعروض (Min: 30 KWD)" | "أرحب بالعروض (من 30 KWD)" | `Make Offer` (pre-fills) | Offer submission via chat template |

**Schema:**
```sql
price_mode        price_mode_enum NOT NULL,  -- 'fixed' | 'negotiable' | 'best_offer'
price_minor_units BIGINT NOT NULL,            -- asking price for fixed/negotiable
                                              -- minimum accepted for best_offer
```

**Best Offer Implementation في V1 (Minimal):**
- Buyer يضغط `Make Offer` → Chat يفتح مع message template:
  `"مرحباً، أعرض ___ KWD للـ [listing name]"`
- Buyer يعدّل ويرسل
- Seller يرد يدوياً (accept / counter / reject via typed text)
- Badge 🎯 في chat يميّز messages من "Make Offer" button

**لا structured state machine في V1.** لا accept/counter/reject buttons. Data تُجمع عبر `sent_as_offer` boolean في messages لـ analytics.

### Implementation Scope Analysis

| Scope | Hours | V1 Fit | Recommendation |
|---|---|---|---|
| **A. Full structured Best Offer** (offers table, state machine, buttons, expiration) | ~40-50 | ❌ Too heavy | Defer to Phase 2 |
| **B. Minimal Best Offer** (enum + UI + chat template) ⭐ | ~10-12 | ✅ Fits V1 | **Recommended** |
| **C. Defer entirely** (only Fixed + Negotiable in V1) | 0 | ✅ | Acceptable fallback |

**التبرير لـ Option B:**
- Visual signal يعطي 80% من القيمة
- Structured state machine يضيف 20% قيمة بـ 400% cost → bad ROI
- Upgrade path نظيف: نضيف `offers` table في Phase 2 بدون breaking changes
- Data تُجمع من اليوم الأول لـ informing Phase 2 design

### Impact Matrix (Revised for 3-Mode System)

| Axis | Impact | Notes |
|---|---|---|
| **UX** | 5/5 | Signals intent clearly; reduces friction; users understand instantly |
| **Tech** | 4/5 | +10 hours; no state machine complexity |
| **Trust** | 5/5 | Transparent pricing + honest negotiation signal |
| **Revenue** | 4/5 | Data groundwork for Phase 2 "Promoted Best Offer" feature |
| **Total** | **18/20** | Strong recommendation |

### UI Details

**Seller posting flow (Step 5 of listing form):**
```
السعر:
[ 50 ] KWD

نوع السعر:
○ ثابت (السعر غير قابل للتفاوض)
○ قابل للتفاوض (مفتوح للنقاش)  ← default
○ عروض (اقبل عروض المشترين)

[If "عروض" selected, show:]
الحد الأدنى المقبول (اختياري): [ __ ] KWD
```

**Listing card display:**
- Fixed:       `KWD 50` + 🔒 small icon
- Negotiable:  `KWD 50` + "قابل للتفاوض" label
- Best Offer:  `أرحب بالعروض` + "من 30 KWD" (if min set)

**Listing detail CTA:**
- Fixed/Negotiable: `تواصل مع البائع` (Contact Seller)
- Best Offer:       `قدّم عرضاً` (Make Offer) — different color accent (amber)

### Chat Flow Impact

**لا تغيير هيكلي على الـ chat system.** المتغيرات:
1. `messages.sent_as_offer` (boolean) — للـ analytics
2. Message bubble للـ offers يحصل على 🎯 badge decoration
3. Pre-fill template يدخل في input عند الـ first message من "Make Offer"
4. Notification content يختلف: "[اسم] قدّم عرضاً لمنتجك" vs "[اسم] راسلك"

**Zero new chat UI components. Zero new message types. Zero state machine.**

### Phase 2 Upgrade Path (Documented)

عند الانتقال لـ Option A (Full Best Offer)، نضيف:
- `offers` table (offer_id, listing_id, buyer_id, amount, status, expires_at)
- Structured offer messages في chat (backward compat with text messages)
- Accept/Counter/Reject inline buttons
- Offer expiration logic (24h per offer)
- Multi-offer queue للـ seller

Zero database migrations break V1 data. Clean path forward.

**Decision locked:** 3 modes في V1 باستخدام Option B (Minimal).

---

## Decision 4: Location Granularity
### بأي دقة نطلب موقع الـ listing؟

**لماذا مهم:** يؤثر على filter UX، privacy, scale لـ GCC expansion.

### الخيارات

| # | Option | Pros | Cons |
|---|---|---|---|
| **A** | City فقط | ✅ أبسط implementation<br>✅ Privacy عالية | ❌ "الكويت" كلها كمدينة واحدة = ضعيف<br>❌ Filter-by-area مستحيل |
| **B** | City + Area (السالمية، حولي، ...) | ✅ Balance معقول<br>✅ مألوف للـ Gulf users<br>✅ Filter يعمل<br>✅ Privacy محفوظة | ❌ يحتاج area taxonomy كل بلد |
| **C** | Precise pin on map | ✅ دقة قصوى<br>✅ "قرب مني" search | ❌ Privacy concerns<br>❌ complexity عالية في V1<br>❌ صعب في RTL maps |
| **D** | Area + optional pin | ✅ مرن<br>✅ seller يقرر | ❌ Inconsistent data |

### Impact Matrix

| Option | UX | Tech | Trust | Revenue | **Total** |
|---|---|---|---|---|---|
| A — City only | 2 | 5 | 3 | 2 | 12 |
| B — City + Area | 5 | 4 | 4 | 4 | **17** ⭐ |
| C — Precise pin | 5 | 2 | 2 | 4 | 13 |
| D — Area + optional pin | 4 | 2 | 3 | 4 | 13 |

### 💡 التوصية: **Option B — City + Area في V1، Map pin في V2**

**التبرير:**
- **UX:** معظم buyers يبحثون "منتج X في السالمية" أو "حولي" — هذا هو mental model الخليجي
- **Tech:** lookup table بسيط (cities) + (areas) + foreign keys — implementation أسبوع واحد
- **Trust:** لا يكشف عنوان محدد — safety للـ seller
- **Future:** pin on map يُضاف في Phase 2 لـ "nearby listings" feature + "Safe Meetup Spots"

**Taxonomy الكويت (6 محافظات رسمية):**
- العاصمة (الكويت City, شرق, الشعب, بنيد القار...)
- حولي (السالمية, حولي, سلوى, الرميثية...)
- الفروانية (الفروانية, خيطان, جليب الشيوخ...)
- الأحمدي (الفحيحيل, الصباحية, المهبولة...)
- مبارك الكبير (مبارك, أبو الحصانية, القصور...)
- الجهراء (الجهراء, تيماء, النسيم...)

إجمالي ~50 area في الكويت — كافية للـ filter بدون ازدحام.

**Data Source:** PACI (Public Authority for Civil Information) عندها قائمة رسمية، أو يدوياً من Google/Wikipedia. $0 cost.

---

## Decision 5: Images per Listing
### كم صورة max يسمح بها لكل listing؟

**لماذا مهم:** يؤثر على storage cost, UX, quality signal.

### الخيارات

| # | Option | Pros | Cons |
|---|---|---|---|
| **A** | 5 صور max | ✅ Storage خفيف<br>✅ يجبر seller يختار أفضل صور | ❌ غير كافي لسيارات/عقار<br>❌ قد يُفهم كـ "low-effort" platform |
| **B** | 10 صور max | ✅ Industry standard<br>✅ Storage معقول<br>✅ يناسب معظم categories | ❌ ليس كافي لـ power sellers |
| **C** | 20+ صور | ✅ مرونة كاملة<br>✅ مناسب لـ cars/real estate | ❌ Storage × 2<br>❌ Upload slow on mobile<br>❌ Image review friction |
| **D** | Dynamic per category (5/10/20) | ✅ ذكي<br>✅ يحترم طبيعة كل market | ❌ Complexity<br>❌ Confusing rules |

### Impact Matrix

| Option | UX | Tech | Trust | Revenue | **Total** |
|---|---|---|---|---|---|
| A — 5 images | 3 | 5 | 3 | 2 | 13 |
| B — 10 images | 5 | 4 | 5 | 4 | **18** ⭐ |
| C — 20+ images | 5 | 2 | 4 | 3 | 14 |
| D — Dynamic | 4 | 2 | 4 | 4 | 14 |

### 💡 التوصية: **Option B — 10 صور max، يتوسع لـ 20 للـ verified sellers في Phase 2**

**التبرير:**
- **UX:** 10 صور كافية لـ 95% من categories. Mobile upload يتم في أقل من دقيقة بـ صور محسنة
- **Tech:** Supabase Storage free tier (1GB) يغطي ~5,000 listing × 10 images × 200KB = $0 لـ 5K listings. Paid tier ($25/mo → 100GB) يكفي لـ 500K listings
- **Trust:** "verified seller" badge يفتح 20-image limit = incentive قوي للـ verification (Phase 2 move)
- **Revenue hook:** Phase 2 — "زد صورك إلى 20" = premium feature KD 2/شهر

**Image Processing:**
- Client-side resize: max 1920x1920 قبل upload
- Server-side WebP conversion
- 3 sizes stored: thumb (300w), medium (800w), full (1920w)
- Image order via drag-and-drop
- أول صورة = cover تلقائياً

**⚠️ Note على الـ storage costs:**
```
10 images × 200KB × 3 sizes = ~6MB per listing
1 GB free tier = ~170 listings capacity
لو 5,000 listing = 30GB needed = $25/mo Supabase Pro
كافي خلال Phase 1.
```

---

## Summary Decision Table (Final — Updated April 18 with AI Decisions)

| # | Decision | Final Recommendation | Confidence |
|---|---|---|---|
| 1 | Listing lifecycle | **30d live + 7d archive revival + manual renewal + 2 notifications** | Locked ✅ |
| 2 | Phone visibility | **Chat-only, phone hidden** | Locked ✅ |
| 3 | Price mode | **3 modes: Fixed / Negotiable / Best Offer (Minimal)** | Locked ✅ |
| 4 | Location | **City + Area (hierarchical GCC-ready)** | Locked ✅ |
| 5 | Images | **10 max, 20 for verified V2 · 8 min for luxury** | Locked ✅ |
| **6** | **AI Integration Philosophy** | **AI-Assisted (human-curated), NOT AI-First** | **Locked ✅** |
| **7** | **AI Model Strategy** | **GPT-4o-mini 90% volume + GPT-4o 10% critical** | **Locked ✅** |
| **8** | **Photo-to-Listing V1 Scope** | **V1 Minimal (category + luxury brand + condition) with accuracy kill criterion** | **Locked ✅** |
| **9** | **Human-Written Monitoring Strategy** | **Granular telemetry from V1 + 4-tier thresholds + V3 Go/No-Go framework** | **Locked ✅** |

### Additional Architectural Decisions (Locked April 18)
- ✅ **GCC-ready schema from V1** (country_code, currency_code, countries table) — see `GCC-READINESS.md`
- ✅ **Western digits only** in Arabic UI (`numberingSystem: 'latn'`)
- ✅ **Supabase region: Mumbai (ap-south-1)** for lowest GCC latency
- ✅ **Payment gateway: Tap Payments** as Phase 2 default (no V1 integration)
- ✅ **Phone validation: libphonenumber-js** — all 6 GCC codes accepted
- ✅ **Defensive domains:** dealohub.com + .com.kw + .sa + .ae registered upfront
- ✅ **Primary competitor: Dubizzle** (NOT OpenSooq) — see `COMPETITOR-DUBIZZLE.md`

---

## Decision 6: AI Integration Philosophy
### AI-Assisted (Human-Curated), NOT AI-First (Machine-Generated)

**The Core Distinction:**

| Approach | Example | Dealo Hub Stance |
|---|---|---|
| **AI-First (Dubizzle "Sell with AI")** | AI writes listing. User clicks publish. 842K auto-generated listings. | ❌ Rejected |
| **AI-Assisted (Dealo Hub)** | AI extracts structured data. Human writes description. Every listing signed by seller. | ✅ **Locked** |

### Impact Matrix

| Axis | Score | Notes |
|---|---|---|
| **UX** | 5/5 | Users feel agency, AI is helpful not pushy |
| **Tech** | 4/5 | Less automation = slightly more friction but much simpler |
| **Trust** | 5/5 | "Human-Written" becomes brand moat vs Dubizzle's commodity listings |
| **Revenue** | 4/5 | Premium positioning supports paid features later (trust subscriptions) |
| **Total** | **18/20** | Strong long-term moat |

### Public Messaging Lock

**For sellers:** "الذكاء الاصطناعي يساعدك، ما يبيع عنك."
**For buyers:** "إعلاناتنا مكتوبة بإنسان، محمية بذكاء اصطناعي."

### Non-Negotiable Rules

1. **Never hide AI usage.** Every AI-assisted action has a clear UI indicator.
2. **Always show confidence.** AI outputs include confidence scores; low confidence = human fallback.
3. **Humans override defaults.** Every AI suggestion can be ignored, edited, or reversed.
4. **AI is invisible for safety, visible for convenience.** Fraud runs silently. Photo-to-Listing is obvious.

### What This Decision Blocks

- ❌ "AI-generated listings" marketing (we never say this)
- ❌ Fully automated listing creation
- ❌ AI descriptions enabled by default (see Decision 8 + Section 11 of AI-FEATURES.md)
- ❌ Black-box AI decisions without user visibility

**Decision locked. Re-evaluation only with explicit founder approval + market research evidence.**

---

## Decision 7: AI Model Strategy (Hybrid)
### GPT-4o-mini (90% volume) + GPT-4o (10% critical)

### The Hybrid Rationale

Running everything on GPT-4o is 17x more expensive than GPT-4o-mini. Running everything on mini sacrifices quality where it matters most (fraud, luxury authentication, disputes).

**Solution:** Use the right model for the right job.

### Model Allocation Matrix

| Task | Model | Justification |
|---|---|---|
| Fraud text analysis (basic) | GPT-4o-mini | Volume task, cost-sensitive |
| Fraud text analysis (full) | GPT-4o (V2 upgrade) | High-stakes — false negatives cost trust |
| Photo-to-Listing extraction | GPT-4o-mini (vision) | Volume task, structured output |
| Luxury authentication analysis | GPT-4o | High-stakes — brand reputation risk |
| Semantic search embeddings | text-embedding-3-small | Free-tier cheap, specialized model |
| Smart pricing fallback | GPT-4o-mini | Edge case only, rare |
| Dispute analysis (V2) | GPT-4o | Low volume, high accuracy need |
| AI description (V3, if go) | GPT-4o-mini | Volume task, human-edited after |

### Cost Implication

At 1,500 listings/month (realistic launch trajectory):
- GPT-4o-mini usage: ~90% of calls = $20-30/mo
- GPT-4o usage: ~10% of calls = $5-15/mo
- **Total AI cost: $25-45/mo** (excludes Google Vision + embeddings)

### Fallback Strategy

- If GPT-4o-mini fails → retry once, then skip feature (fail-open)
- If GPT-4o fails → degrade to GPT-4o-mini with confidence flag
- If OpenAI entire service fails → degrade to rules-only layer (Layer 5 of fraud pipeline)

### V2+ Consideration: Open-Source

If AI costs exceed $400/mo and still <$1K MRR (Month 9 kill switch), consider:
- Llama 3 via Groq (cheap inference, limited Arabic quality)
- Local deployment on Vercel Edge (cost but latency benefit)
- Arabic-specific models (AraBERT, Jais)

**Decision locked for V1 + V2. Revisit at Month 9 based on data.**

---

## Decision 8: Photo-to-Listing V1 Scope
### V1 Minimal — Category + Luxury Brand + Condition ONLY

### Scope Definition (Strict Lock)

**V1 fields extracted:**

| Field | V1 | Confidence Threshold |
|---|---|---|
| Category (main + sub) | ✅ Yes | ≥ 0.80 to show |
| Brand (luxury category only) | ✅ Yes | ≥ 0.80 to show |
| Condition (new/like-new/used/fair) | ✅ Yes | ≥ 0.75 to show |
| Color | ❌ No (V2) | — |
| Model | ❌ No (V2) | — |
| Suggested title | ❌ No (V2) | — |
| **Description** | ❌ **NEVER** (positioning lock) | — |

### Rationale (Why V1, Not V2)

**Original plan:** Defer to V2 to reduce V1 scope.
**Revised plan:** Dubizzle's "Sell with AI" made AI-assisted listing creation a **market baseline expectation**. 842K listings generated = users now expect this. V1 without equivalent = competitive disadvantage.

**Tight scope preserves "Human-Written" positioning** by explicitly excluding description generation.

### 🔴 Pre-Launch Kill Criterion (Hard Gate)

**Before shipping to production (Week 11-12 testing):**

Run accuracy test with 20 real Kuwait product photos covering all V1 categories.

**Thresholds (ALL required):**
- Category accuracy ≥ 75%
- Brand accuracy (luxury) ≥ 70%
- Condition accuracy ≥ 65%

**If ANY threshold fails:**
1. ❌ Defer Photo-to-Listing entirely to V2
2. ✅ Ship V1 without this feature
3. 📋 Document failure modes
4. 🔄 Re-test Month 4 with improved prompts + potential GPT-4o upgrade

**Principle:** Better to ship without AI than ship bad AI. A weak feature creates more friction than none.

### Engineering Cost

- **V1 Minimal:** 17 hours (Sprint 5)
- **V2 Full upgrade:** +25 hours (Month 4-6)
- **Sprint 5 rebalance:** Luxury authentication UI polish shifted to Sprint 6

### Cost Impact

- V1 AI monthly cost: $15-40/mo → **$25-55/mo** (includes Photo-to-Listing API calls)
- Year 1 V1 total: **$400-800** (still within $10K budget)

**Decision locked.** See `design/AI-FEATURES.md` Feature 3 for full spec.

---

## Decision 9: Human-Written Monitoring Strategy
### Granular Telemetry + 4-Tier Thresholds + V3 Go/No-Go Framework

### The Risk Being Mitigated

AI Description feature (V3 candidate) could erode our "Human-Written" positioning if sellers over-rely on it. Decision 9 establishes evidence-based guardrails.

### V1 Telemetry Infrastructure (Ship in Sprint 5)

Track per listing:
- `ai_category_suggested`, `ai_category_accepted`, `ai_category_confidence`
- `ai_brand_suggested`, `ai_brand_accepted`, `ai_brand_confidence`
- `ai_condition_suggested`, `ai_condition_accepted`, `ai_condition_confidence`
- `time_to_publish_seconds`
- `description_char_count`
- `post_publish_edit_count`

**Effort:** 3 hours (schema migration + event logging + SQL queries).

### User Behavior Classification

Daily batch classifies listings:

| Type | Definition | Signal |
|---|---|---|
| **Power User** | AI accepted + desc ≥80 words + time >180s | 🟢 Healthy |
| **Lazy User** | AI accepted + desc <50 words + time <120s | 🔴 Brand risk |
| **Skeptic / Artisan** | AI rejected + desc ≥80 words | 🟢 Quality |
| **Rejector** | AI suggested but all rejected | 🟡 AI quality issue |

### 4-Tier Threshold System

| AI Adoption Rate | Signal | Action |
|---|---|---|
| **< 15%** | AI features not valuable | Re-evaluate UX |
| **15-40%** | 🟢 **Healthy power-user pattern** | Continue |
| **40-60%** | 🟡 Warning zone | Investigate "Lazy User" depth |
| **> 60%** | 🔴 **Critical — brand at risk** | Reduce AI visibility |

### V3 AI Description Go/No-Go Criteria

**Decision date: End of Month 9.** Do not evaluate before (data too noisy).

**✅ GO (ALL required):**
1. V1+V2 AI adoption < 40%
2. User interviews (n≥20) show description writing is top-3 pain
3. Human-Written badge on >60% of listings
4. Avg description length >50 words
5. Lazy User classification <20%
6. Active sellers explicitly request feature (>30% survey)

**❌ NO-GO (ANY vetoes):**
1. AI adoption >50%
2. Premium sellers reject AI in interviews
3. Positioning research: human touch is key buyer value
4. Avg description length dropping month-over-month
5. Lazy User >30%
6. Competitor AI description creates backlash

**If NO-GO:** Ship lightweight "writing tips" instead (static guidance, no AI). Re-evaluate Month 15.

**Decision locked. See `design/AI-FEATURES.md` Sections 9.5 + 11 for full framework.**

---

## Cross-Decision Dependencies

بعض هذه القرارات مترابطة — تغيير واحد يؤثر على غيره:

- **Decision 2 (Phone) + Decision 1 (Expiration):** Chat-only يعمل أفضل مع expiration أقصر — يشجع active sellers فقط
- **Decision 3 (Price) + Decision 5 (Images):** Required price + 10 images = quality floor لكل listing
- **Decision 4 (Location) + GCC expansion:** Area taxonomy لازم تكون extensible لـ 6 دول

---

## الخطوات بعد موافقتك

بعد ما تراجع هذه التوصيات، نسوي التالي:
1. أنت تقرر لكل قرار: **Accept** (توصيتي) أو **Override** (خيار ثاني) أو **Defer** (أجّل للـ V2)
2. نحدّث MASTER-PLAN.md بالقرارات النهائية
3. نبدأ rewrite لـ DESIGN.md بناءً على هذه القرارات (UI components تعتمد عليها)
4. نعمل Supabase schema v1 بناءً على هذه القرارات

---
*هذه الوثيقة **living document** — عدّلها متى ما احتجت. كل قرار يمكن يُراجع في Phase 2 بناءً على real user data.*
