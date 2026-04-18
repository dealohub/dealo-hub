# Dealo Hub — GCC Architectural Readiness
### Zero-Cost Now vs 40x Cost Later

**Date:** April 18, 2026
**Status:** Approved — All 4 items ship in V1
**Principle:** Kuwait launch, GCC architecture

---

## The Core Architectural Principle

> **V1 يخدم الكويت فقط في الـ marketing، supply seeding، والـ default UX. لكن الـ code، الـ schema، والـ primitives تفترض multi-country من اليوم الأول.**

هذا الفرق بين startup ينجح ويتوسّع، و startup يخنقه technical debt في Phase 2.

---

## Cost Analysis Matrix

| # | Feature | V1 Extra Cost | Retrofit Cost | ROI |
|---|---|---|---|---|
| 1a | `country_code` field | 0 min | 2-4 days | ∞ |
| 1b | `currency_code` + minor_units | 30 min | 3-5 days | 60x |
| 1c | countries > cities > areas | 2-3 hrs | 1-2 weeks | 30x |
| 2a | i18n toggle ar/en | 0 (baseline) | Rebuild UI | ∞ |
| 2b | RTL support | 2-4 hrs | 2-3 weeks | 40x |
| 2c | Locale number formatting | 1 hr | 2-3 days | 20x |
| 3 | GCC-ready gateway choice (Tap) | 0 (deferred) | 0 (deferred) | N/A |
| 4 | libphonenumber for GCC codes | **-1 hr** | 1 week | Infinite |
| | **Total** | **~8-12 hrs** | **5-8 weeks** | **40x** |

---

## 1. Database Schema

### Core Tables (GCC-Ready Schema)

```sql
-- Countries reference table
CREATE TABLE countries (
  code          CHAR(2)     PRIMARY KEY,    -- ISO 3166-1 alpha-2
  name_ar       TEXT        NOT NULL,
  name_en       TEXT        NOT NULL,
  currency_code CHAR(3)     NOT NULL,       -- ISO 4217
  phone_code    VARCHAR(6)  NOT NULL,       -- e.g. '+965'
  is_active     BOOLEAN     NOT NULL DEFAULT false,
  sort_order    INT         NOT NULL DEFAULT 0
);

-- Seed data (V1)
INSERT INTO countries VALUES
  ('KW', 'الكويت', 'Kuwait',         'KWD', '+965', true,  1),
  ('SA', 'السعودية', 'Saudi Arabia',  'SAR', '+966', false, 2),
  ('AE', 'الإمارات', 'UAE',           'AED', '+971', false, 3),
  ('BH', 'البحرين', 'Bahrain',        'BHD', '+973', false, 4),
  ('QA', 'قطر', 'Qatar',              'QAR', '+974', false, 5),
  ('OM', 'عُمان', 'Oman',             'OMR', '+968', false, 6);

-- Cities
CREATE TABLE cities (
  id            BIGSERIAL   PRIMARY KEY,
  country_code  CHAR(2)     NOT NULL REFERENCES countries(code),
  name_ar       TEXT        NOT NULL,
  name_en       TEXT        NOT NULL,
  slug          TEXT        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE (country_code, slug)
);

-- Areas
CREATE TABLE areas (
  id            BIGSERIAL   PRIMARY KEY,
  city_id       BIGINT      NOT NULL REFERENCES cities(id),
  name_ar       TEXT        NOT NULL,
  name_en       TEXT        NOT NULL,
  slug          TEXT        NOT NULL,
  UNIQUE (city_id, slug)
);

-- Listings (snippet — full schema later)
CREATE TABLE listings (
  id                 BIGSERIAL   PRIMARY KEY,
  seller_id          UUID        NOT NULL REFERENCES profiles(id),
  country_code       CHAR(2)     NOT NULL DEFAULT 'KW' REFERENCES countries(code),
  city_id            BIGINT      NOT NULL REFERENCES cities(id),
  area_id            BIGINT              REFERENCES areas(id),
  price_minor_units  BIGINT      NOT NULL,        -- in smallest currency unit
  currency_code      CHAR(3)     NOT NULL DEFAULT 'KWD',
  -- ... rest of fields
  CHECK (price_minor_units > 0)
);

-- Critical indexes for multi-country queries
CREATE INDEX idx_listings_country_status ON listings (country_code, status);
CREATE INDEX idx_listings_city_status    ON listings (city_id, status);
```

