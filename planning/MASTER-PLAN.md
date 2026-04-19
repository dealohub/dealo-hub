# Dealo Hub — MASTER PLAN
### الخطة الرئيسية الشاملة لبناء منصة Dealo Hub
**Founder:** Fawzi Rahem (Solo)
**Launch Market:** الكويت → الخليج → العالم العربي → Global
**Model:** C2C Classifieds-first Marketplace (Trust-First Premium UX)
**Tech Stack:** Next.js 14+ · Supabase · Shadcn UI · Tailwind
**Budget:** Under $10,000 (50% product / 50% marketing)
**Timeline Baseline:** 6 شهور لـ MVP Beta، 9 شهور للـ Public Launch
**Date:** April 18, 2026
**Version:** 1.3 (see Change Log at end — post live-audit refinement)

---

## 0. الملخص التنفيذي (Executive Summary)

**Dealo Hub** هي منصة C2C marketplace خليجية premium، تستهدف تقديم تجربة أنظف وأكثر موثوقية من اللاعبين الحاليين (OpenSooq, Q84sale, حراج). الخطة الاستراتيجية مبنية على **phased approach من 4 مراحل**، مع إطلاق **Phase 1 (Classifieds + Trust Layer)** كـ MVP خلال 6 شهور.

### القرارات الاستراتيجية المحسومة (Final — April 18, 2026)

| القرار | الاختيار | الأثر |
|---|---|---|
| **Business Model** | C2C Classifieds-first (NO escrow in V1) | يلغي 60% من التعقيد التقني والقانوني |
| **Launch Scope** | **10 categories فقط** (4 P0 + 4 P1 + 2 P2) | Quality over breadth، يمنع ghost town effect |
| **Marketing Scope** | الكويت أولاً (focus مركّز) | GCC architecture موجود، expansion ~1-2 weeks per country |
| **Architecture** | **GCC-ready من V1** (country_code, currency, i18n, RTL) | Zero retrofit cost لاحقاً — see `GCC-READINESS.md` |
| **Differentiation** | Trust-first + Chat-only (no phone) + Premium UX | Defensible moat ضد OpenSooq/Q84sale/حراج |
| **Tech Approach** | Next.js + Supabase (Mumbai region) + AI-augmented | Solo + Cursor/Claude = 2-3x productivity |
| **Price Modes** | **3 modes: Fixed / Negotiable / Best Offer (Minimal)** | Differentiator مع minimal complexity |
| **Listing Lifecycle** | 30d live + 7d archive + manual renewal | Quality floor + retention hook |
| **Payment Gateway** | Tap Payments (Phase 2 default), deferred from V1 | GCC-native، best DX |
| **Phases** | P1 Classifieds → P2 Trust/Payments → P3 B2C → P4 B2B | Evolutionary build |

### أكبر 3 مخاطر
1. **Broad scope من اليوم الأول** — 50+ categories مع solo founder = خطر dilution. نحتاج mitigation واضح.
2. **Chicken-and-egg problem** — C2C marketplaces تموت بلا critical mass. نحتاج supply seeding strategy.
3. **ملف DESIGN.md الحالي مش متوافق** — مكتوب لـ "deals aggregator" مش C2C marketplace. يحتاج rewrite.

### Next 7 Days — Immediate Actions
1. تحديث DESIGN.md ليعكس C2C marketplace language (listings, sellers, categories — بدل deals)
2. إنشاء category taxonomy (50+ categories with sub-categories)
3. Supabase schema v1 للـ core entities (users, listings, categories, messages)
4. Landing page waitlist لـ lead capture مبكر
5. تحديد pilot city داخل الكويت (السالمية؟ حولي؟) للاختبار المركّز

---

## 1. Project Roadmap — خريطة المشروع

### Phase 0 — Foundation (Week 1–4) · "اللبنة الأساسية"
**الهدف:** بنية تحتية وقرارات معمارية محسومة قبل كتابة أي feature.

**Milestones:**
- ✅ MASTER-PLAN.md (هذا الملف)
- 📝 DESIGN.md revision — إعادة كتابته لـ C2C marketplace vocabulary
- 📝 Category Taxonomy Document — قائمة 50+ categories معتمدة
- 📝 Supabase schema v1 — migrations لـ users, listings, categories, media, messages, favorites, reports
- 📝 Next.js project bootstrap مع: i18n (ar/en), RTL support, Shadcn, Tailwind config, ESLint/Prettier
- 📝 Auth flow (Supabase Auth + phone OTP via SMS — أهم للخليج)
- 📝 Staging environment على Vercel (custom subdomain)
- 📝 Landing page + waitlist (يروح live خلال أسبوع)
- 📝 Brand assets minimal: logo, color tokens, favicon

**Deliverables بنهاية Phase 0:** مشروع يشتغل locally، auth تعمل، schema محسومة، landing page live يجمع emails.

---

### Phase 1 — MVP Build (Week 5–16) · "البناء الأساسي"
**الهدف:** build-test-iterate الـ core classifieds experience.

**Sprint Structure (أسبوعين/sprint، 6 sprints — Updated April 18 with AI integration):**

| Sprint | التركيز | Outputs |
|---|---|---|
| **Sprint 1 (W5-6)** | User accounts + profiles | Seller profile page, phone verification, avatar upload, profile editing |
| **Sprint 2 (W7-8)** | Listing creation flow | Multi-step listing form, 10-image upload, draft mode, category picker, pricing (3 modes), delivery options, **Filter A (phone-in-title/description hard reject)**, **Filter B (luxury counterfeit term reject)** — both specified in `COMPETITOR-DUBIZZLE.md` §12 |
| **Sprint 3 (W9-10)** | Browse + search + filters + **pgvector** | Category pages, **semantic search (pgvector + OpenAI embeddings)**, hybrid ranking, filters, sorting |
| **Sprint 4 (W11-12)** | Listing detail + messaging + **AI quality gate testing** | Listing detail page, image gallery, real-time 1:1 chat, safety tips banner, **Photo-to-Listing accuracy test (20 real Kuwait photos)** |
| **Sprint 5 (W13-14)** | **AI Layer + Trust v1** | **Fraud detection pipeline (reverse image + text analysis + price anomaly + behavioral)**, **Photo-to-Listing Minimal UI (if accuracy gate passed)**, **AI telemetry schema + events**, phone badge, ratings, reports |
| **Sprint 6 (W15-16)** | Polish + performance + **Luxury auth UI (shifted)** | Mobile responsiveness, RTL QA, Lighthouse >90, PostHog, bug fixing, **luxury authentication UI polish (shifted from Sprint 5)** |

