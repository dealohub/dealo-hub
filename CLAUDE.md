# Dealo Hub — Project Rules for Claude

> **This file is loaded at the start of every session.**
> It is Claude's external memory for project-specific discipline.

---

## 🎨 Design skills discipline (MANDATORY)

**Rule:** Before ANY UI / frontend / design / polish / styling task, Claude MUST:

1. **Pause** before touching any code.
2. **Consult the skills catalog below** and pick the most appropriate one(s).
3. **Invoke the skill via the Skill tool** before writing/editing UI code.
4. If a design task ships without a skill invocation, Claude MUST state the reason explicitly (e.g. "pure i18n fix, no visual change").

**Trigger keywords (any of these → design task):**
`تصميم` · `صمّم` · `design` · `UI` · `UX` · `bento` · `layout` · `polish` · `redesign` · `styling` · `tile` · `card` · `hero` · `landing` · `typography` · `spacing` · `color` · `animate` · `motion`

Skipping skills on design work = regression. Non-negotiable.

---

## 📚 Skills Catalog

### مهارات تصميم · Design (Building)
- **`impeccable`** — واجهات احترافية production-grade
- **`frontend-design`** — تصميم UI متميز
- **`ui-ux-pro-max`** — ذكاء UI/UX متقدّم
- **`overdrive`** — يدفع الواجهات لما هو أبعد من التقليدي
- **`gpt-taste`** / **`design-taste-frontend`** — مستوى senior UI/UX

### أسلوب محدّد · Specific Styles
- **`minimalist-ui`** — نظيف وبسيط
- **`industrial-brutalist-ui`** — ميكانيكي خام
- **`bolder`** — جريء وجذّاب
- **`soft-skill`** — ناعم وراقٍ
- **`high-end-visual-design`** — راقٍ وفاخر

### تحسين وإصلاح · Polish & Refinement
- **`polish`** — مراجعة نهائية وتلميع
- **`layout`** — تحسين التخطيط والمسافات
- **`typeset`** — تحسين الطباعة
- **`colorize`** — إضافة لون استراتيجي
- **`animate`** — إضافة حركة وإيماءات
- **`critique`** — تقييم التصميم من منظور UX

### متخصّص · Specialized
- **`emil-design-eng`** — فلسفة Emil Kowalski
- **`stitch-design-taste`** — Design System من Google
- **`canvas-design`** — تصميم إبداعي
- **`shadcn`** — إدارة مكوّنات shadcn

### مراجعة قبل الدمج · Pre-merge Review
- **`/ultrareview`** — multi-agent bug hunt (v2.1.86+, Max plan, 3 free runs حتى 2026-05-05)

---

## 🗺️ Which skill, which phase?

| Phase | Use |
|-------|-----|
| Planning a new surface | `shape` |
| Building from scratch | `frontend-design` أو `impeccable` |
| Redesigning existing | `redesign-existing-projects` أو `ui-ux-pro-max` |
| Spacing / hierarchy | `layout` |
| Typography | `typeset` |
| Color strategy | `colorize` |
| Motion / micro-interactions | `animate` |
| Final pass before commit | `polish` |
| Independent UX audit | `critique` |
| Pre-merge bug hunt | `/ultrareview` |

---

## 📝 Project context quick-reference

- **Stack:** Next.js 14 App Router · Supabase · Tailwind (RTL with `tailwind-logical`) · next-intl
- **Locales:** Arabic (default, RTL) · English
- **Live Feed section:** `src/components/shadcnblocks/live-feed.tsx` — Feature 261 bento, 1 tile live feed + 7 placeholders queued for marketplace customization
- **Translations:** `messages/ar.json` + `messages/en.json` (16 namespaces under `marketplace.*`)
- **Hook for logical CSS:** use `ms-*` / `pe-*` / `start-*` / `end-*` instead of `ml-*` / `pr-*` / `left-*` / `right-*` for RTL correctness
- **Standing rule:** no `git push` to origin until design + polish + tests all green together

---

*Last updated: 2026-04-23 · Rule set v1 (design-skills discipline).*
