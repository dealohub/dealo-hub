# Phase 1 Roadmap — Core Marketplace MVP
### 4 Months · 8 Sprints × 2 Weeks · 10 Launch Categories

**Date:** April 18, 2026
**Scope:** Phase 1 of 6-phase plan (see TAXONOMY-V2.md for full vision)
**Deliverable at end:** Closed Beta launch in Kuwait with 100 invite-only users
**Success criteria:** Users create listings, message, complete transactions

---

## Phase 1 Goals

1. **Ship a beautiful, functional marketplace** across 10 parent categories
2. **Validate thesis** with real Kuwaiti users (100 Beta testers)
3. **Establish design excellence** as the core moat (see DESIGN-EXCELLENCE.md)
4. **Build AI infrastructure** for fraud + semantic search + photo-to-listing
5. **Create supply seeding foundation** for Phase 2 vertical expansion

### Explicitly OUT of Phase 1:
- ❌ Automotive vertical (Phase 2 — needs custom schema)
- ❌ Real Estate (Phase 2 — needs custom schema)
- ❌ Jobs & Services (Phase 2)
- ❌ Auctions (Phase 3 — eBay-style features)
- ❌ Payments / Escrow (Phase 4)
- ❌ Native mobile apps (Phase 5)

---

## Sprint Structure

Each sprint follows same format:
- **Week 1:** Build + iterate
- **Week 2:** Polish + design QA + handoff

Each sprint ships something testable. No "big bang" integration at the end.

---

## 📅 Sprint 1 (Weeks 1-2): Authentication + Profiles Foundation

### Theme
"Users can sign up, verify phone, and create a rich profile — and it feels like Apple."

### Outputs
- Phone OTP signup (Twilio + libphonenumber-js for +965 validation)
- Email-based backup signup
- Login / logout flows
- Profile creation + edit (display name, avatar, bio, country)
- Avatar upload (Supabase Storage + client-side resize)
- Protected routes middleware
- Session management
- Locale switcher in nav (preserved across auth flows)

### Design QA Criteria
- ✅ Signup flow feels conversational, not form-heavy
- ✅ Phone picker shows ONLY 6 GCC flags with Kuwait default
- ✅ OTP field auto-advances between 6 digits, auto-submits when complete
- ✅ RTL and LTR tested on every screen
- ✅ Mobile-first (test on iPhone SE width 375px)
- ✅ Loading states (no spinners — shimmer skeletons only)
- ✅ Error states clear and actionable

### AI Integration
None (Sprint 1).

### Files to Create (briefs for Claude Code)
- BRIEF-001: Authentication System (ready)
- BRIEF-002: Profile Pages (pending)
- BRIEF-003: Avatar Upload (pending)

### Acceptance Checklist
- [ ] User can sign up with phone +965 number, receives SMS OTP, verifies within 60 seconds
- [ ] User can sign up with email (fallback option)
- [ ] Profile auto-created in DB via trigger (already in schema)
- [ ] User can edit display_name, bio, avatar from `/profile/edit`
- [ ] Avatar upload optimized (WebP conversion, 512x512 max)
- [ ] Logout clears session + redirects to home
- [ ] Protected routes redirect unauthenticated users to `/signin`
- [ ] All flows tested on mobile + desktop, AR + EN

---

## 📅 Sprint 2 (Weeks 3-4): Listing Creation Flow

### Theme
"Publishing a listing feels joyful, not tedious. From photo to published in 90 seconds."

### Outputs
- Multi-step listing form (7 steps)
- Category picker (10 parents × ~50 subs)
- Photo upload (5-10 images, drag-reorder, progressive compression)
- Price input with 3 modes (Fixed / Negotiable / Best Offer)
- Delivery options multi-select (Pickup / Seller Delivers / Buyer Ships)
- Location picker (City → Area dropdown hierarchy)
- Draft save + resume
- Preview before publish
- Luxury-specific fields (video upload + authenticity statement)

### Design QA Criteria
- ✅ Step indicator feels like progress, not overwhelming
- ✅ Photos drag-reorder with spring physics (not linear)
- ✅ Category picker uses beautiful cards, not boring dropdown
- ✅ Price field formats as user types (Western digits, currency symbol)
- ✅ Form auto-saves to localStorage every field change
- ✅ Camera capture works on mobile (PWA API)
- ✅ Preview step feels like the actual listing (WYSIWYG)

### AI Integration
Sprint 2 sets up the scaffolding for AI (fields, state) but AI logic ships Sprint 5/6.

### Files to Create
- BRIEF-004: Listing Form Multi-Step (pending)
- BRIEF-005: Photo Upload & Compression (pending)
- BRIEF-006: Category Picker Component (pending)
- BRIEF-007: Location Picker Component (pending)