### Pre-Launch AI Quality Gates (NEW — Week 11-12)

Before Sprint 5 ships AI features, mandatory accuracy testing:

```
Test: Photo-to-Listing Minimal Accuracy
Dataset: 20 real Kuwait product photos across all 10 V1 categories
Thresholds (ALL required):
  ✓ Category accuracy ≥ 75%
  ✓ Brand accuracy (luxury) ≥ 70%
  ✓ Condition accuracy ≥ 65%

If ANY fails → Defer Photo-to-Listing entirely to V2
              Ship V1 without this feature
              Document failure modes
              Re-test Month 4

Test: Fraud Detection False Positive Rate
Dataset: 50 real Kuwait listings (40 clean + 10 flagged)
Thresholds:
  ✓ False positive rate <5%
  ✓ True positive rate >70%

If >5% FPR → Adjust thresholds, lower sensitivity
If <70% TPR → Review prompts, add more scam patterns
```

**Principle:** Better to ship without weak AI than to ship bad AI that creates friction and erodes positioning.

**Milestones:**
- 📝 End of Sprint 2: **Alpha Internal** (founder + 5 friends) — جرّب النشر
- 📝 End of Sprint 4: **Closed Beta** (100 users from waitlist) — جرّب التصفّح والمراسلة
- 📝 End of Sprint 6: **Open Beta** in Kuwait — أي شخص يقدر يسجّل

---

### Phase 2 — Go-to-Market (Week 17–26) · "الإطلاق والنمو"
**الهدف:** اختبار PMF في الكويت، الوصول لـ 1,000 active users + 3,000 listings.

**Tracks متوازية:**
- **Growth Track:** content seeding (100 موبايلات، 50 سيارات، 200 أثاث، الخ)، partnerships مع stores للـ bulk listing، micro-influencer campaigns
- **Product Track:** saved searches + alerts، push notifications، "My listings" management، analytics dashboard للـ sellers
- **Trust Track:** ID verification (اختياري بـ badge مميز)، "Safe Meetup Spots" حول الكويت، seller reputation score

**Milestones:**
- 📝 Week 20: **Public Launch** مع press outreach
- 📝 Week 24: **1,000 weekly active users** (WAU) target
- 📝 Week 26: **PMF checkpoint** — قياس retention, transactions, NPS

**Decision Gate:** إذا بعد Phase 2 الـ WAU < 500 والـ retention < 30%، نعيد تقييم scope/positioning قبل الانتقال لـ Phase 3.

---

### Phase 3 — Expansion (Month 7–12) · "التوسّع"
**الهدف:** GCC expansion + أول transaction layer.

**Key initiatives:**
- الإمارات + السعودية launch (نفس منتج الكويت، بس local marketing)
- Featured listings (مدفوع) — أول revenue stream حقيقي
- Subscription tier للـ power sellers
- Trust layer v2: escrow optional (integration مع MyFatoorah/Tap/Checkout)
- Web + PWA (نؤجّل native mobile apps لـ Phase 4)

### Phase 4 — Verticals & B2B (Year 2)
- B2C storefronts لتجّار صغار
- B2B wholesale marketplace
- Native iOS/Android apps
- API لـ third-party integrations

---

## 2. MVP Scope — نطاق الإصدار الأول

### Must-Have (Phase 1 — لا يتحرّك المشروع بدونها)

**Core Entities:**
- User accounts (email + phone OTP)
- User profiles (bio, avatar, phone verification, member-since)
- Listings (title, description, price, condition, images up to 10, location, category, price_mode, delivery_options, AI telemetry fields)
- Categories (10 categories taxonomy with Arabic + English names)
- Messages (1:1 realtime chat between buyer and seller)
- Favorites / Save for later
- Reports (listing, user)
- Countries / Cities / Areas (GCC-ready hierarchical)

**V1 AI Features (added April 18 after Dubizzle analysis):**
- 🔴 **AI Fraud Detection (Partial)** — reverse image + scam text + price anomaly + rules engine
- 🟠 **Semantic Search (Basic)** — pgvector + OpenAI embeddings + hybrid ranking
- 🟠 **Photo-to-Listing (Minimal)** — category + luxury brand + condition (NO description generation)
- 📊 **AI Telemetry Infrastructure** — granular usage tracking for V3 go/no-go framework

See `design/AI-FEATURES.md` for full specifications, and `planning/COMPETITOR-DUBIZZLE.md` for strategic context.

**Core Flows:**
1. Sign up → verify phone → complete profile
2. Post a listing (step-by-step: category → photos → details → price → location → review → publish)
3. Browse by category or search
4. Filter results (price, location, condition, date posted, has photo)
5. View listing detail (gallery, seller info, safety tips, report button)
6. Contact seller (chat) OR save for later
7. Manage "My Listings" (edit, mark as sold, delete, renew)
8. Leave rating after marking transaction complete

**Essential UX:**
- ✅ Arabic-first with RTL
- ✅ English as secondary
- ✅ Mobile-first responsive (mobile traffic سيكون >70%)
- ✅ Image optimization (WebP, lazy loading, CDN)
- ✅ Dark mode (optional لكن يعطي premium feel)

**Essential Infrastructure:**
- ✅ Supabase Auth, DB, Storage, Realtime
- ✅ Next.js 14+ App Router + Server Components
- ✅ Vercel deployment (Free tier أول، Pro لاحقاً)
- ✅ Image CDN (Supabase Storage + Next.js Image)
- ✅ Analytics: PostHog (free tier)
- ✅ Error tracking: Sentry (free tier)
- ✅ Transactional email: Resend (free tier)

