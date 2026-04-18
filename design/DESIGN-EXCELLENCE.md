# Design Excellence Commitment
### The Moat That Solo + AI Can Actually Build

**Date:** April 18, 2026
**Authority:** Founder directive — "التصميم منافس جداً وبقوة"
**Status:** Binding standard for Phase 1 execution

---

## The Strategic Bet

**Reality of Kuwait/Gulf marketplace design in 2026:**

| Platform | Design Quality | UX Modernity |
|---|---|---|
| Q84sale | 2012-era cluttered | Desktop-first, mobile afterthought |
| OpenSooq | Functional but dated | Poor Arabic typography |
| Dubizzle | Clean but utilitarian | Not premium, not editorial |
| eBay | Enterprise-functional | Ugly by modern standards |
| **Dealo Hub commitment** | **Editorial premium** | **Mobile-first, RTL-native** |

**The bet:** Where solo + AI can't beat network effects, it CAN beat ugly. Design becomes the differentiator users feel in 3 seconds.

---

## The 7 UI Zones — Quality Bars

Every zone has specific quality commitments. Non-negotiable.

---

### Zone 1: Listing Card

**The most-repeated unit in the product.** If it's wrong, everything is wrong.

**Quality bar:**
- Image aspect-[4/3], lazy-loaded, progressive (blur-up)
- Video badge corner (luxury) with subtle pulse
- Image count ("3/10") bottom-end in JetBrains Mono
- Title: `line-clamp-2`, Heading 3, balanced text
- Location + TimeAgo: Body Small, Muted Steel, separated by middle dot
- Price block: Mono Data + 3-mode badges (🔒 / 💬 / 🎯)
- Seller strip: Avatar + name + verified checkmark (only if earned)
- Save button: heart icon with spring scale animation
- Hover: lift 2px + shadow deepens (spring, not linear)
- Focus-visible: 2px amber ring + 2px offset

**Anti-patterns:**
- ❌ Generic "shop now" CTAs
- ❌ Pure white backgrounds (use pure-surface with border)
- ❌ Pure black shadows (use tinted zinc)
- ❌ Multiple badges stacked (max 2 trust signals)
- ❌ Price without currency or with Arabic-Indic digits

---

### Zone 2: Listing Detail Page

**The conversion surface. Browsers become buyers here.**

**Quality bar:**
- Layout: 60/40 split (gallery / details) on desktop
- Gallery: click for fullscreen, swipe on mobile, pinch zoom
- Video player (luxury): hero position, tap-to-play on mobile, hover-preview on desktop
- Breadcrumb: Category > Subcategory (clickable)
- Title: Heading 1 or 2, balanced text
- Price block: Mono Data, large, with mode badge
- Primary CTA: amber "Contact Seller" or "Make Offer" — sticky-bottom on mobile
- Description: max 65ch, comfortable line height (1.6)
- Trust signals: Safety Signals Stack (see Section 14 of DESIGN.md)
- Seller Card: inline, clickable to seller profile
- Location: area + approximate map (no precise pin — privacy)
- Delivery options: visual list with icons
- Safety tips: collapsible accordion
- Related listings: 4 cards at bottom

**Anti-patterns:**
- ❌ Phone number anywhere visible
- ❌ External links in description (always filtered)
- ❌ Cluttered sidebar with ads
- ❌ Video auto-plays with sound

---

### Zone 3: Search Experience

**Magic happens here. Semantic search beats keyword search.**

**Quality bar:**
- Search bar: 48px height, pure-surface, focus glow amber
- AI indicator (✨ Sparkles icon) subtle in end
- Query interpretation widget: "فهمت بحثك كـ..." (only when semantic kicks in)
- Instant results: first results in <200ms
- Filter chips horizontal scrollable mobile, fixed panel desktop
- Active filter count visible
- Results header: count + sort dropdown
- Empty state: specific suggestions (not generic "No results")
- Loading: skeleton cards (match real card dimensions exactly)
- Pagination OR infinite scroll (choose based on UX testing)

**Anti-patterns:**
- ❌ "Loading..." text (use skeletons)
- ❌ Full-page reload on filter change
- ❌ Hiding filter panel without clear re-open
- ❌ Search bar losing focus after submit

---

### Zone 4: Chat / Messaging

**Must feel like iMessage. If it feels like SMS, we've failed.**