### Acceptance Checklist
- [ ] User completes a full listing in under 2 minutes (timed test)
- [ ] 10 photos upload in under 15 seconds (tested on 4G)
- [ ] Draft saves every field change, survives page refresh
- [ ] Luxury category triggers video + authenticity fields
- [ ] Category-specific min_photos enforced (8 for luxury, 5 for others)
- [ ] Preview shows listing exactly as it will appear to buyers
- [ ] Publish creates listing with `status='pending'`, triggers fraud pipeline (stub for now)

---

## 📅 Sprint 3 (Weeks 5-6): Browse + Semantic Search

### Theme
"Finding what you want feels magical, not like using Google 2005."

### Outputs
- Homepage with category cards (asymmetric 4+4+2 grid)
- Category pages (listing grid with filters)
- Semantic search via pgvector + OpenAI embeddings
- Filter panel (price range, location, condition, delivery, trust)
- Sort options (newest, price asc/desc, most saved, nearby)
- Empty states with actionable suggestions
- Pagination (or infinite scroll)
- Loading skeletons (no spinners)
- Save listing (favorite) functionality

### Design QA Criteria
- ✅ Category page header feels editorial (large type, asymmetric)
- ✅ Listing grid responsive: 4 col desktop → 2 col tablet → 1 col mobile
- ✅ Filter panel: desktop sidebar, mobile bottom sheet
- ✅ Search bar with ✨ AI indicator (subtle, not distracting)
- ✅ Search results load in under 200ms
- ✅ Empty states: specific to current filters, not generic
- ✅ Favorite toggle has spring animation (heart scale 1→1.3→1)

### AI Integration
- **Semantic search activated** via pgvector
- Query embedding on user search
- Hybrid ranking (70% semantic + 30% keyword)
- Query interpretation fallback (when keyword search returns <3 results)

### Files to Create
- BRIEF-008: Homepage + Category Grid (pending)
- BRIEF-009: Listing Grid + Filters (pending)
- BRIEF-010: Semantic Search Integration (pending)
- BRIEF-011: Save/Favorite System (pending)

### Acceptance Checklist
- [ ] Semantic search: "جوال قديم زين" returns iPhone used listings
- [ ] Filters update results without page reload
- [ ] Filter chips show active count, clearable individually
- [ ] Favorite saves to DB + updates listing save_count
- [ ] Mobile filter bottom sheet animates smoothly (spring physics)
- [ ] Empty state for zero-result search shows specific suggestions
- [ ] Lighthouse performance score > 90 on category pages

---

## 📅 Sprint 4 (Weeks 7-8): Listing Detail + Chat System

### Theme
"The listing detail page converts browsers to buyers. Chat feels like iMessage, not SMS."

### Outputs
- Listing detail page (60/40 gallery/details split)
- Image gallery with fullscreen zoom + swipe
- Video player for luxury listings
- Seller profile card (inline on detail page)
- Trust signals stack
- Sticky CTA on mobile
- In-app chat system (Supabase Realtime)
- Message threading per (listing, buyer, seller)
- Listing reference card pinned in chat
- Safety banner in chat
- Unread badges
- Typing indicators
- Image attachments in chat
- Push notifications (web push API) for new messages

### Design QA Criteria
- ✅ Listing gallery fullscreen works on mobile (pinch zoom, swipe)
- ✅ Seller card looks beautiful, not like a data dump
- ✅ Chat bubbles feel iMessage-quality (corner radius, spacing, color)
- ✅ Real-time message arrival animates (fade + slide-up 12px)
- ✅ Typing indicator: 3 dots with staggered scale pulse
- ✅ Safety banner calm but prominent
- ✅ "Best Offer" messages have 🎯 visual differentiation

### AI Integration
- Pre-launch fraud accuracy gate test (Week 7)
- Test 50 real listings for fraud detection FPR + TPR
- Kill switch if accuracy < 70% TPR or > 5% FPR

### Files to Create
- BRIEF-012: Listing Detail Page (pending)
- BRIEF-013: Chat System (pending)
- BRIEF-014: Push Notifications (pending)
- BRIEF-015: Pre-launch AI Accuracy Test Suite (pending)

### Acceptance Checklist
- [ ] Listing detail loads in under 1.5s
- [ ] Chat messages arrive in real-time (Supabase Realtime)
- [ ] Unread count accurate across sessions
- [ ] Safety banner visible on every chat screen
- [ ] Phone number NEVER appears on listing detail (moat enforced)
- [ ] Make Offer flow: button pre-fills chat with template
- [ ] Push notifications delivered on both mobile + desktop browsers
- [ ] AI fraud accuracy gate: passes 70% TPR threshold