### Nice-to-Have (يؤجّل لـ Phase 2 إلا لو وقت سمح)
- Saved searches + email alerts
- Push notifications (web push)
- Social login (Google, Apple)
- Listing badges (Top Seller, Fast Responder)
- Deep linking preparation للـ future mobile apps

### Explicitly DEFERRED (نؤجّلها بوضوح — لا تُبنى في V1)
- ❌ **Payments / Escrow** — لا داعي في classifieds model
- ❌ **Shipping integrations** — buyer/seller يتفقون مباشرة
- ❌ **Native mobile apps** — PWA كافي في البداية
- ❌ **Auctions / Bidding** — غير متطلّب للـ classifieds
- ❌ **Multi-language beyond ar/en** — French/Urdu لاحقاً
- ❌ **Admin dashboard متقدّم** — Supabase dashboard + SQL queries كافية
- ❌ **Storefront/shop profiles** — هذا Phase 3 (B2C)
- ❌ **Reviews على المستوى العام** — rating-only بين طرفي الصفقة
- ❌ **AI features** — smart pricing, auto-translation يؤجّلون
- ❌ **Video listings** — images فقط في V1

### كيف نبدأ صغير ونكبر
**Start Small:** افتح 10 categories فقط في الإطلاق (أهم 10 في الكويت)، وسع إلى 50+ خلال Phase 2. يعطي:
- Focused content seeding
- أوضح للـ users
- أسرع بناء
- يقلّل من "ghost town effect" في categories فارغة

**Final 10 launch categories (April 18):**

🔴 **P0 — Heavy seeding (130 listings):**
1. إلكترونيات (Electronics) — 40 listings
2. أثاث (Furniture) — 35 listings
3. حقائب وساعات فاخرة (Luxury Bags & Watches) — 25 listings
4. مستلزمات الأطفال (Baby & Kids) — 30 listings

🟠 **P1 — Medium seeding (70 listings):**
5. ألعاب وهوايات (Games & Hobbies) — 20 listings
6. رياضة وخارجي (Sports & Outdoor) — 15 listings
7. أجهزة رياضية منزلية (Home Fitness) — 15 listings
8. أدوات منزلية (Home Appliances) — 20 listings

🟡 **P2 — Light seeding (20 listings):**
9. جمال وعناية (Beauty & Care, sealed only) — 10 listings
10. متفرقات (General / Other) — 10 listings

**Total Phase 0 target: 220 listings** (see `LAUNCH-STRATEGY.md` for details)
**Plan B fallback: 100 listings في 4 P0 فقط** if shop partnerships fail

---

## 3. Market Entry Strategy — استراتيجية دخول السوق

### Go-to-Market Phases

#### Wave 1: Kuwait Beta (Week 17–22) — "الحوض المركّز"
**Target:** 100-500 active users، 1,500 listings في الكويت فقط.

**Supply-First Strategy (حلّ chicken-and-egg):**
Marketplace ما يشتغل بلا supply. لازم نبدأ بـ supply seeding قبل ما نفتح للـ buyers.

**Seeding Tactics (اختيار 3-5):**
1. **Founder-led seeding:** أنت شخصياً تسجّل 200 listings (أشياء من بيتك/أصدقاء) لـ 2 أسابيع قبل الإطلاق
2. **Concierge listings:** اعرض على 20 بائع "أنا بصوّرلك وأنشرلك مجاناً" — مقابل أن يكون من أول المسجّلين
3. **Scrape + invite:** اجمع قوائم عامة من Instagram sellers + OpenSooq sellers، تواصل معهم يدوياً
4. **Trade-in partnership:** اتفاق مع 2-3 محلات موبايلات/أثاث مستعمل يعرضون stock عندهم
5. **Referral واحد لواحد:** كل seller يدعو 2، ينحصل على featured listing مجاني أسبوع

**Demand Tactics:**
1. **Micro-influencers:** 5-10 كويتيين بـ 10K-50K followers (منطقة lifestyle, tech reviews) — $200-500 per post × 10 = $2,000-5,000
2. **Instagram + TikTok organic:** "deals of the week" content weekly
3. **Local WhatsApp communities:** Kuwait expats, specific neighborhoods, car enthusiasts
4. **Launch coverage:** ArabNet, Wamda, Kuwait Times، CNBC Arabia — pitch story of "أول منصة marketplace خليجية بـ premium UX"
5. **SEO-first content:** "كيف تبيع سيارتك المستعملة في الكويت" — articles تجيب organic traffic
6. **Google Ads on high-intent keywords:** "شراء موبايل مستعمل الكويت" = $500-1,500 test budget

#### Wave 2: Kuwait Public (Week 23–26)
- Press push
- Billboards? لا. بدلاً: **Taxi/Careem decals** (~$500/month) — رؤية عالية بـ cost منخفض
- First paid user campaign على Meta + TikTok: $2,000 test
- Referral program: ادع 3 أصدقاء → featured listing free

#### Wave 3: GCC Expansion (Month 7+)
- الأولوية: **الإمارات** (أسهل legal framework للـ e-commerce)، ثم **السعودية** (أكبر سوق، أصعب logistics)
- Local country manager part-time (أو موظف عن بعد) في كل سوق
- توطين حقيقي: local phone numbers, currency, shipping norms

### بأي سوق نبدأ أولاً؟ — **الكويت فقط في V1**
- السوق الأصلي لك (local knowledge غير قابل للاستعاضة)
- السوق أصغر → أسهل تصل لـ PMF بسرعة
- GCC sub-markets مختلفة كفاية بحيث ما ينفع "launch pan-GCC" بـ solo + $10K
- Kuwait success = proof للمستثمرين لو احتجت funding لاحقاً

