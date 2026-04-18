# Kuwait Scam Patterns — Reference Catalog

**Purpose:** Ground truth for fraud detection prompt training + test cases.
**Audience:** AI prompt authors · admin moderators · support team
**Source:** Manual review of OpenSooq Kuwait + Q84sale + reported scams (April 2026)

**This is NOT shown to users.** This is internal documentation for training prompts and moderators.

---

## Taxonomy (15 Patterns)

Each pattern tagged with:
- **Severity:** 0-100 (contribution to fraud_score)
- **Prevalence:** 🔴 Very common / 🟡 Moderate / 🟢 Rare
- **Detection:** How AI + rules catch it

---

### Pattern 1: Advance-fee fraud (دفع مقدم)

**Severity:** 85 · **Prevalence:** 🔴 Very common

**Signals in Arabic:**
- "حوّلي مقدم"
- "ادفع عربون"
- "احجز بـ X دينار"
- "مقدم حجز"

**Signals in English:**
- "send a deposit"
- "pay advance to reserve"
- "transfer partial payment first"

**Example listing body:**
> "للبيع iPhone 14 Pro. حوّلي مقدم 20 دينار وراح أحجز لك الجهاز وأرسله على السكن."

**Why it's a scam:** The seller disappears after collecting the "deposit." Legitimate C2C never requires advance payment.

**Detection:** AI text analysis flags deposit/advance keywords. Rule: "transfer before meeting" phrases = +50 severity.

---

### Pattern 2: Too-good-to-be-true pricing

**Severity:** 70 · **Prevalence:** 🔴 Very common

**Trigger:** Brand-new high-value item at <40% of market price.

**Example:**
> "iPhone 15 Pro Max 512GB جديد مغلق بـ 80 دينار فقط!" (market: ~400 KWD)

**Why it's a scam:** Bait to attract clicks + phishing attempts.

**Detection:** Price anomaly pipeline (pgvector similar listings) + AI flags implausible pricing vs category median.

---

### Pattern 3: Phone number hijack in description

**Severity:** 60 · **Prevalence:** 🔴 Very common on OpenSooq

**Pattern:** Seller embeds phone number in listing body to bypass platform chat.

**Examples:**
- "كلمني على 999XXXX"
- "تواصل معي WhatsApp +965 9XX XXXX"
- "للجدية: 5XXXXXXX"
- "9999-XXXX اتصل بعد الضهر"

**Why it's against ToS:** Dealo Hub is chat-only (Decision 2). Phone numbers in listings break the moat.

**Detection:** Regex + AI semantic detection of "call me at" phrasing. Pattern `(\+?965)?[\s-]?[0-9]{4}[\s-]?[0-9]{4}` = immediate flag.

---

### Pattern 4: WhatsApp redirect pump

**Severity:** 55 · **Prevalence:** 🔴 Very common

**Pattern:** Legitimate-looking listing urging off-platform contact.

**Example:**
> "السعر قابل للنقاش. للتواصل السريع راسلني على واتساب أو إنستا، أنا ما أدخل هنا كثير."

**Why it's suspicious:** Combined with cheap pricing + new account = classic bait to move transaction off-platform where no audit trail exists.

**Detection:** AI flags "contact me off-platform" phrasing + external platform mentions.

---

### Pattern 5: Fake official/authority framing

**Severity:** 90 · **Prevalence:** 🟡 Moderate (higher impact)

**Pattern:** Seller claims to be from ministry, bank, or police — often for "seized goods."

**Examples:**
- "أنا موظف في وزارة الداخلية، بحكم عملي عندي سيارة مصادرة بسعر رمزي"
- "مزاد بنك الكويت الوطني، سيارات بأسعار تحت السوق"

**Why it's a scam:** Kuwaiti institutions do not sell via C2C platforms. 100% social engineering.

**Detection:** AI flags official-authority claims. List: "وزارة | government | ministry | official auction | مزاد رسمي | seized" triggers review.

---

### Pattern 6: Charity guilt trip

**Severity:** 50 · **Prevalence:** 🟡 Moderate

**Pattern:** Emotional appeal attached to high-value item to justify urgency + cash payment.

**Example:**
> "أبيع ساعتي Rolex بسعر أقل من السوق، أحتاج المبلغ لعلاج ولدي بالخارج. جادّ الرجاء عدم المفاوضة."

**Why it's suspicious:** The emotional story + no-negotiation demand + below-market price = urgency manipulation. Not always a scam, but disproportionately flagged.

**Detection:** AI flags emotional appeals + urgency framing in luxury/high-value listings. Lower severity alone, escalates if combined with other flags.

---

### Pattern 7: Stolen goods indicators

**Severity:** 95 · **Prevalence:** 🟢 Rare but critical

**Pattern:** Explicit or implicit markers that item is not legitimately owned.

**Examples:**
- "بدون فاتورة - سعر خاص"
- "ما لي مال مراجعة الضمان"
- "بدون صندوق بدون ملحقات"
- "السعر للمستعجل - بدون أسئلة"

**Why it's a scam:** Either stolen or counterfeit — either way, platform liability.

**Detection:** AI flags "no receipt / no warranty / no questions" combos on electronics/luxury. Severity escalates for items typically shipped with documentation.

---

### Pattern 8: Counterfeit luxury tells

