# Phase 9 — Admin Dashboard: Discovery, Plan & Handoff

> **Author:** Claude Code (design+impl session with fawzi.al.ibrahim@gmail.com) · **Date:** 2026-04-23
> **Status:** 🟡 DISCOVERY COMPLETE · IMPLEMENTATION NOT YET STARTED — awaiting go-ahead on role model + dashboard variant
> **Scope:** Admin-only surface at `/[locale]/admin/*` to moderate listings, manage users, process AI-review queue, and edit categories. Out of scope: public-facing UX changes, new moderation policies (we wire existing enum states), analytics infrastructure.
> **Depends on:** existing auth (`src/lib/auth/`) · existing middleware (`middleware.ts` + `src/lib/supabase/middleware-auth.ts`) · existing design tokens (`app/globals.css` HSL palette, stabilised 2026-04-23) · `profiles` table (migration 0003) · `listings.status` + `ai_reviews.status` enums (migration 0002)
> **Reference source:** user's licensed Premium `shadcn-admin-kit` v2.0.0 — extracted to `D:\Dealo Hub\admin-kit\` (git-ignored — template reference only, never compiled/deployed from this path)

---

## Executive Summary

`MASTER-PLAN.md §213` explicitly deferred an advanced admin dashboard on the grounds that "Supabase dashboard + SQL queries كافية." **User is overriding that decision** now, in advance of public launch, specifically to get self-serve control over listings and users without leaving the app. The existing schema already anticipates admin moderation — `listings.status` has `'held'` (admin review queue) and `'rejected'`; `ai_reviews.status` has `'held'`, `'approved_manual'`, `'rejected'` — so the database is ready; what's missing is a person-identity model (`profiles.is_admin`), a route group, and UI. This phase adds all three.

The user holds a Premium Lifetime license to `shadcnblocks-admin` v2.0.0 and extracted it locally. **It is not usable as a drop-in** — it ships Next 16 + React 19 + Tailwind v4 + OKLCH tokens + `@tabler/icons-react` + mock data + no i18n + no RTL + no auth integration, against our Next 14 + React 18 + Tailwind 3.4 + HSL tokens + `lucide-react` + Supabase + next-intl + RTL-default stack. The integration cost of Next 16→14 downgrade alone outweighs re-authoring. **The chosen strategy is to port individual components** (shell, sidebar, 1–2 data-table patterns, 1 dashboard variant) into `src/components/admin/` and rewrite them against our tokens + RTL + next-intl + Supabase. The Admin Kit stays on disk as a reference only.

Three phases. **Phase 9a** (this session, 3–4h) ships role model + shell + listings moderation — the 80% of daily admin value. **Phase 9b** ships users + ai-reviews + categories. **Phase 9c** polishes, adds tests, commits i18n completeness. No admin feature goes public without bilingual strings + RTL pass + `/ultrareview` green.

---

## 0. Existing Schema Surface (What's Already Admin-Ready)

The Phase-3 schema was designed anticipating admin operations even though the dashboard was deferred. Relevant columns and enums as of migration `0040`:

| Table | Column | Admin-relevant values | Who sets today |
|---|---|---|---|
| `profiles` | `is_banned BOOLEAN` + `ban_reason TEXT` | Manual per-user suspension | — (no UI exists) |
| `profiles` | `is_founding_partner BOOLEAN` | Curated launch badge | — (hand-inserted via SQL) |
| `profiles` | `id_verified_at TIMESTAMPTZ` | KYC (V2 — not populated) | — |
| `listings` | `status` enum | `'draft'`, `'pending'`, `'active'`, **`'held'`**, `'sold'`, `'archived'`, **`'rejected'`** | Sellers set draft→pending on publish; admin transitions `'held'` and `'rejected'` |
| `listings` | `verification_tier` | `'unverified'`, `'dealer'`, `'dealo_inspected'` | — (no UI; `dealo_inspected` needs admin grant) |
| `listings` | `is_featured BOOLEAN` · `is_hot BOOLEAN` | Curated badges | — |
| `ai_reviews` | `status` enum | `'approved_auto'`, **`'held'`**, **`'approved_manual'`**, **`'rejected'`** | Pipeline writes `'held'` on low-confidence; admin resolves to `'approved_manual'` or `'rejected'` |
| `categories` | `is_active BOOLEAN` | Hide sub-cats without deleting | — |