### كيف نجذب أول 100 مستخدم؟
**الطريقة الصحيحة (hand-crafted):**
1. **الأسبوع 1:** أنت شخصياً + 10 من عائلتك/أصدقائك = 11 users. اطلب منهم ينشروا 3 listings لكل شخص = 33 listings.
2. **الأسبوع 2:** كل واحد من الـ 11 يدعو 2-3 اشخاص = +25 users. سجّلهم يدوياً، اعطهم onboarding call 5 دقائق.
3. **الأسبوع 3-4:** closed beta مع 60-80 من waitlist. اسأل كل واحد: "ايش حسيت في التجربة؟" — video call 15 دقيقة
4. **الأسبوع 5-8:** open beta مع invite codes. 5 codes لكل existing user. وصلنا ~200 user.
5. **الأسبوع 9-12:** الأولى 100 active + feedback صريح

⚠️ **لا تطلق public قبل ما تكون 80%+ confident في الـ core experience** — أول 100 user = أغلى قاعدة بيانات عندك من الـ feedback.

---

## 4. Technical Milestones — المراحل التقنية

### Build Order (بترتيب الأولوية)

#### 🏗️ Foundation Layer (Week 1-4)
```
1. Next.js 14 setup + App Router + TypeScript
2. Supabase project (Mumbai region) + GCC-ready schema
   - countries (KW active, others inactive)
   - cities + areas hierarchical
   - listings with country_code + currency_code + price_minor_units
   - price_mode enum (fixed/negotiable/best_offer)
   - listing lifecycle fields (expires_at, archived_at, renewed_count)
3. Auth (phone OTP with libphonenumber-js, all GCC codes accepted)
4. i18n setup (next-intl) + RTL config + logical CSS properties
5. Shadcn components baseline with RTL testing
6. Landing page + waitlist (يطلق week 1)
7. Environment variables & secrets hygiene
8. Locale-aware format utilities (currency with numberingSystem:'latn')
```

#### 🧱 Data Layer (Week 3-6) — GCC-Ready Schema
```
Reference tables:
- countries (code PK, name_ar, name_en, currency_code, phone_code, is_active)
- cities (id, country_code FK, name_ar, name_en, slug)
- areas (id, city_id FK, name_ar, name_en, slug)
- categories (id, parent_id, slug, name_ar, name_en, icon, priority, is_active)

Core tables:
- profiles (id, phone_e164, email, display_name, avatar_url, bio,
            verified_phone_at, country_code, created_at)
- listings (id, seller_id, title_ar, title_en, description_ar, description_en,
            price_minor_units BIGINT, currency_code CHAR(3), 
            price_mode ENUM('fixed','negotiable','best_offer'),
            min_offer_minor_units BIGINT NULL,
            condition, status, category_id,
            country_code, city_id, area_id,
            expires_at, archived_at, renewed_count, last_renewed_at,
            created_at, updated_at)
- listing_images (id, listing_id, url, position, width, height)
- favorites (user_id, listing_id, created_at)
- conversations (id, listing_id, buyer_id, seller_id, last_message_at)
- messages (id, conversation_id, sender_id, body, sent_as_offer,
            media_url, created_at, read_at)
- reports (id, reporter_id, target_type, target_id, reason, status, created_at)
- ratings (id, rater_id, rated_id, listing_id, score, comment, created_at)

RLS Policies من اليوم الأول — لا تؤجّلها.
Policy example: active listings visible only if country_code IN (active countries).
```

#### 🚀 Feature Layer (Week 5-16 — 6 sprints, Updated April 18)
بالترتيب، كل sprint = 2 أسابيع:

| # | Feature | AI Integration | Why This Order |
|---|---|---|---|
| 1 | User accounts + profiles | — | Foundation لكل شي |
| 2 | Post a listing (3 price modes + delivery options) | — | Supply side must come first |
| 3 | Browse + search + filters | **Semantic search (pgvector + embeddings)** | Demand side |
| 4 | Messaging + **AI quality gate testing** | **Photo-to-Listing accuracy test** | Transaction starts هنا + test before ship |
| 5 | **AI Layer + Trust v1** | **Fraud pipeline + Photo-to-Listing Minimal (if passed gate) + Telemetry** | AI moat + basic trust |
| 6 | Polish + performance + **Luxury auth UI (shifted)** | — | Before opening to public |

#### 🎁 Polish Layer (Week 15-16)
- Lighthouse score >90 (mobile)
- Arabic RTL edge cases QA
- Loading states everywhere (skeletons)
- Empty states مكتوبة بعناية
- Error boundaries
- 404 + 500 pages
- SEO basics (meta tags, sitemap, robots.txt)
- PostHog events for funnel tracking
- Sentry error tracking

### Release Timeline

| Release | متى | لمن | What Ships |
|---|---|---|---|
| **Internal Alpha** | End Week 8 | فوزي + 5 friends | Post listing, browse, basic messaging |
| **Closed Beta** | End Week 12 | 100 waitlist users | Full feature set, trust layer off |
| **Open Beta** | End Week 16 | Public in Kuwait | Complete Phase 1, limited marketing |
| **Public Launch** | Week 20 | Kuwait at scale | Paid acquisition, press |
| **v1.1 Stable** | Week 26 | Kuwait | Bug fixes, priority feature requests |
| **GCC Launch** | Month 8 | UAE, KSA | Localization + regional marketing |

---

## 5. Risk Assessment — تقييم المخاطر

### أهم 7 مخاطر (مرتّبة حسب الأولوية)

#### 🔴 Risk 1: Chicken-and-Egg Marketplace Dynamic
**الاحتمال:** مرتفع (يحدث في 80%+ من C2C launches)
**الأثر:** Existential — ممكن المشروع يموت
**Mitigation:**
- Supply-first seeding لمدة شهرين قبل demand marketing
- Start in 10 categories only, expand after traction
- Founder يسجّل 100-200 listings شخصياً قبل الإطلاق
- Concierge onboarding للـ first 50 sellers
**Plan B:** إذا بعد 3 شهور ما فيه supply ذاتي، pivot لـ vertical واحد (e.g., electronics only) للتركيز

#### 🔴 Risk 2: Broad Scope Dilution (Solo Founder)
**الاحتمال:** مرتفع
**الأثر:** Product mediocre في كل شي، ممتاز في لا شي
**Mitigation:**
- تقليل launch categories من 50+ إلى 10
- "Deep on few" vs "shallow on many"
- Monthly scope review — اقتل features ما تُستخدم
- اعتمد AI tools بشدة لسد الفجوة (Cursor, Claude Code)
**Plan B:** تقليل إلى 3-5 categories في حالة تجمد التقدم

