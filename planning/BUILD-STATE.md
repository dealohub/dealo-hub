# Dealo Hub — Build State Snapshot

**Date:** 2026-04-19
**Last Commit:** `c2556e0` (35 commits ahead of origin/master, unpushed)
**Purpose:** Forward-looking handoff — use this as the starting point for building pages beyond the landing.

---

## 1. Executive Summary

- ✅ **Landing page complete** — EN/AR, dark + light, RTL-correct, SEO-ready, deployed route: `/[locale]/`
- ✅ **Backend layer intact** — Supabase schema + 27 server actions/queries in `src/lib/` survived the UI reset untouched
- ✅ **Design system locked** — shadcn CSS vars + Geist/Bricolage/Cairo fonts + warm stone light palette + oklch primary
- ✅ **i18n infrastructure wired** — 16 namespaces in messages/, `marketplace.*` fully translated, RTL font swap via CSS cascade
- 🟡 **1 known issue:** `src/lib/browse/queries.ts` imports a deleted `ListingCard` — `tsc` fails, `next dev` tolerates
- 📋 **Next phase:** Browse → Listing Detail → Sell Wizard → Auth → Account (roadmap in §10)

---

## 2. What's Built (Landing)

Route: `/[locale]/` renders in this order:

| # | Component | File | Notes |
|---|---|---|---|
| 1 | `EcommerceNavbar1` | `shadcnblocks/ecommerce-navbar-1.tsx` | Search, mega-menu (Community), Gulf country selector (KW default), Sell-now red pill, theme + locale toggles |
| 2 | `Feature283` | `shadcnblocks/feature-283.tsx` | Hero: heading + inline search (category pills + input + red CTA) + 6 draggable scattered images from `HERO_LISTING_INDICES` |
| 3 | `FeaturedBrandsStrip` | `shadcnblocks/featured-brands-strip.tsx` | Marquee of 12 brand logos via cdn.simpleicons.org, pause on hover |
| 4 | `AIProtectionStrip` | `shadcnblocks/ai-protection-strip.tsx` | 4 tinted cards: listing verification, image intelligence, scam shield, semantic search |
| 5 | `LiveFeed` + `LiveFeedParts` | `shadcnblocks/live-feed.tsx` + `live-feed-parts.tsx` | LiveStatusBar, FeedHeader, FilterPills, rolling feed of `ListingCardCircular` |
| 6 | `FeaturedPartnersSection` | inside `live-feed-parts.tsx` | 4-col partners grid + 3-col MarketPulse strip (promoted from aside) |
| 7 | `SiteFooter` | `shadcnblocks/site-footer.tsx` | 4 col links + newsletter + trust chip + social + legal + auto © year |
| — | `BackgroundPattern115` | `shadcnblocks/background-pattern-115.tsx` | Wraps Feature283 as backdrop (Center Vignette Dot Grid) |
| — | `ThemeToggle` | `components/theme-toggle.tsx` | Sun/Moon, uses `next-themes` `useTheme` |
| — | `LocaleToggle` | `components/locale-toggle.tsx` | AR/EN switch |

### Listing Card Variants
Four variants built during iteration — all in the tree, swap via one import alias in `live-feed.tsx`:
- `listing-card-editorial.tsx` (A)
- `listing-card-compact.tsx` (B)
- `listing-card-polished.tsx` (C)
- `listing-card-circular.tsx` (D) ← **shipped**

---

## 3. What's Intact (Backend — Do Not Touch)

All of `src/lib/` survived the UI reset. Use as-is when building pages:

### Server Actions
- `actions/waitlist.ts` — landing waitlist capture
- `auth/actions.ts` — signin, signup, signout, OTP verify, password reset
- `auth/phone.ts`, `auth/validators.ts` — phone OTP + libphonenumber-js + Zod
- `favorites/actions.ts` — `toggleFavorite`
- `listings/actions.ts` — `publishListing`, draft ops
- `listings/client-upload.ts` — image/video upload to Supabase Storage
- `listings/draft.ts` — draft lifecycle (resume in-progress wizard)
- `listings/embeddings.ts` — OpenAI `text-embedding-3-small` on publish
- `listings/validators.ts` — full Zod schema for listing create/update
- `profile/actions.ts`, `profile/validators.ts` — profile edit, avatar upload