---

## 📅 Sprint 5 (Weeks 9-10): Trust Layer + AI Fraud Pipeline

### Theme
"Every listing passes through a trust pipeline. Users see safety signals everywhere."

### Outputs
- Ratings system (5-star post-transaction)
- Reports workflow (listing + user reports)
- Phone verified badge on profiles
- AI fraud pipeline (5 layers):
  1. Reverse image search (Google Vision)
  2. Text pattern analysis (GPT-4o-mini)
  3. Price anomaly detection (pgvector similar)
  4. Duplicate detection (embedding similarity)
  5. Behavioral scoring (rules)
- Safety Signals Stack component on listing detail
- Fraud event logging
- Admin fraud review queue (simple SQL view)

### Design QA Criteria
- ✅ Trust signals UI doesn't overwhelm — subtle when clean, prominent when issue
- ✅ "AI Safety Checked" badge feels earned, not fake
- ✅ Report flow simple: 3 clicks max
- ✅ Rating submission after "Mark as Sold" is frictionless
- ✅ FraudCheckProgress animation during submission: progressive reveal, calm

### AI Integration
- **Full fraud pipeline active**
- Triggers on every listing publish
- Fail-open on AI errors
- Cost monitoring (budget alerts via Sentry)

### Files to Create
- BRIEF-016: Rating System (pending)
- BRIEF-017: Reports + Moderation (pending)
- BRIEF-018: Fraud Detection Pipeline (pending)
- BRIEF-019: Trust Signals UI (pending)

### Acceptance Checklist
- [ ] Every new listing processed by fraud pipeline before becoming 'live'
- [ ] Reverse image search catches stock photos (tested with 20 samples)
- [ ] Price anomaly flags listings <50% or >200% of category median
- [ ] AI cost per listing < $0.02
- [ ] Fail-open: listings publish even if OpenAI is down (status='pending_review')
- [ ] Admin can view + action flagged listings via Supabase dashboard
- [ ] Rating triggers profile.rating_avg recompute

---

## 📅 Sprint 6 (Weeks 11-12): Luxury Excellence + AI Photo-to-Listing

### Theme
"Luxury resale feels like Net-a-Porter. AI helps sellers, never replaces them."

### Outputs
- Luxury-specific components:
  - LuxuryVideoPlayer (hero on listing detail)
  - Authenticity statement flow
  - 8-photo minimum enforcement
  - Documentation upload (receipt/serial)
  - Luxury category banner + disclaimer
- AI Photo-to-Listing (V1 Minimal):
  - Category auto-detect
  - Brand auto-detect (luxury only)
  - Condition auto-detect
  - Confidence thresholds enforced (silent skip below 0.75-0.80)
- Pre-launch accuracy gate (Week 11):
  - 20 real Kuwait product photos test
  - Kill switch if accuracy < 75% category

### Design QA Criteria
- ✅ Luxury listing detail feels premium (typography, spacing, video hero)
- ✅ AISuggestionCard: user accepts/rejects feels effortless
- ✅ Confidence badges subtle, never shame low-confidence
- ✅ "Human-Written" badge displayed prominently on manual listings
- ✅ Video upload smooth on mobile (no crashes, progress indicator)

### AI Integration
- **Photo-to-Listing Minimal active** (category + luxury brand + condition)
- Telemetry capture (Decision 9 monitoring)
- V3 Go/No-Go telemetry begins collecting

### Files to Create
- BRIEF-020: Luxury Components (pending)
- BRIEF-021: Photo-to-Listing Pipeline (pending)
- BRIEF-022: AI Telemetry Schema (pending)
- BRIEF-023: Accuracy Gate Test Suite (pending)

### Acceptance Checklist
- [ ] Luxury listings require video + 8 photos + authenticity statement
- [ ] Video plays inline on mobile + desktop (no external redirect)
- [ ] Photo-to-Listing accuracy gate passes: 75% category, 70% brand, 65% condition
- [ ] Low-confidence AI suggestions silently skipped (not shown to user)
- [ ] Human-Written badge appears on ≥60% of test listings
- [ ] Telemetry captured: ai_category_accepted, ai_brand_accepted, etc.

---

## 📅 Sprint 7 (Weeks 13-14): Seller Tools + Admin

### Theme
"Sellers have a dashboard that feels like Stripe. Admin tools save Fawzi's time."

### Outputs
- Seller dashboard (`/my-listings`):
  - Active / archived / sold lists
  - Edit listing
  - Mark as sold
  - Renew archived listings
  - View analytics (views, messages, saves)
- Saved searches + email/push alerts
- Block user functionality
- Admin panel (basic):
  - Fraud queue
  - Reports queue
  - User management (ban/unban)
  - Category management
