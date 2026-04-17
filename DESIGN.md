# Design System: Dealo Hub

---

## 1. Visual Theme & Atmosphere

**Dealo Hub** is a high-agency marketplace and deals aggregator. The interface should feel like a premium editorial product — confident, fast, and opinionated. Think a well-funded fintech meets a design-forward commerce platform: dense with information but never cluttered, expressive without being loud.

- **Density:** 6 / 10 — "Daily App Balanced" — enough breathing room to feel premium, tight enough to respect the user's time
- **Variance:** 8 / 10 — Offset Asymmetric — hero sections, feature rows, and card grids are deliberately off-axis. No centered symmetry in high-impact zones
- **Motion:** 6 / 10 — Fluid CSS with spring physics — interactions feel physical and weighted; deals "snap" into place on filter, cards have tactile hover states

**Atmosphere descriptor:** A deal-finding platform that respects its users' intelligence. Clinical zinc surfaces with a single warm amber accent that signals urgency without panic. The UI should feel like a Bloomberg Terminal that went to design school — dense, data-rich, beautiful.

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|---|---|---|
| **Canvas Zinc** | `#F4F4F5` | Primary background surface (zinc-100) |
| **Pure Surface** | `#FFFFFF` | Card fills, modal backgrounds, elevated containers |
| **Deep Layer** | `#FAFAFA` | Section alternation, subtle recesses |
| **Charcoal Ink** | `#18181B` | Primary text, headings, zinc-950 depth — NEVER pure black |
| **Muted Steel** | `#71717A` | Secondary text, metadata, descriptions, timestamps |
| **Ghost Border** | `rgba(228,228,231,0.7)` | Card outlines, table dividers, 1px structural separators |
| **Whisper Divider** | `#E4E4E7` | Section breaks, horizontal rules, solid borders |
| **Warm Amber** | `#D97706` | Single accent — CTAs, active states, deal badges, focus rings, price highlights |
| **Amber Surface** | `rgba(217,119,6,0.08)` | Accent-tinted backgrounds for selected states, active filters |
| **Amber Glow** | `rgba(217,119,6,0.15)` | Hover shimmer on accent-adjacent elements only |
| **Success Sage** | `#16A34A` | Price drops, verified deals, savings indicators |
| **Danger Coral** | `#DC2626` | Expired deals, errors, destructive actions |
| **Caution Flax** | `#CA8A04` | Expiring-soon warnings, limited-time badges |

**Palette rules:**
- The Warm Amber accent is the ONLY saturated color in the system. Saturation ceiling: 75%
- No purple, no indigo, no blue gradients — these are banned
- Background layering: Canvas Zinc → Pure Surface → Deep Layer (three tiers, never more)
- All shadows are tinted zinc (`rgba(24,24,27,0.06)`) — never pure black box shadows

---

## 3. Typography Rules

### Font Stack

- **Display / Hero Headlines:** `Satoshi` — Variable weight, track-tight (`letter-spacing: -0.03em`), weight 700–900. Hierarchy through weight contrast and color, not massive scale
- **Body / UI Text:** `Satoshi` — Regular weight 400–500, relaxed leading (`line-height: 1.6`), max 65 characters per line (`max-width: 65ch`)
- **Data / Mono:** `JetBrains Mono` — All prices, percentages, discount values, timestamps, deal codes, and numeric counters. High-density numbers MUST use monospace
- **Labels / Tags:** `Satoshi` Medium 500, uppercase, letter-spacing `0.08em`, font-size `0.7rem`

### Scale

```
Display XL:  clamp(3rem, 6vw, 5.5rem)   / weight 800 / tracking -0.03em
Display:     clamp(2rem, 4vw, 3.5rem)   / weight 700 / tracking -0.025em
Heading 1:   clamp(1.5rem, 3vw, 2.25rem)/ weight 700 / tracking -0.02em
Heading 2:   clamp(1.25rem,2.5vw,1.75rem)/weight 600 / tracking -0.015em
Heading 3:   1.125rem                   / weight 600 / tracking -0.01em
Body Large:  1.0625rem                  / weight 400 / leading 1.65
Body:        1rem (16px)                / weight 400 / leading 1.6
Body Small:  0.875rem                   / weight 400 / leading 1.55
Caption:     0.75rem                    / weight 500 / leading 1.4
Label:       0.6875rem                  / weight 500 / uppercase / tracking 0.08em
Mono Data:   JetBrains Mono 0.875rem   / weight 500 / tabular-nums
```

