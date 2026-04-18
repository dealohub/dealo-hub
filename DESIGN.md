# Design System — Dealo Hub v2.0
### C2C Marketplace Design Reference for Engineers

**Version:** 2.0 · **Date:** April 18, 2026 · **Replaces:** v1.0 (archived as `DESIGN.v1-deals.md`)
**Context:** Trust-first premium C2C marketplace — Kuwait launch, GCC-ready architecture
**Stack:** Next.js 14 App Router · Supabase · Shadcn UI · Tailwind CSS · TypeScript

---

## Table of Contents

1. [Vision & Atmosphere](#1-vision--atmosphere)
2. [Vocabulary — C2C Marketplace Lingo](#2-vocabulary)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [RTL-First Principles](#5-rtl-first-principles)
6. [Layout & Grid System](#6-layout--grid-system)
7. [Hero & Landing Sections](#7-hero--landing-sections)
8. [Core Component: ListingCard](#8-core-component-listingcard)
9. [Core Component: ListingDetail](#9-core-component-listingdetail)
10. [Core Component: SellerProfileCard](#10-core-component-sellerprofilecard)
11. [Core Component: CategoryCards](#11-core-component-categorycards)
12. [Search & Filter System](#12-search--filter-system)
13. [Price Mode System (Fixed / Negotiable / Best Offer)](#13-price-mode-system)
14. [Trust Signal Hierarchy](#14-trust-signal-hierarchy)
15. [Delivery Options Pattern](#15-delivery-options-pattern)
15.5. [AI Integration Points](#155-ai-integration-points)
16. [Luxury-Specific Components](#16-luxury-specific-components)
17. [Chat & Messaging UI](#17-chat--messaging-ui)
18. [Forms: Listing Creation Flow](#18-forms-listing-creation-flow)
19. [Empty, Loading & Error States](#19-empty-loading--error-states)
20. [Motion & Interaction](#20-motion--interaction)
21. [Mobile-First Breakpoints](#21-mobile-first-breakpoints)
22. [Anti-Patterns (Banned)](#22-anti-patterns-banned)
23. [Accessibility](#23-accessibility)
24. [Appendix: Component Inventory](#24-appendix-component-inventory)

---

## 1. Vision & Atmosphere

**Dealo Hub** is a premium C2C marketplace for the Gulf — a platform where buyers and sellers transact with the clarity and trust of a well-designed financial tool, not the chaos of a classifieds board.

### Experience Pillars

- **Clarity over density** — 6/10 information density, enough breathing room to feel premium
- **Asymmetric editorial** — 8/10 layout variance, no centered symmetry in high-impact zones
- **Physical motion** — 6/10, spring-based transitions, tactile hover states
- **Data-first** — prices, timestamps, counts use monospace fonts for legibility
- **Trust-first** — every screen surfaces trust signals (verified badges, seller ratings, video tags)

### Atmosphere Descriptor

> A C2C marketplace that respects its users' intelligence. Clinical zinc surfaces with a single warm amber accent that signals action without panic. Feels like a well-engineered Arabic-first Bloomberg Terminal for everyday items — dense, legible, beautiful.

### What Dealo Hub is NOT

- ❌ Not a deals aggregator (no store logos, no discount countdowns, no "Hot Deal" blinking badges)
- ❌ Not an auction platform (no bidding, no ending-soon countdowns on every listing)
- ❌ Not a full e-commerce checkout (no cart, no in-app payments in V1)
- ❌ Not OpenSooq (no phone numbers on cards, no spam banners, no stale stock photos)

---

## 2. Vocabulary

Every surface in the product uses this vocabulary. Deviations are defects.

| ❌ Old (Deals v1) | ✅ New (Marketplace v2) | Usage Context |
|---|---|---|
| Deal | **Listing** / إعلان | Primary unit of the marketplace |
| Store | **Seller** / بائع | User posting listings |
| Shopper | **Buyer** / مشتري | User browsing/messaging |
| Discount | **Price mode** / نوع السعر | Fixed / Negotiable / Best Offer |
| Original price | **Asking price** / السعر المطلوب | The seller's stated price |
| Expiry countdown | **Listing lifecycle** / دورة الإعلان | 30d live + 7d archive |
| Verified deal | **Verified seller** / بائع موثّق | Phone-verified (baseline) |
| Coupon code | N/A | Removed entirely |
| Savings badge | **Price mode badge** | Fixed 🔒 / Negotiable 💬 / Best Offer 🎯 |
| Store rating | **Seller rating** / تقييم البائع | Star rating from completed transactions |
| Live deals counter | **Active listings** / الإعلانات المتوفرة | Homepage trust signal |

### Tone Guidelines (Arabic + English Copy)

- **Never use:** "صفقة", "عرض لفترة محدودة", "خصم", "وفّر %"
- **Prefer:** "إعلان", "للبيع", "متوفر", "قابل للتفاوض"
- **Never use:** "Deal", "Offer expires", "Hot deal", "Save X%"
- **Prefer:** "For sale", "Listed", "Ask/Negotiable/Offer", "Updated X min ago"

---

## 3. Color System

**Inherited from v1 — unchanged.** The palette works equally well for marketplace context.

| Token | Hex | Role |
|---|---|---|
| `canvas-zinc` | `#F4F4F5` | Primary background |
| `pure-surface` | `#FFFFFF` | Card fills, modals |
| `deep-layer` | `#FAFAFA` | Section alternation |
| `charcoal-ink` | `#18181B` | Primary text, never `#000` |
| `muted-steel` | `#71717A` | Secondary text, metadata |
| `ghost-border` | `rgba(228,228,231,0.7)` | Card outlines |
| `whisper-divider` | `#E4E4E7` | Solid section breaks |
| **`warm-amber`** | `#D97706` | **Single accent — CTAs, active states, price mode highlights** |
| `amber-surface` | `rgba(217,119,6,0.08)` | Selected filter backgrounds |
| `amber-glow` | `rgba(217,119,6,0.15)` | Hover on accent elements |
| `success-sage` | `#16A34A` | Verified badges, trust signals |
| `danger-coral` | `#DC2626` | Errors, report actions |
| `caution-flax` | `#CA8A04` | Expiring-soon warnings (3-day expiration notice) |

**Palette rules (unchanged from v1):**
- `warm-amber` is the ONLY saturated color. Saturation ceiling: 75%.
- No purple, no indigo, no neon gradients — banned.
- Three-tier background layering: `canvas-zinc` → `pure-surface` → `deep-layer`.
- All shadows are tinted zinc: `rgba(24,24,27,0.06)`. Never pure black.

### New Color Role: Trust Signal Colors

```typescript
// Trust signal hierarchy — encoded as CSS classes
.trust-verified-phone  { color: var(--success-sage); }     // baseline trust
.trust-verified-id     { color: var(--success-sage); }     // V2 enhanced
.trust-founding        { color: var(--warm-amber); }       // founding partner badge
.trust-luxury-auth     { color: var(--charcoal-ink); }     // authenticity statement
.trust-video-included  { color: var(--success-sage); }     // video upload present
```

---

## 4. Typography

**Inherited from v1 with one addition.** Font stack remains `Satoshi` + `JetBrains Mono`.

### Scale (unchanged)

```
Display XL:  clamp(3rem, 6vw, 5.5rem)      / weight 800 / tracking -0.03em
Display:     clamp(2rem, 4vw, 3.5rem)      / weight 700 / tracking -0.025em
Heading 1:   clamp(1.5rem, 3vw, 2.25rem)   / weight 700 / tracking -0.02em
Heading 2:   clamp(1.25rem, 2.5vw, 1.75rem)/ weight 600 / tracking -0.015em
Heading 3:   1.125rem                      / weight 600 / tracking -0.01em
Body Large:  1.0625rem                     / weight 400 / leading 1.65
Body:        1rem (16px)                   / weight 400 / leading 1.6
Body Small:  0.875rem                      / weight 400 / leading 1.55
Caption:     0.75rem                       / weight 500 / leading 1.4
Label:       0.6875rem                     / weight 500 / uppercase / tracking 0.08em
Mono Data:   JetBrains Mono 0.875rem       / weight 500 / tabular-nums
```

### Arabic Typography

**Critical:** Arabic uses `Satoshi` as a shared Latin/Arabic-compatible fallback pattern, but for production Arabic we specify `IBM Plex Sans Arabic` (free, open-source, pairs well with Satoshi).

```css
/* globals.css */
html[lang="ar"] {
  font-family: 'IBM Plex Sans Arabic', 'Satoshi', system-ui, sans-serif;
}

html[lang="en"] {
  font-family: 'Satoshi', system-ui, sans-serif;
}

/* Prices, data, counters — always monospace, always Western digits */
.font-mono-data {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
```

### Rules

- **Banned fonts:** `Inter`, `Roboto`, `Helvetica Neue`, any serif (`Times`, `Georgia`)
- **Gradient text:** Banned on headings larger than Heading 2
- **All prices and numbers:** Always `JetBrains Mono` + `tabular-nums` + `numberingSystem: 'latn'`
- **Maximum 2 font weights visible on any single screen**
- **Arabic digits (١٢٣٤):** NEVER. Gulf users prefer Western digits universally.

---

## 5. RTL-First Principles

**Dealo Hub defaults to Arabic (RTL).** The entire design system is built RTL-first, LTR-compatible.

### Cardinal Rules

1. **Never use directional Tailwind classes** (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`)
2. **Always use logical properties** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`)
3. **Icons that imply direction must flip** in RTL (arrows, carets, chevrons)
4. **Layouts using `flex-row` automatically reverse** in RTL — no action needed
5. **Test every component in both directions** before merging

### Logical Property Cheatsheet

```tsx
// ❌ WRONG — breaks in RTL
<div className="ml-4 border-l-2 text-right rounded-tl-lg">

// ✅ CORRECT — auto-flips
<div className="ms-4 border-s-2 text-end rounded-s-lg">
```

| Physical (DO NOT USE) | Logical (USE) |
|---|---|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `border-l-*` / `border-r-*` | `border-s-*` / `border-e-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |
| `rounded-tl-*` / `rounded-tr-*` | `rounded-ss-*` / `rounded-se-*` |

### Root Layout Setup

```tsx
// app/[locale]/layout.tsx
export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: 'ar' | 'en' };
}) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={cn(
        'bg-canvas-zinc text-charcoal-ink antialiased',
        locale === 'ar' ? 'font-arabic' : 'font-satoshi'
      )}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Directional Icon Strategy

```tsx
// Icons that must flip based on direction
import { ChevronEnd } from '@/components/ui/icons'; // custom component

// Use start/end semantic icons — they flip automatically
<ChevronEnd />  // → in LTR, ← in RTL

// For icons from lucide-react that are inherently directional
<ChevronRight className="rtl:rotate-180" />  // manually flip in RTL
```

**Exception list — icons that DO NOT flip in RTL:**
- Clock icons (always same orientation)
- Search (magnifier always same)
- User/avatar silhouettes
- Brand logos
- Numbers/checkmarks
- Play/pause media controls

---

## 6. Layout & Grid System

### Container Widths

```
Max container:   1400px, centered, px-6 (mobile) → px-8 (tablet) → px-12 (desktop)
Content area:    1200px for listing grids, 960px for single-listing pages
Sidebar layout:  72% content / 28% sidebar (NO 50/50 splits)
```

### Listing Grid (Core Layout)

```
┌──────────┬──────────┬──────────┬──────────┐
│ Listing  │ Listing  │ Listing  │ Listing  │   Desktop: 4 cols
├──────────┼──────────┼──────────┼──────────┤   gap: 1.25rem
│ Listing  │ Listing  │ Listing  │ Listing  │
└──────────┴──────────┴──────────┴──────────┘

┌──────────────┬──────────────┐
│   Listing    │   Listing    │               Tablet: 2 cols
├──────────────┼──────────────┤               gap: 1rem
│   Listing    │   Listing    │
└──────────────┴──────────────┘

┌────────────────────────────┐
│         Listing             │                Mobile: 1 col
├────────────────────────────┤               gap: 0.75rem
│         Listing             │
└────────────────────────────┘
```

```tsx
// components/listings/ListingGrid.tsx
<div className="
  grid gap-3
  sm:grid-cols-2 sm:gap-4
  lg:grid-cols-3 lg:gap-5
  xl:grid-cols-4
">
  {listings.map(listing => <ListingCard key={listing.id} {...listing} />)}
</div>
```

### Banned Layouts

- ❌ 3 equal-width columns — use 4 + asymmetric featured
- ❌ Centered hero sections — use Left-Aligned Asymmetric Split
- ❌ 50/50 content splits — use 72/28 or 60/40
- ❌ Full-bleed background image heroes
- ❌ Overlapping elements outside the ListingCard media zone

### Spacing Philosophy

```
Base unit:              4px (0.25rem)
Section vertical gap:   clamp(4rem, 8vw, 7rem)
Card internal padding:  1rem (16px)
Grid gap:               1.25rem (20px) desktop, 0.75rem mobile
Inline element gap:     0.75rem (12px)
Icon-to-label gap:      0.375rem (6px)
```

---

## 7. Hero & Landing Sections

### Homepage Hero — Marketplace Variant

**Structure:** Left-Aligned Asymmetric Split (unchanged from v1)
- Left column (55%): Headline + search bar + trust signals
- Right column (45%): 3 featured listing cards stacked asymmetrically (fanned deck)

**ASCII Mockup:**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  2,400 إعلان نشط.                        ┌──────────────┐       │
│  محادثة واحدة تكفي.                      │  [Listing 1]  │       │
│                                            └──────────────┘      │
│  [🔍 ابحث عن...]  [الفئة ▾]               ┌──────────────┐      │
│                                            │  [Listing 2]  │      │
│  🔒 محادثة آمنة                             └──────────────┘       │
│  ✓ بائعون موثّقون                             ┌──────────────┐     │
│  🎥 فيديو لكل منتج فاخر                    │  [Listing 3]  │     │
│                                            └──────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Headline Formula (Updated)

**Old (v1):** "Find the best [Amazon logo pill] deals before anyone else"
**New (v2):** "2,400 إعلان نشط. محادثة واحدة تكفي." / "2,400 active listings. One chat away."

- Weight 800, `clamp(2.75rem, 5vw, 4.5rem)`, `charcoal-ink`, tracking `-0.03em`
- Lead with specificity: listing count, category breadth, trust signal
- **Banned clichés:** "Unleash", "Seamless", "Next-Gen", "Elevate", "Transform", "حصرياً", "لفترة محدودة"

### Inline Typography Technique (Adapted)

Instead of store logo pills (deals context), use **category pills** within headline:

```tsx
<h1 className="text-[clamp(2.75rem,5vw,4.5rem)] font-extrabold tracking-[-0.03em]">
  اشتري <CategoryPill icon="Smartphone">إلكترونيات</CategoryPill>{' '}
  و <CategoryPill icon="Shirt">أزياء فاخرة</CategoryPill>{' '}
  بثقة.
</h1>
```

```tsx
// CategoryPill component spec
<span className="
  inline-flex items-center gap-1.5
  px-2 py-0.5 mx-1
  bg-pure-surface border border-ghost-border
  rounded-md text-[0.9em]
  align-middle
">
  <Icon className="size-4 text-muted-steel" />
  {label}
</span>
```

### Hero CTA Rules

- **Single primary CTA only:** "تصفح الإعلانات" or "بيع شيئك الآن"
- No secondary "Learn more" links
- No scroll arrows, bouncing chevrons, or "Scroll to explore" text — banned
- On mobile: CTA appears BEFORE the listing stack (stacked vertically)

---

## 8. Core Component: ListingCard

**The fundamental repeating unit of the marketplace.** Every design decision flows from this component.

### Anatomy

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │  ← Media zone (aspect-[4/3])
│  │                               │  │     - Swipeable on mobile
│  │     [Primary Image]           │  │     - Lazy loaded
│  │                               │  │
│  │                               │  │
│  │   🎥 فيديو           1 / 10  │  │  ← Video badge (luxury) + count
│  └───────────────────────────────┘  │
│                                     │
│  iPhone 14 Pro Max 256GB             │  ← Title (line-clamp-2, Heading 3)
│                                     │
│  السالمية · قبل ساعتين               │  ← Meta (Body Small, muted)
│                                     │
│  ┌─────────────────────────────┐    │
│  │ KWD 145.000  💬 قابل للتفاوض │    │  ← Price + mode badge
│  └─────────────────────────────┘    │
│                                     │
│  ────────────────────────────────   │  ← Whisper divider
│                                     │
│  [👤] Ahmad K.  ✓ موثّق    ♡ 23     │  ← Seller avatar + trust + saves
└─────────────────────────────────────┘
```

### Implementation

```tsx
// components/listings/ListingCard.tsx
interface ListingCardProps {
  id: string;
  title: string;
  priceMode: 'fixed' | 'negotiable' | 'best_offer';
  priceMinorUnits: bigint;
  currencyCode: 'KWD' | 'SAR' | 'AED' | 'BHD' | 'QAR' | 'OMR';
  minOfferMinorUnits?: bigint;
  images: { url: string; width: number; height: number }[];
  hasVideo: boolean;          // true for luxury listings
  area: string;
  timeAgo: string;
  seller: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isPhoneVerified: boolean;
    rating?: number;
  };
  savedCount: number;
  isSaved: boolean;
  locale: 'ar' | 'en';
}

export function ListingCard(props: ListingCardProps) {
  return (
    <article className="
      group relative flex flex-col
      bg-pure-surface border border-ghost-border
      rounded-2xl overflow-hidden
      shadow-[0_1px_3px_rgba(24,24,27,0.05),0_4px_12px_rgba(24,24,27,0.04)]
      transition-all duration-200
      hover:shadow-[0_4px_16px_rgba(24,24,27,0.08)]
      hover:-translate-y-0.5
      hover:border-zinc-300
    ">
      {/* Media zone */}
      <div className="relative aspect-[4/3] bg-deep-layer">
        <Image
          src={props.images[0].url}
          alt={props.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
          loading="lazy"
        />

        {/* Video badge — top start corner */}
        {props.hasVideo && (
          <span className="
            absolute top-3 start-3
            inline-flex items-center gap-1.5
            px-2 py-1 rounded-md
            bg-charcoal-ink/90 text-white
            text-label backdrop-blur-sm
          ">
            <PlayIcon className="size-3" />
            فيديو
          </span>
        )}

        {/* Image count — bottom end corner */}
        <span className="
          absolute bottom-3 end-3
          font-mono-data text-caption text-white
          bg-charcoal-ink/80 rounded-md
          px-2 py-0.5
        ">
          1 / {props.images.length}
        </span>
      </div>

      {/* Content zone */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="
          font-semibold text-heading-3 text-charcoal-ink
          line-clamp-2 leading-snug
        ">
          {props.title}
        </h3>

        <p className="text-body-small text-muted-steel">
          {props.area} · {props.timeAgo}
        </p>

        <PriceBlock
          mode={props.priceMode}
          minorUnits={props.priceMinorUnits}
          currency={props.currencyCode}
          minOfferMinorUnits={props.minOfferMinorUnits}
          locale={props.locale}
        />
      </div>

      {/* Seller strip */}
      <div className="
        flex items-center justify-between gap-2
        px-4 py-3 border-t border-whisper-divider
      ">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={props.seller.avatarUrl}
            name={props.seller.displayName}
            size="sm"
          />
          <span className="text-body-small text-charcoal-ink truncate">
            {props.seller.displayName}
          </span>
          {props.seller.isPhoneVerified && (
            <CheckBadge className="size-3.5 text-success-sage shrink-0" />
          )}
        </div>

        <SaveButton
          isSaved={props.isSaved}
          count={props.savedCount}
          listingId={props.id}
        />
      </div>
    </article>
  );
}
```

### Card States

| State | Visual Treatment |
|---|---|
| **Default** | Shadow 1, border `ghost-border` |
| **Hover** | Shadow 2, translate-y -2px, border `zinc-300` |
| **Focus-visible** | 2px amber focus ring, 2px offset |
| **Saved** | Heart icon filled amber, count updated |
| **Expired (archive)** | Opacity 0.6, grayscale filter, "منتهي" badge overlay |
| **Sold** | Opacity 0.7, "مُباع" badge overlay top-start |
| **Loading** | Skeleton with 3 rects matching anatomy |

### Variants

- `ListingCard` — default (grid view)
- `ListingCardCompact` — for "My Listings" management (no seller strip, edit/delete actions)
- `ListingCardList` — horizontal layout for list view (image start, content middle, actions end)
- `ListingCardFeatured` — larger variant for homepage hero (asymmetric grid)

---

## 9. Core Component: ListingDetail

The single-listing page — where buyers decide to contact sellers. **Conversion surface.**

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Nav (sticky, 64px)                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ← رجوع       [breadcrumb: إلكترونيات > موبايلات]             │
│                                                                │
│  ┌──────────────────────────────┐ ┌──────────────────────────┐│
│  │                              │ │ iPhone 14 Pro Max 256GB   ││
│  │     [Main Image Gallery]     │ │ السالمية · قبل ساعتين     ││
│  │     aspect-[4/3]             │ │                           ││
│  │     [◀] [▶] nav arrows       │ │ ┌───────────────────────┐ ││
│  │                              │ │ │ KWD 145.000            │ ││
│  │                              │ │ │ 💬 قابل للتفاوض        │ ││
│  │                              │ │ └───────────────────────┘ ││
│  │                              │ │                           ││
│  │ [●●●○○○○○○○] (dots)           │ │ [  تواصل مع البائع  ]    ││ ← Primary CTA
│  │                              │ │ [ ♡ احفظ  ] [ 🚩 إبلاغ ]  ││
│  └──────────────────────────────┘ │                           ││
│                                   │ ┌───────────────────────┐ ││
│  ┌─────────────────────────────┐  │ │ SellerProfileCard      │ ││
│  │ [thumb] [thumb] [thumb] ... │  │ │ Ahmad K.               │ ││
│  └─────────────────────────────┘  │ │ ✓ موثّق · ⭐ 4.8 (23) │ ││
│                                   │ │ عضو منذ مارس 2026      │ ││
│  ═══════════════════════════════  │ │ 12 إعلان نشط           │ ││
│                                   │ └───────────────────────┘ ││
│  الوصف                            │                           ││
│  Lorem ipsum... (full desc)       │ ┌───────────────────────┐ ││
│                                   │ │ 📍 الموقع              │ ││
│  التفاصيل                         │ │ السالمية، الكويت       │ ││
│  - الحالة: ممتاز                  │ │ [Static area indicator] │ ││
│  - الضمان: نعم                    │ └───────────────────────┘ ││
│  - اللون: Black                   │                           ││
│                                   │ ┌───────────────────────┐ ││
│  خيارات التسليم                   │ │ 🛡️ نصائح الأمان       │ ││
│  ✓ استلام من الموقع               │ │ • التقِ في مكان عام     │ ││
│  ✓ البائع يوصّل (للتفاوض)         │ │ • تحقق قبل الدفع        │ ││
│                                   │ │ • لا ترسل مبالغ مسبقاً  │ ││
│  إعلانات مشابهة                   │ └───────────────────────┘ ││
│  [ListingCard x4]                 │                           ││
└────────────────────────────────────────────────────────────────┘
```

### Layout Split

- **Desktop/Tablet:** 60/40 split — gallery start (60%), details end (40%)
- **Mobile:** Stacked vertically, gallery first, details below, CTA sticky-bottom

### Sticky CTA (Mobile)

On mobile, a sticky bottom bar appears when user scrolls past the primary CTA:

```tsx
// Mobile only, sticky bottom
<div className="
  lg:hidden fixed bottom-0 inset-x-0 z-40
  flex items-center gap-3 p-4
  bg-pure-surface/95 backdrop-blur-md
  border-t border-whisper-divider
  shadow-[0_-4px_12px_rgba(24,24,27,0.06)]
">
  <PriceBlock compact {...} />
  <Button variant="primary" size="lg" className="flex-1">
    {priceMode === 'best_offer' ? 'قدّم عرضاً' : 'تواصل مع البائع'}
  </Button>
</div>
```

### Image Gallery

```tsx
// Primary gallery + thumbnail strip + full-screen modal
<ListingGallery
  images={listing.images}
  video={listing.video}        // optional, first position if present
  category={listing.category}
  showThumbnails={true}
  enableFullscreen={true}
/>
```

**Behavior:**
- Click main image → fullscreen modal with swipeable carousel
- For luxury listings with video: video is position 1, plays inline on tap
- Thumbnail strip: horizontally scrollable, 80px height, 4:3 aspect
- Arrow keys navigate in fullscreen (LTR: → next, RTL: ← next)

---

## 10. Core Component: SellerProfileCard

Displayed inline on ListingDetail + as standalone on `/sellers/[id]` page.

### Anatomy

```
┌──────────────────────────────────────────┐
│  ┌─────┐                                  │
│  │     │  Ahmad Al-Kuwait                 │
│  │ IMG │  @ahmad_k                         │
│  │     │                                   │
│  └─────┘  ✓ هاتف موثّق                    │
│           ⭐ 4.8  (23 تقييم)               │
│           عضو منذ مارس 2026                │
│                                            │
│  ──────────────────────────────────────    │
│  12 إعلان نشط · 47 إعلان مُباع             │
│                                            │
│  [عرض جميع إعلانات البائع →]               │
└──────────────────────────────────────────┘
```

### Implementation

```tsx
// components/sellers/SellerProfileCard.tsx
interface SellerProfileCardProps {
  seller: {
    id: string;
    displayName: string;
    handle?: string;
    avatarUrl?: string;
    memberSince: Date;
    isPhoneVerified: boolean;
    isIdVerified: boolean;       // V2
    isFoundingPartner: boolean;  // V2
    rating: number;              // 0-5
    ratingCount: number;
    activeListingsCount: number;
    soldListingsCount: number;
  };
  variant?: 'inline' | 'standalone';
}

export function SellerProfileCard({ seller, variant = 'inline' }: SellerProfileCardProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 p-5 rounded-2xl",
      "bg-pure-surface border border-ghost-border",
      variant === 'standalone' && "p-8"
    )}>
      <div className="flex items-start gap-4">
        <Avatar
          src={seller.avatarUrl}
          name={seller.displayName}
          size={variant === 'standalone' ? 'xl' : 'lg'}
        />

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3 className="font-semibold text-heading-3 text-charcoal-ink truncate">
            {seller.displayName}
          </h3>
          {seller.handle && (
            <p className="text-body-small text-muted-steel">
              @{seller.handle}
            </p>
          )}

          <TrustSignalStack seller={seller} />
        </div>
      </div>

      <Divider className="bg-whisper-divider" />

      <div className="flex items-center gap-4 font-mono-data text-body-small">
        <span>
          <strong className="text-charcoal-ink">{seller.activeListingsCount}</strong>
          <span className="text-muted-steel"> إعلان نشط</span>
        </span>
        <span className="text-whisper-divider">·</span>
        <span>
          <strong className="text-charcoal-ink">{seller.soldListingsCount}</strong>
          <span className="text-muted-steel"> مُباع</span>
        </span>
      </div>

      {variant === 'inline' && (
        <Link
          href={`/sellers/${seller.id}`}
          className="
            inline-flex items-center gap-1
            text-body-small font-medium text-warm-amber
            hover:text-amber-700
          "
        >
          عرض جميع إعلانات البائع
          <ChevronEnd className="size-4" />
        </Link>
      )}
    </div>
  );
}
```

### TrustSignalStack Sub-Component

Renders available trust signals in priority order (see Section 14).

---

## 11. Core Component: CategoryCards

Homepage category navigation — 10 cards arranged in asymmetric grid.

### Layout: 4 + 4 + 2 Asymmetric Grid

```
┌──────────┬──────────┬──────────┬──────────┐
│ 📱 Elec. │ 🛋️ Furn. │ 👜 Luxury│ 👶 Kids  │  ← P0 (larger)
├──────────┼──────────┼──────────┼──────────┤
│ 🎮 Games │ ⛺ Sport │ 🏋️ Fit.  │ 🍳 Home  │  ← P1 (medium)
├──────────┴──────────┼──────────┴──────────┤
│  💄 Beauty           │  📦 General          │  ← P2 (wide)
└──────────────────────┴──────────────────────┘
```

### CategoryCard Spec

```tsx
interface CategoryCardProps {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: LucideIcon;
  tier: 'p0' | 'p1' | 'p2';
  activeCount: number;
  locale: 'ar' | 'en';
}

<Link
  href={`/${locale}/categories/${slug}`}
  className={cn(
    "group relative flex flex-col justify-end",
    "p-5 rounded-2xl overflow-hidden",
    "bg-pure-surface border border-ghost-border",
    "transition-all duration-200",
    "hover:shadow-[0_8px_24px_rgba(24,24,27,0.08)]",
    "hover:-translate-y-1 hover:border-warm-amber/40",
    // Tier-based sizing
    tier === 'p0' && "aspect-[4/5] min-h-[200px]",
    tier === 'p1' && "aspect-square",
    tier === 'p2' && "aspect-[2/1] col-span-2"
  )}
>
  {/* Background icon — large, positioned to start */}
  <Icon className="
    absolute top-4 start-4
    size-16 text-amber-surface
    group-hover:text-amber-glow
    transition-colors
  " />

  {/* Content at card end */}
  <div className="relative flex flex-col gap-1">
    <h3 className="font-semibold text-heading-2 text-charcoal-ink">
      {locale === 'ar' ? nameAr : nameEn}
    </h3>
    <p className="text-body-small text-muted-steel font-mono-data">
      {activeCount.toLocaleString(locale, { numberingSystem: 'latn' })} إعلان
    </p>
  </div>
</Link>
```

### 10 Final Categories (Matching Planning Decisions)

```typescript
// lib/categories.ts
export const CATEGORIES = [
  // P0 — Heavy seeding
  { slug: 'electronics',    nameAr: 'إلكترونيات',        nameEn: 'Electronics',       icon: 'Smartphone',     tier: 'p0' },
  { slug: 'furniture',      nameAr: 'أثاث',              nameEn: 'Furniture',         icon: 'Sofa',           tier: 'p0' },
  { slug: 'luxury',         nameAr: 'حقائب وساعات فاخرة', nameEn: 'Luxury Bags & Watches', icon: 'Gem',        tier: 'p0' },
  { slug: 'baby-kids',      nameAr: 'مستلزمات الأطفال',   nameEn: 'Baby & Kids',       icon: 'Baby',           tier: 'p0' },

  // P1 — Medium seeding
  { slug: 'games-hobbies',  nameAr: 'ألعاب وهوايات',      nameEn: 'Games & Hobbies',   icon: 'Gamepad2',       tier: 'p1' },
  { slug: 'sports-outdoor', nameAr: 'رياضة وخارجي',       nameEn: 'Sports & Outdoor',  icon: 'Mountain',       tier: 'p1' },
  { slug: 'home-fitness',   nameAr: 'أجهزة رياضية منزلية', nameEn: 'Home Fitness',     icon: 'Dumbbell',       tier: 'p1' },
  { slug: 'home-appliances',nameAr: 'أدوات منزلية',       nameEn: 'Home Appliances',   icon: 'Utensils',       tier: 'p1' },

  // P2 — Light seeding
  { slug: 'beauty',         nameAr: 'جمال وعناية',        nameEn: 'Beauty & Care',     icon: 'Sparkles',       tier: 'p2' },
  { slug: 'general',        nameAr: 'متفرقات',            nameEn: 'General',           icon: 'Package',        tier: 'p2' },
] as const;
```

---

## 12. Search & Filter System

### Search Input (Semantic-Enabled from V1)

**V1 ships with semantic search** (pgvector + OpenAI embeddings). See `design/AI-FEATURES.md` Feature 2 for full spec.

Component: `SemanticSearchInput` (defined in Section 15.5).

```tsx
<div className="
  relative w-full max-w-2xl
  flex items-center
  h-12 px-4
  bg-pure-surface border-[1.5px] border-ghost-border rounded-xl
  focus-within:border-warm-amber
  focus-within:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]
  transition-all duration-150
">
  <SearchIcon className="
    size-5 me-3
    text-muted-steel
    shrink-0
  " />

  <input
    type="search"
    placeholder="ابحث عن منتج، ماركة، أو صف ما تبحث عنه..."
    className="
      flex-1 bg-transparent outline-none
      text-body text-charcoal-ink
      placeholder:text-muted-steel
    "
  />

  {/* AI indicator — subtle, top-end */}
  <SparklesIcon className="
    size-4 text-warm-amber opacity-70 me-1
  " title="بحث ذكي مفعّل" />
</div>
```

### Search Results Header

```tsx
<div className="flex items-center gap-2 mb-4">
  <h2 className="text-heading-2">نتائج البحث ({count})</h2>
  {isSemanticUsed && (
    <span className="
      inline-flex items-center gap-1 px-2 py-1
      bg-warm-amber/10 text-warm-amber rounded-md text-label
    ">
      <SparklesIcon className="size-3" />
      نتائج ذكية
    </span>
  )}
</div>
```

### Filter Bar

Horizontal scrollable on mobile, fixed on desktop. Above listing grid.

```
┌──────────────────────────────────────────────────────────────┐
│  [الكل] [إلكترونيات] [أثاث] [فاخرة] [أطفال] [...] → scroll   │
├──────────────────────────────────────────────────────────────┤
│  💰 السعر ▾  📍 المنطقة ▾  🏷️ السعر ▾  🛡️ موثّق  🎥 فيديو  │
│                                                       [مسح] │
└──────────────────────────────────────────────────────────────┘
```

### Filter Chip

```tsx
// Active state
<button className="
  inline-flex items-center gap-1.5
  px-3.5 py-1.5 rounded-full
  bg-warm-amber text-white
  text-body-small font-medium
  transition-colors
  hover:bg-amber-700
">
  قابل للتفاوض
  <XIcon className="size-3.5" />
</button>

// Inactive state
<button className="
  inline-flex items-center gap-1.5
  px-3.5 py-1.5 rounded-full
  bg-zinc-100 text-zinc-700
  text-body-small
  hover:bg-zinc-200
">
  قابل للتفاوض
</button>
```

### Filter Panel (Desktop Sidebar, Mobile Bottom Sheet)

```
┌──────────────────┐
│ الفئة            │
│ ☐ إلكترونيات     │
│ ☐ أثاث           │
│ ☐ أزياء فاخرة    │
│ ...              │
├──────────────────┤
│ السعر            │
│ [KWD 0] — [KWD ∞]│
│ [slider]         │
├──────────────────┤
│ المنطقة          │
│ ▼ اختر منطقة     │
├──────────────────┤
│ نوع السعر        │
│ ☐ ثابت          │
│ ☐ قابل للتفاوض   │
│ ☐ يقبل العروض    │
├──────────────────┤
│ خيارات التسليم   │
│ ☐ استلام        │
│ ☐ توصيل         │
│ ☐ شحن           │
├──────────────────┤
│ الثقة            │
│ ☐ بائع موثّق     │
│ ☐ فيديو متوفر    │
│ ☐ وثائق متوفرة   │
└──────────────────┘
[تطبيق الفلاتر]
[إلغاء الفلاتر]
```

---

## 13. Price Mode System

**Three visual treatments for three price modes — locked in V1.**

### 1. Fixed Price Mode (🔒)

**Visual:**
```
┌──────────────────────────┐
│ KWD 145.000              │
│ 🔒 السعر ثابت            │
└──────────────────────────┘
```

**Tailwind:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-mono-data text-heading-3 font-bold text-charcoal-ink">
    {formatPrice(price, currency, locale)}
  </span>
  <span className="
    inline-flex items-center gap-1
    px-2 py-0.5 rounded-md
    bg-zinc-100 text-zinc-700
    text-label
  ">
    <LockIcon className="size-3" />
    ثابت
  </span>
</div>
```

### 2. Negotiable Price Mode (💬)

**Visual:**
```
┌──────────────────────────────┐
│ KWD 145.000                   │
│ 💬 قابل للتفاوض                │
└──────────────────────────────┘
```

**Tailwind:**
```tsx
<div className="flex items-center gap-2">
  <span className="font-mono-data text-heading-3 font-bold text-charcoal-ink">
    {formatPrice(price, currency, locale)}
  </span>
  <span className="
    inline-flex items-center gap-1
    px-2 py-0.5 rounded-md
    bg-amber-surface text-amber-700
    text-label
  ">
    <ChatIcon className="size-3" />
    قابل للتفاوض
  </span>
</div>
```

### 3. Best Offer Price Mode (🎯)

**Visual:**
```
┌───────────────────────────────────┐
│ أرحّب بالعروض                       │
│ 🎯 من KWD 30.000                   │  ← if min_offer_minor_units set
└───────────────────────────────────┘
```

**Tailwind:**
```tsx
<div className="flex flex-col gap-1">
  <span className="font-semibold text-heading-3 text-charcoal-ink">
    أرحب بالعروض
  </span>
  <span className="
    inline-flex items-center gap-1.5 self-start
    px-2 py-0.5 rounded-md
    bg-warm-amber/10 text-warm-amber
    text-label font-mono-data
  ">
    <TargetIcon className="size-3" />
    {minOffer && `من ${formatPrice(minOffer, currency, locale)}`}
  </span>
</div>
```

### CTA by Price Mode

```tsx
// components/listings/ListingCTA.tsx
export function ListingCTA({ listing }: { listing: Listing }) {
  const ctaLabel = listing.priceMode === 'best_offer'
    ? 'قدّم عرضاً'
    : 'تواصل مع البائع';

  const ctaIcon = listing.priceMode === 'best_offer'
    ? TargetIcon
    : MessageCircleIcon;

  return (
    <Button
      variant="primary"
      size="lg"
      icon={ctaIcon}
      onClick={() => openChat(listing, { preFillOffer: listing.priceMode === 'best_offer' })}
    >
      {ctaLabel}
    </Button>
  );
}
```

### Chat Pre-Fill Template (Best Offer)

When buyer clicks "قدّم عرضاً", chat opens with pre-filled message:

```
مرحباً، أعرض ______ KWD للـ iPhone 14 Pro Max 256GB
```

Cursor placed in blank. Buyer edits amount, sends.
Message in DB has `sent_as_offer: true` for analytics.

---

## 14. Trust Signal Hierarchy

**Every trust signal surface must display signals in this priority order.** Signals are stacked vertically or inline depending on space.

### Priority Stack (Top = Highest Authority) — Updated April 18 with AI Signals

```
1. 🏆 Founding Partner          ← Dealo Hub curated, permanent badge
2. ✓ ID Verified (V2)            ← KYC'd seller
3. ✓ Phone Verified              ← Baseline trust (V1 minimum)
3.5. 🛡️ AI Safety Checked        ← NEW: Auto by fraud pipeline (V1)
4. ⭐ Seller Rating ≥ 4.5         ← Earned from transactions
5. 🎥 Video Included             ← This listing has video
6. 📜 Documentation Included     ← Receipt/invoice uploaded
7. 🏷️ Authenticity Statement     ← Seller checked the box (luxury)
7.5. ✍️ Human-Written              ← NEW: AI not used in description (V1)
8. 📅 Member Since > 6 months    ← Tenure signal
```

### New Signals Detail

**Signal 3.5: AI Safety Checked**
- Auto-added when fraud pipeline completes successfully (fraud_score < 30)
- Icon: Shield with checkmark
- Color: `text-success-sage` with `bg-success-sage/10`
- Label (AR): "محمي بالذكاء الاصطناعي"
- Label (EN): "AI Safety Checked"
- Component use: `<AISafetyBadge />` (see Section 15.5)

**Signal 7.5: Human-Written**
- Added when `ai_any_accepted = false` on listing
- Icon: Pen / writing icon
- Color: `text-charcoal-ink` with `bg-charcoal-ink/5`
- Label (AR): "مكتوب بيد البائع"
- Label (EN): "Human-Written"
- Component use: `<HumanWrittenBadge />` (see Section 15.5)
- **Strategic importance:** This is the anti-Dubizzle positioning signal — preserves brand as V3 AI description gets gated (Decision 9)

### Visual Hierarchy

```tsx
// components/trust/TrustSignalStack.tsx
interface TrustSignals {
  isFoundingPartner?: boolean;
  isIdVerified?: boolean;
  isPhoneVerified: boolean;
  rating?: number;
  ratingCount?: number;
  hasVideo?: boolean;
  hasDocumentation?: boolean;
  hasAuthenticityStatement?: boolean;
  memberSinceDays: number;
}

export function TrustSignalStack({ signals, compact = false }: Props) {
  const items = [
    signals.isFoundingPartner && {
      icon: TrophyIcon,
      label: 'شريك مؤسس',
      className: 'text-warm-amber bg-warm-amber/10',
    },
    signals.isIdVerified && {
      icon: ShieldCheckIcon,
      label: 'هوية موثّقة',
      className: 'text-success-sage bg-success-sage/10',
    },
    signals.isPhoneVerified && {
      icon: PhoneCheckIcon,
      label: 'هاتف موثّق',
      className: 'text-success-sage bg-success-sage/10',
    },
    signals.rating && signals.rating >= 4.5 && {
      icon: StarIcon,
      label: `${signals.rating.toFixed(1)} (${signals.ratingCount})`,
      className: 'text-caution-flax bg-caution-flax/10',
    },
    signals.hasVideo && {
      icon: VideoIcon,
      label: 'فيديو متوفر',
      className: 'text-charcoal-ink bg-zinc-100',
    },
    // ... etc
  ].filter(Boolean);

  return (
    <div className={cn(
      "flex flex-wrap gap-1.5",
      compact && "gap-1"
    )}>
      {items.map((item, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-flex items-center gap-1",
            "px-2 py-0.5 rounded-md",
            "text-label font-medium",
            item.className
          )}
        >
          <item.icon className="size-3" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
```

### Rules

- **Maximum 3 badges visible on ListingCard** (space constraint) — show top 3 by priority
- **SellerProfileCard shows up to 5 badges**
- **Never invent badges that aren't earned** (no placeholder "Power Seller" badges in V1)
- **Founding Partner > All other signals** (always displayed first if present)

---

## 15. Delivery Options Pattern

**Multi-select field — determines how buyer receives the item.**

### Listing Form UI (Seller Creating Listing)

```
خيارات التسليم (اختر واحد أو أكثر):
☑ استلام من موقع البائع
☐ البائع يقدر يوصّل (للتفاوض)
☐ المشتري يرتّب الشحن
```

### Listing Detail Display

```tsx
// components/listings/DeliveryOptions.tsx
interface DeliveryOptionsProps {
  options: Array<'pickup' | 'seller_delivers' | 'buyer_ships'>;
}

const OPTION_CONFIG = {
  pickup: {
    icon: MapPinIcon,
    label: 'استلام من الموقع',
    description: 'تلتقي بالبائع وتستلم المنتج',
  },
  seller_delivers: {
    icon: TruckIcon,
    label: 'البائع يقدر يوصّل',
    description: 'قابل للتفاوض حسب الموقع',
  },
  buyer_ships: {
    icon: PackageIcon,
    label: 'المشتري يرتّب الشحن',
    description: 'ترتّب الشحن عبر شركة شحن',
  },
};

export function DeliveryOptions({ options }: DeliveryOptionsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-semibold text-heading-3">خيارات التسليم</h3>

      <ul className="flex flex-col gap-2">
        {options.map(opt => {
          const config = OPTION_CONFIG[opt];
          return (
            <li key={opt} className="flex items-start gap-3">
              <config.icon className="size-5 text-success-sage shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-body text-charcoal-ink">
                  {config.label}
                </span>
                <span className="text-body-small text-muted-steel">
                  {config.description}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

### ListingCard Badge (Compact Version)

On ListingCard, delivery options appear as icon-only badges (hover for tooltip):

```tsx
<div className="flex items-center gap-1 text-muted-steel">
  {options.includes('pickup') && <MapPinIcon className="size-3.5" title="استلام" />}
  {options.includes('seller_delivers') && <TruckIcon className="size-3.5" title="توصيل" />}
  {options.includes('buyer_ships') && <PackageIcon className="size-3.5" title="شحن" />}
</div>
```

### Smart Defaults by Category

```typescript
const CATEGORY_DELIVERY_DEFAULTS = {
  'electronics':     ['pickup', 'seller_delivers', 'buyer_ships'], // flexible
  'furniture':       ['pickup'],                                    // bulky
  'home-fitness':    ['pickup'],                                    // bulky
  'home-appliances': ['pickup', 'seller_delivers'],                // semi-bulky
  'luxury':          ['pickup', 'seller_delivers'],                // high-value, prefer in-person
  'baby-kids':       ['pickup', 'seller_delivers', 'buyer_ships'], // flexible
  // ... etc
};
```

---

## 15.5 AI Integration Points

**AI features are not a separate product.** They are integrated into core flows with clear visibility principles.

Full specifications in `design/AI-FEATURES.md`. This section covers **UI integration patterns only.**

### Visibility Principles

> **"AI is invisible for safety, visible for convenience."**

| AI Feature | Visibility | Rationale |
|---|---|---|
| Fraud Detection (seller-side) | ✅ Visible during submission | Build trust, show work |
| Fraud Detection (buyer-side) | ✅ Visible as trust signals | Position platform as AI-Protected |
| Semantic Search | ✅ Subtle indicator (✨ icon) | User should know "smart search" is active |
| Photo-to-Listing | ✅ Obvious with accept/reject | User agency, "AI-Assisted" positioning |
| Smart Pricing (V2) | ✅ Helpful hint, not push | Reference data, not pressure |
| AI Description (V3 gated) | ⚠️ Opt-in only, never default | Preserves "Human-Written" positioning |

### Core AI Components (V1 Scope)

#### 1. `FraudCheckProgress` — Shown during listing submission

```tsx
<div className="flex flex-col gap-3 p-6 rounded-2xl bg-deep-layer">
  <h3 className="text-heading-3 font-semibold flex items-center gap-2">
    <ShieldIcon className="size-5 text-success-sage" />
    جاري فحص الإعلان...
  </h3>

  <ul className="flex flex-col gap-2">
    {checks.map(check => (
      <li key={check.id} className="flex items-center gap-2">
        {check.status === 'checking' && (
          <Spinner className="size-4 text-warm-amber animate-spin" />
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

**Checklist labels (Arabic):**
- "صور أصلية"
- "النص واضح"
- "السعر ضمن المتوسط"
- "لا تكرار"

#### 2. `SafetySignalsStack` — Shown on listing detail (buyer-side)

```tsx
<section className="
  flex flex-col gap-3 p-4
  bg-success-sage/5 rounded-xl
  border border-success-sage/20
">
  <h4 className="font-semibold text-body flex items-center gap-2">
    <ShieldIcon className="size-4 text-success-sage" />
    إشارات الأمان
  </h4>

  <ul className="flex flex-col gap-2">
    <li className="flex items-start gap-2">
      <CheckIcon className="size-3.5 text-success-sage shrink-0 mt-0.5" />
      <span className="text-body-small">صور أصلية</span>
    </li>
    <li className="flex items-start gap-2">
      <CheckIcon className="size-3.5 text-success-sage shrink-0 mt-0.5" />
      <span className="text-body-small">السعر ضمن المتوسط ({range})</span>
    </li>
    <li className="flex items-start gap-2">
      <CheckIcon className="size-3.5 text-success-sage shrink-0 mt-0.5" />
      <span className="text-body-small">بائع موثّق (عضو منذ {tenure})</span>
    </li>
  </ul>

  <Link href="/safety" className="text-caption text-warm-amber underline">
    كيف نحمي المعاملات؟ ←
  </Link>
</section>
```

#### 3. `AISuggestionCard` — Used in Photo-to-Listing flow (3 instances: category/brand/condition)

```tsx
<div className="
  flex items-start gap-3 p-4 rounded-xl
  bg-warm-amber/5 border border-warm-amber/20
">
  <div className="flex flex-col gap-1 min-w-0 flex-1">
    <div className="flex items-center gap-2">
      <SparklesIcon className="size-4 text-warm-amber" />
      <span className="text-label text-warm-amber">اقتراح الذكاء الاصطناعي</span>
      <ConfidenceBadge value={confidence} />
    </div>

    <span className="text-body font-medium text-charcoal-ink">
      {fieldLabel}: {suggestedValue}
    </span>
  </div>

  <div className="flex gap-2 shrink-0">
    <Button size="sm" variant="primary" onClick={onAccept}>قبول</Button>
    <Button size="sm" variant="ghost" onClick={onReject}>تغيير</Button>
  </div>
</div>
```

#### 4. `ConfidenceBadge` — Visual indicator for AI certainty

```tsx
const CONFIDENCE_CONFIG = {
  high:   { label: 'ثقة عالية',   className: 'bg-success-sage/10 text-success-sage' },
  medium: { label: 'ثقة متوسطة',  className: 'bg-caution-flax/10 text-caution-flax' },
  low:    { label: 'ثقة منخفضة',  className: 'bg-muted-steel/10 text-muted-steel' },
};

// Threshold logic (V1 Minimal doesn't show low confidence at all)
// high: >= 0.90
// medium: 0.80-0.89
// low: < 0.80 → don't show suggestion (silent skip)
```

#### 5. `SemanticSearchInput` — Replaces basic search (Section 12 upgrade)

```tsx
<div className="relative w-full max-w-2xl flex items-center h-12 px-4
  bg-pure-surface border-[1.5px] border-ghost-border rounded-xl
  focus-within:border-warm-amber
  focus-within:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]
  transition-all duration-150
">
  <SearchIcon className="size-5 me-3 text-muted-steel shrink-0" />

  <input
    type="search"
    placeholder="ابحث عن منتج، ماركة، أو صف ما تبحث عنه..."
    className="flex-1 bg-transparent outline-none text-body"
  />

  <SparklesIcon className="size-4 text-warm-amber opacity-70 me-1" title="بحث ذكي مفعّل" />
</div>
```

#### 6. `HumanWrittenBadge` — Trust signal for non-AI listings

```tsx
<span className="
  inline-flex items-center gap-1
  px-2 py-0.5 rounded-md
  bg-charcoal-ink/5 text-charcoal-ink
  text-label font-medium
">
  <PenIcon className="size-3" />
  مكتوب بيد البائع
</span>
```

**Display logic:**
- Show on listings where `ai_any_accepted = false`
- Hide on listings that used AI suggestions
- Part of Trust Signal Hierarchy (Section 14, position 7.5)

### AI Loading States

Three standard loading patterns:

#### Loading: AI Photo Analysis
```
┌──────────────────────────────────┐
│  ✨ جاري تحليل الصور...            │
│  ─────────────────────────────── │
│  [shimmer placeholder 1]          │
│  [shimmer placeholder 2]          │
│  [shimmer placeholder 3]          │
│                                   │
│  (3-5 seconds expected)           │
└──────────────────────────────────┘
```

#### Loading: AI Search
Progress bar only (top of viewport, amber, 2px height).

#### Loading: AI Fraud Check
Checklist reveal (from `FraudCheckProgress` above).

### AI Error States

#### Error: AI Service Unavailable
```tsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-100">
  <InfoIcon className="size-5 text-muted-steel shrink-0" />
  <div className="flex flex-col gap-1">
    <p className="text-body-small text-charcoal-ink">
      الذكاء الاصطناعي غير متاح حالياً. يمكنك إكمال الإعلان يدوياً.
    </p>
    <button className="text-caption text-warm-amber underline self-start">
      حاول مرة أخرى
    </button>
  </div>
</div>
```

**Principle:** AI failure = graceful degradation. Never block user from publishing.

#### Error: Fraud Check Failed
Don't show user-facing error. Log to Sentry. Allow publish with "AI Check Pending" flag (admin review later).

### Integration Points by DESIGN.md Section

This umbrella Section 15.5 connects to:

- **Section 12 (Search & Filter):** Replace search input with `SemanticSearchInput`
- **Section 14 (Trust Signals):** Add 2 new signals — "AI Safety Checked" (auto) + "Human-Written" (conditional)
- **Section 18 (Listing Creation):** Add Step 2.5 (AI Analysis) with `AISuggestionCard` × 3
- **Section 19 (States):** AI loading + error states listed above
- **Section 24 (Component Inventory):** 11 new components listed

---

## 16. Luxury-Specific Components

**The luxury category (حقائب وساعات فاخرة) has enhanced trust requirements.**

### LuxuryVideoPlayer

```tsx
// components/luxury/LuxuryVideoPlayer.tsx
<div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-charcoal-ink">
  <video
    src={videoUrl}
    poster={posterUrl}
    controls
    playsInline
    preload="metadata"
    className="w-full h-full object-contain"
  />

  {/* Overlay: Video duration + "Luxury Video" badge */}
  <div className="
    absolute top-3 start-3
    inline-flex items-center gap-1.5
    px-2 py-1 rounded-md
    bg-charcoal-ink/90 text-white
    text-label backdrop-blur-sm
  ">
    <VideoIcon className="size-3" />
    فيديو تفقّدي · {duration}
  </div>
</div>
```

### LuxuryAuthenticationStack

Displayed on luxury ListingDetail, above main description:

```
┌──────────────────────────────────────────┐
│  إشارات الأصالة                           │
│                                          │
│  ✓ البائع يضمن الأصالة                   │
│  🎥 فيديو تفقّد المنتج                    │
│  📜 فاتورة/إيصال متوفر                    │
│  🔢 الرقم التسلسلي: XXXX-XXXX             │
│                                          │
│  ⚠️ Dealo Hub لا يتحقق من الأصالة.       │
│  تحقق قبل الدفع عبر [خدمات التحقق].      │
└──────────────────────────────────────────┘
```

### Authenticity Statement (Seller-Side Form)

**Required checkbox in luxury listing creation flow:**

```tsx
<Checkbox
  checked={authenticityConfirmed}
  onCheckedChange={setAuthenticityConfirmed}
  required
>
  <span className="text-body-small leading-relaxed">
    أضمن أصالة هذا المنتج. أقبل استرجاعه كاملاً إذا ثبت
    عدم أصالته خلال 7 أيام من تاريخ الاستلام.
  </span>
</Checkbox>
```

### Luxury Category Intro Banner

Shown on `/categories/luxury` page above listing grid:

```tsx
<div className="
  flex items-start gap-3 p-4
  bg-amber-surface rounded-xl
  border border-warm-amber/20
">
  <ShieldIcon className="size-5 text-warm-amber shrink-0 mt-0.5" />
  <div className="flex flex-col gap-1">
    <h4 className="font-semibold text-body text-charcoal-ink">
      تحقّق قبل الشراء
    </h4>
    <p className="text-body-small text-muted-steel leading-relaxed">
      Dealo Hub لا يتحقق من أصالة المنتجات الفاخرة مباشرة. كل
      إعلان في هذه الفئة يحتوي على فيديو تفقّدي وضمان من البائع.
      للتحقق الاحترافي، استخدم خدمات متخصصة مثل{' '}
      <a href="https://entrupy.com" className="underline text-warm-amber">
        Entrupy
      </a>.
    </p>
  </div>
</div>
```

### Luxury ListingCard Variant

```tsx
// Slightly different card styling for luxury — black video thumbnail, gold accents
<article className="
  bg-pure-surface border border-ghost-border rounded-2xl
  hover:border-warm-amber/40
  group
">
  <div className="relative aspect-[4/3] bg-charcoal-ink overflow-hidden">
    {/* Video plays on hover on desktop, tap on mobile */}
    <video
      src={thumbnailVideoUrl}
      muted
      loop
      playsInline
      className="
        w-full h-full object-cover
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300
      "
      onMouseEnter={e => e.currentTarget.play()}
      onMouseLeave={e => e.currentTarget.pause()}
    />
    <Image
      src={posterUrl}
      alt={title}
      fill
      className="
        object-cover
        group-hover:opacity-0
        transition-opacity duration-300
      "
    />

    {/* Luxury-specific "Video Verified" badge */}
    <span className="
      absolute top-3 start-3
      inline-flex items-center gap-1.5
      px-2 py-1 rounded-md
      bg-charcoal-ink/90 text-white
      text-label backdrop-blur-sm
      border border-white/10
    ">
      <VideoIcon className="size-3 text-warm-amber" />
      فيديو تفقّدي
    </span>
  </div>

  {/* ... rest of card */}
</article>
```

---

## 17. Chat & Messaging UI

**Chat is the defining experience of Dealo Hub.** Phone numbers are hidden; chat replaces them.

### Chat Window Layout

```
┌─────────────────────────────────────────────────┐
│  ← رجوع                                          │
│                                                  │
│  [avatar] Ahmad K.                               │
│           ✓ موثّق · آخر ظهور قبل 5 دقائق         │
├─────────────────────────────────────────────────┤
│  ╔═════════════════════════════════════════╗    │
│  ║ 📎 iPhone 14 Pro Max 256GB               ║    │
│  ║    KWD 145.000 · قابل للتفاوض            ║    │
│  ║                        [عرض الإعلان →]    ║    │
│  ╚═════════════════════════════════════════╝    │
│                                                  │
│  💬                                              │
│        ┌──────────────────────────────┐         │
│        │ مرحباً، هل المنتج لا يزال     │         │
│        │ متوفّر؟                      │         │
│        │                       1:23م  │         │
│        └──────────────────────────────┘         │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ نعم متوفر، المنتج ممتاز.      │               │
│  │                       1:25م ✓✓│               │
│  └──────────────────────────────┘               │
│                                                  │
│  🎯 عرض:                                         │
│        ┌──────────────────────────────┐         │
│        │ أعرض KWD 130 للمنتج           │         │
│        │                       1:30م  │         │
│        └──────────────────────────────┘         │
│                                                  │
├─────────────────────────────────────────────────┤
│  🛡️ نصيحة: التقِ في مكان عام (خرائط ↗)          │
├─────────────────────────────────────────────────┤
│  [📎] [اكتب رسالة...]                [إرسال ↗]   │
└─────────────────────────────────────────────────┘
```

### Message Bubble

```tsx
// components/chat/MessageBubble.tsx
interface MessageProps {
  body: string;
  timestamp: Date;
  isOwn: boolean;
  readAt?: Date;
  sentAsOffer: boolean;    // highlights offer messages
  mediaUrl?: string;
}

export function MessageBubble({ body, timestamp, isOwn, readAt, sentAsOffer }: MessageProps) {
  return (
    <div className={cn(
      "flex items-end gap-1 max-w-[75%]",
      isOwn ? "self-end" : "self-start",
      sentAsOffer && "relative"
    )}>
      {sentAsOffer && (
        <span className="
          absolute -top-6 start-0
          inline-flex items-center gap-1
          px-2 py-0.5 rounded-md
          bg-warm-amber/10 text-warm-amber
          text-label
        ">
          <TargetIcon className="size-3" />
          عرض
        </span>
      )}

      <div className={cn(
        "flex flex-col gap-1 px-4 py-2.5 rounded-2xl",
        isOwn
          ? "bg-charcoal-ink text-white rounded-se-sm"
          : "bg-deep-layer text-charcoal-ink rounded-ss-sm border border-ghost-border",
      )}>
        <p className="text-body leading-snug whitespace-pre-wrap">
          {body}
        </p>

        <div className="flex items-center gap-1 self-end">
          <time className="text-caption opacity-70">
            {formatTime(timestamp)}
          </time>
          {isOwn && (
            readAt
              ? <CheckCheckIcon className="size-3 text-success-sage" />
              : <CheckIcon className="size-3 opacity-70" />
          )}
        </div>
      </div>
    </div>
  );
}
```

### Listing Reference Card (Pinned Top of Chat)

```tsx
// Sticky at top of chat window — the listing being discussed
<div className="
  sticky top-0 z-10
  flex items-center gap-3 p-3
  bg-pure-surface border-b border-whisper-divider
">
  <Image
    src={listing.images[0].url}
    width={48}
    height={48}
    className="rounded-lg object-cover"
  />
  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
    <h4 className="text-body-small font-medium truncate">
      {listing.title}
    </h4>
    <PriceBlock compact mode={listing.priceMode} {...} />
  </div>
  <Link
    href={`/listings/${listing.id}`}
    className="text-body-small font-medium text-warm-amber whitespace-nowrap"
  >
    عرض ←
  </Link>
</div>
```

### Safety Banner (Persistent Footer in Chat)

```tsx
<div className="
  flex items-center gap-2 px-4 py-2
  bg-deep-layer border-t border-whisper-divider
  text-caption text-muted-steel
">
  <ShieldIcon className="size-3.5 shrink-0" />
  <span>
    التقِ في{' '}
    <Link href="/safe-meetup-spots" className="underline text-charcoal-ink">
      مكان عام آمن
    </Link>
    {' '}· لا ترسل مبالغ مسبقة · تحقق من المنتج قبل الدفع
  </span>
</div>
```

### Message Input

```tsx
<form
  onSubmit={handleSend}
  className="
    flex items-end gap-2 p-3
    bg-pure-surface border-t border-whisper-divider
  "
>
  <Button variant="ghost" size="icon" type="button">
    <PaperclipIcon className="size-5" />
  </Button>

  <textarea
    value={body}
    onChange={e => setBody(e.target.value)}
    placeholder="اكتب رسالة..."
    rows={1}
    className="
      flex-1 max-h-32 resize-none
      bg-deep-layer border border-ghost-border rounded-2xl
      px-4 py-2.5
      text-body placeholder:text-muted-steel
      focus:outline-none focus:border-warm-amber
    "
  />

  <Button type="submit" variant="primary" size="icon" disabled={!body.trim()}>
    <SendIcon className="size-4" />
  </Button>
</form>
```

---

## 18. Forms: Listing Creation Flow

**Multi-step form, one decision per screen.** Minimizes cognitive load.

### Step Sequence (Updated April 18 — Added Step 2.5 AI Analysis)

```
Step 1:   اختر الفئة              → Category picker (10 main + sub)
Step 2:   ارفع الصور              → Image upload (min 5, max 10)
          [+ فيديو للفئة الفاخرة]   → Video required if luxury
Step 2.5: ✨ تحليل الذكاء الاصطناعي → AI extracts: category / brand (luxury) / condition
          (AUTOMATIC — 3-5s wait)   → Shows AISuggestionCard × 3
                                     → User accepts / rejects each
                                     → Low confidence suggestions silently skipped
Step 3:   التفاصيل الأساسية        → Title, description (HUMAN), condition (can be AI-prefilled)
Step 4:   السعر                   → Price + mode (Fixed/Negotiable/Best Offer)
          [+ الحد الأدنى للعروض]    → If Best Offer
Step 5:   الموقع                  → City + Area dropdowns (from countries table)
Step 6:   خيارات التسليم           → Multi-select delivery options
Step 7:   [إن كانت فاخرة]          → Authenticity statement checkbox
          الأصالة                     Receipt/invoice upload (optional)
                                     Serial number (optional)
Step 7.5: 🛡️ فحص الأمان           → Fraud pipeline runs (3-8s)
          (AUTOMATIC)                → FraudCheckProgress shown
                                     → User sees which checks pass
Step 8:   مراجعة ونشر              → Preview + publish
```

### NEW Step 2.5: AI Analysis (V1)

**Placement:** Immediately after photos uploaded, before detail form.

```
┌─────────────────────────────────────────────┐
│  ✨ الذكاء الاصطناعي يحلل صورك...            │
│  ┌──────────────────────────────────────┐   │
│  │ [shimmer]                            │   │
│  └──────────────────────────────────────┘   │
│  (3-5 ثواني)                                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  ✨ اقتراحات الذكاء الاصطناعي                │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ✨ الفئة: إلكترونيات > موبايلات       │   │
│  │ ثقة عالية    [قبول] [تغيير]          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ✨ الماركة: Apple  (luxury only)     │   │
│  │ ثقة عالية    [قبول] [تغيير]          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ✨ الحالة: مستعمل - ممتاز            │   │
│  │ ثقة متوسطة   [قبول] [تغيير]          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  💡 نحن نترك لك كتابة العنوان والوصف.        │
│     شخصيتك تصنع الفرق.                        │
│                                              │
│  [متابعة →]                                  │
└─────────────────────────────────────────────┘
```

**Components used:**
- `AIPhotoAnalyzer` (orchestrator)
- `AISuggestionCard` × 3 (category / brand / condition)
- `ConfidenceBadge` (high / medium / low)

**Behavior:**
- Low confidence (< threshold) → skip suggestion silently (no card shown)
- AI service fail → skip step, proceed to Step 3 with manual fill
- User can skip entire step with "تعبئة يدوية" button

**Pre-Launch Accuracy Gate:** See DECISIONS.md Decision 8. If Week 11-12 testing shows <75% category accuracy, defer feature to V2.

### Progress Indicator

```tsx
// Top of every step
<div className="flex items-center gap-2 mb-6">
  {steps.map((step, idx) => (
    <div
      key={idx}
      className={cn(
        "h-1 flex-1 rounded-full transition-colors",
        idx < currentStep && "bg-warm-amber",
        idx === currentStep && "bg-warm-amber",
        idx > currentStep && "bg-zinc-200"
      )}
    />
  ))}
</div>
<p className="text-caption text-muted-steel mb-4">
  الخطوة {currentStep + 1} من {steps.length}
</p>
```

### Category Picker (Step 1)

Two-level picker: main categories grid, then sub-category list.

```
┌─────────────────────────────────────────────┐
│  اختر الفئة الأنسب                            │
│                                              │
│  ┌──────┬──────┬──────┬──────┐              │
│  │ 📱   │ 🛋️   │ 👜   │ 👶   │              │
│  │ إلك. │ أثاث │ فاخرة│ أطفال│              │
│  └──────┴──────┴──────┴──────┘              │
│  ┌──────┬──────┬──────┬──────┐              │
│  │ 🎮   │ ⛺   │ 🏋️   │ 🍳   │              │
│  └──────┴──────┴──────┴──────┘              │
│  ┌─────────────┬─────────────┐              │
│  │ 💄 جمال     │ 📦 متفرقات   │              │
│  └─────────────┴─────────────┘              │
└─────────────────────────────────────────────┘
```

### Image Upload (Step 2)

```
┌─────────────────────────────────────────────┐
│  ارفع صور المنتج (5-10 صور)                  │
│  الصورة الأولى ستكون الغلاف                  │
│                                              │
│  ┌───┬───┬───┬───┬───┐                      │
│  │img│img│img│+  │+  │                      │
│  │ 1 │ 2 │ 3 │   │   │                      │
│  └───┴───┴───┴───┴───┘                      │
│  [اسحب للترتيب]                              │
│                                              │
│  📱 أو التقط صورة بالكاميرا                   │
│                                              │
│  ⚠️ للفئة الفاخرة: مطلوب فيديو تفقّدي        │
│     [تسجيل فيديو 30-60 ثانية]                │
└─────────────────────────────────────────────┘
```

### Price Step (Step 4) — With 3 Modes

```
┌─────────────────────────────────────────────┐
│  السعر                                       │
│                                              │
│  [        150       ] KWD                    │
│                                              │
│  نوع السعر:                                   │
│  ○ 🔒 ثابت — السعر غير قابل للتفاوض         │
│  ● 💬 قابل للتفاوض — مفتوح للنقاش             │
│  ○ 🎯 يقبل العروض — المشترون يقدّمون عروض    │
│                                              │
│  [إذا اختار "يقبل العروض":]                   │
│  الحد الأدنى المقبول (اختياري):                │
│  [       30        ] KWD                     │
└─────────────────────────────────────────────┘
```

---

## 19. Empty, Loading & Error States

### Empty State: No Search Results

```
┌─────────────────────────────────────────────┐
│                                              │
│             [SVG illustration]               │
│             (minimal, zinc palette)          │
│                                              │
│     لم نجد إعلانات تطابق بحثك                │
│                                              │
│     جرّب:                                     │
│     • إزالة فلتر "إلكترونيات"                │
│     • توسيع نطاق السعر                       │
│     • البحث في منطقة أخرى                    │
│                                              │
│       [مسح جميع الفلاتر]                      │
│                                              │
└─────────────────────────────────────────────┘
```

**Rules:**
- Never "No data available" — always specific, actionable
- SVG illustrations only (no stock photography)
- Specific suggestion tied to current filter state
- Primary CTA: "Clear filters" or "Adjust search"

### Empty State: First-Time Buyer

```tsx
<div className="flex flex-col items-center gap-6 py-12">
  <EmptyIllustration />
  <h2 className="text-heading-2 text-center">
    مرحباً في Dealo Hub
  </h2>
  <p className="text-body text-muted-steel text-center max-w-md">
    اختر فئة لتبدأ التصفح. 10 فئات رئيسية بأكثر من 200 إعلان نشط.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
    {TOP_CATEGORIES.map(cat => (
      <CategoryCard key={cat.slug} {...cat} />
    ))}
  </div>
</div>
```

### Loading State: Skeleton Cards

```tsx
// components/listings/ListingCardSkeleton.tsx
export function ListingCardSkeleton() {
  return (
    <div className="
      flex flex-col bg-pure-surface border border-ghost-border
      rounded-2xl overflow-hidden
    ">
      <div className="aspect-[4/3] bg-zinc-200 animate-pulse" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 bg-zinc-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-zinc-200 rounded animate-pulse w-1/2" />
        <div className="h-6 bg-zinc-200 rounded animate-pulse w-2/3 mt-2" />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-whisper-divider">
        <div className="size-6 rounded-full bg-zinc-200 animate-pulse" />
        <div className="h-4 bg-zinc-200 rounded animate-pulse w-24" />
      </div>
    </div>
  );
}
```

### Loading State: Top Progress Bar (Page Transitions)

```tsx
// Top of viewport, 2px height, amber-600
<div className="
  fixed top-0 inset-x-0 z-50
  h-0.5 bg-warm-amber
  transition-all duration-300
" style={{ width: `${progress}%` }} />
```

**No circular spinners anywhere. Ever.**

### AI Loading States (Added April 18)

Three AI-specific loading patterns. See Section 15.5 for component specs.

#### AI Photo Analysis (Step 2.5 of listing creation)

```tsx
<div className="flex flex-col gap-3 p-6 rounded-2xl bg-warm-amber/5 border border-warm-amber/20">
  <div className="flex items-center gap-2">
    <SparklesIcon className="size-5 text-warm-amber animate-pulse" />
    <h3 className="text-heading-3 font-semibold">جاري تحليل الصور...</h3>
  </div>

  <p className="text-body-small text-muted-steel">
    الذكاء الاصطناعي يستخرج معلومات المنتج من الصور. (3-5 ثواني)
  </p>

  {/* Skeleton placeholders for 3 suggestion cards */}
  <div className="flex flex-col gap-2 mt-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-14 bg-zinc-200 rounded-lg animate-pulse" />
    ))}
  </div>
</div>
```

#### AI Fraud Check (Step 7.5 of listing creation)

See `FraudCheckProgress` component in Section 15.5.

#### AI Search Loading

Use top progress bar only. No inline spinner. Results replace after fetch.

### AI Error States (Added April 18)

#### AI Service Unavailable (Graceful Degradation)

```tsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-100 border border-ghost-border">
  <InfoIcon className="size-5 text-muted-steel shrink-0 mt-0.5" />
  <div className="flex flex-col gap-1">
    <p className="text-body-small text-charcoal-ink font-medium">
      الذكاء الاصطناعي غير متاح حالياً
    </p>
    <p className="text-caption text-muted-steel">
      يمكنك إكمال الإعلان يدوياً. سيتم الفحص الأمني لاحقاً.
    </p>
    <button className="text-caption text-warm-amber underline self-start mt-1">
      حاول مرة أخرى
    </button>
  </div>
</div>
```

**Principle:** AI failure NEVER blocks user action. Always fail-open, always provide manual path.

#### AI Low Confidence (Silent Handling)

When AI confidence < threshold, **do not show a "low confidence" warning.** Silently skip the suggestion. User fills field manually without friction.

**Reason:** Visible low-confidence badges create doubt and friction. Better UX = AI only speaks when confident.

#### AI Timeout (>10 seconds)

```tsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-caution-flax/5 border-s-4 border-caution-flax">
  <ClockIcon className="size-5 text-caution-flax shrink-0" />
  <div className="flex flex-col gap-1">
    <p className="text-body-small font-medium">
      التحليل استغرق وقتاً أطول من المعتاد
    </p>
    <button className="text-caption text-warm-amber underline self-start">
      تعبئة يدوية
    </button>
  </div>
</div>
```

### Error States

#### Inline Form Error
```tsx
<input className="border-danger-coral" />
<p className="text-body-small text-danger-coral mt-1 flex items-center gap-1">
  <AlertCircleIcon className="size-3.5" />
  السعر يجب أن يكون أكبر من 0
</p>
```

#### Alert Banner
```tsx
<div className="
  flex items-start gap-3 p-4 rounded-xl
  bg-red-50 border-s-4 border-danger-coral
">
  <AlertIcon className="size-5 text-danger-coral shrink-0" />
  <div className="flex flex-col gap-1">
    <h4 className="font-semibold text-body text-charcoal-ink">
      فشل النشر
    </h4>
    <p className="text-body-small text-muted-steel">
      يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.
    </p>
  </div>
</div>
```

#### Toast Notification

```tsx
// Bottom-start on mobile, bottom-end on desktop
<Toast
  className="
    flex items-center gap-3 p-3 pe-4
    bg-pure-surface border border-ghost-border rounded-xl
    shadow-[0_8px_24px_rgba(24,24,27,0.12)]
    max-w-sm
  "
>
  <CheckCircleIcon className="size-5 text-success-sage" />
  <span className="text-body-small">تم نشر إعلانك بنجاح</span>
</Toast>
```

---

## 20. Motion & Interaction

### Spring Physics (unchanged from v1)

```javascript
// Default spring — weighty, premium
const SPRING_DEFAULT = { stiffness: 120, damping: 20, mass: 1 };

// Snappy — filter chips, tab switches
const SPRING_SNAPPY = { stiffness: 300, damping: 30 };

// Floaty — card hover lifts
const SPRING_FLOATY = { stiffness: 80, damping: 15 };

// Easing curves (Tailwind config)
// Entrance with overshoot: cubic-bezier(0.34, 1.56, 0.64, 1)
// Exit smooth: cubic-bezier(0.4, 0, 0.2, 1)
// Never: linear
```

### Marketplace-Specific Micro-Interactions

```
Listing card hover:       translate-y(-2px) + shadow lift (spring floaty)
Save button toggle:       heart scale 1 → 1.3 → 1 (spring snappy)
Price mode badge change:  cross-fade 200ms
Filter chip toggle:       background transition with spring
Image swipe (mobile):     follow finger with resistance at bounds
Chat message arrive:      fade + slide-up 12px (300ms spring)
Typing indicator:         3 dots with staggered scale pulse (infinite)
"New listing" arrival:    slide-in from start with fade
```

### Staggered Reveals

```tsx
// Listing grid on mount
<AnimatePresence>
  {listings.map((listing, idx) => (
    <motion.div
      key={listing.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: idx * 0.06,    // 60ms stagger
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }}
    >
      <ListingCard {...listing} />
    </motion.div>
  ))}
</AnimatePresence>
```

### Performance Rules

- Animate only `transform` and `opacity` — never `top/left/width/height/margin`
- `will-change: transform` on cards with hover animations
- Respect `prefers-reduced-motion`: all transitions max 50ms in that mode
- Luxury video auto-play on hover: desktop only, not mobile (battery)

---

## 21. Mobile-First Breakpoints

### Breakpoints

```
Mobile:      < 640px     (sm)
Tablet:      640–1023px  (md)
Desktop:     1024px+     (lg)
Wide:        1280px+     (xl)
Ultra:       1536px+     (2xl)
```

### Mobile-Specific Patterns

#### Bottom Navigation (Optional but Recommended)
```
┌──────────────────────────────────────┐
│                                      │
│         [Main content area]           │
│                                      │
├──────────────────────────────────────┤
│  🏠      🔍      ➕      💬      👤    │
│ الرئيسية  بحث   بيع   رسائل  حسابي │
└──────────────────────────────────────┘
```

#### Sticky CTA on Listing Detail
Already documented in Section 9 — CTA appears at bottom after scroll.

#### Horizontal Scroll Patterns
- Filter chips on mobile
- Category carousel on homepage
- Related listings on listing detail

**Rule:** Any horizontal scroll must have `scroll-snap-type: x mandatory` and hide scrollbars on mobile.

### Touch Targets

```
Minimum touch target:     44px × 44px
Ideal primary buttons:    48px height
Icon buttons:             40px minimum (buttons, not content)
Spacing between targets:  8px minimum
```

### Performance Targets (Mobile)

```
LCP (Largest Contentful Paint):  < 2.5s
FID (First Input Delay):          < 100ms
CLS (Cumulative Layout Shift):    < 0.1
Time to Interactive:              < 3.5s

Lighthouse score (mobile):        > 90 across all metrics
```

---

## 22. Anti-Patterns (Banned)

### Typography & Content
- ❌ `Inter`, `Roboto`, `Helvetica Neue` as primary fonts
- ❌ Gradient text on headings larger than `1.75rem`
- ❌ Arabic-Indic digits (١٢٣٤) — always Western (1234)
- ❌ AI copywriting clichés: "Elevate", "Seamless", "Unleash", "حصرياً"
- ❌ Filler UI text: "Scroll to explore", "Swipe down"
- ❌ Placeholder names: "John Doe", "Acme Corp"
- ❌ Fake round numbers without real data
- ❌ Emojis in UI (use inline SVG icons only) — **exception:** emoji is acceptable in user-generated content

### Color & Visual
- ❌ Pure black (`#000000`) — use `charcoal-ink` (`#18181B`)
- ❌ Neon outer glow shadows on any element
- ❌ Saturated colors above 75% (except warm-amber which is calibrated)
- ❌ Purple, indigo, blue-neon gradients
- ❌ Full-bleed background image heroes with text overlay
- ❌ Store logos as primary visual elements (this is C2C, not deals aggregator)
- ❌ Flashing "Hot Deal" or urgency animations

### Layout & Structure
- ❌ 3-column equal-width card layouts for marketing
- ❌ Centered hero sections
- ❌ Overlapping elements (except gallery overlay badges)
- ❌ `h-screen` — always `min-h-[100dvh]`
- ❌ `calc()` percentage hacks
- ❌ Horizontal scroll on mobile (except explicit scroll-snap zones)
- ❌ `left-*`, `right-*`, `ml-*`, `mr-*`, `pl-*`, `pr-*` (use logical properties)

### Components & Interaction
- ❌ **Phone numbers displayed anywhere on listings or cards** (the moat)
- ❌ WhatsApp links from listing cards
- ❌ Custom mouse cursors
- ❌ Circular loading spinners (use skeleton + top progress bar)
- ❌ Floating labels on inputs (labels above, always)
- ❌ Modal-on-modal stacking
- ❌ Auto-playing video or audio (except luxury desktop hover)
- ❌ Cookie consent banners covering > 10% of viewport
- ❌ **Deal badges, discount percentages, savings indicators** (this is a marketplace, not a deals site)
- ❌ Store rating stars on listing cards (that's seller rating, shown on seller strip)

### Marketplace-Specific Anti-Patterns
- ❌ Fake listings or placeholder content in production
- ❌ Showing "X people viewing this" fake counters
- ❌ "Last chance!" / "Selling fast!" artificial urgency
- ❌ Recommending unrelated categories ("You might also like...") before 1,000 listings per category
- ❌ Seller verification badges without actual verification flow
- ❌ Price drop indicators (we're not tracking historical pricing in V1)

---

## 23. Accessibility

### Baseline Requirements

- **Keyboard navigation:** Every interactive element reachable via Tab, operable via Enter/Space
- **Focus indicators:** Visible 2px amber ring with 2px offset on all focusable elements
- **Screen reader labels:** Every icon-only button has `aria-label`
- **Color contrast:** WCAG AA minimum (4.5:1 body text, 3:1 large text)
- **Form labels:** Always visible, always above input (no floating labels)
- **Error messages:** Associated with `aria-describedby`, announced by screen reader

### ARIA Patterns

```tsx
// Listing card
<article
  role="article"
  aria-labelledby={`listing-${id}-title`}
>
  <h3 id={`listing-${id}-title`}>{title}</h3>
</article>

// Save button
<button
  aria-label={isSaved ? 'إزالة من المحفوظات' : 'حفظ الإعلان'}
  aria-pressed={isSaved}
>
  <HeartIcon />
</button>

// Filter chip
<button
  role="button"
  aria-pressed={isActive}
  aria-label={`${isActive ? 'إزالة' : 'تطبيق'} فلتر: ${label}`}
>
  {label}
</button>

// Image gallery
<div role="region" aria-label="معرض صور الإعلان">
  {images.map((img, idx) => (
    <img
      src={img.url}
      alt={`${listing.title} - صورة ${idx + 1} من ${images.length}`}
    />
  ))}
</div>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.05ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Arabic Screen Reader Support

- `lang="ar"` set on root element
- `dir="rtl"` respected by screen readers
- Arabic translations in ARIA labels always

---

## 24. Appendix: Component Inventory

**Checklist for V1 implementation — track completion here.**

### Atoms
- [ ] `Button` (variants: primary, secondary, ghost, destructive, icon)
- [ ] `Input` (text, number, textarea, search)
- [ ] `Label`
- [ ] `Badge` (variants: trust, price-mode, category, status)
- [ ] `Avatar` (sizes: sm, md, lg, xl)
- [ ] `Icon` (wrapper for lucide-react)
- [ ] `Checkbox`
- [ ] `Radio`
- [ ] `Switch`
- [ ] `Divider`
- [ ] `Spinner` (for in-button loading only — no page spinners)

### Formatters
- [ ] `PriceBlock` (3 modes + compact variant)
- [ ] `TimeAgo` (relative time with locale)
- [ ] `DateDisplay` (Gregorian, Western digits)
- [ ] `CountDisplay` (monospace numbers with locale)

### Layout
- [ ] `Container`
- [ ] `ListingGrid`
- [ ] `AsymmetricGrid` (for featured sections)
- [ ] `Stack` / `HStack` / `VStack` (flexbox helpers)

### Navigation
- [ ] `Nav` (desktop header, sticky)
- [ ] `MobileNav` (hamburger menu)
- [ ] `BottomNav` (mobile 5-tab)
- [ ] `Breadcrumb`
- [ ] `TabsUnderline` (category tabs)

### Listing Components
- [ ] `ListingCard` (default)
- [ ] `ListingCardCompact` (my listings)
- [ ] `ListingCardList` (horizontal)
- [ ] `ListingCardFeatured` (hero)
- [ ] `ListingCardSkeleton`
- [ ] `ListingGallery`
- [ ] `ListingDetail`
- [ ] `ListingCTA` (3 price mode variants)
- [ ] `RelatedListings`

### Seller Components
- [ ] `SellerProfileCard` (inline + standalone)
- [ ] `SellerListings` (their listings grid)
- [ ] `TrustSignalStack`
- [ ] `SellerBadge` (inline, compact)

### Filter & Search
- [ ] `SearchInput`
- [ ] `FilterBar` (horizontal chips)
- [ ] `FilterPanel` (sidebar + bottom sheet)
- [ ] `FilterChip` (active + inactive)
- [ ] `PriceRangeSlider`
- [ ] `AreaPicker` (city > area)
- [ ] `SortDropdown`

### Forms (Listing Creation)
- [ ] `ListingForm` (orchestrator)
- [ ] `CategoryPicker`
- [ ] `ImageUploader` (drag-drop, camera, reorder)
- [ ] `VideoUploader` (luxury-only, 30-60s)
- [ ] `PriceInput` (with mode selector)
- [ ] `LocationPicker`
- [ ] `DeliveryOptionsInput`
- [ ] `AuthenticityStatement` (luxury checkbox)
- [ ] `StepIndicator`
- [ ] `ReviewStep`

### Chat
- [ ] `ConversationList`
- [ ] `ChatWindow`
- [ ] `MessageBubble`
- [ ] `ListingReferenceCard` (pinned in chat)
- [ ] `SafetyBanner`
- [ ] `MessageInput`
- [ ] `TypingIndicator`

### Luxury-Specific
- [ ] `LuxuryVideoPlayer`
- [ ] `LuxuryAuthenticationStack`
- [ ] `LuxuryCategoryBanner`
- [ ] `LuxuryListingCard` (variant with video thumb)

### Feedback
- [ ] `Toast` (success, error, info)
- [ ] `AlertBanner`
- [ ] `EmptyState` (with illustration)
- [ ] `ErrorBoundary`

### Homepage
- [ ] `Hero` (asymmetric split)
- [ ] `CategoryCards` (10 cards, 4+4+2 grid)
- [ ] `FeaturedListings`
- [ ] `LiveStats` (listings count, sellers count — only real data)
- [ ] `HowItWorks` (3-step explainer)
- [ ] `TrustSection`

### Utility
- [ ] `DirectionalIcon` (auto-flip in RTL)
- [ ] `LocaleSwitcher`
- [ ] `ThemeWrapper` (light/dark — dark optional V2)
- [ ] `AnalyticsEvent` (PostHog wrapper)

### AI Components (V1 Scope — Added April 18)

**Full specs in Section 15.5 + `design/AI-FEATURES.md`.**

- [ ] `FraudCheckProgress` — Shown during listing submission (animated checklist)
- [ ] `SafetySignalsStack` — Shown on listing detail (buyer-side trust signals)
- [ ] `FraudWarningBanner` — Shown when anomaly detected (subtle caution)
- [ ] `AISafetyBadge` — Trust signal 3.5 ("محمي بالذكاء الاصطناعي")
- [ ] `AIPhotoAnalyzer` — Orchestrator for Step 2.5 listing creation
- [ ] `AISuggestionCard` — Per-field AI suggestion with accept/reject
- [ ] `ConfidenceBadge` — High/Medium/Low indicator
- [ ] `HumanWrittenBadge` — Trust signal 7.5 ("مكتوب بيد البائع")
- [ ] `SemanticSearchInput` — Enhanced search with ✨ indicator
- [ ] `SmartResultsLabel` — "نتائج ذكية" header on search results
- [ ] `AIErrorBoundary` — Graceful AI failure UI wrapper

### AI Admin Components (Internal, V1 Manual)
- [ ] `AdminFraudQueue` — Simple Supabase dashboard view (V1 = SQL queries, V2 = custom UI)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial design system (deals aggregator context) |
| 2026-04-18 | 2.0 | **Complete rewrite for C2C marketplace.** Vocabulary shift (deals → listings, stores → sellers), new components (ListingCard, SellerProfileCard, CategoryCards, Chat UI), RTL-first principles, 3 price modes, trust signals, delivery options, luxury-specific components. Kept palette, typography, motion system from v1. |
| 2026-04-18 | 2.1 | **AI Integration Points added.** New Section 15.5 (umbrella AI UI patterns). Section 12 upgraded to semantic search. Section 14 added 2 trust signals (AI Safety Checked, Human-Written). Section 18 added Step 2.5 (AI Analysis) and Step 7.5 (Fraud Check). Section 19 added AI loading + error states. Section 24 added 11 new AI components. Integrates with `design/AI-FEATURES.md` spec. |

---

*This design system is a living contract between design intent and implementation. Every component deviation from this spec is a defect. Updates to this document require explicit founder approval.*

*Reference planning documents: `planning/MASTER-PLAN.md` · `planning/DECISIONS.md` · `planning/LAUNCH-STRATEGY.md` · `planning/GCC-READINESS.md`*