- Notification preferences

### Design QA Criteria
- ✅ My Listings looks like a beautiful inventory view (not a table dump)
- ✅ Analytics shows as small inline chart (sparkline), not huge card
- ✅ Renew button prominent for archived listings
- ✅ Admin panel: functional, not polished (internal tool)

### AI Integration
None new (Sprint 7 focuses on tooling).

### Files to Create
- BRIEF-024: Seller Dashboard (pending)
- BRIEF-025: Saved Searches (pending)
- BRIEF-026: Admin Panel (pending)

### Acceptance Checklist
- [ ] Seller can renew archived listing with 1 click
- [ ] Analytics per listing: views, messages, saves
- [ ] Saved search triggers email when match appears
- [ ] Admin can approve/reject flagged listings
- [ ] Admin can ban user (soft delete their listings)

---

## 📅 Sprint 8 (Weeks 15-16): Polish + Closed Beta Launch

### Theme
"Everything works, everything feels right. Ship to 100 Beta users."

### Outputs
- Mobile audit (every screen tested on iPhone SE, iPhone 15, Galaxy S24)
- Arabic RTL QA (every screen flipped, logical properties verified)
- Accessibility audit (WCAG AA minimum)
- Performance optimization (Lighthouse > 90 on all routes)
- SEO optimization (meta tags, schema.org, sitemap, robots.txt)
- Error tracking (Sentry)
- Analytics (PostHog events for full funnel)
- PWA manifest + service worker
- Onboarding flow for Beta users (invitation-only)
- Beta feedback widget
- Closed Beta launch to 100 invited users

### Design QA Criteria
- ✅ Every screen passes design QA from DESIGN-EXCELLENCE.md
- ✅ Zero `left/right` Tailwind classes (enforced by lint rule)
- ✅ Every page Lighthouse mobile score > 90
- ✅ WCAG AA contrast on all text
- ✅ Keyboard navigation works on every interactive element

### AI Integration
Monitoring + telemetry dashboard.

### Files to Create
- BRIEF-027: PWA + Offline Support (pending)
- BRIEF-028: SEO Optimization (pending)
- BRIEF-029: Beta Onboarding Flow (pending)
- BRIEF-030: Analytics + Sentry Integration (pending)

### Acceptance Checklist
- [ ] Closed Beta accessible to 100 invited users
- [ ] All sprints deliverables verified functional
- [ ] Supply seeding: 200+ listings live at Beta launch
- [ ] Mobile experience: 95+ Lighthouse score
- [ ] Arabic RTL: zero visual bugs
- [ ] Accessibility: WCAG AA compliant
- [ ] Analytics tracking full funnel (signup → list → message → sold)
- [ ] Sentry capturing all errors
- [ ] Feedback widget visible for Beta users

---

## Cumulative Acceptance — End of Phase 1

By end of Week 16, Dealo Hub is:

✅ A fully functional C2C marketplace with 10 categories
✅ Beautiful beyond anything in the Gulf market
✅ AI-protected from day one (fraud pipeline live)
✅ AI-Assisted for sellers (Photo-to-Listing Minimal)
✅ Chat-only moat intact (no phone numbers visible)
✅ Luxury-first positioning with video + authenticity
✅ Mobile-first PWA (installable)
✅ Arabic RTL-native + English LTR
✅ 200+ seed listings in Kuwait
✅ 100 Beta users testing
✅ Analytics + telemetry capturing data for Phase 2 decisions

**Phase 2 entry criteria:** at least 60% of Beta users complete at least 1 transaction. At least 30% of those enthusiastically request automotive/real estate.

---

## Risk Register (Phase 1)

| Risk | Probability | Mitigation |
|---|---|---|
| Sprint slip compounds | HIGH | Weekly review, aggressive descoping option |
| AI accuracy gate fails | MEDIUM | Defer Photo-to-Listing to Phase 2 if needed |
| Supply seeding insufficient | MEDIUM | Shop partnerships kick off Week 2, concurrent with build |
| Design polish neglected for features | HIGH | Design QA is REQUIRED pass/fail per sprint |
| Founder burnout | HIGH | 1 full day off per week, mandatory |
| Claude Code execution bottleneck | MEDIUM | Have 2-3 briefs ready ahead; don't wait |

---

## Pacing Principles

1. **Each sprint ships** — no "integration sprints" at the end
2. **Design QA is a gate** — can't move to next sprint without passing
3. **AI cost monitoring** — weekly check against budget caps
4. **Supply seeding parallel** — not sequential to code
5. **Beta feedback loops** — start as soon as Sprint 5 ships trust layer

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial Phase 1 roadmap — 8 sprints, 4 months, 10 categories, Closed Beta at end |