### Price Storage — Minor Units Pattern

**لماذا:** floats كسرت شركات كثيرة. Always integer minor units.

```typescript
// Currency decimals lookup
const CURRENCY_DECIMALS: Record<string, number> = {
  KWD: 3, BHD: 3, OMR: 3,   // 1 KWD = 1,000 fils
  SAR: 2, AED: 2, QAR: 2,   // standard 2-decimal
};

// Store: price is entered as 125.500 KWD → stored as 125500 minor units
function toMinorUnits(amount: number, currency: string): bigint {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return BigInt(Math.round(amount * Math.pow(10, decimals)));
}

// Display
function fromMinorUnits(minor: bigint, currency: string): number {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return Number(minor) / Math.pow(10, decimals);
}
```

### V1 RLS Policy (Country-Aware)

```sql
-- Buyers see only active-country listings by default
CREATE POLICY "public_listings_select"
  ON listings FOR SELECT
  USING (
    status = 'live'
    AND country_code IN (SELECT code FROM countries WHERE is_active = true)
  );
```

In V1, only KW is `is_active=true`. Flipping SA to active in V2 = single `UPDATE` statement.

---

## 2. UI/UX Internationalization

### Framework Choice: `next-intl`

```bash
pnpm add next-intl libphonenumber-js
```

### App Router Structure

```
app/
├── [locale]/
│   ├── layout.tsx        # sets dir={locale === 'ar' ? 'rtl' : 'ltr'}
│   ├── page.tsx
│   ├── listings/
│   ├── messages/
│   └── sell/
├── layout.tsx            # root
└── middleware.ts         # locale detection + country routing
```

### Locale + Direction Setup

```typescript
// app/[locale]/layout.tsx
export default function LocaleLayout({ children, params: { locale } }) {
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className="font-satoshi">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Tailwind RTL Discipline

**Rule:** Use logical properties only. Never `left/right` or `ml/mr`.

```tsx
// ❌ BAD — breaks in RTL
<div className="ml-4 border-l-2 text-right">

// ✅ GOOD — auto-flips
<div className="ms-4 border-s-2 text-end">
```

**Logical Tailwind classes to memorize:**
- `ms-*` / `me-*` (margin-start, margin-end)
- `ps-*` / `pe-*` (padding)
- `start-*` / `end-*` (positioning)
- `border-s-*` / `border-e-*`
- `text-start` / `text-end`
- `rounded-s-*` / `rounded-e-*`

### Number & Currency Formatting

```typescript
// lib/format.ts
export function formatPrice(
  minorUnits: bigint,
  currency: string,
  locale: 'ar' | 'en'
): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const amount = Number(minorUnits) / Math.pow(10, decimals);

  return new Intl.NumberFormat(
    locale === 'ar' ? 'ar-KW' : 'en-US',
    {
      style: 'currency',
      currency,
      numberingSystem: 'latn',   // ⚠️ critical — Western digits in Arabic UI
      minimumFractionDigits: decimals,
    }
  ).format(amount);
}