### Typography Rules
- **Banned fonts:** `Inter`, `Roboto`, `Helvetica Neue` for premium contexts, `Times New Roman`, `Georgia`, `Garamond`, `Palatino` — all banned
- **Gradient text:** Banned on all headings larger than `Heading 2`. Single-color text only at display scale
- All monetary values, percentages, and discount amounts use `JetBrains Mono` with `font-variant-numeric: tabular-nums`
- Maximum 2 font weights visible on any single screen

---

## 4. Hero Section

The hero is where Dealo Hub makes its first impression. It must communicate speed, breadth of deals, and trustworthiness — without resorting to lifestyle photography or vague value props.

### Hero Structure: **Left-Aligned Asymmetric Split**
- Left column (55%): Headline + search bar + trust signals
- Right column (45%): Live deal cards in an asymmetric stacked grid (3 cards, offset vertically like a fanned deck)
- **Centered hero layouts are BANNED** — variance 8 demands asymmetric structure

### Inline Typography Technique
- Embed 2–3 small inline deal/brand logo pills directly within the hero headline. These sit at `1em` height, `auto` width, rounded `0.375rem`, with a `Pure Surface` background and `Ghost Border` outline
- Example: "Find the best `[Amazon logo pill]` deals before anyone else"
- These inline pills are the signature visual device — they replace generic hero imagery

### Headline Formula
- Weight 800, `clamp(2.75rem, 5vw, 4.5rem)`, Charcoal Ink, tracking `-0.03em`
- NO clichés: "Unleash", "Seamless", "Next-Gen", "Elevate", "Transform" — all banned
- Lead with specificity: deal count, category breadth, savings amounts
- Example direction: "2,400 live deals. Updated every 15 minutes."

### Hero CTA
- Single primary CTA only — "Browse Deals" or "See Today's Picks"
- No secondary "Learn more" links below the primary
- No scroll arrows, bouncing chevrons, or "Scroll to explore" text — ever

---

## 5. Component Stylings

### Buttons

```
Primary:    bg-amber-600  text-white     px-5 py-2.5  rounded-lg  font-600
            Hover: bg-amber-700 (no glow, no shadow expansion)
            Active: translate-y-[1px] scale-[0.99] — tactile push feedback
            Focus: 2px amber-500 focus ring, 2px offset

Secondary:  bg-white  border-[1.5px] border-zinc-200  text-zinc-800  px-5 py-2.5  rounded-lg
            Hover: bg-zinc-50 border-zinc-300
            Active: translate-y-[1px]

Ghost:      bg-transparent  text-zinc-600  px-4 py-2  rounded-md
            Hover: bg-zinc-100 text-zinc-900

Destructive: bg-red-600 text-white — same shape as Primary
```

**Button rules:**
- NO outer glow box-shadows on any button state
- NO custom mouse cursors
- NO gradient fills on buttons
- NO rounded-full pill buttons for primary actions (use `rounded-lg` = 8px)
- Icon buttons: 40px × 40px minimum, `rounded-md`, `bg-zinc-100` hover

### Deal Cards

Deal cards are the core repeating unit. They must be information-dense, scannable, and tactile.

```
Structure:
  - Container: bg-white, border border-zinc-200/70, rounded-2xl (16px), p-4
  - Shadow: 0 1px 3px rgba(24,24,27,0.05), 0 4px 12px rgba(24,24,27,0.04)
  - Hover: shadow lifts — 0 4px 16px rgba(24,24,27,0.08), translate-y-[-2px]
  - Transition: spring cubic-bezier(0.34, 1.56, 0.64, 1) 200ms

Layout:
  - Top: Store logo (32px, rounded-md) + Category tag + Expiry badge
  - Mid: Product thumbnail (full-width, aspect-video, object-cover, rounded-xl)
  - Body: Product name (Heading 3) + short description (Body Small, 2 lines max)
  - Footer: Price block (JetBrains Mono) + CTA button + Save/bookmark icon

Price Block:
  - Current price: JetBrains Mono, 1.25rem, weight 700, Charcoal Ink
  - Original price: JetBrains Mono, 0.875rem, Muted Steel, line-through
  - Discount badge: Warm Amber bg, white text, Label size, rounded-md, px-2 py-0.5
  - Savings line: Success Sage, Body Small — "Save $XX.XX (XX% off)"
```

