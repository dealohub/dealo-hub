# Phase 8a — GCC Live DOM: Home Cleaning + Handyman Sections

**Probed:** 2026-04-22 (live Chrome DevTools MCP navigation + DOM a11y snapshot + viewport screenshots, all saved under `./screenshots/`).
**Sites covered:** Dubizzle Kuwait (www.dubizzle.com.kw) + Q84Sale / 4Sale (www.q84sale.com).
**Not covered:** OpenSooq KW, Haraj, 4Sale BH — time boxed. Patterns from the two probed were dominant enough to proceed to synthesis; additional sites can be appended later.
**Method note:** An earlier sub-agent attempt was blocked by sandboxed WebFetch permission. Switched to Chrome DevTools MCP running in the main thread, which successfully rendered both SPAs. Every observation below is from an actual DOM frame, not training data.

---

## 1. Per-site findings

### 1.1 Dubizzle Kuwait — `/en/services/` + `/en/services/domestic-services/`

**Landing — `/en/services/` (screenshot 01):**
- Header reads **"Professional Services and Companies in Kuwait — 1,708 ads"**. The 1,708 figure advertises scale.
- Sidebar categories: **Services › Domestic Services (6) · Business Services (36) · Personal Services (10) · Events (1)**. That is 53 ads across named service sub-cats; the remaining 1,655 sit in unnamed buckets or are mislabeled from non-service verticals. **Service scale is shallow.**
- Featured ads on page 1: "Commercial licenses for sale", "English teachers". Not cleaning, not handyman.
- Listing card CTAs: **"Call" + "Chat"**. Call exposes the phone number directly on click. Phone numbers also baked into promo images (e.g. "66813567" embedded in a washing-machine-repair banner). **No phone masking.**
- Only filter visible on the landing level: Location (dropdown, Kuwait-level only — no governorate/area pre-filter at this depth). Price min/max.
- Sort: "Newly listed" default. No trust/rating sort.

**Domestic Services — `/en/services/domestic-services/` (screenshot 02):**
- Shows **6 ads total**, all of 2026-04-22. Breakdown of what appears under "Domestic Services":
  1. "قص خرسانه بالليزر" (concrete laser cutting) — KWD 1 "Negotiable" — **mislabeled**.
  2. "Transportation available" — KWD 1 — **mislabeled**.
  3. "نقل عفش السره" (furniture moving) — **KWD 50,636,444** — **this is a phone number masquerading as price** (50636444 embedded in banner image).
  4. "مكتب خدم منزلي" (domestic worker office) — KWD 220 — only one genuinely service-like listing; it is an agency, not an individual provider.
  5. "Repair washing machine Ac split unit Refrigerator" — KWD 5 — **mislabeled as domestic**.
  6. "هافلوري للإيجار" (Hi-Lux for rent, moving) — KWD 30 — moving, not cleaning.
- Sidebar narrows to: Babysitting (1) · Cooks (2) · Drivers (2). No "cleaning" sub-category.
- **No home-cleaning-proper listings surfaced in the dedicated sub-cat.**
- Price filter (Min/Max) visible, no area filter at this depth, no rating filter.

**Safety signals observed:** None on the landing or browse views. Generic "meet seller in person" CTA not shown at this level.

### 1.2 Q84Sale / 4Sale — `/en/services` → `/en/services/cleaning-services`

**Landing — `/en/services` (screenshot 03):**
- Service sub-categories exposed as icon tiles: Satellite · Pack & Move · **Cleaning Services** · Nannies & Laborers · Clearing Agent · Parties · Tailor · Travel & Tourism · Medical Services · Hairdresser · Laundry · Food & Catering · Commercial Licenses · Advertisement Services · Transportation & Logistics · Other Services. **~16 sub-cats, dedicated "Cleaning Services" tile at top.**
- "Commercial Ads" promo banners below: "Pack & Move", "Cleaning", "Louisiana Co. Cleaning", another "Pack & Move". Phone numbers visible in every banner image.

**Cleaning Services — `/en/services/cleaning-services/1` (screenshots 04, 06):**
- Page title **"Cleaning Services (page: 1) — 171 Ads"**. **~28× Dubizzle's dedicated sub-cat volume.**
- Governorate filter chips row: **Ahmadi District · Jahra District · Kuwait City District · Mubarek Al-Kabeer District · Farwaniyah District · Hawalli District**. This is structured, not a free-text dropdown.
- **Primary CTA on the browse page:** a large blue button reading **"Get Quotes"** with tagline "Stop searching! Get the best price from service providers. +20 Providers are waiting for your request." Adjacent illustration labeled `deposit money illustration for get quote section` (DOM alt-text, verbatim). **This is a Thumbtack-style quote-request feature built into 4Sale.**
- Clicking the Get Quotes button (screenshot 05) navigated to a page that rendered **500 Server Error ("Sorry!, we have encountered a server error")**. Either the feature is gated behind auth, broken at the time of probe, or permanently abandoned. **FLAG — needs reconfirm in a later probe.**
- Below the quote band, listings are rendered as **commercial banner images**. A sample:
  - "Ayadi Cleaning" — banner shows phones **66503191 / 51575000** baked into the image.
  - "Cleaning" — **66270077** (banner text: "24 Hour Service All Areas").
  - "Cleaning" — **99337172** (with WhatsApp icon).
  - "Al Danah Cleaning" — **55342155** ("Fast service, all areas, best prices").
  - "Cleaning" — **55350432**.