// Usage
formatPrice(125500n, 'KWD', 'ar') // → "د.ك 125.500"
formatPrice(125500n, 'KWD', 'en') // → "KWD 125.500"
```

**⚠️ Gotcha:** `numberingSystem: 'latn'` is MANDATORY. Gulf users universally prefer Western digits even in Arabic UI. Default Arabic-Indic (١٢٣٤) = rejected in market testing.

### Date/Time Formatting

```typescript
new Intl.DateTimeFormat('ar-KW', {
  calendar: 'gregory',      // force Gregorian — not Hijri
  numberingSystem: 'latn',
  dateStyle: 'medium',
}).format(new Date())
```

---

## 3. Payment Gateway Strategy

### V1 Decision: **Deferred (no payment in classifieds model)**

### V2 Decision Matrix (Documented Now)

| Criterion | Tap Payments | MyFatoorah |
|---|---|---|
| Kuwait HQ | ✅ | ✅ |
| GCC coverage | KW/SA/UAE/BH/EG | KW/SA/UAE/BH/QA/OM |
| KNET support | ✅ Native | ✅ Native |
| Apple Pay / Google Pay | ✅ | ✅ |
| Developer experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Documentation | Excellent, modern | Good, localized |
| React/Next.js SDK | ✅ | ✅ |
| Webhook reliability | Strong | Decent |
| Pricing | 2.5% + KD 0.10 | 2.5-3% tiered |
| Setup complexity | Low | Medium |
| **V2 Recommendation** | **✅ Primary** | Backup |

### V1 Architectural Commitment

**Do NOT:**
- ❌ Hardcode any currency in payment logic
- ❌ Build wallet/balance UI that assumes single currency
- ❌ Pick gateway based on Kuwait-only features

**Do:**
- ✅ Design "checkout" abstraction layer (future) to support multiple gateways
- ✅ Store `currency_code` on every transaction record (when they exist)
- ✅ Plan for 3DS + KNET requirements from architecture Day 1

---

## 4. Phone Validation

### Library: `libphonenumber-js`

```typescript
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

const GCC_COUNTRIES = ['KW', 'SA', 'AE', 'BH', 'QA', 'OM'] as const;
type GCCCountry = typeof GCC_COUNTRIES[number];

export function validateGCCPhone(
  phone: string,
  country: GCCCountry
): { valid: boolean; formatted: string | null; e164: string | null } {
  const parsed = parsePhoneNumberFromString(phone, country);
  if (!parsed || !parsed.isValid()) {
    return { valid: false, formatted: null, e164: null };
  }
  return {
    valid: true,
    formatted: parsed.formatInternational(),  // "+965 1234 5678"
    e164: parsed.number,                      // "+96512345678"
  };
}
```

### UI Component (V1)

```tsx
// Using react-phone-number-input
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

<PhoneInput
  defaultCountry="KW"
  countries={['KW', 'SA', 'AE', 'BH', 'QA', 'OM']}
  value={phone}
  onChange={setPhone}
  international
  countryCallingCodeEditable={false}
/>
```

**V1 UX:** Dropdown shows only 6 GCC flags. Default = 🇰🇼 +965. Users can switch, but list is locked down.
**V2:** enable all GCC countries as active, expand list if needed.

### Bundle Size Note

- `libphonenumber-js/min` = ~120KB
- Dynamic import only in signup/OTP pages
- Zero impact on homepage/landing

---

## 5. Supabase Configuration

### Region Selection

**Recommendation: `ap-south-1` (Mumbai)**

| Region | Latency to Kuwait | Latency to Riyadh | Latency to Dubai |
|---|---|---|---|
| **ap-south-1 (Mumbai)** | ~60ms ⭐ | ~70ms ⭐ | ~40ms ⭐ |
| eu-west-2 (London) | ~85ms | ~90ms | ~130ms |
| eu-central-1 (Frankfurt) | ~90ms | ~95ms | ~135ms |
| us-east-1 (Virginia) | ~180ms ❌ | ~190ms ❌ | ~200ms ❌ |

Mumbai is the best default for a GCC-focused marketplace.

### Storage CDN

- Supabase Storage uses Cloudflare CDN — automatically fast in GCC
- Image transformation: Use Next.js Image component + Supabase URL transform params
- No additional config needed

---

## 6. SEO & Routing Strategy

### V1: Path-Based
```
dealohub.com/kw/ar/listings/...
dealohub.com/kw/en/listings/...
```

### V2+: Subdomain-Based (optional)
```
kw.dealohub.com/ar/...
sa.dealohub.com/ar/...
ae.dealohub.com/en/...
```

### Middleware (Next.js)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect country from URL or default to KW
  const country = pathname.match(/^\/(kw|sa|ae|bh|qa|om)\//)?.[1] ?? 'kw';

  // Detect locale from URL or Accept-Language
  const locale = pathname.match(/\/(ar|en)\//)?.[1]
    ?? (request.headers.get('accept-language')?.includes('ar') ? 'ar' : 'en');

  // Attach to request context
  const response = NextResponse.next();
  response.headers.set('x-country', country);
  response.headers.set('x-locale', locale);
  return response;
}
```

