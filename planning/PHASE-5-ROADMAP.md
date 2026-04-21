# Phase 5 Roadmap — Build → Polish → Test

> **Author:** Claude Code · **Date:** 2026-04-21
> **Status:** Active — Phase 5b complete, Phase 5c next
> **Context preservation:** This document is the single source of truth
> for "where we are + where we're going". If a future session loses
> memory, reading this + `docs/STATUS.md` is sufficient to resume.

---

## 🎯 The Strategic Decision (locked)

**Build all features first → one dedicated polish pass → test foundation.**

NOT:
- ❌ Polish each page as we build it (diverges patterns, wastes ~30% time on work that later phases invalidate)
- ❌ Patch / hybrid / add-a-bit-here (user has explicitly rejected this — "لا ترقيع")

**The principle (quote the founder):**

> Form follows function, polish follows form.
> We build the function first. We arrange the form with it (acceptable baseline).
> We polish after we see the full shape — not before.

Each feature phase ships at **"functional + acceptable baseline visual"** — not ugly, not world-class yet. Polish is ONE dedicated sweep after all features land.

---

## 🛑 Hard Rules (from the founder, locked)

1. **No `git push` until the design/build phase is fully complete.** All commits stay local until polish + tests are done.
2. **No patching.** Each commit ships a coherent unit; no cosmetic band-aids.
3. **Trust the plan.** If we need a feature we haven't built, we build it — we don't stub it.
4. **Doctrine from `planning/PHASE-4A-AUDIT.md` §1** (the 14 pillars) stays the north star for every surface.

---

## 📍 Where We Are (Phase 5b shipped — 2026-04-21)

**Current git HEAD:** `bec19d4` · 35 commits ahead of `origin/master`.

| Phase | Status | Shipped |
|---|---|---|
| 3b | ✅ | Rides detail page (`/rides/[id]`) — 8 components, DB-backed |
| 3c | ✅ | Rides hub (`/rides`) — 10 sections, Zero-seed |
| 3d | ✅ | Landing (`/[locale]/`) — hero + feed DB-backed |
| 3d+ | ✅ | Landing fixes — unified hero+feed query, 6th hero car, dead URLs |
| 4a | ✅ | Properties DB foundation — taxonomy + schema + validators + 10-seed |
| 4b | ✅ | Properties detail (`/properties/[slug]`) — 14 doctrine pillars live |
| 4c | ✅ | Properties hub (`/properties`) — hero + trust strip + grid + chalet⭐ |
| 5a | ✅ | Auth UI — signin + signup + reset + callback |
| 5b | ✅ | Sell wizard — 7 steps (authenticity deferred to luxury vertical) |

**What the user can do today (logged in):**
1. Sign up / verify email
2. Browse `/rides` and `/properties` hubs + detail pages
3. Post a listing via `/sell` wizard → lands on the correct vertical detail page
4. See their new listing in LiveFeed on landing + in hub grids