**Severity:** 80 · **Prevalence:** 🔴 Very common in luxury category

**Pattern:** Language giving away that luxury item is a replica.

**Examples:**
- "طبق الأصل"
- "مثل الأصلي تماماً"
- "درجة أولى ممتازة"
- "first copy" / "mirror copy" / "AAA replica"
- "original quality"

**Why it's a problem:** Dealo Hub's luxury positioning depends on authenticity. Counterfeits destroy brand.

**Detection:** Specific keyword flagging in luxury category listings.

---

### Pattern 9: Crypto payment demands

**Severity:** 85 · **Prevalence:** 🟡 Growing (from ~2024)

**Pattern:** Seller insists on cryptocurrency payment for high-value items.

**Examples:**
- "ادفع USDT TRC20"
- "Bitcoin only"
- "تحويل عملة رقمية"

**Why it's a scam:** Crypto is irreversible + untraceable. Legitimate Kuwait C2C doesn't use it.

**Detection:** AI flags crypto terms. Pattern: "USDT | Bitcoin | BTC | TRC20 | ERC20 | crypto | عملة رقمية" → +40 severity.

---

### Pattern 10: Visa/residency services disguised as listings

**Severity:** 75 · **Prevalence:** 🟡 Moderate

**Pattern:** Listings in unrelated categories that are actually visa/labor services.

**Examples:**
- "أسوي لك إقامة عمل بسعر رمزي"
- "Family visa processing"
- "أوفر تأشيرة"

**Why it's flagged:** Outside marketplace scope + often illegal labor trafficking.

**Detection:** AI flags visa/residency/labor keywords in non-services categories. Rule-based keyword list triggers admin review.

---

### Pattern 11: Stock-photo listings (stolen images)

**Severity:** 70 · **Prevalence:** 🔴 Very common

**Pattern:** Listing uses images copied from official brand websites or other marketplaces.

**Why it's a scam:** Seller doesn't actually have the product — photos taken from Apple.com, Amazon, etc.

**Detection:**
1. Reverse image search via Google Vision (pHash hamming distance)
2. Check against internal `image_hashes` cache for duplicates across accounts
3. AI caption analysis: "is this a product photo or a stock image?"

---

### Pattern 12: Phishing link in description

**Severity:** 85 · **Prevalence:** 🟡 Moderate

**Pattern:** Listing body contains external link meant to phish user.

**Examples:**
- "شوف تفاصيل أكثر هنا: bit.ly/XXXX"
- "Special price at my website: www.XXX.com"

**Why it's a scam:** Links lead to credential-harvesting sites.

**Detection:** Regex for URLs in description body + AI classification. All URLs flagged for admin review.

---

### Pattern 13: Duplicate/spam cross-posting

**Severity:** 40 · **Prevalence:** 🔴 Very common

**Pattern:** Same content posted across multiple categories to game search visibility.

**Example:** Identical "iPhone 14" listing appears under Electronics + Phones + General.

**Why it's against ToS:** Clutters marketplace, hurts search quality.

**Detection:** Embedding similarity >0.95 across listings from same seller = duplicate flag.

---

### Pattern 14: Fake urgency manufacturing

**Severity:** 45 · **Prevalence:** 🔴 Very common

**Pattern:** Artificial deadlines to rush decisions.

**Examples:**
- "السعر لحد الليلة فقط"
- "آخر قطعة متوفرة"
- "خلال 24 ساعة"

**Why it's problematic:** Pressure tactic pushing users to skip due diligence. Not always scam but correlates with fraud.

**Detection:** AI flags urgency phrases. Low severity alone, escalates when combined with transfer requests.

---

### Pattern 15: New account + high-value first listing

**Severity:** 35 · **Prevalence:** 🔴 Very common

**Pattern:** Account created <7 days ago, first listing is >500 KWD item.

**Why it's suspicious:** Legitimate sellers typically list smaller items first or have account history. New accounts flooding with luxury = red flag.

**Detection:** Rules-based (not AI). Account age + listing price + seller history combined into behavioral score.

**Note:** This alone is NOT a scam — many legitimate new users. Combine with Pattern 2 or 7 for high severity.

---

## Cross-Pattern Escalation Rules

When multiple patterns present, severity multiplies:

| Combination | Effect |
|---|---|
| Advance-fee + new account | Severity × 1.5 → auto-hold |
| Counterfeit tell + luxury category | Severity × 2 → auto-reject |
| Phone-in-body + WhatsApp redirect | Merge to single high-severity flag |
| Crypto + high-value + new account | Auto-hold + admin notification |

---

## Out of Scope (Not Fraud, But Banned)

Excluded from fraud detection — handled via separate content moderation:

- Hate speech / harassment in description
- Weapons / ammunition (legal only with hunting license)
- Medical devices / prescriptions
- Live animals (Dealo Hub policy — not fraud)
- Adult content
- Real estate (not a V1 category anyway)

---

## Evolution Protocol

This catalog is a **living document**. Process:

1. **Weekly review** (first 3 months) by Fawzi
2. **Add new pattern:** any scam reported 3+ times by users
3. **Retire pattern:** if no occurrences in 90 days
4. **Test cases:** every new pattern must have 3+ test examples added to `fraud-detection.md`

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial catalog — 15 patterns documented for V1 launch |
