# Security Audit — 2026-04-23

**Context:** Post-Phase-8.5 stack upgrade. First `npm audit` on the new
stack (Next 16 / React 19 / Tailwind 4 / @supabase/ssr 0.10).

**Before:** 13 vulnerabilities (2 low, 9 moderate, 2 high)
**After:**  **4 vulnerabilities** (4 moderate, dev-only, deferred)

---

## What we fixed

### Chain 1 — Removed `@google-cloud/vision@4.3.2` (−7 vulns)

**Why it was there:** Pre-installed speculatively for a future feature
(reverse image search, Phase 6+). Documented in
`planning/DECISIONS.md:439` as "excludes Google Vision" in the active
AI cost budget — meaning it was planned but never wired up.

**Why it was safe to remove:**
- Zero imports across `src/**/*.{ts,tsx,js,mjs}`
- Zero references in any npm script
- Photo-to-listing feature uses **GPT-4o-mini vision** instead
  (`DECISIONS.md:427`), not Google Cloud Vision
- The installed 4.3.2 carried 6 transitive vulns in its `google-gax →
  teeny-request → http-proxy-agent → @tootallnate/once` chain, plus
  `uuid` in `gaxios`

**When we'll want it back:** Phase 6+ reverse image search. At that
point we'll install the latest version (likely 5.x+) with patched
transitive deps. Better than carrying a stale, vulnerable copy for a
year.

**Command:** `npm uninstall @google-cloud/vision`

### Chain 3 — Upgraded `supabase` CLI 1.187.10 → 2.93.1 (−2 high)

**Why:** The Supabase CLI depends on `tar` ≤ 7.5.10, which has **six
CVEs** for hardlink/symlink path traversal during archive extraction.
`tar` is used by the CLI to unpack downloaded binaries during
`supabase db push` / `supabase gen types`.

**Risk profile:**
- **dev-only tool** (in `devDependencies`) — never shipped to
  production. No impact on the deployed app.
- "Breaking" for CLI 1 → 2 means **flag/command renames**, not API
  changes. None of our scripts hit the breaking paths:
  - `supabase db push` — unchanged
  - `supabase db reset` — unchanged
  - `supabase gen types typescript --local` — unchanged

**Verified post-upgrade:** tsc clean, 734/734 tests passing, next build
clean. No regressions.

**Command:** `npm install -D supabase@latest`

---

## What we deferred

### Chain 2 — `vitest` 1.6.1 (4 moderate vulns, deferred)

The remaining 4 vulnerabilities all live in one dev-only chain:

```
esbuild (≤0.24.2)   ← GHSA-67mh-4wv8-2f99 (moderate)
  └── vite          ← transitive
       └── vite-node
            └── vitest 1.6.1
```

**The actual risk:** `esbuild`'s dev server accepts cross-origin
requests. Exploitable **only if** `vitest --ui` (or similar dev UI) is
running on a network reachable by an attacker. We never run
`vitest --ui` on anything other than localhost during test
development.

**Why we didn't fix it today:**

1. **Three-major-version jump** (1 → 2 → 3 → 4). Vitest 4 changed:
   - Config file format
   - Snapshot serializer format
   - Mocking API (`vi.mock` semantics)
   - Default pool (threads vs forks)
2. **734 tests to revalidate.** Real risk of "tests pass but behave
   differently" — false-negative failures.
3. **Just finished Phase 8.5.** Doing another major-version jump on
   the same day violates the Karpathy surgical-changes discipline
   in `CLAUDE.md`.
4. The threat model (local-only dev server) makes this low urgency.

**When to revisit:** Separate session. Ideally after we:
- Pin a day specifically for the upgrade (not interleaved with
  product work)
- Read the vitest 1→2, 2→3, 3→4 migration guides
- Run the full 734-test suite in both before/after states and diff
  behavior, not just pass/fail

---

## Current state

```
$ npm audit
# 4 moderate severity vulnerabilities
# all in esbuild/vite/vite-node/vitest chain
# all dev-only (vitest in devDependencies)
# all require vitest 1→4 breaking upgrade to fix
```

**Production vulnerability count: 0.**

---

## Takeaway

> Dead dependencies are a liability, not a safety net. Every package
> in `dependencies` is a CVE surface. If it's not used, it has to go.

`@google-cloud/vision` had been sitting in the manifest for months with
no code touching it, carrying 6 open CVEs. The cheapest fix was
uninstall, not `npm audit fix`. Worth running the same "is this
actually imported?" check on every prod dep before the next audit.