**What the user CANNOT do today:**
1. Contact a seller (buttons are decorative — no chat)
2. Save a listing (no DB write)
3. Compare listings (no compare bar)
4. Search across verticals (`/search` doesn't exist)
5. See their own listings (`/my-listings` doesn't exist)
6. Edit their profile (`/profile` doesn't exist)
7. Get push notifications (no PWA / realtime)

---

## 🗺️ The 27-Day Roadmap (Phase 5 → 6 → 7)

### Block A — Feature Build (~14 days)

| Phase | Days | Route(s) | Description |
|---|---|---|---|
| **5b+** | 0.25 | `/properties` | **Live feed section** (gap flagged by founder — mirrors landing's pattern but scoped to property listings). Small, ships immediately. |
| **5c** | 5 | `/messages` + inline chat | Chat realtime — the core DECISIONS.md #2 moat. Supabase Realtime channels + 1:1 chat table + RLS + inbox + thread + send + online/offline + push notifications (PWA). |
| **5d** | 2 | `/search?q=...` | Search page consuming `getHybridSearchResults` (pgvector + keyword + fail-open). "Smart search" badge. Filter panel. |
| **5e** | 3 | `/my-listings` · `/saved` · `/profile/[handle]` · `/profile/me` · `/profile/edit` | Authenticated-user surfaces. Reuses existing server actions + verification-badge. |
| **5f** | 2 | Cross-cutting | Navbar category buttons wired (`عقارات` → `/properties`, etc.). Footer links. Error boundaries (`error.tsx`). Loading states (`loading.tsx`). Empty states. |
| **5g** | 2 | Infra | PostHog analytics wiring (events on every CTA). Sentry error tracking. Rate limits on mutation server actions. |

**End of Block A:** every button produces a state change; every link routes somewhere real.

### Block B — Polish Pass (~9 days)

**Dedicated sweep — not interleaved with features.** Bring all surfaces to world-class in one craft session.

| Phase | Days | Focus |
|---|---|---|
| **6a** | 2 | Design tokens audit. Unify spacing scale, color usage, typography rhythm across all pages. |
| **6b** | 2 | Animation / micro-interactions. Page transitions, hover states, success celebrations, skeleton→content morph. |
| **6c** | 2 | Accessibility audit (WCAG 2.1 AA). Focus management, ARIA labels, keyboard nav, screen reader pass, color contrast. |
| **6d** | 1 | Lighthouse perf audit + fixes. LCP, CLS, TBT on mobile for all 3 major surfaces. |
| **6e** | 1 | Mobile audit — every page, every breakpoint. RTL edge cases. |
| **6f** | 1 | Content polish. Copy proofread AR + EN. Translation parity. Tone consistency. Remove placeholders. |

**End of Block B:** every surface at "production world-class". No rough edges. Consistent voice.

### Block C — Tests + Security (~4 days)

| Phase | Days | Focus |
|---|---|---|
| **7a** | 1 | Test foundation — Playwright + Vitest setup, CI stub. |
| **7b** | 2 | E2E critical paths — signup flow, sell flow, browse→contact flow. |
| **7c** | 1 | RLS security tests — anon vs authed vs fraud-flag users; verify no data leaks. |

**End of Block C:** we can push to origin + deploy to Vercel with confidence.

---

## 🏁 Definition of Done (Phase 5 → 7 complete)

Checklist before first push + first deploy:

1. Every button produces a measurable state change ✓
2. Every link routes to a real page ✓
3. Search returns actual filtered results ✓
4. Authenticated state renders distinctly (save/profile/my-listings) ✓
5. Core transaction (contact seller → chat → close) completes end-to-end ✓
6. Real-time data where marketed as real-time (chat + live feed) ✓
7. Lighthouse ≥ 90 on mobile for all 3 major surfaces ✓
8. WCAG 2.1 AA on all interactive elements ✓
9. SEO: structured data + sitemap + robots + OG image per route ✓
10. Per-listing metadata dynamic ✓ (already done)
11. Error boundaries per route segment ✓
12. Loading states (skeletons) on every async ✓
13. Empty states with written copy ✓
14. Analytics events on every CTA ✓
15. Error tracking hooked (Sentry) ✓
16. RLS policies tested with anon + authed + fraud-flag users ✓
17. Rate limits on mutation actions ✓
18. Content moderation workflow (basic admin) ✓
19. Test coverage ≥ 50% on critical paths ✓
20. CI + preview deploys ✓

**Currently passing: 1/20** (#10 only).
**Target: 20/20 before first push.**

---

## 🔄 Resume Instructions (if memory lost)

1. **Read `docs/STATUS.md`** — authoritative "what shipped" table.
2. **Read this file** — roadmap + hard rules + checklist.
3. **`git log --oneline -40`** — commit history shows current position.
4. **`npx tsc --noEmit`** — verify tree green.
5. **Next phase is the first ⬜ in the Block A table above.**

Phase 5c (Chat) is the next execution target as of 2026-04-21.

---

## 📝 Amendment Log

| Date | Change | Author |
|---|---|---|
| 2026-04-21 | Initial roadmap after Phase 5b ships | Claude Code |