**Card rules:**
- Cards are used ONLY in deal listings and featured sections — not for feature marketing or FAQs
- High-density list view: replace cards with border-top divider rows (`border-t border-zinc-100`)
- NO card-on-card nesting
- Shadow is always tinted zinc — never pure black drop shadows
- Expired deal cards: opacity 0.5, grayscale filter, "Expired" amber badge

### Filter Bar / Search

```
Search input:
  - Full-width, height 48px, bg-white, border-[1.5px] border-zinc-200
  - rounded-xl, px-4, font Satoshi 1rem
  - Left icon: magnifying glass in Muted Steel
  - Focus: border-amber-500, shadow 0 0 0 3px rgba(217,119,6,0.12)
  - No floating labels — placeholder text only

Filter chips:
  - Scrollable horizontal row on mobile
  - Default: bg-zinc-100, text-zinc-700, rounded-full, px-3.5 py-1.5, text-sm
  - Active: bg-amber-600, text-white
  - Transition: background 150ms ease

Category tabs:
  - Underline-style tabs, NOT pill tabs
  - Active: 2px amber-600 bottom border, text Charcoal Ink weight 600
  - Inactive: no border, Muted Steel weight 400
```

### Badges & Tags

```
Deal Live:      bg-success-sage/10  text-green-700   rounded-md  px-2 py-0.5  Label
Expiring Soon:  bg-amber-50         text-amber-700   rounded-md  px-2 py-0.5  Label
Expired:        bg-zinc-100         text-zinc-400    rounded-md  px-2 py-0.5  Label
Exclusive:      bg-charcoal-ink     text-white       rounded-md  px-2 py-0.5  Label
Verified:       bg-green-50         text-green-700   rounded-md  px-2 py-0.5  Label + checkmark icon
Hot Deal:       bg-red-50           text-red-600     rounded-md  px-2 py-0.5  Label + flame icon (SVG, not emoji)
```

**Badge rules:**
- NO emoji in badges — use inline SVG icons only
- Maximum 2 badges per deal card
- Badge text always Label style: uppercase, `0.08em` tracking, `0.6875rem`

### Navigation

```
Desktop Nav:
  - Height: 64px, bg-white/95 backdrop-blur-md, border-b border-zinc-200/60
  - Sticky — stays at top on scroll, no hide-on-scroll behavior
  - Logo left, category links center, auth/CTA right
  - Active link: Charcoal Ink weight 600, amber bottom border 2px
  - Hover: text transitions to Charcoal Ink from Muted Steel, 150ms ease

Mobile Nav:
  - Same 64px height
  - Hamburger right-aligned (3 lines, 24px, stroke Charcoal Ink)
  - Menu: full-screen overlay, bg-white, links stacked at Display size
  - Close: X icon top-right — no swipe gestures

Bottom Nav (Mobile):
  - Optional for deal browsing: 5-tab bar, 64px height, bg-white
  - Active icon: Warm Amber, inactive: Muted Steel
  - Labels below icons, Caption size
```

### Data Tables / Deal Lists

For high-density list views (power users, comparison mode):

```
Row:        border-t border-zinc-100, py-3 px-4, hover:bg-zinc-50
Store col:  Logo 24px + name, width 140px
Deal col:   Product name (truncate 1 line) + category tag
Price col:  JetBrains Mono, right-aligned, with original + discount badge
Savings:    Success Sage, JetBrains Mono, right-aligned
Actions:    Icon buttons — Copy code / Open deal / Save
```

### Loading States

```
Skeleton:   bg-zinc-200, rounded matching target element shape, animate-pulse
            Match exact dimensions of the real content placeholder
            Stagger shimmer delay: 100ms between each skeleton element

Page load:  Top progress bar — 2px height, amber-600, spans full viewport width
            No full-screen spinners, no circular loaders
            
Infinite scroll: 3 skeleton cards at bottom, auto-load when 200px from viewport bottom
```

### Empty States

```
No deals found:
  - SVG illustration (minimal, geometric, zinc palette)
  - Heading 2: "No deals match these filters"
  - Body: specific suggestion ("Try removing the 'Electronics' filter or expanding your price range")
  - Primary CTA: "Clear filters" (amber)
  - NO generic "No data available" text
  - NO stock photography

First-time user:
  - Welcome state with 3 category selection cards
  - "Tell us what you're looking for" — personalization onboarding
```

### Error States

