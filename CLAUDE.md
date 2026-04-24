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
- **`tailwind-design-system`** — Design system بـ Tailwind (مخصّص للمشروع)
- **`extract-design-system`** — استخراج design system من الكود الحالي
- **`liquid-glass-design`** — تصميم عصري وجذّاب

### صفحات · Pages
- **`landing-page-design`** — تصميم صفحات الـ marketplace
- **`sleek-design-mobile-apps`** — تصميم responsive + mobile
- **`design-md`** — توثيق التصميم بأسلوب Google

### ⚙️ Stack-Specific (Next.js + Supabase)
- **`nextjs-app-router-patterns`** — App Router patterns لـ Next.js 14
- **`nextjs-supabase-auth`** — Auth بين Next.js وSupabase
- **`nextjs-best-practices`** — أفضل ممارسات Next.js

### 🎬 Animation
- **`ui-animation`** — حركات UI عامة
- **`tailwindcss-animations`** — animations بـ Tailwind CSS

### ⚡ Performance
- **`performance`** — أداء الويب (من Addy Osmani · Google)

### 🧪 Testing
- **`webapp-testing`** — اختبار تطبيقات الويب (من Anthropic رسمياً)
- **`e2e-testing-patterns`** — أنماط E2E testing مع Playwright

### 🔒 Security
- **`security-review`** — مراجعة أمنية شاملة للكود

### 📘 TypeScript
- **`typescript-advanced-types`** — أنواع TypeScript المتقدمة

### ♿ Accessibility
- **`accessibility`** — أفضل ممارسات إمكانية الوصول (من Addy Osmani · Google)
- **`fixing-accessibility`** — إصلاح مشاكل الـ accessibility

### 🔍 SEO
- **`seo-audit`** — تدقيق SEO للمشروع (86K تثبيت)
- **`seo`** — أفضل ممارسات SEO (من Addy Osmani · Google)

### مراجعة قبل الدمج · Pre-merge Review
- **`/ultrareview`** — multi-agent bug hunt (v2.1.86+, Max plan, 3 free runs حتى 2026-05-05)

---

## 🗺️ Which skill, which phase?

| Phase | Use |
|-------|-----|
| Planning a new surface | `shape` |
| Building from scratch | `frontend-design` أو `impeccable` |
| Redesigning existing | `redesign-existing-projects` أو `ui-ux-pro-max` |
| Tailwind tokens / system | `tailwind-design-system` |
| Spacing / hierarchy | `layout` |
| Typography | `typeset` |
| Color strategy | `colorize` |
| Motion / micro-interactions | `animate` |
| Landing / marketplace pages | `landing-page-design` |
| Mobile / responsive | `sleek-design-mobile-apps` |
| Modern trendy UI | `liquid-glass-design` |
| Extract existing design system | `extract-design-system` |
| Next.js App Router | `nextjs-app-router-patterns` |
| Supabase auth flow | `nextjs-supabase-auth` |
| Performance audit | `performance` |
| UI animations | `ui-animation` أو `tailwindcss-animations` |
| TypeScript types / generics | `typescript-advanced-types` |
| Writing tests | `webapp-testing` |
| E2E tests | `e2e-testing-patterns` |
| Security review | `security-review` |
| Accessibility audit | `accessibility` |
| SEO audit | `seo-audit` + `seo` |
| Final pass before commit | `polish` |
| Independent UX audit | `critique` |
| Pre-merge bug hunt | `/ultrareview` |

---

## 📝 Project context quick-reference

- **Stack:** Next.js 14 App Router · Supabase · Tailwind (RTL with `tailwind-logical`) · next-intl
- **Locales:** Arabic (default, RTL) · English
- **Live Feed section:** `src/components/shadcnblocks/live-feed.tsx` — Feature 284 bento (5 tiles, shadcnblocks) + `LiveStatusBar` + `FeedHeader`. Swapped from Feature 261 on 2026-04-24; tiles still carry default shadcnblocks demo copy/images pending marketplace content.
- **Translations:** `messages/ar.json` + `messages/en.json` (16 namespaces under `marketplace.*`)
- **Hook for logical CSS:** use `ms-*` / `pe-*` / `start-*` / `end-*` instead of `ml-*` / `pr-*` / `left-*` / `right-*` for RTL correctness
- **Standing rule:** no `git push` to origin until design + polish + tests all green together

## 🌐 Browser automation

**Rule:** For any browser task (open URL, click, type, screenshot, scrape), ALWAYS use **Playwright MCP** — it runs directly inside Claude Code with no extra API key.

```
mcp__plugin_playwright_playwright__browser_navigate   ← فتح URL
mcp__plugin_playwright_playwright__browser_snapshot   ← قراءة الصفحة
mcp__plugin_playwright_playwright__browser_click      ← نقر
mcp__plugin_playwright_playwright__browser_type       ← كتابة
mcp__plugin_playwright_playwright__browser_take_screenshot ← لقطة شاشة
mcp__plugin_playwright_playwright__browser_fill_form  ← ملء نماذج
```

- **لا تستخدم autobrowse** إلا إذا طُلب تحديداً (يحتاج ANTHROPIC_API_KEY منفصل)
- Playwright MCP = Max plan مباشرة، بدون تكلفة إضافية

---

*Last updated: 2026-04-23 · Rule set v1 (design-skills discipline).*

---

## 🧠 Karpathy-Inspired Coding Guidelines

> Derived from [Andrej Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on LLM coding pitfalls.
> Source: [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