**Missing entirely:** any column that identifies a user as an admin. `profiles` has `is_banned` + `is_founding_partner` but no `is_admin`. This is the first blocker.

---

## 1. Discovery — Admin Kit Inventory & Gap Analysis

### 1.1 What's in `admin-kit/`

Filesystem survey of `D:\Dealo Hub\admin-kit\`:

```
src/
  app/
    (admin)/
      ecommerce/         (products, orders, customers, shipments, dashboards 1-9, layout)
      developers/        (devtools)
      original/          (generic dashboards 10-12, users, tasks, settings)
      layout.tsx         SidebarProvider + AppSidebar + Header
    (auth)/              login/register/forgot-password UI (no real auth)
    (errors)/            401/403/404/500/503 pages
    layout.tsx           theme-provider + font loading
    globals.css          Tailwind v4 + OKLCH tokens
  components/
    layout/              ⭐ admin-shell, app-sidebar, nav-group, nav-user, team-switcher, header(+3 header-* panels), sub-header, types.ts
    ui/                  40 shadcn v4 primitives (accordion → tooltip)
    ecommerce/           30 feature blocks (product-list-1..4, dashboard-1..9, customer-list-1, order-list-1..3, product-detail-1..2, order-detail-1..2, customer-detail-1, shipment-*, editors)
    errors/              error page shells
  data/
    sidebar-data.tsx     nav config driving app-sidebar
    site.ts              brand constants
  hooks/                 use-mobile, use-dialog-state
  lib/                   mock-data generators (ecommerce-*.ts), theme-presets, filter helpers
