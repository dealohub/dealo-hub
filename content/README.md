# Content — Blog & Marketing Copy

SEO-optimized editorial content for Dealo Hub.

**Publishing platform:** Next.js MDX routes at `/[locale]/blog/[slug]` (built in Sprint 2+)
**Interim:** Drafts live here as `.md` files for review before implementation

---

## Folder Structure

```
content/
├── README.md                       (this file)
└── blog/
    ├── why-dealo-hub-ar.md         Launch-era explainer (Arabic)
    └── why-dealo-hub-en.md         Launch-era explainer (English)
```

**Convention:** Every post has matching `-ar.md` and `-en.md` files. Use `hreflang` to link them in the built site.

---

## Frontmatter Standard

Every blog post starts with YAML frontmatter:

```yaml
---
title: "..."                       # H1-equivalent, used in og:title
description: "..."                 # 150-160 chars, used in meta description
slug: "why-dealo-hub"               # URL segment
locale: ar | en                    # language
author: "Fawzi Al-Ibrahim"
publish_date: 2026-05-01            # ISO 8601 — post-landing launch
tags: ["product-philosophy", "trust"]
canonical: "https://dealohub.com/ar/blog/why-dealo-hub"
og_image: "/og/why-dealo-hub-ar.png"
reading_time_minutes: 5
status: draft | scheduled | published
---
```

---

## SEO Conventions

### Target keywords (primary per post)

The "why-dealo-hub" post targets:
- Arabic: `منصة بيع وشراء مستعمل الكويت` / `موقع بيع آمن الكويت`
- English: `c2c marketplace kuwait` / `buy sell used kuwait`

Keyword placement checklist:
- ✅ Appears in H1
- ✅ First 100 words
- ✅ At least one H2
- ✅ Conclusion paragraph
- ✅ Meta description
- ❌ No keyword stuffing — natural phrasing wins

### Related / supporting keywords

Arabic cluster: بيع أونلاين، سوق مستعمل، تطبيق بيع، موقع بيع آمن، منصة بدون WhatsApp، بيع مستعمل بدون احتيال

English cluster: safe marketplace, AI protection, trust-first selling, gulf ecommerce, sell without phone number

---

## Editorial Voice

**Rules (from DESIGN.md + COMPETITOR-DUBIZZLE.md):**

| ✅ DO | ❌ DON'T |
|---|---|
| Lead with real user pain | Lead with company pitch |
| Use specific Kuwait examples | Use generic global examples |
| Reference Dubizzle/OpenSooq by *problem pattern* | Mention them by name in a negative frame |
| Write in Gulf-natural Arabic (not MSA) | Use formal academic Arabic |
| Use Western digits (1234) | Use Arabic-Indic digits (١٢٣٤) |
| Name our principles honestly | Exaggerate ("best platform ever") |
| Acknowledge trade-offs we chose | Pretend we have all features |
| Soft CTA to waitlist | Hard-sell CTA every paragraph |

**Banned phrases** (all languages):
- "thought leader" / "رائد الفكر"
- "cutting-edge" / "ثوري"
- "game-changer" / "سيغير اللعبة"
- "revolutionize" / "يثور"
- "seamless" / "سلس"
- "unparalleled" / "لا مثيل له"
- "elevate" / "ارتقِ"
- "best-in-class" / "الأفضل في فئته"

---

## Writing Process

1. **Draft:** Markdown file here with frontmatter
2. **Review:** Fawzi + optional human editor
3. **Polish:** Read aloud in target locale — does it sound like a human?
4. **Visuals:** Create OG image (1200×630px), add inline diagrams if needed
5. **Schedule:** Set `status: scheduled` + `publish_date` in frontmatter
6. **Publish:** Move to production via Sprint 2+ MDX pipeline

---

## Image Guidelines

- OG images: 1200×630px, PNG or WebP, under 300KB
- Inline images: WebP, max 1200px wide, under 150KB each
- Alt text REQUIRED: specific + locale-appropriate
- Store in `public/og/` and `public/blog/` (Next.js conventions)

---

## Performance Note

Blog posts should:
- Load in < 2s on 4G
- Score 95+ on Lighthouse performance
- Be readable without JavaScript (no React-only widgets inline)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial content folder + first blog post (why-dealo-hub) drafted |