#### 🟠 Risk 3: Trust Deficit vs Incumbents
**الاحتمال:** متوسط-عالي
**الأثر:** Users يرجعون لـ OpenSooq بعد أول احتيال
**Mitigation:**
- Verified phone + (optional) verified ID من اليوم الأول
- Safety tips واضحة في كل listing
- Quick reporting flow
- "Safe Meetup Spots" feature (خرائط لمواقع عامة آمنة)
- Moderation manual في أول 6 شهور (أنت شخصياً)
**Plan B:** Escalate trust layer إلى Phase 2 بدلاً من Phase 3 لو scam reports مرتفعة

#### 🟠 Risk 4: Burnout (Solo Founder + Flexible Schedule)
**الاحتمال:** مرتفع في شهر 4-6
**الأثر:** Project stalls
**Mitigation:**
- Weekly sprint reviews — احتفل بإنجازات
- 1 يوم كامل أسبوعياً off (no code, no planning)
- Accountability partner (زميل founder آخر في الكويت)
- Document كل شي — لو احتجت تأخذ استراحة، المشروع ما يضيع
**Plan B:** تجميد features جديدة لمدة شهر كامل، focus polish + marketing فقط

#### 🟠 Risk 5: Budget Overrun قبل Product-Market Fit
**الاحتمال:** متوسط
**الأثر:** تنفذ الفلوس قبل validation
**Mitigation:**
- Phase 0-1 (Week 1-16) يجب ما يتجاوز $1,500 (hosting + tools + seed content photography)
- Marketing spend محبوس < $500 حتى week 16
- احتفظ بـ $3,000 emergency reserve للـ PMF validation
- Free tier everything في البداية: Supabase Free, Vercel Hobby, PostHog Free
**Plan B:** Friends & Family round بحدود $25K-50K إذا PMF واضح في شهر 6

#### 🟡 Risk 6: Design System Mismatch (DESIGN.md)
**الاحتمال:** مؤكد (الملف مكتوب لـ deals aggregator)
**الأثر:** Wasted dev time لو بنينا على التصميم الحالي
**Mitigation:**
- **Week 1:** rewrite DESIGN.md للـ C2C marketplace vocabulary
- Color palette + typography يمكن إعادة استخدامهم كما هم (جميل)
- Component specs (listing cards بدل deal cards) تحتاج إعادة تعريف
**Plan B:** لا يوجد — هذا ما يُختصر

#### 🟡 Risk 7: Regulatory Changes (الكويت / GCC)
**الاحتمال:** منخفض-متوسط
**الأثر:** Forced shutdown أو cost surge
**Mitigation:**
- Classifieds model أقل regulatory surface من escrow
- طالع ministerial guidelines في MOCI بانتظام
- شريك مستشار قانوني على retainer ($200-500/شهر) من شهر 4+
**Plan B:** اختيار UAE كـ HQ legal (DIFC) لو الكويت صعّبت

### Risk Register — ملخّص

| # | Risk | Probability | Impact | Priority |
|---|---|---|---|---|
| 1 | Chicken-and-egg | High | Critical | P0 |
| 2 | Scope dilution | High | High | P0 |
| 3 | Trust deficit | Med-High | High | P1 |
| 4 | Founder burnout | High (late) | High | P1 |
| 5 | Budget overrun | Medium | High | P1 |
| 6 | DESIGN.md mismatch | Certain | Medium | P1 |
| 7 | Regulatory | Low-Med | Medium | P2 |

---

## 6. Decision Points — القرارات المفتوحة

### قرارات يجب الحسم قبل أسبوع 1

#### Decision 1: Listing Expiration Model
**الخيارات:**
- **A.** Listings تنتهي بعد 30 يوم تلقائياً، seller يقدر يجدّد
- **B.** Listings تظل "حية" حتى يمسحها seller
- **C.** 60 يوم expiration مع auto-renewal اختياري

**التوصية:** **A** — يضمن freshness، يقلل stale listings، يخلق reason للـ seller يرجع.

#### Decision 2: Username vs Phone Display
**الخيارات:**
- **A.** Show phone number to buyer after "interested" click (أسرع للـ contact)
- **B.** In-app chat only، phone number hidden (أكثر safety، أكثر friction)
- **C.** Seller's choice

**التوصية:** **B** — هذا هو الـ differentiator الأساسي ضد OpenSooq. Chat-first، phone opt-in فقط.

#### Decision 3: Price Required or Optional?
**الخيارات:**
- **A.** سعر إلزامي لكل listing
- **B.** "Price on request" مسموح
- **C.** "قابل للتفاوض" checkbox

**التوصية:** **A + C** — سعر إلزامي لكن مع checkbox "السعر قابل للتفاوض". يحسّن search/filter experience.

#### Decision 4: Location Granularity
**الخيارات:**
- **A.** City فقط (الكويت، الإمارات، السعودية)
- **B.** City + Area (السالمية، حولي، ...)
- **C.** Precise pin on map

**التوصية:** **B** — City + Area في V1. Map pin في V2. Precise لا في V3 (privacy concerns).

#### Decision 5: Image Count per Listing
**الخيارات:**
- **A.** 5 images max (خفيف)
- **B.** 10 images max (standard)
- **C.** 20+ images (power sellers)

**التوصية:** **B** — 10 images، يتوسع لـ 20 للـ verified sellers في Phase 2.

### أسئلة بحثية مفتوحة (Research Required)

#### Research Item 1: SMS OTP Provider للكويت
- Twilio? MessageBird? Kuwaiti local provider (STC/Zain)?
- Cost per SMS
- Deliverability rates لأرقام 965

#### Research Item 2: Kuwait Address/Area Taxonomy
- هل فيه API رسمية لمناطق الكويت؟
- Google Places API? PACI (Public Authority for Civil Information)?