```

Key component sizes (LOC):

| Component | Lines | Purpose |
|---|---:|---|
| `components/layout/admin-shell.tsx` | 29 | SidebarProvider + AppSidebar + content slot |
| `components/layout/app-sidebar.tsx` | 34 | Data-driven from `sidebar-data.tsx` |
| `components/ui/sidebar.tsx` | ~750 | shadcn Sidebar primitive (SidebarProvider, collapsible=icon variant, keyboard shortcut) |
| `components/ecommerce/product-list-1.tsx` | **1228** | Full data table: tabs by status, filters, search, bulk actions, URL sync |
| `components/ecommerce/customer-list-1.tsx` | **1347** | Same pattern for users |
| `components/ecommerce/dashboard-3.tsx` | 1866 | KPI cards + revenue chart + transactions table |
| `components/ecommerce/dashboard-7.tsx` | 2262 | Sales pipelines (heavier, less fit for marketplace) |
| `data/sidebar-data.tsx` | 380 | Nav schema — 4 groups × N items × sub-items |

### 1.2 Stack gap matrix

| Dimension | Admin Kit | Dealo Hub | Porting action |
|---|---|---|---|
| Next.js | **16.1.6** | **14.x** | Rewrite `use cache`/`cacheLife` directives · check `cookies()` API difference · drop React 19 ref-as-prop calls |
| React | **19.2.4** | **18.x** | Replace `useActionState` → `useFormState` · restore `forwardRef` where ref is passed |
| Tailwind | **v4** (`@import "tailwindcss"` + `@plugin`) | **3.4.6** | Rewrite globals.css imports · every `@theme` directive → `tailwind.config.ts` entry · re-check all `bg-sidebar-*` tokens (we don't define them; map to `bg-muted` / `bg-card`) |
| Color tokens | **OKLCH** | **HSL** (stabilised 2026-04-23, marketplace brand red `357 94% 46%`) | Do NOT import admin-kit's globals.css; map component-level `bg-primary` etc. to our HSL vars via existing `tailwind.config.ts` |
| Icon library | `@tabler/icons-react` | `lucide-react` | **Decision needed** — add tabler (~100KB gzipped tree-shaken, 30-40 icons used) vs hand-port to lucide |
| Data layer | Mock (`lib/ecommerce-*.ts`) | Supabase RLS | Replace every mock import with real `src/lib/admin/*` query module |
| i18n | none | `next-intl` (AR default RTL / EN LTR) | Every hard-coded string → `t('admin.xxx')` key · 2 JSON files to extend (`messages/ar.json`, `messages/en.json`) |
| Directionality | LTR-only | **RTL-default** | `mr-*`/`ml-*`/`left-*`/`right-*` → `me-*`/`ms-*`/`start-*`/`end-*` · add `rtl:rotate-180` on forward-direction icons |
| Auth | none (pages are stubs) | Supabase SSR + cookie refresh (`src/lib/supabase/middleware-auth.ts`) | Add `/admin` to `PROTECTED_PATH_SEGMENTS` **and** add a stronger `isAdminPath` check that queries `profiles.is_admin` |
| Routing | `/ecommerce/products/...` | `/[locale]/admin/...` | Rewrite every URL in `sidebar-data.tsx` |

### 1.3 Why "port" beats "clone wholesale"

A full clone would require: Next 16→14 downgrade across ~50 files · Tailwind v4→3.4 CSS layer rewrite · RTL retrofit on every margin/padding · next-intl wrap on every string · tabler→lucide on every icon · replacing 20 mock-data modules with Supabase queries. **Estimated: 2–3 sessions of pure translation with zero new value.** Porting the 5–6 components we actually need costs one session and lets us tailor to Dealo Hub's entities as we go.

---

## 2. Architectural Decisions

### 2.1 Role model — `is_admin BOOLEAN` (recommended)

Three options surveyed:

| Option | Schema diff | RLS burden | Fit for today | Upgrade path |
|---|---|---|---|---|
| ✅ **`is_admin BOOLEAN`** | 1 column + 1 index | 1 `USING` clause per admin policy | **100%** — we have one admin (Fawzi) | `role user_role NOT NULL DEFAULT CASE WHEN is_admin THEN 'admin' ELSE 'user' END`, drop `is_admin` — two SQL statements, zero app-code change |
| `user_role` enum (`user`/`moderator`/`admin`/`superadmin`) | 1 enum + 1 column | ~15 policy rewrites for tiered access | overkill | — |
| `admin_users` table + JSONB permissions | 1 table + 1 FK | middleware fetches perms per request | overkill | — |

**Recommendation: `is_admin BOOLEAN`.** The upgrade path to tiered roles is cheap; the cost of tiered roles today (policy sprawl, untestable combinations, no consumer) is not.

### 2.2 Bootstrap — Seed in migration

User's email `fawzi.al.ibrahim@gmail.com` must become admin on migration apply. Cleanest option: a migration `UPDATE profiles SET is_admin = TRUE FROM auth.users WHERE profiles.id = auth.users.id AND auth.users.email = 'fawzi.al.ibrahim@gmail.com'` that no-ops safely if the user hasn't signed up yet (then we run it again later). This keeps the seed in version control and makes staging/prod parity explicit.

### 2.3 Route protection — layered

Middleware-level: extend `PROTECTED_PATH_SEGMENTS` with `'/admin'` so unauthenticated users bounce to `/signin` (reuses existing flow). **Not sufficient alone** — a signed-in non-admin would reach the layout.

Layout-level guard: `app/[locale]/admin/layout.tsx` runs a server-side `SELECT is_admin FROM profiles WHERE id = auth.uid()` and returns `notFound()` (not `redirect('/signin')` — the user IS signed in, and we don't want to expose that `/admin` exists).

RLS-level: any admin-scoped mutation (e.g., approving a held listing) runs under `SECURITY DEFINER` RPCs that check `is_admin` internally. **Never trust the client to claim admin status.**

### 2.4 Component-porting strategy — `src/components/admin/`

New directory, mirrors the admin-kit structure:

```
src/components/admin/
  layout/
    admin-shell.tsx          ← ported from admin-kit (simplified: no team-switcher for v1)
    app-sidebar.tsx           ← ported, rewritten for our nav
    header.tsx                ← ported, RTL + i18n
    nav-group.tsx             ← ported, uses next-intl Link
    nav-user.tsx              ← ported, wired to real Supabase user
  listings/
    listings-table.tsx        ← ported from product-list-1, rewritten against listings schema
    listings-filters.tsx      ← extracted from product-list-1
  users/                      ← Phase 9b
  ai-reviews/                 ← Phase 9b
  categories/                 ← Phase 9b

src/lib/admin/
  queries.ts                  ← getListingsPage, getUsersPage, getAiReviewsQueue, etc.
  actions.ts                  ← approveListing, rejectListing, holdListing, banUser, grantAdmin
  guards.ts                   ← requireAdmin() helper for layouts + actions
```

`components/ui/sidebar.tsx` already exists in our project (we use shadcn). If our version lacks `collapsible="icon"` variant we port the admin-kit's sidebar primitive in full; otherwise we reuse ours.

### 2.5 Nav schema — 5 groups (v1 scope)

```ts
// src/data/admin-sidebar.ts
export const adminNav = [
  { title: 'overview', items: [
    { title: 'dashboard',   url: '/admin',              icon: LayoutDashboard },
  ]},
  { title: 'moderation', items: [
    { title: 'listings',    url: '/admin/listings',     icon: Package, badge: 'held_count' },
    { title: 'aiReviews',   url: '/admin/ai-reviews',   icon: Bot,     badge: 'ai_held_count' },
  ]},
  { title: 'community', items: [
    { title: 'users',       url: '/admin/users',        icon: Users },
  ]},
  { title: 'catalog', items: [
    { title: 'categories',  url: '/admin/categories',   icon: FolderTree },
  ]},
  { title: 'system', items: [
    { title: 'settings',    url: '/admin/settings',     icon: Settings }, // Phase 9c
  ]},
];
```

Badges (red dot + count) on Listings and AI-Reviews are fed by a single `getAdminBadges()` RPC that returns counts of `held` items; surfaces urgency without extra navigation.

---

## 3. Entity Mapping: Admin Kit → Dealo Hub

| Admin Kit concept | Dealo Hub analog | Phase | Notes |
|---|---|---|---|
| Products | **Listings** (`listings`) | 9a | The primary moderation surface. Filter tabs: All / Pending / Active / Held / Rejected / Sold / Archived. Columns: thumbnail + title + category + price + dealer + status + verification_tier + created_at. Bulk: approve / reject / hold / feature. |
| Customers | **Users** (`profiles`) | 9b | Columns: avatar + name + handle + email (auth.users join) + country + listings_count + rating_avg + is_banned + is_admin + is_founding_partner + created_at. Row actions: ban, unban, grant/revoke admin, grant founding partner. |
| Orders | (deferred) | — | No transactional orders in Dealo Hub. Possibly repurpose for "transactions" / "inquiries" in Phase 10+. |
| Shipments | (not applicable) | — | Not relevant for a chat-moat marketplace. |
| Dashboards (9 variants) | **/admin overview** | 9a | Port ONE variant (likely `dashboard-3`), replace mock KPIs with: total active listings · listings pending review · new signups (24h) · messages (24h). |
| Dev Tools | (deferred) | — | API keys / webhooks not relevant for v1. |
| Settings | **/admin/settings** | 9c | General: site-wide toggles. Categories would also live here. |
| (new) | **AI Reviews queue** | 9b | Unique to Dealo Hub — human moderator resolves `ai_reviews.status = 'held'` rows. No Admin Kit analog. |