**Quality bar:**
- Conversation list: avatar + name + last message preview + unread dot + timestamp
- Active conversation: animated slide-in from end
- Message bubbles: spring arrival, fade + translateY(12px)
- Own messages: charcoal-ink background, white text, rounded-se-sm (tail corner)
- Other messages: deep-layer background, charcoal-ink text, rounded-ss-sm
- Read receipts: double checkmark in success-sage when read
- Typing indicator: 3 dots with staggered scale pulse
- Listing reference card: pinned top of chat (sticky)
- Safety banner: persistent footer above input
- Input: textarea auto-grow, max 5 lines, submit on Enter (Shift+Enter for new line)
- Media attachment: inline thumbnails, tap for fullscreen
- Offer messages: 🎯 badge decoration, amber accent

**Anti-patterns:**
- ❌ Phone icon to call (moat enforcement)
- ❌ WhatsApp export button
- ❌ External URLs without confirmation modal
- ❌ Linear transitions (use spring physics)

---

### Zone 5: Listing Creation Flow

**7 steps that feel like Apple onboarding, not government paperwork.**

**Quality bar:**
- Step indicator: thin horizontal progress bar, amber for complete/current
- One decision per screen (reduce cognitive load)
- Transitions between steps: slide horizontal with spring
- Photo upload: drag-drop zone + tap to capture (mobile camera API)
- Photo reorder: drag with spring animation, haptic feedback mobile
- Category picker: visual grid, not dropdown
- Price input: large, prominent, formatted as user types
- Preview step: shows actual listing card + detail preview
- Publish CTA: confirmation feel (not just "submit")

**Anti-patterns:**
- ❌ Long scrolling forms with all fields
- ❌ Red asterisks for required fields (use inline validation)
- ❌ Submit button at page bottom always visible (causes early submission)
- ❌ Generic file input (use custom drag-drop + camera)

---

### Zone 6: Category Browse + Homepage

**Editorial, not directory. Makes users want to explore.**

**Quality bar:**
- Homepage hero: asymmetric 55/45 split (headline + decorative card stack)
- Category cards: asymmetric grid (4+4+2), tier-based sizing
- Featured sections: "Most Viewed in [Category]" — mimics Dubizzle's strength
- Trust pillars section: 3 columns, icon + title + description + "vs competitor"
- Inline category pills in headline (signature device from DESIGN.md)
- Scroll-triggered reveals: staggered fade-in-up (60ms between items)

**Anti-patterns:**
- ❌ Full-bleed hero images with text overlay
- ❌ Centered everything (use asymmetric splits)
- ❌ 3 equal-width columns for marketing
- ❌ Carousels that auto-advance (user controls)

---

### Zone 7: Mobile-First Everything

**Test on iPhone SE (375px) first. Desktop is the easier case.**

**Quality bar:**
- Touch targets: 44×44px minimum
- Bottom nav: 5 tabs, 64px height, active state with amber icon
- Sticky bottom CTA on listing detail (when user scrolls past primary CTA)
- Filter bottom sheet: drag-down to dismiss, drag-up to expand
- Horizontal scroll zones: `scroll-snap-type: x mandatory`, hide scrollbars
- Pull-to-refresh on listing grids
- Haptic feedback (vibration API) on key actions
- Chat: full-screen on mobile, no nav visible
- Photo zoom: pinch gestures native

**Anti-patterns:**
- ❌ Desktop layout scaled down
- ❌ Hover-only interactions (no fallback on mobile)
- ❌ Tiny tap targets (<44px)
- ❌ Forcing rotation to landscape

---

## Cross-Cutting Excellence Standards

### Typography

- **Primary:** IBM Plex Sans Arabic (free, Google Fonts)
- **Latin:** Plus Jakarta Sans (close to Satoshi, free, Google Fonts)
  - OR license Satoshi from Fontshare ($49/yr) — recommended for final
- **Monospace:** JetBrains Mono (free, Google Fonts)
- **CRITICAL:** `numberingSystem: 'latn'` everywhere — Western digits mandatory
- **Max 2 weights visible** per screen
- **Line length:** 60-65ch max for body text
- **Arabic + Latin blending:** smooth via font-feature-settings

### Motion Language

Spring physics, NOT linear timing:

```css
/* Default weighty spring */
transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Exit / dismissal */
transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Snappy interactions (filters, chips) */
transition: background 150ms ease;
```

**Never:**
- `transition: all` (performance + a11y issues)
- Linear transitions for entrances
- Motion on elements that don't need it

**Always:**
- Animate only `transform` and `opacity`
- `will-change: transform` on hover-animated elements
- Respect `prefers-reduced-motion` (disable all >50ms)