#### Research Item 3: Top 10 Categories Research
- أي categories هي الأعلى traffic في OpenSooq Kuwait / Q84sale الآن؟
- Interview 5 sellers + 5 buyers من الكويت

#### Research Item 4: Safe Meetup Locations
- بنوك، مراكز تجارية، محطات وقود كبيرة — أي الأنسب؟
- هل Kuwait Police عندها guidance لـ online purchases meetups؟

#### Research Item 5: Competitive Intelligence Deep Dive
- OpenSooq: pricing of featured listings, user counts leaked
- Q84sale: monetization model details
- Haraj: how they handle dispute resolution

### Strategic Open Questions (بدون إجابة واضحة بعد)

1. **هل نبني PWA أو native app في Phase 2؟** — PWA أرخص، native أكثر engagement. نؤجل للقرار لـ week 20.
2. **Monetization timing:** متى نبدأ featured listings؟ — توصية: week 22 (بعد WAU > 1000).
3. **Content moderation:** manual (founder) أو AI-assisted من البداية؟ — start manual، AI في Phase 2.
4. **Community building:** ننشئ Discord/Telegram للـ early users؟ — توصية: نعم، Telegram channel للـ announcements من week 10.
5. **الاسم "Dealo Hub" vs SEO:** هل الاسم مناسب لـ "دلو" (bucket in Arabic)؟ اختبر مع 20 شخص كويتي.

---

## 7. Budget Allocation — توزيع الميزانية ($10,000)

### Product Side ($5,000)

| Item | Cost | Phase | Notes |
|---|---|---|---|
| Domains (.com + .com.kw + .sa + .ae) | $80 | Week 1 | Defensive registration, ~$15-25 each |
| Vercel Pro (month 4+) | $20/mo × 9 = $180 | Phase 2+ | Free tier في البداية |
| Supabase Pro (month 4+) | $25/mo × 9 = $225 | Phase 2+ | Free tier: 500MB DB, 1GB storage |
| SMS OTP budget | $500 | Phase 1-2 | ~$0.03-0.05/SMS × 10K-15K SMS |
| **OpenAI API (GPT-4o-mini + embeddings)** | **$25-45/mo × 6 = $210** | **Month 4+** | **Fraud text + Photo-to-Listing + Semantic search** |
| **Google Cloud Vision API** | **$10-20/mo × 6 = $90** | **Month 2+** | **Reverse image search for fraud** |
| Email provider (Resend) | $20/mo × 6 = $120 | Phase 2+ | Free tier يكفي initial |
| Content photography | $600 | Phase 1-2 | Freelance photographer لـ 200-300 listings |
| Design assets (icons, logo refinement) | $400 | Phase 0 | Fiverr designer |
| Legal consultation (retainer) | $1,500 | Month 4-9 | $250/mo × 6 |
| Analytics (PostHog) | $0 | - | Free tier |
| Error tracking (Sentry) | $0 | - | Free tier |
| Misc tooling (Linear, Figma, GitHub) | $300 | - | Free tiers أولاً |
| **Dev reserve (bugs, infra spikes)** | $495 | Ongoing | Buffer 10% after AI addition |
| **Total** | **$5,000** | | |

### AI Budget Detail (Updated April 18)

| Service | Monthly (launch) | Monthly (M6+) | Year 1 Total |
|---|---|---|---|
| OpenAI GPT-4o-mini (volume) | $15-25 | $30-50 | $350-500 |
| OpenAI GPT-4o (critical) | $5-10 | $10-20 | $120-200 |
| OpenAI embeddings | $1-5 | $5-10 | $40-80 |
| Google Vision API | $10-20 | $20-40 | $160-280 |
| **Total AI** | **$31-60/mo** | **$65-120/mo** | **$670-1,060** |

**Kill Switches:**
- Month 4: AI cost > $75/mo + no ROI → reduce to fraud-only
- Month 6: AI cost > $200/mo + WAU < 500 → strip to rules-only
- Month 9: AI cost > $400/mo + <$1K MRR → consider open-source alternatives (Llama via Groq)

### Marketing Side ($5,000)

| Item | Cost | Phase | Notes |
|---|---|---|---|
| Micro-influencer campaigns (10 posts) | $2,500 | Weeks 17-26 | $150-300 per post |
| Paid ads (Meta + TikTok) | $1,500 | Weeks 20-26 | Test campaigns |
| Google Ads (SEM) | $500 | Weeks 20-26 | High-intent keywords |
| Content creation (videos, reels) | $300 | Weeks 14-22 | Freelance editor + stock |
| Press/PR outreach | $0 | Weeks 18-20 | DIY |
| Launch event (small, local) | $200 | Week 22 | Coffee meetup for first 20 users |
| **Growth reserve** | $0 | | Keep it lean |
| **Total** | **$5,000** | | |

### Burn Rate Timeline
- **Months 1-3:** $300/month (hosting free tier, mostly photography + tools)
- **Months 4-6:** $800/month (paid tiers start, content seeding)
- **Months 7-9:** $1,500/month (marketing ramp)
- **Total projected:** ~$7,800 — يبقى $2,200 كـ emergency reserve ✅

---

## 8. Success Metrics — مقاييس النجاح

### North Star Metric
**Weekly Transactions Initiated** = عدد المحادثات buyer-seller اللي تبدأ على listing خلال أسبوع.

لماذا؟ هذا أقوى signal للـ marketplace health من DAU/registrations/listings فقط.

### Phase 1 Targets (End of Week 16 — Open Beta)
- 500 registered users
- 1,500 listings live
- 200 weekly transactions initiated
- 15% week-over-week retention
- <3% listings reported/flagged
- Mobile page load <2.5s (p75)
- Lighthouse score 90+ mobile

### Phase 2 Targets (End of Week 26 — Post-Launch)
- 5,000 registered users
- 15,000 listings live
- 1,500 weekly transactions initiated
- 30% week-over-week retention
- 2.5 avg listings per active seller
- NPS >30
- 20% organic traffic (non-paid)

### Leading Indicators (track weekly)
- Sign-up conversion rate (landing → account)
- Listing completion rate (start form → publish)
- First message latency (post-listing → first contact)
- Time-to-sold (published → marked sold)
- DAU/MAU ratio (stickiness)