```
Inline error (form): Danger Coral text, Body Small, below input, 4px margin-top
Alert banner:        bg-red-50, border-l-4 border-red-500, px-4 py-3, rounded-r-lg
Network error:       Full-width banner, Charcoal Ink bg, white text, Retry CTA
Toast notifications: Bottom-right, max-width 360px, rounded-xl, shadow, 4s auto-dismiss
                     Success: left border Success Sage
                     Error: left border Danger Coral
                     Info: left border Warm Amber
```

---

## 6. Layout Principles

### Grid System

```
Max container width: 1400px, centered, px-6 (mobile) px-8 (tablet) px-12 (desktop)
Main content width:  1200px for listings, 960px for editorial/single deal pages
Sidebar layout:      72% content / 28% sidebar (NO 50/50 splits)

Grid columns:
  - Deal grid desktop:  4 columns, gap-5
  - Deal grid tablet:   2 columns, gap-4
  - Deal grid mobile:   1 column, gap-3
  - Featured:           Asymmetric 3+1 (large left card + 3 stacked right)
```

### Banned Layouts

- **3 equal-width cards in a horizontal row** — use the asymmetric 3+1 or 2-column zig-zag instead
- **Centered hero sections** — use Left-Aligned Asymmetric Split
- **50/50 content splits** — use 60/40 or 72/28
- **Full-bleed background image heroes** — use editorial split layouts with inline pill typography
- **Overlapping elements** — every element has its own clean spatial zone
- **`calc()` percentage width hacks** — use CSS Grid `fr` units

### Spacing Philosophy

```
Base unit: 4px (0.25rem)
Section vertical gap:   clamp(4rem, 8vw, 7rem)
Card internal padding:  1rem (16px)
Grid gap:               1.25rem (20px)
Inline element gap:     0.75rem (12px)
Icon-to-label gap:      0.375rem (6px)
```

### Full-Height Sections

- Always use `min-h-[100dvh]` — NEVER `h-screen` (iOS Safari viewport jump catastrophe)
- Hero section: `min-h-[85dvh]` — leave room to peek at first deal row below the fold

---

## 7. Responsive Rules

### Breakpoints

```
Mobile:   < 640px   (sm)
Tablet:   640–1023px (md)
Desktop:  1024px+   (lg)
Wide:     1280px+   (xl)
Ultra:    1536px+   (2xl)
```

### Collapse Rules

- All multi-column layouts collapse to **single column below 768px** — no exceptions
- Deal grid: 4col → 2col → 1col
- Asymmetric hero: side-by-side → stacked (content above, deal cards below)
- Navigation: horizontal nav → hamburger menu
- Filter bar: horizontal chips → horizontally scrollable single-row (`overflow-x: auto`, hide scrollbar)
- Data tables: hidden columns on mobile, priority = price + deal name + CTA

### Typography Scaling

```
All display/heading sizes use clamp() — never fixed px at large scales
Body text minimum: 1rem (16px) — never smaller on any viewport
Touch targets: minimum 44px × 44px for all interactive elements
Horizontal scroll: ZERO TOLERANCE — any overflow-x on mobile is a critical failure
```

### Image Behavior

- Inline typography brand pills: collapse below headline on mobile, display as horizontal scrollable row
- Deal card thumbnails: `aspect-[16/9]` maintained at all viewports
- Store logos: fixed 32px height, width auto — scale maintained

---

## 8. Motion & Interaction

### Spring Physics Defaults

```javascript
// Default spring — weighty, premium, no bounce excess
stiffness: 120, damping: 20, mass: 1

// Snappy — for filter chips, tab switches
stiffness: 300, damping: 30

// Floaty — for card hover lifts
stiffness: 80, damping: 15
```

**Easing curve:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for entrances with slight overshoot.
`cubic-bezier(0.4, 0, 0.2, 1)` for exits — never `linear`.

### Perpetual Micro-Interactions

```
Deal countdown timers:    Tick animation — digit flips with 80ms scale pulse
"New" deal badge:         Subtle ping pulse (CSS @keyframes, opacity 0→0.5→0, 2s infinite)
Price drop indicator:     Green arrow with 300ms downward slide on update
Live deal counter:        Count-up animation on page mount, JetBrains Mono
Bookmark/Save icon:       Heart fill with spring scale 1→1.3→1 on toggle
Filter chip active:       Background transitions with spring, not linear ease
```

### Staggered Reveals