### RTL Discipline (Arabic-First)

**Every component built RTL-first, LTR-compatible.** Zero `left/right` classes.

| ❌ Forbidden | ✅ Required |
|---|---|
| `ml-4` `mr-4` | `ms-4` `me-4` |
| `pl-4` `pr-4` | `ps-4` `pe-4` |
| `left-0` `right-0` | `start-0` `end-0` |
| `border-l` `border-r` | `border-s` `border-e` |
| `text-left` `text-right` | `text-start` `text-end` |
| `rounded-tl` `rounded-tr` | `rounded-ss` `rounded-se` |

Enforced by ESLint rule (add in Phase 1 Sprint 1).

### Dark Mode (ADDED to Phase 1)

- Toggle in user preferences
- `prefers-color-scheme: dark` respected as default
- Inverted palette:
  - `canvas-zinc` → `#09090B` (zinc-950)
  - `pure-surface` → `#18181B` (charcoal-ink)
  - `charcoal-ink` → `#F4F4F5` (canvas-zinc)
  - `muted-steel` → `#A1A1AA` (zinc-400)
  - `warm-amber` unchanged (works both modes)
- Tested on every screen

### Accessibility (WCAG AA minimum)

- Contrast: 4.5:1 body text, 3:1 large text
- Keyboard nav: every interactive element reachable via Tab
- Focus-visible: 2px amber ring + 2px offset on all
- ARIA labels: every icon-only button
- Screen reader: Arabic + English tested
- Reduced motion: all animations disabled
- Form labels: always visible, never floating

---

## Design QA Gate (Per Sprint)

Before closing any sprint, ALL must pass:

**Visual QA:**
- [ ] Every new component RTL + LTR tested
- [ ] Mobile iPhone SE 375px tested
- [ ] Mobile iPhone 15 Pro Max 430px tested
- [ ] Desktop 1400px tested
- [ ] Dark mode variant exists + tested
- [ ] Focus states on every interactive element
- [ ] Empty states for every list/grid

**Performance QA:**
- [ ] Lighthouse mobile score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] No console errors or warnings

**Accessibility QA:**
- [ ] Keyboard-only navigation works
- [ ] VoiceOver / TalkBack tested Arabic
- [ ] VoiceOver tested English
- [ ] Color contrast checker passes AA
- [ ] Reduced motion test (all animations <50ms)

**Code Quality QA:**
- [ ] Zero `left/right/ml/mr/pl/pr` in codebase (ESLint enforced)
- [ ] All formatted numbers use `numberingSystem: 'latn'`
- [ ] Component names follow PascalCase convention
- [ ] No `any` types in TypeScript

---

## The "Wow Moments" — Specific Polish Targets

Hunt for these. They compound into magic:

1. **Onboarding:** Phone number field auto-formats as typing (+965 XX XX XX XX)
2. **Photo upload:** Drag-reorder feels like iOS Photos
3. **Listing publish:** Success confirmation with subtle confetti (reduced-motion respects)
4. **Chat arrival:** Sound + haptic + visual all coordinated
5. **Save (favorite):** Heart pulses with spring, updates count immediately
6. **Search focus:** Keyboard shortcut (⌘K) with spotlight-style modal
7. **Empty state humor:** "لسه ما فيه إعلانات هنا — كن الأول 👇" (playful but tasteful)
8. **Dark mode toggle:** Smooth palette transition, not jarring

---

## Measurement: Are We Actually Better?

**User-facing metrics:**
- Time-to-first-interaction (tap/scroll): < 2s
- Listing creation completion rate: > 75%
- Mobile Lighthouse score: consistently > 90
- "How did the design feel?" survey: > 8/10 average in Beta

**Comparative (blind tests with Beta users):**
- Show Dealo Hub + Q84sale side-by-side → which feels more trustworthy?
- Target: 80%+ choose Dealo Hub on design alone

---

## Resources & References

**Inspiration (not imitation):**
- Linear.app (motion + density)
- Stripe dashboard (information clarity)
- Net-a-Porter (editorial luxury)
- Arc Browser (bold typography choices)
- Airbnb mobile (category browsing, photo emphasis)

**Tools:**
- Figma (mockups, kept in sync with code)
- Framer Motion (React animation library)
- Tailwind CSS + `tailwindcss-logical`
- Radix UI (accessibility primitives)
- Lucide React (icons — always inline SVG)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial Design Excellence commitment. 7 UI zones defined, QA gates per sprint, dark mode added to Phase 1, accessibility WCAG AA baseline. |