### Queries
- `browse/queries.ts` — `getFilteredListings`, `getFeaturedListings`, `getSavedListingIdSet` ⚠️ **stale ListingCard import, see §9**
- `browse/filters.ts`, `browse/types.ts` — URL param parse/serialize, filter state
- `listings/queries.ts` — listing detail fetches
- `profile/queries.ts` — profile by handle / uuid
- `search/queries.ts` + `search/embeddings.ts` — hybrid keyword (70%) + pgvector (30%) with fail-open fallback

### Infrastructure
- `supabase/client.ts` — browser client
- `supabase/server.ts` — server component client
- `supabase/middleware-auth.ts` — middleware helper
- `supabase/storage.ts` + `storage-listings.ts` — storage ops
- `categories.ts`, `category-icons.ts` — 10-category taxonomy
- `format.ts` — locale-aware currency/date (Western digits)
- `helpers.ts`, `utils.ts` — `cn()`, misc

### Database (Supabase — Mumbai ap-south-1)
14 migrations applied. Core tables: `profiles`, `listings`, `listing_images`, `listing_videos`, `listing_drafts`, `categories`, `countries`, `cities`, `areas`, `favorites`, `waitlist`, `ai_events`. Buckets: `avatars`, `listing-images`, `listing-videos`.

### Middleware (`middleware.ts`)
- `next-intl` locale routing (`/en`, `/ar`)
- Auth gate for `PROTECTED_PATH_SEGMENTS` (sell, my-listings, saved, profile/edit/me)
- Supabase session refresh

---

## 4. Stack + Dependencies