### Hreflang Tags
```html
<link rel="alternate" hreflang="ar-KW" href="https://dealohub.com/kw/ar/listings/123" />
<link rel="alternate" hreflang="en-KW" href="https://dealohub.com/kw/en/listings/123" />
```

---

## 7. Testing Strategy

### Pre-Launch Testing Matrix

| Test | V1 Required | Phase 2 |
|---|---|---|
| RTL rendering (every screen) | ✅ | ✅ |
| Locale switch mid-session | ✅ | ✅ |
| Arabic text truncation | ✅ | ✅ |
| Phone validation (all 6 GCC codes) | ✅ | ✅ |
| KWD price entry (3 decimals) | ✅ | ✅ |
| SAR/AED display (2 decimals) | ⏭️ V1 skip | ✅ |
| Multi-currency filter | ⏭️ V1 skip | ✅ |
| Cross-country messaging | ⏭️ V1 skip | ✅ |

### Storybook RTL Addon
```bash
pnpm add -D storybook-addon-rtl
```
Every component story has RTL variant. Catch issues at component level.

---

## 8. "Country Activation" Checklist (for Phase 2)

When ready to launch UAE/KSA, this is the checklist:

```markdown
## Activate Country: [KSA/UAE/...]
- [ ] `UPDATE countries SET is_active = true WHERE code = 'XX'`
- [ ] Seed cities for the country (~10-15 cities)
- [ ] Seed areas for top 3 cities (~50 areas each)
- [ ] Enable country code in phone picker
- [ ] Update middleware country whitelist
- [ ] Localize marketing copy for country
- [ ] Update hreflang tags
- [ ] Set up country-specific social accounts
- [ ] Run RTL + locale regression tests
- [ ] Enable country in payment gateway (Phase 3+)
```

**Estimated activation time:** 1-2 weeks per country once architecture is ready.
**Without this architecture:** 4-8 weeks per country + engineering debt.

---

## 9. What We Explicitly DEFER (Multi-Country)

These are NOT in V1, explicitly documented to prevent scope creep:

❌ Multi-currency price display in listings (V1 = KWD only)
❌ Cross-country search ("show UAE listings to KW users")
❌ FX conversion in listings
❌ Regional pricing differences
❌ Country-specific terms of service
❌ Tax handling (VAT in SA/UAE)
❌ Per-country content moderation rules
❌ Per-country feature flags

All of these are **trivial to add later** because the primitives (`country_code`, `currency_code`) are in place.

---

## 10. Final Commitment Summary

### V1 Ships With:
1. ✅ `country_code` + `currency_code` fields everywhere
2. ✅ Hierarchical countries > cities > areas schema
3. ✅ Full i18n (ar/en) with RTL/LTR support
4. ✅ `libphonenumber-js` validating all 6 GCC codes
5. ✅ Locale-aware number/currency formatting (Western digits!)
6. ✅ Supabase in Mumbai region
7. ✅ Next.js middleware aware of country/locale
8. ✅ Only KW active (`is_active=true`) in countries table
9. ✅ Default country = 'KW', default currency = 'KWD', default locale = 'ar'
10. ✅ Documentation (this file) for Phase 2 activation

### V1 Does NOT Ship With:
- ❌ Any payment integration
- ❌ Cross-country browsing
- ❌ FX conversion
- ❌ Multi-country search

### Total V1 Cost of GCC Readiness
**~8-12 hours of additional work across 16-week build.**
**<2% of total V1 effort.**

### Total V2 Savings
**5-8 weeks of engineering retrofit avoided.**

---

## Appendix: GCC Data Seed Files

Will be created in:
- `supabase/seed/countries.sql`
- `supabase/seed/cities-kw.sql` (only KW active)
- `supabase/seed/areas-kw.sql`

Placeholder files for future countries (commented out, ready to activate):
- `supabase/seed/cities-sa.sql` (drafted, inactive)
- `supabase/seed/cities-ae.sql` (drafted, inactive)

---
*Approved: April 18, 2026 · Author: Fawzi Rahem + Claude planning session*