### Lagging Indicators (track monthly)
- Active sellers (>1 listing in 30 days)
- Active buyers (>1 message sent in 30 days)
- Repeat sellers (>2 listings lifetime)
- Category diversity (top 3 vs others)

---

## 9. Roles & Responsibilities (Solo Founder Reality Check)

أنت الـ Everything. لكن لازم تفصل الأدوار لتنظيم الوقت:

| Role | % Time | أمثلة نشاط |
|---|---|---|
| **Product Manager** | 15% | Spec features, prioritize, write user stories |
| **Designer** | 10% | Figma mockups, review UX, refine flows |
| **Engineer** | 50% | Build the damn thing |
| **QA Tester** | 5% | Manual testing, bug reproduction |
| **Community Manager** | 10% | Telegram, user interviews, support |
| **Marketer** | 5% | Content, social, ads |
| **Ops/Admin** | 5% | Legal, finance, partnerships |

**AI Leverage Strategy:**
- **Engineer role → 60% AI-assisted** with Cursor/Claude Code (حقيقي: تسرع 2-3x)
- **Designer role → 40% AI-assisted** with v0.dev, shadcn blocks, Claude for layouts
- **Community + Marketing → 20% AI-assisted** (captions, responses templates)
- **Product + QA → يظلون human-driven**

### Weekly Rhythm (مقترح)
- **Monday:** Planning + sprint grooming (2-3 ساعات)
- **Tues-Fri:** Deep work (coding/designing)
- **Saturday:** Community + marketing + user interviews
- **Sunday:** OFF (no work) — recovery mandatory

---

## 10. Immediate Next Actions — المهام الفورية

### Week 1 Sprint (من اليوم)

#### Day 1-2
- [ ] **تحديث DESIGN.md** — rewrite لـ C2C marketplace vocabulary
- [ ] إنشاء category taxonomy في Google Sheet (10 main × 5-7 sub each)
- [ ] **شراء defensive domains:**
  - [ ] dealohub.com (primary)
  - [ ] dealohub.com.kw (Kuwait TLD)
  - [ ] dealohub.sa (Saudi defensive, ~$15/yr)
  - [ ] dealohub.ae (UAE defensive, ~$15/yr)
- [ ] Scout 20 shop partnership prospects (5 electronics, 5 luxury, 5 furniture, 5 misc)

#### Day 3-4
- [ ] Supabase project creation **in ap-south-1 (Mumbai) region**
- [ ] **Enable pgvector extension** in Supabase (Sprint 3 dependency)
- [ ] Schema v1 migrations (GCC-ready: countries, cities, areas, listings with AI telemetry fields, profiles)
- [ ] Seed countries table (KW active, SA/AE/BH/QA/OM inactive)
- [ ] Next.js 14 + Shadcn + next-intl + RTL bootstrap
- [ ] GitHub repo + deploy to Vercel
- [ ] First 10 shop partnership outreach messages sent
- [ ] **OpenAI API account setup** + API keys stored in Vercel env
- [ ] **Google Cloud Vision API enable** + credentials stored

#### Day 5-7
- [ ] Landing page + waitlist (Supabase form saves emails + country preference)
- [ ] Analytics (PostHog snippet with country + locale dimensions)
- [ ] Social accounts reserved (Instagram, Twitter/X, TikTok: @dealohub)
- [ ] libphonenumber-js integration in auth flow
- [ ] Write first "Why Dealo Hub" blog post للـ SEO seed
- [x] ~~**Dubizzle Kuwait manual audit** — capture screenshots~~ ✅ **Done 2026-04-18** (raw materials removed 2026-04-19; findings integrated)
  - [x] Homepage + category page + listing detail (iPhone + Rolex) + mobile view
  - [ ] ~~Chat flow as buyer~~ — login-gated, deferred
  - [ ] ~~"Sell with AI" flow~~ — UAE flagship Imperva-blocked; KW has no such feature
  - [ ] ~~Featured listings pricing~~ — login-gated, deferred
  - ✅ Strategy doc updates: `COMPETITOR-DUBIZZLE.md` v1.1 + `EXECUTIVE-SUMMARY.md` v2.1 + `LAUNCH-STRATEGY.md` v1.3
- [ ] **Draft fraud detection prompt library** (10+ Kuwait scam examples collected)

### Week 2 Sprint
- [ ] Auth flow (phone OTP + email fallback)
- [ ] Profile model + edit page
- [ ] Upload avatar logic
- [ ] i18n strings ar/en baseline
- [ ] RTL audit of baseline components

### Key Checkpoints (قبل ما تكمل)
- ✅ DESIGN.md revised and matches C2C marketplace
- ✅ 50-category taxonomy documented
- ✅ First user can sign up, verify phone, edit profile
- ✅ Landing page live with waitlist

---

## 11. Plan B Scenarios — سيناريوهات بديلة

### Scenario A: "أنا متأخر في المراحل" (Behind Schedule)
**Trigger:** End of Week 12 ولسه ما خلصت Sprint 4.
**Action:**
- قلل categories من 50 إلى 10 permanent
- أجّل ratings/reports إلى Phase 2
- Launch "Classifieds-only" بدون trust layer

### Scenario B: "ما فيه supply" (No Listings)
**Trigger:** End of Week 18 وأقل من 500 listings.
**Action:**
- Pivot إلى single vertical (pick top category by volume — likely Electronics)
- 3 شهور focused seeding في vertical واحد
- Rebrand sub-page: dealohub.com/electronics أولاً، ثم expand

### Scenario C: "ما فيه demand" (No Buyers)
**Trigger:** End of Week 20 وأقل من 100 WAU.
**Action:**
- Interview 20 non-users — ليش ما يجون؟
- Re-evaluate positioning + messaging
- Consider B2C pivot (hand-curated sellers) أسرع من C2C

### Scenario D: "Budget deplete قبل PMF"
**Trigger:** $2,000 remaining, no PMF indicators.
**Action:**
- Freeze paid marketing
- Focus 100% على retention + quality
- Reach out لـ angel investors في الكويت (aUEY, Gulf Venture Capital, individual HNWIs)
- Friends & Family round $25-50K