---

## 4. Phase Breakdown

### Phase 9a — Foundation + Listings Moderation (this session)

**Goal:** Admin can sign in, navigate to `/admin`, see a listings table with status tabs, approve/reject/hold individual listings, and execute bulk actions. Dashboard page exists but shows placeholder cards. Everything in AR + EN, RTL-correct.

**Deliverables:**
1. Migration `0041_profiles_is_admin.sql`: add `is_admin BOOLEAN NOT NULL DEFAULT FALSE` + index + RLS policy update + seed for Fawzi's email.
2. `src/lib/supabase/middleware-auth.ts`: add `/admin` to protected segments.
3. `src/lib/admin/guards.ts`: `requireAdmin()` server helper (called by layout + actions).
4. `src/lib/admin/queries.ts`: `getAdminBadges()`, `getListingsPage(filters, pagination)`.
5. `src/lib/admin/actions.ts`: `approveListing`, `rejectListing`, `holdListing` server actions (call admin RPCs).
6. New Supabase RPCs (in migration 0041): `admin_approve_listing(listing_id)`, `admin_reject_listing(listing_id, reason)`, `admin_hold_listing(listing_id)` — all `SECURITY DEFINER` with internal `is_admin` check.
7. `src/components/admin/layout/{admin-shell,app-sidebar,header,nav-group,nav-user}.tsx` (ported + rewritten).
8. `src/data/admin-sidebar.ts` (nav schema).
9. `app/[locale]/admin/layout.tsx` (guard + shell).
10. `app/[locale]/admin/page.tsx` (placeholder dashboard — real KPIs + chart deferred to 9c).
11. `app/[locale]/admin/listings/page.tsx` + `src/components/admin/listings/listings-table.tsx`.
12. `messages/ar.json` + `messages/en.json`: new `admin.*` namespace (~50 keys for v1).
13. Commit as `feat(phase-9a): admin shell + listings moderation`.

