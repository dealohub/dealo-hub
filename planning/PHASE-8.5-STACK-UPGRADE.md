# Phase 8.5 — Stack Upgrade (Next 14 → 16, React 18 → 19, Tailwind 3 → 4)

> **Status**: Planning — awaiting user approval before first commit
> **Blocks**: Phase 9 (admin dashboard) — Phase 9a commits 1 & 2 already landed (SQL + middleware, both version-independent) and survive the upgrade untouched
> **Estimated work**: 6–8 commits across 3–5 sessions
> **Written**: 2026-04-23
> **Triggered by**: Admin Kit (admin-kit/) requires Next 16 + React 19 + Tailwind v4; user chose option A ("full upgrade now") over porting on current stack

---

## Table of contents

0. [Current vs target state](#0-current-vs-target-state)
1. [Migration order + justification](#1-migration-order--justification)
2. [Per-commit breakdown](#2-per-commit-breakdown)
3. [Risk register](#3-risk-register)
4. [Rollback strategy](#4-rollback-strategy)
5. [Breaking changes cheatsheet](#5-breaking-changes-cheatsheet)
6. [Regression checklist](#6-regression-checklist)
7. [What does NOT change](#7-what-does-not-change)
8. [Post-upgrade validation](#8-post-upgrade-validation)
9. [Open decisions](#9-open-decisions)

---

## 0. Current vs target state

| Dependency | Current | Target | Delta | Risk |
|---|---|---|---|---|
| next | 14.2.35 | 16.1.6 | +2 major | 🔴 HIGH (async params, caching, Turbopack) |
| react / react-dom | 18.3.1 | 19.2.4 | +1 major | 🟡 MED (removed APIs, types) |
| @types/react | 18.3.3 | 19.x | +1 major | 🟢 LOW (handled by codemod) |
| tailwindcss | 3.4.6 | 4.2.1 | +1 major | 🔴 HIGH (CSS-first @theme, new engine) |
| @tailwindcss/postcss | ❌ | 4.2.1 | NEW | 🟢 LOW (straight swap with old config) |
| tailwindcss-logical | 3.0.1 | ❌ REMOVE | drop | 🟢 LOW (unused — not in plugins[]; Tailwind 3.3+ has built-ins) |
| next-intl | 3.26.5 | 4.x | +1 major | 🟡 MED (middleware API changes) |
| eslint | 8.57.0 | 9.x | +1 major | 🟢 LOW (flat config, mostly mechanical) |
| eslint-config-next | 14.2.35 | 16.x | +2 major | 🟢 LOW (tracks Next) |
| @supabase/ssr | 0.4.0 | 0.6.x | +2 minor | 🟡 MED (cookie API shifted to getAll/setAll) |
| @supabase/supabase-js | 2.45.0 | 2.50+ | minor | 🟢 LOW |
| @radix-ui/react-dialog | 1.1.1 | 1.1.x | patch | 🟢 LOW |
| @radix-ui/react-dropdown-menu | 2.1.1 | 2.1.x | patch | 🟢 LOW |
| lucide-react | 0.414.0 | 0.577.0 | minor | 🟢 LOW (additive icons only) |
| typescript | 5.5.3 | 5.9.x | minor | 🟢 LOW |
| @tabler/icons-react | ❌ | 3.38.x | NEW (from Phase 9 D3) | 🟢 LOW |

### Codebase impact surfaces (measured)

- **33 files** use `params` destructuring — all need `await params` under Next 15+
- **4 files** use `searchParams` — same
- **4 files** use `forwardRef` — optional refactor under React 19 (can stay)
- **5 files** use logical classes (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) — work natively in Tailwind 3.3+ and v4, no change needed
- **globals.css** has 30 HSL token definitions (103 lines) — migrate to `@theme` block

---

## 1. Migration order + justification

Rules:
1. **Upgrade in small hops, not big-bang.** Each commit = one dependency family, tests green before moving on.
2. **Next 14 → 15 first.** Next 15 is the "async params" barrier. Getting past it unlocks Next 16. Doing 14→16 directly is double-trouble because Next 16 breaks additional things (Turbopack, caching) on top of 15's breaks.
3. **Tailwind AFTER Next**, not before. Tailwind v4 migration is visual — easier to isolate regressions when Next is stable.
4. **React 18 → 19 after Tailwind**, because React 19 type changes touch many files; doing it while Tailwind is also in flight doubles the mental load.
5. **Next 15 → 16 last.** Needs React 19 (enforced by Next 16 peer deps).
6. **Cleanup commit at the end**, not interleaved. Mixing "remove unused deps" with "upgrade X" hides regressions.

### Final order

```
A → planning doc (this file)
B → Next 14 → 15        (+ eslint-config-next, ~33 files mechanical)
C → next-intl 3 → 4     (if B requires it; otherwise defer to G)
D → Tailwind 3.4 → 4    (+ @tailwindcss/postcss, CSS-first @theme)
E → React 18 → 19       (+ types, optional forwardRef cleanup)
F → Next 15 → 16        (Turbopack, unauthorized(), forbidden())
G → Dependency cleanup  (radix versions, lucide, supabase-ssr 0.6, eslint 9)
H → Regression sweep    (visual smoke, all locales × themes × routes)
```

Each commit: build + type-check + test must pass before moving to the next. No `git push origin` until H lands and passes smoke.

---

## 2. Per-commit breakdown

### Commit A — Planning doc (this file)
**Scope**: just this .md file
**Validation**: n/a (docs only)

### Commit B — Next 14 → 15 + React stays at 18
**Why React stays**: Next 15 supports both 18 and 19. Keeping React pinned isolates the Next-specific breakage.

**Changes**:
- `next@15` + `eslint-config-next@15`
- Run `npx @next/codemod@canary upgrade latest` on just the `next` parts
- Run `npx @next/codemod@latest next-async-request-api .` to auto-convert `params` / `searchParams` / `cookies()` / `headers()` / `draftMode()`
- Manual fixes for anything the codemod misses (Supabase server.ts cookies → async)
- Update `next.config.js` if needed (experimental flags renamed)
- Verify middleware still works (middleware API is stable across 14→15)

**Risk**: caching semantics — in Next 15, `fetch()` is no longer cached by default. Any silent reliance on fetch caching breaks. Audit all `fetch` + `revalidate` + route segment configs.

**Validation**:
- `npm run build` passes
- `npm run type-check` passes
- `npm test` passes (should stay at 734)
- Manual smoke: /ar, /en, /ar/browse/cars, /ar/listings/[slug] load correctly
- Auth flow: signin, signout work
- Admin middleware redirect: /ar/admin → /ar/signin (Phase 9a gate still holds)

### Commit C — next-intl 3 → 4 (conditional)
**Why conditional**: if Commit B reveals next-intl 3.26 still works on Next 15, defer to G. next-intl 4 requires mild config changes.

**Changes (if needed)**:
- `next-intl@4`
- `createMiddleware` return type may change
- `routing` config in `src/i18n/routing.ts` stays compatible
- Client hooks (`useTranslations`, `useLocale`) stay

**Validation**: all 16 `marketplace.*` namespaces render correctly in both AR and EN.

### Commit D — Tailwind 3.4 → 4
**Why now, not earlier**: Tailwind migration is visually impactful. Isolate it.

**Changes**:
- `tailwindcss@4` + `@tailwindcss/postcss@4`
- Remove `tailwindcss-logical` from package.json (unused; Tailwind 3.3+ has built-in logical classes and v4 confirms them)
- `postcss.config.js` → use `@tailwindcss/postcss` plugin only (drop `autoprefixer`, v4 includes it)
- `tailwind.config.ts` → delete; migrate content to `@theme { ... }` block inside `app/globals.css`
  - `fontFamily.sans` → `--font-sans: ...`
  - `fontFamily.calSans` → `--font-cal-sans: ...`
  - `colors.primary` etc → all tokens become `--color-primary` etc with `hsl()` wrappers already in place
  - `borderRadius.lg/md/sm` → `--radius-lg/md/sm`
  - `plugins: [tailwindcss-animate]` → `@plugin 'tailwindcss-animate'` in CSS (verify plugin is v4-compatible; may need `tw-animate-css` replacement)
- `darkMode: 'class'` → `@variant dark (&:where(.dark, .dark *))` in CSS
- Verify all HSL → `hsl(var(--x))` wrappers still work (v4 supports raw hsl() + var())

**Known gotcha**: `tailwindcss-animate` v1 may not be v4-compat. Check on upgrade; if broken, swap to `tw-animate-css` (admin-kit uses this).

**Validation**:
- Dev server renders correctly at /ar and /en
- Dark mode toggle still flips `.dark` class and colors update
- Visual smoke: hero, browse grid, listing detail, signin form, my-listings, messages thread
- RTL direction still correct on /ar (no `left` bleed)
- No broken class warnings in console

### Commit E — React 18 → 19
**Why after Tailwind**: React type changes touch many files, easier to land after Tailwind is stable.

**Changes**:
- `react@19` + `react-dom@19` + `@types/react@19` + `@types/react-dom@19`
- Run `npx types-react-codemod@latest preset-19 .` for type updates
- Audit removed APIs (none expected in our codebase: no `ReactDOM.render`, no `findDOMNode`, no string refs, no legacy context)
- Optional: 4 `forwardRef` files — leave as-is (works in 19) OR convert to `ref` as prop (stylistic)
- `useSyncExternalStore` from `use-sync-external-store/shim` → drop shim (use React's built-in)

**Validation**:
- Build + type-check + test
- Toast notifications work (sonner/radix toast)
- Client components with form state work (react-hook-form)
- Dropdown menus, dialogs, selects (radix) render correctly

### Commit F — Next 15 → 16
**Changes**:
- `next@16` + `eslint-config-next@16`
- Turbopack is the default bundler — test dev + build
- `dynamicIO` / `cacheComponents` are experimental; leave off unless we have a specific need
- Refactor `src/lib/admin/require-admin.ts` to use `forbidden()` from `next/navigation` instead of `notFound()` (Next 16 new primitive — semantically correct for "logged-in but not admin")
- Check middleware compatibility (should be stable)
- Update `tsconfig.json` module resolution if needed

**Validation**:
- Turbopack dev server starts + HMR works
- Production build succeeds
- /admin still 404s for non-admin authed users
- /admin redirects unauthed users to signin

### Commit G — Dependency cleanup
**Scope**: dependency hygiene, not behavior change.

**Changes**:
- `@supabase/ssr` 0.4 → 0.6 (migrate `cookies.get/set/remove` → `cookies.getAll/setAll`)
- `@supabase/supabase-js` 2.45 → 2.50+
- All `@radix-ui/*` to latest compatible versions (audit each)
- `lucide-react` 0.414 → 0.577
- `eslint` 8 → 9 (flat config migration — `.eslintrc.json` → `eslint.config.mjs`)
- `prettier` 3.3 → 3.6+
- `typescript` 5.5 → 5.9
- Add `@tabler/icons-react` (Phase 9 D3 decision)
- Remove `autoprefixer` (subsumed by @tailwindcss/postcss)

**Validation**:
- Full build + tests
- No new lint errors
- `npm outdated` shows nothing pinned red

### Commit H — Regression sweep + smoke
**Scope**: manual + automated testing only. No code changes unless blockers found.

**Visual smoke matrix** (13 high-risk routes × 2 locales × 2 themes = 52 screenshots):
- `/` (landing)
- `/browse` + category pages (cars, electronics, properties, home, services, jobs)
- `/listings/[slug]` (one per category — at least cars + electronics)
- `/signin`, `/signup`
- `/my-listings` (as admin user)
- `/messages` (as admin user with a thread)
- `/saved`
- `/sell`
- `/profile/me`
- `/admin` → should still redirect/404 per Phase 9a

**Functional smoke**:
- Auth: signin, signout, password reset
- Listing lifecycle: create draft → publish → archive → delete
- Chat: open conversation → send message → receive unread badge
- Favorites: save → unsave
- Search + filters
- Dark mode toggle
- Locale switch (AR ↔ EN)

**If regressions found**: patch in H or revert to last green commit and open follow-up.

---

## 3. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | `fetch` caching behavior change (Next 15) silently breaks ISR/SSG | HIGH | HIGH | Audit every `fetch()` call in commit B; add explicit `{ cache: 'force-cache', next: { revalidate: N } }` where behavior matters |
| R2 | `tailwindcss-animate` v1 incompatible with Tailwind v4 | MED | MED | Pre-check on install; swap to `tw-animate-css` if broken (admin-kit uses this) |
| R3 | Tailwind v4 class-generation differs, causes visual regressions | MED | HIGH | Commit D standalone + thorough visual smoke; deep review of any utility classes that changed semantics |
| R4 | Supabase SSR 0.4 → 0.6 cookie API breaks auth silently | MED | HIGH | Migrate cookie pattern in one focused commit (G); e2e auth test right after |
| R5 | next-intl middleware incompatibility with Next 15/16 | MED | HIGH | Test immediately after commit B; if it breaks, do C inline |
| R6 | Turbopack dev/build differs from webpack (Next 16 default) | MED | MED | Test `npm run dev` and `npm run build` after commit F; fall back to `--no-turbopack` flag if showstopper |
| R7 | Radix UI version bumps break unstyled primitives | LOW | MED | Pin to current minor in commit G, bump one at a time if needed |
| R8 | ESLint 8 → 9 flat config migration takes longer than expected | LOW | LOW | Time-box G; if eslint 9 migration is thorny, keep eslint 8 until a follow-up phase |
| R9 | React 19 type changes cause cascade of `@types/react` errors in node_modules | MED | LOW | `skipLibCheck: true` already set in tsconfig — errors in deps are already ignored |
| R10 | Admin-kit components STILL won't port cleanly after upgrade (unknown dependencies) | LOW | MED | Validate post-upgrade by attempting to port one component (AppSidebar) as a smoke test before continuing Phase 9a |
| R11 | Upgrade breaks unrelated feature we forgot about | MED | HIGH | Comprehensive H smoke matrix; keep every commit revertable |

---

## 4. Rollback strategy

Every commit must be independently revertable. Rules:

- **Reversibility**: each commit's `git revert <sha>` must yield a working build. This is the primary safety net.
- **Pinning**: in each package.json bump, pin to exact version (not `^`) so rollback is deterministic.
- **Lockfile discipline**: after rollback, run `rm -rf node_modules package-lock.json && npm install` to regenerate from the reverted package.json.
- **No cross-commit dependencies on behavior**: if E depends on D's visual changes being correct, they should be in the same commit.
- **Abandon point**: if we reach commit F and discover a fundamental Next 16 blocker, the stopping point is E (React 19 + Next 15 + Tailwind v4) — still a huge upgrade. Don't force F.

### What we CAN'T roll back
- Database schema changes (N/A for this phase — no migrations)
- Deployed production state (N/A — no push until H)

### Emergency reset
If things get deeply tangled, `git reset --hard 1e3ec35` (Phase 9a commit 2) returns to the known-green baseline. That's why we're not pushing until H.

---

## 5. Breaking changes cheatsheet

### Next 14 → 15
- ❌ `export default function Page({ params }: { params: { slug: string } })` → `await params`
- ❌ `export default function Page({ searchParams })` → `await searchParams`
- ❌ `cookies()` is sync → `await cookies()`
- ❌ `headers()` is sync → `await headers()`
- ❌ `fetch()` default is cached → default is uncached (opt-in via `cache: 'force-cache'`)
- ✅ `generateStaticParams` still sync
- ✅ Middleware API unchanged
- ✅ Server actions unchanged

### React 18 → 19
- ❌ `ReactDOM.render` → `createRoot` (we don't use)
- ❌ string refs → ref callbacks (we don't use)
- ❌ legacy context → new context API (we don't use)
- ✅ `forwardRef` still works (optional to refactor)
- ✅ Hooks unchanged
- ➕ `useActionState`, `useFormStatus`, `use()` new
- ➕ `ref` can be a prop (no forwardRef needed)

### Tailwind 3.4 → 4
- ❌ `tailwind.config.ts` deprecated → `@theme` block in CSS
- ❌ `@tailwind base/components/utilities` → `@import "tailwindcss"`
- ❌ `darkMode: 'class'` → `@variant dark (&:where(.dark, .dark *))`
- ❌ `plugins: []` → `@plugin '...'` in CSS
- ✅ Utility classes mostly unchanged
- ➕ CSS variables become first-class
- ➕ Container queries without plugin

### Next 15 → 16
- ❌ Webpack default → Turbopack default (opt-out via `--no-turbopack`)
- ➕ `forbidden()` from `next/navigation` → renders `forbidden.tsx`
- ➕ `unauthorized()` from `next/navigation` → renders `unauthorized.tsx`
- ❌ Some experimental flags promoted to stable, some removed

### @supabase/ssr 0.4 → 0.6
- ❌ `cookies.get(name)` / `cookies.set(name, value, options)` / `cookies.remove(name, options)`
- ✅ `cookies.getAll()` / `cookies.setAll(cookiesToSet)` (new unified API)

---

## 6. Regression checklist

After each commit (B–G):

```
[ ] npm run build
[ ] npm run type-check
[ ] npm test
[ ] npm run dev (HMR works, home page loads)
[ ] Manual: /ar loads, /en loads
[ ] Manual: dark mode toggle works
```

After commit H (full smoke):

```
Route checks (both locales, both themes):
[ ] / (landing)
[ ] /browse/cars
[ ] /browse/electronics
[ ] /browse/properties
[ ] /browse/home
[ ] /browse/services
[ ] /browse/jobs
[ ] /listings/[cars-slug]
[ ] /listings/[electronics-slug]
[ ] /signin
[ ] /signup
[ ] /my-listings (authed)
[ ] /messages (authed)
[ ] /saved (authed)
[ ] /sell (authed, all 6 category wizards)
[ ] /profile/me (authed)
[ ] /admin (unauthed → redirect to signin) ✅ Phase 9a gate
[ ] /admin (authed non-admin → 404) ✅ Phase 9a gate
[ ] 404 page renders
[ ] 500 error boundary renders

Flow checks:
[ ] Signup new user → profile auto-created via trigger
[ ] Signin existing user
[ ] Signout
[ ] Password reset email flow
[ ] Create listing draft → publish → view live → archive → delete
[ ] Send message in chat thread → unread badge updates
[ ] Save listing → appears in /saved
[ ] Unsave listing → disappears from /saved
[ ] Search + filter on /browse
[ ] Locale switch AR ↔ EN maintains current route
[ ] Theme toggle persists across reload
```

---

## 7. What does NOT change

To prevent scope creep, the following are explicitly out of scope:

- **Database schema**: 0041 migration from Phase 9a stays; no new migrations in this phase
- **Business logic**: no feature additions, no copy changes, no taxonomy changes
- **Design tokens**: HSL color values, font stack, spacing scale remain identical. Only the SYNTAX for declaring them changes (tailwind.config.ts → @theme CSS block)
- **Phase 9a work already committed**: migration 0041 + middleware + requireAdmin helper all survive untouched (version-independent code)
- **`.impeccable.md`**: design context unchanged
- **`CLAUDE.md`**: rules unchanged (may need a version-bump note after)
- **Translations**: `messages/ar.json` + `messages/en.json` unchanged
- **Seed data**: `supabase/seed/*` unchanged
- **Tests**: we add no new tests; existing tests must keep passing

---

## 8. Post-upgrade validation

Once H lands and smoke passes:

1. **Port test**: attempt to port `admin-kit/src/components/layout/app-sidebar.tsx` into `src/components/admin/app-sidebar.tsx` with ZERO translation effort (no class name rewrites, no react-19-to-18 shims). If it ports cleanly, the upgrade succeeded. If it doesn't, we missed something.
2. **Resume Phase 9a**: continue from commit 3/4 (admin shell port) — now trivial.
3. **Document in planning/PHASE-8.5-STACK-UPGRADE.md Appendix**: what broke, what took longer than expected, any leftover tech debt.

---

## 9. Open decisions

Before starting commit B, need user answer on:

**D-A — Turbopack default or opt-out?**
Next 16 makes Turbopack the default. Two options:
- `--turbopack` (default in 16): faster but occasional HMR weirdness
- `--no-turbopack`: fall back to webpack for stability
Recommendation: **Turbopack default**; opt out only if a specific regression bites.

**D-B — eslint 8 or 9 in commit G?**
Flat config migration is ~2 hours of busywork. Option to stay on eslint 8 for this phase and migrate in a separate maintenance commit later.
Recommendation: **eslint 9** — bundle with G so we don't accumulate "stuff to upgrade later" debt.

**D-C — `tailwindcss-animate` vs `tw-animate-css`?**
Tailwind v4 may break the former. Admin-kit uses the latter.
Recommendation: **migrate to `tw-animate-css` in commit D** preemptively — avoid an unknown surprise.

**D-D — React 19 `forwardRef` cleanup: inline or follow-up?**
4 files use forwardRef. React 19 lets us refactor to `ref` as prop. Stylistic improvement only.
Recommendation: **leave for follow-up** — forwardRef still works in 19, don't mix refactor with upgrade.

---

## Appendix — commands reference

### Codemods we'll run
```bash
# Commit B: Next 15 async params + cookies/headers
npx @next/codemod@latest next-async-request-api .

# Commit E: React 19 type migrations
npx types-react-codemod@latest preset-19 .

# Commit F: (Next 16 doesn't ship a codemod for 15→16 at time of writing)
```

### Validation commands
```bash
npm run build        # production build
npm run type-check   # tsc
npm test             # vitest
npm run dev          # dev server
npm outdated         # see what's still lagging
```

### Reset
```bash
git reset --hard 1e3ec35   # back to Phase 9a commit 2 (known green)
rm -rf node_modules package-lock.json .next
npm install
```

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-23 | Accept option A (full upgrade before admin) | User choice; admin-kit ports cleanly only on new stack |
| 2026-04-23 | Sequential upgrade (B→C→D→E→F→G→H) not big-bang | Isolate regressions per dependency family |
| 2026-04-23 | React 19 refactor AFTER Tailwind v4 | Two visual-impacting changes at once = untraceable bugs |
| 2026-04-23 | Next 16 last | Turbopack + React 19 peer dep compound risk |
| 2026-04-23 | Phase 9a commits 1-2 not reverted | Version-independent (SQL + TS middleware) — benefit from upgrade later |

---

*End of plan. Awaiting approval before commit B.*