| Layer | Package | Version | Notes |
|---|---|---|---|
| Framework | `next` | 14.2.35 | Semver-patch latest of v14 |
| Language | `typescript` | 5.5.3 | strict mode |
| Styling | `tailwindcss` | 3.4.6 | + `tailwindcss-animate`, `tailwind-merge`, `class-variance-authority` |
| UI primitives | `@radix-ui/react-*` | various | dialog, dropdown, select, slider, switch, toast, aspect-ratio, checkbox, label, slot |
| Icons | `lucide-react` | ^0.414.0 | All icons (replaced handoff's `icons.jsx`) |
| Animation | `framer-motion` | ^12.38.0 | Feature283 drag + hover blur, card variants |
| Fonts | `geist` | ^1.7.0 | LTR body |
| | `next/font/google` | — | Bricolage Grotesque (display LTR), Cairo (RTL) |
| Theming | `next-themes` | ^0.4.6 | class attribute, dark default, enableSystem |
| i18n | `next-intl` | ^3.26.5 | `/[locale]/` routing, `useTranslations` |
| Backend | `@supabase/supabase-js` | 2.45.0 | |
| | `@supabase/ssr` | 0.4.0 | SSR cookie helpers |
| AI | `openai` | 4.52.7 | embeddings (text-embedding-3-small) |
| | `@google-cloud/vision` | 4.3.2 | reverse image search (not yet wired to UI) |
| Auth | `libphonenumber-js` | 1.11.7 | + `react-phone-number-input` |
| Forms | `zod` | 3.23.8 | validators |
| DnD | `@dnd-kit/*` | various | image reorder in sell wizard |

---

## 5. File Structure (Current)

```
D:\Dealo Hub\
├── app/
│   ├── layout.tsx                        ← root shell (pass-through for next-intl)
│   ├── globals.css                       ← :root + .dark CSS vars
│   └── [locale]/
│       ├── layout.tsx                    ← next-intl + next-themes + RTL + fonts
│       └── page.tsx                      ← landing page composition
├── src/
│   ├── components/
│   │   ├── locale-toggle.tsx
│   │   ├── theme-toggle.tsx
│   │   └── shadcnblocks/                 ← all shipped landing components
│   │       ├── ai-protection-strip.tsx
│   │       ├── background-pattern-115.tsx
│   │       ├── ecommerce-navbar-1.tsx
│   │       ├── feature-283.tsx
│   │       ├── featured-brands-strip.tsx
│   │       ├── listing-card-circular.tsx    ← SHIPPED variant
│   │       ├── listing-card-compact.tsx
│   │       ├── listing-card-editorial.tsx
│   │       ├── listing-card-polished.tsx
│   │       ├── listings-data.ts              ← single seed source
│   │       ├── live-feed-parts.tsx
│   │       ├── live-feed.tsx
│   │       └── site-footer.tsx
│   ├── lib/                              ← DO NOT TOUCH (backend intact)
│   ├── i18n/
│   │   ├── routing.ts                    ← locale strategy
│   │   └── request.ts                    ← next-intl config
│   └── types/
│       └── database.ts                   ← generated from schema
├── messages/
│   ├── ar.json                           ← 16 namespaces
│   └── en.json
├── supabase/migrations/                  ← 14 migrations, all applied
├── planning/
│   ├── MASTER-PLAN.md
│   ├── DECISIONS.md
│   ├── EXECUTIVE-SUMMARY.md
│   ├── COMPETITOR-DUBIZZLE.md
│   ├── LAUNCH-STRATEGY.md
│   ├── GCC-READINESS.md
│   └── BUILD-STATE.md                    ← THIS FILE
├── design-prototypes/handoff/            ← original Claude Design source
├── tailwind.config.ts
├── next.config.js
├── middleware.ts
├── package.json                          ← next 14.2.35, 16 deps + 13 devDeps
└── ref-upstack-*.png                     ← 4 visual refs (committed)
```

---

## 6. Architecture Contracts (Non-Negotiable)

These invariants must hold across all new pages. Break them and the build decays.

### 6.1 Theme System
- **CSS vars in HSL triplets** (e.g. `--border: 240 6% 90%`) consumed via `hsl(var(--border))` in Tailwind.
- **Exception:** `--primary` is `oklch(0.58 0.19 274)` — consumed via `var(--primary)` (no `hsl()` wrapper).
- **Toggle:** `.dark` class on any ancestor flips vars (not just `html.dark`).
- Light palette: warm stone (hue 60/30, not cool 240).

### 6.2 Font Cascade (Arabic Swap)
- `html[dir='rtl']` overrides `--font-geist-sans` and `--font-bricolage` to point at `--font-cairo`.
- Tailwind utilities (`font-sans`, `font-calSans`) consume those vars — no per-component font logic.
- **Never** hardcode a font on a component. Use the utilities.

### 6.3 Card Variant System
- Swap card design by changing one import alias in `src/components/shadcnblocks/live-feed.tsx`:
  ```tsx
  import ListingCard from './listing-card-circular'; // ← D shipped
  ```
- **Never inline card JSX into live-feed** — kills the variant-swap contract.

### 6.4 Seed Data
- `src/components/shadcnblocks/listings-data.ts` = **single source of truth** for `SEED_LISTINGS`, `SEED_PRICE_DROPS`, `ACTIVITY_SIGNALS`, `HERO_LISTING_INDICES`.
- Hero and live feed both consume it — keeps imagery in sync.
- Any new visual element needing listing data imports from here.

### 6.5 Category Labels
- Translations route through `item.id`, NOT label strings.
- `MENU` constant in navbar stays English (fallback).
- `useLocalizedCategoryLabel()` hook in React tree; `CAT_LABEL` object for non-React consumers.

### 6.6 RTL Styling
- **Only logical properties:** `ms-*` / `me-*` / `ps-*` / `pe-*` / `start-*` / `end-*` / `text-start` / `text-end`.
- Forbidden in new code: `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`.
- Existing handoff components may still use physical properties — fix opportunistically, don't retrofit.

### 6.7 Digits
- Western numerals (`0-9`) in Arabic UI always — `numberingSystem: 'latn'` on `Intl.NumberFormat`.
- Use helpers in `src/lib/format.ts` for prices/dates.

### 6.8 i18n Discipline
- All user-visible strings in new pages → `messages/{en,ar}.json` under appropriate namespace.
- `marketplace.*` for landing-adjacent strings.
- Use existing namespaces for: `nav`, `listing`, `trust`, `safety`, `auth`, `profile`, `sell`, `browse`, `search`, `saved`.
- **No hardcoded user-visible text in TSX components.**

---

## 7. i18n Namespace Map

Available in both `messages/ar.json` and `messages/en.json`:

| Namespace | Purpose | Status |
|---|---|---|
| `app` | App-level chrome (titles, errors) | Ready |
| `home` | Home page | Legacy — landing uses `marketplace.*` |
| `landing` | Pre-auth landing | Legacy |
| `marketplace` | All landing strings (nav, hero, brands, AI, feed, footer) | ✅ Used |
| `common` | Shared strings (buttons, loading) | Ready |
| `nav` | Navigation | Partially used |
| `listing` | Listing card + detail | Ready, unused in landing |
| `trust` | Trust signals, safety tips | Ready |
| `safety` | Safety banners | Ready |
| `auth` | Signin, signup, OTP, reset | Ready |
| `profile` | Profile page, edit | Ready |
| `sell` | Sell wizard | Ready |
| `browse` | Browse/category pages | Ready |
| `search` | Search results | Ready |
| `saved` | Saved listings | Ready |
| `footer` | Legacy | Superseded by `marketplace.footer` |

New pages should reuse existing namespaces where possible; add keys to them rather than creating new namespaces.

---

## 8. Server Actions + Queries — What's Wireable Now

These are ready to call from new pages without writing backend code:

### Listings
- `getFilteredListings(params)` → feed for category/search pages
- `getFeaturedListings()` → home strips
- `getListingById(id)` → detail page
- `publishListing(formData)` → sell wizard submit
- `toggleFavorite(listingId)` → save button action

### Search
- `getHybridSearchResults(query, filters)` → `/search` — keyword ILIKE + pgvector merged 70/30, fail-open

### Profile
- `getProfileByHandle(handle)` → `/profile/[handle]`
- `getProfileByUuid(uuid)` → fallback route
- `updateProfile(data)` → profile edit

### Auth
- `signInWithEmail`, `signUpWithEmail`, `signOut`
- `requestOtp`, `verifyOtp`
- `requestPasswordReset`, `confirmPasswordReset`

### Sell Wizard (draft-first)
- `createDraft()`, `updateDraft(id, stepData)`, `getDraft(id)`, `deleteDraft(id)`, `moveDraftImages()`

---

## 9. Known Issues

### 🟡 Pre-existing — dead import in queries.ts
- **File:** `src/lib/browse/queries.ts`
- **Problem:** Imports `@/components/listings/ListingCard` which was deleted in the UI reset (2026-04-19, commit `1058b50`).
- **Impact:** `tsc --noEmit` fails. `next dev` and `next build` tolerate it (type-only reference).
- **Fix window:** When building the browse page, replace the import with whichever card variant is chosen for category/search results — likely `@/components/shadcnblocks/listing-card-circular` or a purpose-built grid card.
- **Do not fix in isolation** — wait until browse page work starts so we pick the right card in context.

---

## 10. Page Roadmap

Aligned to MASTER-PLAN Sprint 3–6. Build in this order:

### 🔴 P0 — Browse & Search (next)
| Route | Purpose | Backend ready? |
|---|---|---|
| `/[locale]/categories` | All 10 categories bento grid | `categories.ts` ✅ |
| `/[locale]/categories/[slug]` | Category page (filters + grid + pagination) | `getFilteredListings` ✅ |
| `/[locale]/categories/[slug]/[subSlug]` | Sub-category drill-down | Same ✅ |
| `/[locale]/search` | Hybrid search results | `getHybridSearchResults` ✅ |

**Shared needs:** FilterPanel (desktop), FilterBottomSheet (mobile), SortDropdown, Pagination, FilterChipsBar, SearchResultsHeader, "Smart search" badge.

### 🔴 P0 — Listing Detail
| Route | Purpose | Backend ready? |
|---|---|---|
| `/[locale]/listings/[id]` | Detail page (gallery, seller, CTA, safety tips, report) | `getListingById` ✅ |

**Shared needs:** Image gallery, SellerCard, PriceDisplay (3 modes: Fixed/Negotiable/Best Offer), Make Offer template, Contact Seller → chat, Report flow, Safety tips panel.

### 🟠 P1 — Sell Wizard
| Route | Step |
|---|---|
| `/[locale]/sell` | Entry / draft resume |
| `/[locale]/sell/category` | Step 1 — category picker |
| `/[locale]/sell/media` | Step 2 — 10 photos + optional video |
| `/[locale]/sell/details` | Step 3 — title, description, condition + Filter A (phone-in-title) + Filter B (counterfeit) |
| `/[locale]/sell/price` | Step 4 — 3 price modes + optional min offer |
| `/[locale]/sell/location` | Step 5 — governorate + area |
| `/[locale]/sell/delivery` | Step 6 — delivery options |
| `/[locale]/sell/authenticity` | Step 7 — luxury-only (receipt, serial) |
| `/[locale]/sell/preview` | Step 8 — review + publish |

**Shared needs:** WizardShell, StepIndicator, StepNavigation, PhotoUploader (canvas resize + WebP), VideoUploader, CategoryPicker, DetailsForm, PriceForm, LocationForm, DeliveryOptionsForm, AuthenticityForm, PreviewCard.

### 🟠 P1 — Auth
| Route | Purpose |
|---|---|
| `/[locale]/signin` | Email + phone OTP |
| `/[locale]/signup` | New account |
| `/[locale]/verify-otp` | OTP entry |
| `/[locale]/reset-password` | Request + confirm |

**Shared needs:** AuthCard, AuthMethodToggle (email/phone), OtpInput, PhoneInput.

### 🟡 P2 — Account
| Route | Purpose |
|---|---|
| `/[locale]/profile/[handle]` | Public profile + seller listings |
| `/[locale]/profile/me` | Own profile redirect |
| `/[locale]/profile/edit` | Edit profile |
| `/[locale]/my-listings` | Seller's listings (edit, mark sold, renew, delete) |
| `/[locale]/saved` | Favorites grid |

**Shared needs:** ProfileHeader, AvatarDisplay, AvatarUpload, HandleInput, SellerStatsBar, TrustSignalsStack, ProfileEditForm.

---

## 11. Pre-Build Checklist (Apply to Every New Page)

Before writing a new page, verify:

- [ ] **Route placement:** `app/[locale]/...` (protected routes go in `(app)` route group if needed for middleware)
- [ ] **i18n keys:** all strings in `messages/{en,ar}.json` under existing namespace
- [ ] **Server action / query exists** in `src/lib/` — don't write backend here
- [ ] **Card variant import** (if listings shown): aliased from shadcnblocks, never inline
- [ ] **Filter/sort** (if grid): reuse URL param helpers in `src/lib/browse/filters.ts`
- [ ] **Logical CSS properties only** — no `ml-*`/`mr-*` in new code
- [ ] **Western digits** — use `src/lib/format.ts` helpers for numbers/prices
- [ ] **Font utilities** — `font-sans`/`font-calSans`, never hardcoded font
- [ ] **Theme tokens** — `bg-background`, `text-foreground`, `border-border`, etc. — never `bg-white`/`text-black`
- [ ] **RTL flip** — any directional icon (chevron, arrow) flips via `rtl:rotate-180` or equivalent
- [ ] **Loading state** — Skeleton (Radix skeleton via `@/components/ui/skeleton` — needs to be re-added) or custom
- [ ] **Empty state** — written i18n copy, not generic "No results"
- [ ] **Error boundary** — `error.tsx` in route segment for user-facing failures
- [ ] **Mobile-first** — >70% traffic; test at `sm` (640px) breakpoint first

---

## 12. Workflow (Unchanged)

1. **Claude Design** = designs (user owns creative direction, not Cowork)
2. **Cowork** (this file's author) = writes code in `D:\Dealo Hub\` directly
3. **Claude Code** = runs `git` / `npm install` / `npm run dev` and reports results

**Forbidden:**
- Cowork designing without a reference
- Executing more than one logical step without founder approval
- Long briefs / design docs (`planning/` is locked unless founder asks for update)

---

## 13. Recommended Next Step

**Build `/[locale]/categories` (index) first.**

Why this page:
- Smallest in P0 Browse track
- Reuses existing `categories.ts` + category icons
- Tests i18n + RTL for a grid layout
- Produces the design language for category pages before we commit to single-category layout
- Doesn't yet need the `ListingCard` variant — no live listings shown, just category tiles

After this ships, move to `/[locale]/categories/[slug]` which introduces the FilterPanel + grid + ListingCard variant choice (and fixes the `queries.ts` stale import).

---

## 14. Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-19 | Initial BUILD-STATE snapshot after landing session | Cowork |