**Acceptance (must pass before 9b starts):**
- [ ] Signed-out user visiting `/ar/admin` → redirects to `/ar/signin?next=/ar/admin`.
- [ ] Signed-in non-admin visiting `/ar/admin` → 404 (server-side).
- [ ] Signed-in admin visiting `/ar/admin` → renders shell + sidebar + empty dashboard.
- [ ] `/ar/admin/listings` renders table with status-tab filters, badge counts, rows selectable.
- [ ] Approve/reject/hold actions work individually and in bulk. RLS rejects same calls from non-admin client session.
- [ ] AR render is RTL-correct (sidebar on right, chevrons flipped, numbers LTR inside RTL context).
- [ ] EN render is LTR-correct.
- [ ] `npx tsc --noEmit` clean (0 new errors).
- [ ] Lighthouse a11y ≥90 on `/admin/listings`.

### Phase 9b — Users + AI Reviews + Categories (next session)

1. `/admin/users` with search + country filter + row actions (ban/unban, grant/revoke admin, grant founding_partner).
2. `/admin/ai-reviews` — dedicated queue UI (card-per-review pattern, not a table; shows the flagged content side-by-side with AI reasoning, with approve/reject). Consumes `ai_reviews.status = 'held'`.
3. `/admin/categories` — tree view with drag-handle reorder + `is_active` toggle. No add/delete in 9b (taxonomy is curated via migrations).
4. Dashboard page (`/admin`) gets real KPIs + one chart (listings published per day, 14-day window).
5. Corresponding i18n + action modules + tests.

### Phase 9c — Polish, settings, tests, `/ultrareview`

1. `/admin/settings` — site-wide toggles (feature flags surfaced as env-readable settings).
2. Admin audit log table + UI (every admin action inserts a row; admin can see "who banned whom and when").
3. Vitest coverage for `src/lib/admin/actions.ts` (mutations) and `guards.ts` (auth fencing). RLS tests in `supabase/tests/` for admin-only RPCs.
4. `/polish` pass over all admin surfaces — spacing, tokens, RTL edge cases.
5. `/ultrareview` before merge.

