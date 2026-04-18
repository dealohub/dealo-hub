# Dealo Hub

> The first AI-Protected C2C marketplace in the Gulf.
> Human-Written Listings. Trust-First Experience.

**Status:** Week 1 / Bootstrap Phase
**Launch target:** Kuwait → GCC
**Founder:** Fawzi Al-Ibrahim

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Supabase project (see `supabase/README.md`)
- OpenAI API key (for AI features)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase + OpenAI keys

# 3. Run database migrations + seeds (see supabase/README.md)
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

Open http://localhost:3000/ar (Arabic) or http://localhost:3000/en (English).

---

## Project Structure

```
Dealo Hub/
├── app/                          Next.js App Router
│   ├── layout.tsx                Root layout (metadata)
│   ├── [locale]/
│   │   ├── layout.tsx            Locale layout (RTL/LTR + i18n provider)
│   │   └── page.tsx              Home page (placeholder)
│   └── globals.css               Tailwind + base styles
│
├── src/
│   ├── components/               UI components (populated in Sprints 1+)
│   ├── lib/
│   │   ├── categories.ts         10-category taxonomy (source of truth)
│   │   ├── utils.ts              cn(), slugify(), invariant()
│   │   ├── format.ts             formatPrice(), formatTimeAgo(), etc. (Western digits!)
│   │   └── supabase/
│   │       ├── client.ts         Browser client (RLS-respecting)
│   │       └── server.ts         Server + admin clients
│   ├── i18n/
│   │   ├── routing.ts            next-intl routing config
│   │   └── request.ts            Per-request locale loading
│   └── types/                    TypeScript types (database.ts generated from Supabase)
│
├── messages/                     Translation files
│   ├── ar.json                   Arabic (default)
│   └── en.json                   English
│
├── supabase/                     Database (see supabase/README.md)
│   ├── migrations/               8 migration files (schema)
│   └── seed/                     Countries + cities + categories
│
├── planning/                     Strategic planning docs
│   ├── EXECUTIVE-SUMMARY.md      1-page overview
│   ├── MASTER-PLAN.md            Full project plan
│   ├── DECISIONS.md              9 locked decisions
│   ├── LAUNCH-STRATEGY.md        Categories + Plan B + Playbook
│   ├── COMPETITOR-DUBIZZLE.md    Primary competitor analysis
│   └── GCC-READINESS.md          Multi-country architecture
│
├── design/                       Design specifications
│   └── AI-FEATURES.md            AI layer specification
│
├── data/
│   └── categories-reference.md   Human-readable categories doc
│
├── DESIGN.md                     Design system v2.1 (2,674 lines)
├── middleware.ts                 Locale + country detection
├── next.config.js                Next.js config (with next-intl plugin)
├── tailwind.config.ts            Design tokens + RTL plugin
└── tsconfig.json                 TypeScript strict mode
```

---

## Key Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run format` | Prettier |
| `npm run db:push` | Apply Supabase migrations |
| `npm run db:seed` | Seed countries + cities + categories |
| `npm run db:types` | Generate TypeScript types from Supabase schema |

---

## Architecture Principles

### 1. RTL-First
- Every component uses logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`)
- Arabic is default locale
- Western digits mandatory (per DECISIONS.md + DESIGN.md)

### 2. GCC-Ready from Day 1
- `country_code` on every relevant row
- Only `KW` active in V1; others seeded as dormant
- Activation = single SQL update, no retrofit needed

### 3. AI-Assisted, Not AI-First
- AI extracts structured data; humans write descriptions
- `Human-Written` badge shown on listings without AI acceptance
- Granular telemetry in listings table for Decision 9 monitoring

### 4. Trust-First Moat
- Phone numbers never exposed (chat-only)
- Luxury category requires video + authenticity statement
- Fraud pipeline runs before publish

### 5. Minor Units Everywhere
- Prices stored as `BIGINT` (fils for KWD, halalas for SAR)
- No floats. Ever.
- `formatPrice(125500n, 'KWD', 'ar')` → "د.ك 125.500"

---

## Development Conventions

### File naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts` or `camelCase.ts`
- Pages: lowercase folders with `page.tsx` (Next.js convention)

### Imports
Use `@/*` path alias:
```ts
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/categories';
```

### Tailwind — RTL rules
❌ `ml-4 pr-2 text-left`
✅ `ms-4 pe-2 text-start`

Lint will warn on violations. Run `npm run lint`.

### Committing
- One logical change per commit
- Reference task IDs: "Task #9: Next.js bootstrap"
- Never commit `.env.local` or `gcp-vision-credentials.json`

---

## Deployment

Target platform: **Vercel** (free tier through Phase 1).

Required env vars in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GCP_VISION_CREDENTIALS_BASE64` (for Vercel — use base64-encoded JSON)
- `NEXT_PUBLIC_APP_URL`

Domain setup (after Task #2):
- Primary: `dealohub.com`
- Add `dealohub.com.kw`, `dealohub.sa`, `dealohub.ae` as aliases

---

## Status

### Week 1 (current)
- [x] Task #1: Category taxonomy
- [x] Task #6: Supabase schema v1
- [x] Task #9: Next.js 14 bootstrap (this commit)
- [ ] Task #3: Landing page
- [ ] Task #11: AI prompt library
- [ ] Task #12: SEO blog post

### Reference
- Full plan: `planning/MASTER-PLAN.md`
- Design system: `DESIGN.md` (v2.1)
- AI spec: `design/AI-FEATURES.md`

---

## License

Proprietary. © 2026 Dealo Hub. All rights reserved.
