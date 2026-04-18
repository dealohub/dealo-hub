# Supabase — Dealo Hub Database

Schema v1 migrations + seed data for Dealo Hub C2C marketplace.

## Structure

```
supabase/
├── README.md                          (this file)
├── migrations/
│   ├── 0001_extensions.sql            Extensions (pgvector, pg_trgm, citext, unaccent)
│   ├── 0002_enums_reference.sql       Enums + countries/cities/areas schema
│   ├── 0003_profiles.sql              User profiles (extends auth.users)
│   ├── 0004_categories.sql            Categories table (hierarchical)
│   ├── 0005_listings.sql              Listings + images + videos
│   ├── 0006_social.sql                Messaging + favorites + ratings + reports
│   ├── 0007_ai_layer.sql              Fraud events + image hashes + embeddings
│   └── 0008_rls_and_functions.sql     RLS policies + triggers + functions
└── seed/
    ├── 0001_countries.sql             6 GCC countries (KW active, others dormant)
    ├── 0002_cities_kw.sql             6 Kuwait governorates + ~50 areas
    └── categories.sql                 10 main + 54 sub-categories
```

## Prerequisites

1. Supabase project created
2. **Region: ap-south-1 (Mumbai)** — lowest GCC latency per GCC-READINESS.md
3. pgvector extension enabled (Database > Extensions > vector)
4. Environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
   SUPABASE_SERVICE_ROLE_KEY=eyJhb...   # server-only
   ```

## Applying Migrations

### Option A: Supabase CLI (Recommended)

```bash
# Install CLI (one-time)
brew install supabase/tap/supabase   # macOS
# OR: scoop install supabase          # Windows

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations in order
supabase db push

# Then seed
psql $SUPABASE_DB_URL -f supabase/seed/0001_countries.sql
psql $SUPABASE_DB_URL -f supabase/seed/0002_cities_kw.sql
psql $SUPABASE_DB_URL -f supabase/seed/categories.sql
```

### Option B: Supabase SQL Editor (Manual)

Run files in this exact order:
1. `migrations/0001_extensions.sql`
2. `migrations/0002_enums_reference.sql`
3. `migrations/0003_profiles.sql`
4. `migrations/0004_categories.sql`
5. `migrations/0005_listings.sql`
6. `migrations/0006_social.sql`
7. `migrations/0007_ai_layer.sql`
8. `migrations/0008_rls_and_functions.sql`
9. `seed/0001_countries.sql`
10. `seed/0002_cities_kw.sql`
11. `seed/categories.sql`

## Key Design Decisions

**See `planning/DECISIONS.md` for full rationale.**

| # | Schema Reflection |
|---|---|
| 1 | `expires_at`, `archived_at`, `renewed_count`, `last_renewed_at` on listings |
| 2 | Phone number hidden; chat-only in `messages` table |
| 3 | `price_mode` enum + `min_offer_minor_units`; `sent_as_offer` on messages |
| 4 | `country_code` + `city_id` + `area_id` hierarchical |
| 5 | `listing_images` with position 0-9; luxury category enforces 8+ min |
| 6 | AI-Assisted philosophy: telemetry in listings table |
| 7 | GPT-4o-mini for 90%; data captured in `fraud_events.details` JSONB |
| 8 | AI telemetry columns: `ai_*_suggested`, `ai_*_accepted`, `ai_*_confidence` |
| 9 | `ai_any_accepted` computed column drives "Human-Written" badge |

## GCC-Ready Schema

- `countries`: 6 GCC countries seeded, only `KW` active in V1
- `listings.country_code` + `currency_code` on every row
- Prices stored as `BIGINT` minor units (no floats)
- RLS policy filters listings by `active_country_codes()`

**Phase 2 activation:** `UPDATE countries SET is_active = true WHERE code = 'AE';`

## AI Layer

- `listing_embeddings` — vector(1536) for semantic search + dedup
- `image_hashes` — pHash cache for reverse image search
- `fraud_events` — audit log for all fraud pipeline runs
- `category_pricing_stats` — materialized view for V2 Smart Pricing

Refresh pricing stats nightly:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY category_pricing_stats;
```

## Cron Jobs (Supabase Edge Functions or pg_cron)

Daily:
```sql
-- Expire listings past 30 days
SELECT expire_listings();

-- Soft-delete archived listings past 7 days
SELECT soft_delete_old_archives();

-- Refresh pricing stats (V2)
REFRESH MATERIALIZED VIEW category_pricing_stats;
```

## RLS Safety Verification

After migrations, test RLS works:

```sql
-- As authenticated user (replace UUID)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<user-uuid>';

-- Should only see own drafts + everyone's live listings
SELECT id, status, seller_id FROM listings LIMIT 10;
```

## Verification Checklist

After running all migrations + seeds:

```sql
-- Should return 6
SELECT COUNT(*) FROM countries;

-- Should return 6
SELECT COUNT(*) FROM cities WHERE country_code = 'KW';

-- Should return 40+
SELECT COUNT(*) FROM areas WHERE city_id IN (SELECT id FROM cities WHERE country_code = 'KW');

-- Should return 10 main + 54 sub = 64 total
SELECT COUNT(*) FROM categories;

-- Should return 'KW' only
SELECT code FROM countries WHERE is_active = true;

-- Should list pgvector, pg_trgm, citext, unaccent
SELECT extname FROM pg_extension WHERE extname IN ('vector','pg_trgm','citext','unaccent');
```

## Migration Philosophy

- **Each migration is idempotent** when possible (CREATE IF NOT EXISTS)
- **Migrations are append-only** — never edit a committed migration; write a new one
- **Breaking changes get a new migration file** with clear documentation
- **RLS enabled on every table** from day 1 (no "we'll add RLS later")

## Further Reading

- `planning/MASTER-PLAN.md` — Full project plan
- `planning/DECISIONS.md` — 9 locked decisions matrix
- `planning/GCC-READINESS.md` — Multi-country architecture rationale
- `design/AI-FEATURES.md` — AI layer specification
- `DESIGN.md` — UI design system