---

## 5. Risks & Mitigations

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| R1 | Porting admin-kit sidebar primitive clashes with our existing shadcn sidebar | Medium | Medium | Audit our `src/components/ui/sidebar.tsx` first; if ≥shadcn v0.8 with `collapsible="icon"` we reuse; otherwise port kit's primitive wholesale (it's self-contained) |
| R2 | `@tabler/icons-react` bundle bloat if blindly imported | Low | Low | Enforce named imports (`import { IconPackage } from '@tabler/icons-react'`) — tree-shakeable |
| R3 | Non-admin discovers `/admin` URL exists because layout returns 404 too late (after fetching user) | Low | Low | Use Next 14 `notFound()` from layout; test that response headers/body match a genuine 404 |
| R4 | Bulk actions with 1000+ selected rows hit Supabase row timeout | Low | Medium | Cap bulk action size at 100 in UI; for larger batches use background job (Phase 9c) |
| R5 | RLS policy drift — admin RPCs accidentally callable by non-admins | Low | **High** | Every admin RPC starts with `IF NOT (SELECT is_admin FROM profiles WHERE id = auth.uid()) THEN RAISE EXCEPTION 'unauthorized'; END IF;`. Test in `supabase/tests/rls.sql`. |
| R6 | Audit log gap — actions happen without trace | Medium | Medium | Defer to 9c; acceptable for v1 because only Fawzi has admin. Upgrades to multi-admin MUST land audit log first. |
| R7 | Next 16 idioms in ported code fail silently on Next 14 (e.g., `'use cache'` directive) | Medium | Low | Review every ported file's top-of-file directives; strip React 19 / Next 16 exclusives |
| R8 | Admin-kit globals.css imported by accident, poisons our HSL tokens | Low | **High** | Never import `admin-kit/src/app/globals.css`. Add a `.gitignore` entry for `admin-kit/` to prevent future confusion — template is reference, not runtime. |
| R9 | i18n coverage incomplete at ship; falls back to key names in UI | Medium | Low | Grep test: `grep -r "admin\." messages/ar.json messages/en.json | wc -l` must match in both files |
| R10 | RTL regressions on newly-ported components (icons, chevrons, number alignment) | High | Low | Visual QA on every surface in both locales before commit |

---

## 6. Open Decisions (Resolved 2026-04-23)

Committed ahead of Phase 9a coding, under blanket authority "اعمل الذي تراه مناسب مع التوثيق".

### D1 — Role model → `is_admin BOOLEAN` ✅ SHIPPED
Implemented in migration `0041_profiles_is_admin.sql` (commit `1eb28d7`). Mirrors existing `is_dealer` / `is_founding_partner` pattern on profiles. SECURITY DEFINER `public.is_admin()` RPC wraps the check so RLS policies can call it without recursion. No enum, no separate table.

### D2 — Dashboard `/admin` home → **Option 4: empty placeholder** for Phase 9a
Rationale: Karpathy surgical-changes discipline. Phase 9a's user-visible goal is "admin can moderate listings" — the dashboard home is chrome, not the job. Porting `dashboard-3` (1866 LOC) on the same commit balloons the diff, risks KPI-source drift (we'd port fake "revenue" and have to rewire it against real counts), and delays listings moderation shipping. Placeholder shows: admin welcome + count badges reused from the sidebar + a visible "dashboard landing coming in 9b" hint. Real dashboard port lands in 9b alongside AI-reviews queue.

### D3 — Icon library → **`lucide-react`** (existing dep)
Verified all Phase 9 icons exist in lucide: `LayoutDashboard`, `Package`, `Bot`, `Users`, `FolderTree`, `Settings`, `PanelLeft`, `ChevronRight`, `ChevronsUpDown`, `LogOut`, `Bell`, `Search`, `Command`. Zero new dep, zero bundle growth, one icon family across the entire app (marketplace + admin). If 9c/10+ needs an icon without a lucide analog, revisit then — not now on speculation.