```
Deal card grid on mount:
  - Each card delays 60ms per index (card[0]: 0ms, card[1]: 60ms, ... card[7]: 420ms)
  - Enter: opacity 0→1 + translateY(12px)→0
  - Duration: 300ms spring

Category filter mount:
  - Each chip: 40ms stagger
  - Enter: opacity 0→1 + scale(0.95)→1

Skeleton → content transition:
  - Cross-fade 200ms, no layout shift
```

### Performance Rules

- Animate ONLY `transform` and `opacity` — never `top`, `left`, `width`, `height`, `margin`
- `will-change: transform` on cards with hover lift animation
- Grain/noise texture: fixed `::before` pseudo-element on body, `pointer-events: none`, `z-index: -1`
- Heavy animations in Isolated Client Components (`'use client'`) — never block SSR
- Reduce motion: `@media (prefers-reduced-motion: reduce)` disables all animations, transitions max 50ms

---

## 9. Anti-Patterns (Banned)

### Typography & Content
- **NO** `Inter`, `Roboto`, `Helvetica Neue` as primary fonts
- **NO** generic serif fonts (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`)
- **NO** gradient text on headings larger than `1.75rem`
- **NO** AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Transform", "Revolutionary", "Game-changing", "Leverage", "Cutting-edge"
- **NO** filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- **NO** generic placeholder names: "John Doe", "Acme Corp", "Nexus", "TechCo"
- **NO** fake round numbers: `99.99%`, `50%`, `100K+` without real data backing
- **NO** emojis anywhere in the UI — use inline SVG icons only

### Color & Visual
- **NO** pure black (`#000000`) anywhere — use Charcoal Ink (`#18181B`) or Zinc-950
- **NO** neon outer glow box-shadows on buttons, cards, or any element
- **NO** oversaturated accent colors (saturation ceiling: 75%)
- **NO** purple, indigo, or blue-neon gradient aesthetics — banned palette colors
- **NO** full-bleed hero background images with text overlay
- **NO** warm gray / cool gray inconsistency — Zinc palette exclusively

### Layout & Structure
- **NO** 3-column equal-width card layouts for feature marketing
- **NO** centered hero sections (variance 8 demands asymmetry)
- **NO** overlapping elements — every element occupies its own clear spatial zone
- **NO** absolute-positioned content stacking over other content
- **NO** `h-screen` — always `min-h-[100dvh]`
- **NO** `calc()` percentage hacks — use CSS Grid `fr` units
- **NO** horizontal scroll on mobile — zero tolerance

### Components & Interaction
- **NO** custom mouse cursors
- **NO** circular loading spinners — use skeletal shimmer loaders
- **NO** floating labels on inputs — labels above, always
- **NO** modal-on-modal stacking
- **NO** tooltip-on-hover for critical information — always visible
- **NO** broken image links — use `picsum.photos/{id}` for placeholders or SVG avatars
- **NO** auto-playing video or audio
- **NO** cookie consent banners covering > 10% of viewport

---

## 10. Deal-Specific Design Patterns

### Urgency Without Panic

Dealo Hub communicates urgency through information density, not aggressive visual noise:

```
Expiry countdown: JetBrains Mono, Caution Flax color, format "3h 22m left"
                  Only shown when < 24 hours remaining
Stock scarcity:   "X claimed today" in Muted Steel — never red or flashing
Price drop alert: Green downward arrow icon + "Price dropped X% today" in Success Sage
Hot deal tag:     Warm Amber badge, never red blinking or animated
```

### Savings Communication

```
Always show three data points for every deal:
1. Current price (JetBrains Mono, large, Charcoal Ink)
2. Original price (JetBrains Mono, smaller, Muted Steel, strikethrough)
3. Savings summary (JetBrains Mono, Success Sage) — "Save $XX (XX% off)"

Price history sparkline (optional on hover): 60px wide, 24px tall, Success Sage stroke
```

### Trust Signals

```
Verified deal badge: Green checkmark SVG + "Verified" label
Store reputation:    Star rating with exact decimal (JetBrains Mono: "4.7")
Last updated:        "Updated 3 min ago" — Caption, Muted Steel, timestamp in Mono
Deal click count:    "1,240 people clicked this" — Caption, Muted Steel
```

---

*This design system enforces a premium, non-generic aesthetic for Dealo Hub. Every decision prioritizes information clarity, data legibility, and interaction quality over decorative excess. The Warm Amber accent signals deals and value without manufactured urgency. The Satoshi + JetBrains Mono pairing gives the platform its editorial-yet-technical character.*