- From the DOM a11y tree, every top-of-page listing is flagged `commercial-listing` (e.g. `url="https://www.q84sale.com/en/commercial-listing/hands-search-subscriber"`, 25+ such rows). **100% of featured listings observed are businesses — no individual-provider profiles at all.**

**Listing detail — `/en/listing/cleaning-services-20737164` (screenshot 06):**
- Seller card: **"clean service kuwait" · 3 ads · Member since October 2024**.
- **Phone number 66984597 is the dominant visual element** — a giant banner occupying ~40% of viewport, un-suppressible (it is inside a JPEG).
- CTAs visible: **"Book now"** (primary blue button), a phone-icon button, a WhatsApp-icon button (green), a chat-icon button. Four separate contact primitives, phone never masked.
- Services listed (inside the image, not as structured fields): apartment / villa / kitchen / office / carpet / sofa / marble polishing / bathroom cleaning. **No structured amenity picker — all copy is inside banner image JPEGs.**
- Metadata: 134 views · 2 days old · "More than 41 people are interested — grab it before it's gone!" (FOMO copy).
- **Right rail: "Safety Guidelines".** Four bullets are shown — but they are the **goods-marketplace boilerplate** ("Make sure to inspect the product", "Document the sale/purchase process", "Do not transfer money until you have verified the seller's identity", "Make sure to obtain a signed receipt"). **Not service-adapted.** The words "product" and "receipt" read wrong for cleaning.
- **No structured price.** No hourly rate. No service package. No reviews. No ratings. No completion count.

---

## 2. Side-by-side observations

| Dimension | Dubizzle KW | Q84Sale / 4Sale |
|---|---|---|
| Dedicated "Cleaning" sub-cat | No — only "Domestic (6)" | **Yes — "Cleaning Services (171)"** |
| Listings at page 1 | 6 (mostly mislabeled) | 171 |
| Governorate/area filter | No (Kuwait-level only) | **Yes — chip row, 6 governorates** |
| Rating/trust filter | No | No |
| Quote-request feature | No | **Yes, but broken 500 at probe time** |
| Individual-provider profiles | No | No |
| Price shown on browse | Per-listing "negotiable" | Per-listing (often KWD 10 anchor) |
| Structured service fields | None | None (copy is inside JPEGs) |
| Ratings / reviews | None visible | None visible |
| Phone masking | None (Call button direct) | None (phone in image) |
| WhatsApp CTA | No (Chat only) | **Yes — green WhatsApp icon on detail** |
| On-platform chat | Yes (Chat button) | Yes (chat icon) |
| FOMO / urgency copy | Subtle | Strong ("41 people interested — grab it") |
| Service-adapted safety copy | No trust bar | Generic goods-marketplace safety bar |
| Booking primitive | None | **"Book now" button — effect unknown** |
| Seller history signal | "X ago" timestamps | "Member since October 2024" + ad count |

---

## 3. Top 5 buyer PAINS (observed, not theoretical)

1. **Cleaning in Dubizzle KW is effectively invisible** — no dedicated sub-cat, 6 mislabeled ads. A buyer ends up on WhatsApp or 4Sale.
2. **All providers are companies, not individuals.** Neither site surfaces a real cleaner's profile, availability, or history — a single aggregated "brand" is the only granularity. The visit-to-visit quality-varies pain (§3 of the Kuwait Context report) has no UX fix here.
3. **Phone is the service — platforms are just routers.** Phone numbers are baked into listing images on 4Sale and sit behind "Call" on Dubizzle. Once the call connects, the platform is out of the loop. No re-engagement, no accountability, no review capture.
4. **No structured service spec.** Nothing enforces "what's included" disclosure. Everything is marketing copy inside JPEGs. Two listings titled "Cleaning" at KWD 10 may mean two different things.
5. **FOMO copy replaces trust signals.** 4Sale's "41 people are interested — grab it before it's gone!" substitutes urgency theater for actual reputation primitives (rating, completion count, verified identity).

## 4. Top 5 GAPS no GCC site fills

1. **No individual-provider profiles with per-cleaner history.** The atomic unit is a company brand, not the human who shows up at your door.
2. **No structured quote-request flow.** 4Sale attempted one (Get Quotes button) but it returned 500 at probe time and has no public documentation. There is no working Kuwait equivalent of Thumbtack's "answer 6 questions, get 3-5 quotes" loop.
3. **No reviews or ratings after service completion.** Both sites surface zero post-service feedback, so a buyer cannot distinguish the 99.9% real cleaner from the 0.1% scammer until damage occurs.
4. **No area-matching intelligence for providers.** 4Sale has governorate chips for browse, but no system that says "this Salmiya cleaner serves Hawalli + Jabriya, not Ahmadi." Buyer has to match manually.
5. **No service-adapted safety/dispute content.** 4Sale's safety guidelines literally say "inspect the product" — a textual tell that Services is being treated as a goods-marketplace afterthought.

## 5. Surprising pattern

**4Sale shipped the Thumbtack moat — and appears to have abandoned it.** The "Get Quotes" button is prominent, DOM-labeled `deposit money illustration for get quote section`, and advertises "+20 Providers are waiting for your request" — yet clicking it returns 500. Either this was a paid-deposit model they rolled back, a feature under reconstruction, or an internal-only staging experiment leaking to prod. Whichever it is, it says the quote-first structure was tried in Kuwait, didn't stick, and the why matters for Phase 8a planning.

---

**End of 01-GCC-LIVE-DOM.md** — observation catalog. Synthesis + doctrine derivation happens separately in `00-SYNTHESIS.md` and `PHASE-8A-HOME-SERVICES.md` respectively. No recommendations made in this file.