---

## 7. Out-of-Scope for Phase 9 (Captured, Not Ignored)

- **Multi-admin invitation flow.** Today only Fawzi. When a second admin joins, we need (a) audit log live (9c), (b) a UI to grant/revoke from an existing admin (lands in 9b `/admin/users` already), (c) email notification on role change.
- **Admin impersonation ("view as user").** Useful for debugging but security-heavy. Defer to post-launch.
- **Bulk export (CSV/XLSX).** Supabase Dashboard covers this today; add only if user requests after using 9a-9c for a week.
- **Scheduled/cron admin actions.** E.g., auto-expire listings older than X days. Defer.
- **Admin mobile app / PWA chrome.** Desktop-first for v1; sidebar collapses to bottom-sheet on mobile viewports courtesy of the shadcn sidebar primitive, but we don't design native mobile.
- **Analytics dashboards beyond the basic KPI strip.** PostHog + Sentry DSNs are wired (Phase 5g) but unpopulated; real analytics belongs in its own phase with data-warehouse decisions.

---

## 8. Onboarding for a Fresh Session

If a future Claude Code session picks this up cold, this sequence reconstructs context in ≤10 min:

1. Read **this file** (`planning/PHASE-9-ADMIN-DASHBOARD.md`) top-to-bottom.
2. Read `planning/MASTER-PLAN.md §213` — confirms admin was deferred and this phase explicitly overrides that.
3. Read `supabase/migrations/0002_enums_reference.sql` (lines 20-23, 58-60) — confirms `held` + `rejected` enum values exist on `listings.status` and `ai_reviews.status`.
4. Read `supabase/migrations/0003_profiles.sql` — confirms `is_admin` does NOT exist yet; the first deliverable adds it.
5. Read `middleware.ts` + `src/lib/supabase/middleware-auth.ts` — understand the auth+protection pattern this phase extends.
6. `ls D:/Dealo\ Hub/admin-kit/src/components/layout/` — see what we're porting from.
7. Check git log: last relevant commits are `9ba3297 refactor(theme): unify hardcoded #e30613 on bg/text/border-primary token` and `2a539bc polish(live-feed): remove tile frame borders from bento grid`. Both land the tokens this phase will use.
8. Answer D1/D2/D3 in §6 → start Phase 9a.

---

## 9. Design Discipline (CLAUDE.md compliance)

Per `CLAUDE.md §Design skills discipline`, every UI-building session must invoke a skill. Expected invocations for this phase:

| Phase | Skill | When |
|---|---|---|
| 9a | `impeccable` (Context Gathering — Design Context already established for this project) | Before writing the shell/sidebar/table components |
| 9a | `polish` | Before commit, after functional work lands |
| 9b | `impeccable` again | Before writing the ai-reviews queue UI (novel surface, not a port) |
| 9c | `critique` + `/ultrareview` | Before merging to master |

No design work ships without a skill invocation on record. No git push until design + polish + tests all green (standing rule, `CLAUDE.md`).

---

## 10. Decision Log (Appendix — fill as we go)

| Date | Decision | Rationale | Who |
|---|---|---|---|
| 2026-04-23 | Port, not clone, Admin Kit | Stack gap matrix §1.2 — Next 16→14 + Tailwind v4→3.4 + RTL + i18n + Supabase = 2-3 sessions of pure translation | Claude + user |
| 2026-04-23 | Admin Kit stays on disk as reference only | Template is licensed for user's reuse but not deployable as-is from `D:\Dealo Hub\admin-kit\` | Claude |
| 2026-04-23 | **pending** | `is_admin BOOLEAN` vs `user_role` enum | — |
| 2026-04-23 | **pending** | `dashboard-3` vs empty placeholder vs other | — |
| 2026-04-23 | **pending** | `@tabler/icons-react` vs hand-port to lucide | — |

---

*End of Phase 9 plan. Update §6 and §10 when D1/D2/D3 are settled, then proceed to Phase 9a execution.*