### Scenario E: "PMF Achieved قبل المتوقع"
**Trigger:** Week 20، 2,000+ WAU، >40% retention.
**Action:**
- Accelerate GCC launch
- Consider seed round ($500K-$1M)
- Hire 1-2 contractors (engineer + growth marketer)
- UAE next market within 60 days

---

## 12. Appendix — مراجع سريعة

### Competitor Quick Reference
| Platform | Market | Strengths | Weaknesses | Dealo Hub Opportunity |
|---|---|---|---|---|
| OpenSooq | Pan-GCC | Scale, brand recognition | UX قديم، full of spam | Premium experience |
| Q84sale | Kuwait-dominant (cars) | Kuwait loyalty, cars vertical | Ugly UX, weak trust | Non-cars categories |
| حراج | Saudi-dominant | Saudi brand | Very old UX | Modern GCC alternative |
| Dubizzle | UAE-dominant | Polished | Expensive for sellers | Kuwait focus, cheaper |
| Facebook Marketplace | Pan-GCC | Free, social graph | Low trust, poor search | Serious buyer/seller UX |

### Technology Decision Matrix
| Area | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 App Router | SSR + SEO + RSC |
| DB + Auth | Supabase | Fast, generous free tier, realtime built-in |
| Styling | Tailwind + Shadcn | Speed + consistency |
| Deploy | Vercel | Zero-config Next.js |
| Storage | Supabase Storage | Same ecosystem |
| Realtime | Supabase Realtime | Built-in, avoid Pusher cost |
| Search | Postgres FTS + pg_trgm | Avoid Algolia cost in V1 |
| Email | Resend | Modern API, generous free tier |
| SMS | Twilio or local | Research needed |
| Analytics | PostHog | Self-hosted option + free tier |
| Errors | Sentry | Industry standard, free tier |

### Glossary (for consistency)
- **Listing** (إعلان) — a user's posted item for sale. Not "deal."
- **Seller** (بائع) — user posting a listing
- **Buyer** (مشتري) — user browsing/messaging
- **Category** (فئة) — taxonomic classification of listings
- **Conversation** (محادثة) — buyer-seller message thread
- **Verified** (موثّق) — user with verified phone/ID
- **Active listing** — status = 'live' AND expires_at > now()

---

## 13. Change Log

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-04-18 | 1.0 | Initial master plan created | Fawzi + Claude |
| 2026-04-18 | 1.1 | Categories finalized (luxury + home fitness) · Price modes finalized (3 modes) · Listing lifecycle (manual renew + archive) · GCC-ready architecture · Defensive domains · Plan B + Shop Playbook added | Fawzi + Claude |
| 2026-04-18 | 1.2 | **Dubizzle competitive analysis** added (see COMPETITOR-DUBIZZLE.md). **AI features integrated:** V1 AI Fraud Detection + Semantic Search + Photo-to-Listing Minimal + Telemetry Infrastructure. Sprint 5 rebalanced (luxury auth UI → Sprint 6). Pre-launch AI quality gates added (Week 11-12). Budget updated: AI costs $25-55/mo launch, $400-800 Year 1 total. Week 1 actions: OpenAI + Vision + pgvector setup + Dubizzle manual audit. | Fawzi + Claude |
| 2026-04-18 | 1.3 | **Post live-audit refinement** (Task #10 complete). Dubizzle Kuwait audit completed; findings integrated (raw materials removed 2026-04-19). Three strategic adjustments cascaded to `COMPETITOR-DUBIZZLE.md` v1.1, `EXECUTIVE-SUMMARY.md` v2.1, `LAUNCH-STRATEGY.md` v1.3: (1) phone-moat reframed as behavioral not technical (sellers embed phone in titles); (2) "Sell with AI" confirmed UAE/KSA-only, Kuwait first-mover window for Dealo Hub Photo-to-Listing; (3) luxury counterfeit evidence strengthened (live "Rolex 1st copy @ KWD 22" on Dubizzle KW). **Two new Sprint 2 filters** added to scope: phone-in-title hard reject (Filter A) + luxury counterfeit term reject (Filter B) — both <1d engineering, Day-1 differentiators. Week 1 `Dubizzle manual audit` checklist marked done with scope notes. | Fawzi + Claude |

---

## Related Documents
- [`EXECUTIVE-SUMMARY.md`](./EXECUTIVE-SUMMARY.md) — 1-page scannable summary
- [`DECISIONS.md`](./DECISIONS.md) — Decision matrix for 9 core decisions (including AI decisions 6-9)
- [`LAUNCH-STRATEGY.md`](./LAUNCH-STRATEGY.md) — Category strategy + Plan B + Shop Playbook + AI positioning
- [`GCC-READINESS.md`](./GCC-READINESS.md) — Multi-country architecture technical reference
- [`COMPETITOR-DUBIZZLE.md`](./COMPETITOR-DUBIZZLE.md) — Primary competitor deep-dive and strategic positioning
- [`../design/AI-FEATURES.md`](../design/AI-FEATURES.md) — AI features specification (5 features + telemetry + V3 Go/No-Go framework)
- [`../DESIGN.md`](../DESIGN.md) — Design system v2.0

---

## 14. Sign-off

هذه الخطة **vivante** — لا تتعامل معها كـ contract. راجعها كل 4 أسابيع وحدّثها حسب الواقع.

**القرار الأصعب في كل الخطة:** الـ broad-scope (50+ categories) launch. التوصية القوية هي البدء بـ 10 فقط والتوسع بعد traction، لكن هذا قرارك النهائي.

**القرار الثاني الأصعب:** Hidden phone number / chat-first. هذا هو الـ moat الحقيقي ضد OpenSooq — لا تتنازل عنه بسهولة.

**النصيحة النهائية:** Ship something embarrassing في Week 8 (internal alpha). الـ perfectionism هو عدو الـ solo founder الأول.

بالتوفيق فوزي — خلّينا نبني شي يستحق.

— *End of Master Plan v1.0*
