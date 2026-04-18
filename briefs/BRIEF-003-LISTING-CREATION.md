# BRIEF-003: Listing Creation Flow
### Third Executable Brief for Claude Code

**Status:** 🟢 Ready (after BRIEF-002 committed)
**Estimated effort:** 22-28 hours (3-4 Claude Code sessions)
**Sprint:** 2 (Weeks 3-4 of Phase 1)
**Dependencies:** BRIEF-001 (Auth) + BRIEF-002 (Profiles)
**Blocks:** BRIEF-004 (Browse), BRIEF-005 (Detail)

**This brief is the visual turning point.** Where Dealo Hub stops being plumbing and becomes a product.

---

## Context

Users have identities (BRIEF-002). Now they need to publish listings. This flow is the most-used feature in the product — every seller starts here. Design quality here sets the brand perception for everything else.

**Read before starting:**
- `planning/DECISIONS.md` — Decision 3 (3 price modes), Decision 5 (10 images max, 8 for luxury)
- `DESIGN.md` Section 18 (Listing Creation Flow) + Section 16 (Luxury Components)
- `design/DESIGN-EXCELLENCE.md` Zone 5 (Listing Creation) + Zone 7 (Mobile)
- `src/lib/categories.ts` — source of truth for categories + per-category constraints
- `supabase/migrations/0005_listings.sql` — listings + listing_images + listing_videos schema

---

## Goal

User flow:
1. Click "+ Sell" in nav → `/sell` → 7-step form
2. **Step 1:** Pick category (visual grid, 10 parents × ~50 subs)
3. **Step 2:** Upload 5-10 photos (8 min for luxury) + optional video (required for luxury)
4. **Step 3:** Title + description + condition + brand/model (optional)
5. **Step 4:** Price + mode (Fixed/Negotiable/Best Offer) + min offer if Best Offer
6. **Step 5:** Location (city → area hierarchical)
7. **Step 6:** Delivery options (multi-select)
8. **Step 7 (luxury only):** Authenticity statement + receipt/serial optional
9. **Step 8:** Preview → Publish
10. Success → redirect to the published listing page (stub `/listings/[id]` — BRIEF-005 fleshes it out)

**Behaviors:**
- Draft auto-saves every field change (localStorage + DB)
- Resume draft anytime at `/sell`
- Back/forward buttons preserve state
- Each step validates before allowing next
- Mobile-first: each step feels like an Apple onboarding screen
- Design Excellence Zone 5 applied rigorously

### Out of scope:
- AI Photo-to-Listing (Sprint 5 — BRIEF-006)
- AI fraud pipeline (Sprint 5 — BRIEF-007)
- Edit existing listing (BRIEF-003a follow-up, not this brief)
- Delete listing (follow-up)

---

## Tech Decisions (Locked)

- **Image storage:** Supabase Storage bucket `listing-images` (public read, user-scoped write)
- **Video storage:** Supabase Storage bucket `listing-videos` (public read, user-scoped write, 50MB limit, mp4/webm/mov)
- **Image processing:** Client-side resize to 1920x1920 max + WebP conversion before upload
- **Draft persistence:** Dual strategy — localStorage (instant) + DB (cross-device), last-write-wins
- **Form library:** No heavy form lib — use React state + Zod validation + server actions
- **Step navigation:** URL-based (`/sell/[step]`) so back/forward + share work
- **Publish status:** Sets `status='pending'` → triggers fraud pipeline (stub for now, real in BRIEF-007)

---

## Files to Create/Modify

### Create

```
src/
├── app/
│   └── [locale]/
│       └── (app)/
│           └── sell/
│               ├── layout.tsx                     # Wizard shell with progress bar
│               ├── page.tsx                       # Entry — resumes draft or starts Step 1
│               ├── category/
│               │   └── page.tsx                    # Step 1
│               ├── media/
│               │   └── page.tsx                    # Step 2
│               ├── details/
│               │   └── page.tsx                    # Step 3
│               ├── price/
│               │   └── page.tsx                    # Step 4
│               ├── location/
│               │   └── page.tsx                    # Step 5
│               ├── delivery/
│               │   └── page.tsx                    # Step 6
│               ├── authenticity/
│               │   └── page.tsx                    # Step 7 (luxury only)
│               └── preview/
│                   └── page.tsx                    # Step 8
├── components/
│   ├── sell/
│   │   ├── WizardShell.tsx                         # Progress bar + nav buttons + step container
│   │   ├── StepIndicator.tsx                       # Thin horizontal progress
│   │   ├── StepNavigation.tsx                      # Back / Continue buttons
│   │   ├── CategoryPicker.tsx                      # Step 1: visual grid of 10 parents
│   │   ├── SubCategoryPicker.tsx                   # Step 1b: sub-categories after parent selected
│   │   ├── PhotoUploader.tsx                       # Step 2: drag-drop + camera + reorder + delete
│   │   ├── VideoUploader.tsx                       # Step 2 luxury: 30-60s video
│   │   ├── ConditionPicker.tsx                     # Step 3: radio group styled as cards
│   │   ├── DetailsForm.tsx                         # Step 3: title + desc + condition + brand
│   │   ├── PriceForm.tsx                           # Step 4: amount + 3-mode radio + min offer
│   │   ├── PriceModeBadge.tsx                      # Reusable (also for ListingCard later)
│   │   ├── LocationForm.tsx                        # Step 5: city + area cascading select
│   │   ├── DeliveryOptionsForm.tsx                 # Step 6: multi-select checkboxes
│   │   ├── AuthenticityForm.tsx                    # Step 7: statement + optional receipt upload
│   │   ├── PreviewCard.tsx                         # Step 8: WYSIWYG listing preview
│   │   └── DraftResumeBanner.tsx                   # Shown at /sell entry if draft exists
│   └── ui/
│       ├── Textarea.tsx                            # NEW primitive
│       ├── RadioCard.tsx                           # NEW primitive — radio styled as selectable card
│       └── Checkbox.tsx                            # NEW primitive
├── lib/
│   ├── listings/
│   │   ├── actions.ts                              # saveDraft, publishListing, deleteDraft
│   │   ├── validators.ts                           # Zod schemas per step
│   │   ├── draft.ts                                # Draft persistence (localStorage + DB sync)
│   │   └── queries.ts                              # getCurrentDraft, getCategoriesWithSubs
│   └── supabase/
│       └── storage-listings.ts                     # uploadListingImage, uploadListingVideo, delete helpers
supabase/migrations/
├── 0012_listing_images_bucket.sql                  # Storage bucket + RLS
├── 0013_listing_videos_bucket.sql                  # Storage bucket + RLS
└── 0014_drafts_table.sql                           # drafts table for cross-device draft sync
```

### Modify

```
src/components/layout/Nav.tsx                     # Add "+ Sell" CTA (prominent amber button)
src/components/layout/UserMenu.tsx                # Add "Create listing" menu item
messages/ar.json                                  # Add sell.* namespace
messages/en.json                                  # Add sell.* namespace
```

---

## Step-by-Step Implementation

### Step 1: Storage buckets + drafts table (1 hour)

`supabase/migrations/0012_listing_images_bucket.sql`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,  -- 5MB per image
  ARRAY['image/webp', 'image/jpeg', 'image/png']
);

-- Path convention: {user_uuid}/{listing_id or draft_id}/image-{position}-{timestamp}.webp
CREATE POLICY "listing_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_user_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_images_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_images_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

`supabase/migrations/0013_listing_videos_bucket.sql` — similar for videos:
- Limit: 50 MB
- MIME: `video/mp4`, `video/webm`, `video/quicktime`
- Same path convention

`supabase/migrations/0014_drafts_table.sql`:

```sql
-- Cross-device draft storage (complements localStorage)
CREATE TABLE listing_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Step data as JSONB — flexible schema during wizard
  category_id     BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  title           TEXT,
  description     TEXT,
  condition       item_condition,
  brand           TEXT,
  model           TEXT,
  color           TEXT,
  price_minor_units BIGINT,
  currency_code   CHAR(3) DEFAULT 'KWD',
  price_mode      price_mode,
  min_offer_minor_units BIGINT,
  country_code    CHAR(2) DEFAULT 'KW',
  city_id         BIGINT REFERENCES cities(id),
  area_id         BIGINT REFERENCES areas(id),
  delivery_options delivery_option[] DEFAULT '{}',
  authenticity_confirmed BOOLEAN DEFAULT false,
  has_receipt     BOOLEAN DEFAULT false,
  serial_number   TEXT,

  -- Media refs (uploaded but not yet attached to a listing)
  image_urls      TEXT[] DEFAULT '{}',
  video_url       TEXT,

  -- Wizard state
  current_step    TEXT DEFAULT 'category',

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- One active draft per user
  UNIQUE (user_id)
);

CREATE INDEX idx_drafts_user ON listing_drafts(user_id);

-- RLS
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_drafts" ON listing_drafts
  FOR ALL
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER trg_drafts_updated_at
  BEFORE UPDATE ON listing_drafts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Apply via MCP.

### Step 2: UI primitives (2 hours)

1. `src/components/ui/Textarea.tsx` — mirrors Input styling, min-height 100px, auto-grow
2. `src/components/ui/RadioCard.tsx` — radio styled as selectable card with amber accent when selected
3. `src/components/ui/Checkbox.tsx` — Radix-based checkbox with amber accent

### Step 3: Validators per step (1.5 hours)

`src/lib/listings/validators.ts`:

```typescript
export const Step1CategorySchema = z.object({
  category_id: z.number().int().positive(),
  subcategory_id: z.number().int().positive().optional().nullable(),
});

export const Step2MediaSchema = z.object({
  image_urls: z.array(z.string().url()).min(5).max(10),
  video_url: z.string().url().optional().nullable(),
});

// For luxury category, min is 8 images, video required — enforced at form level

export const Step3DetailsSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(5000),
  condition: z.enum(['new', 'new_with_tags', 'like_new', 'excellent_used', 'good_used', 'fair_used']),
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
});

export const Step4PriceSchema = z.object({
  price_minor_units: z.number().int().positive(),
  currency_code: z.literal('KWD'),
  price_mode: z.enum(['fixed', 'negotiable', 'best_offer']),
  min_offer_minor_units: z.number().int().positive().optional().nullable(),
}).refine(
  data => data.price_mode !== 'best_offer' || data.min_offer_minor_units == null || data.min_offer_minor_units <= data.price_minor_units,
  { message: 'min_offer_must_be_less_than_price' }
);

export const Step5LocationSchema = z.object({
  country_code: z.literal('KW'),
  city_id: z.number().int().positive(),
  area_id: z.number().int().positive().optional().nullable(),
});

export const Step6DeliverySchema = z.object({
  delivery_options: z.array(z.enum(['pickup', 'seller_delivers', 'buyer_ships'])).min(1),
});

export const Step7AuthenticitySchema = z.object({
  authenticity_confirmed: z.boolean(),
  has_receipt: z.boolean(),
  serial_number: z.string().trim().max(100).optional().nullable(),
});
```

### Step 4: Draft persistence layer (2 hours)

`src/lib/listings/draft.ts`:

```typescript
// Dual-write: localStorage (instant) + DB (cross-device)
// Read priority: DB (if fresher) > localStorage > empty

export interface DraftState {
  category_id?: number;
  subcategory_id?: number;
  title?: string;
  description?: string;
  // ... all fields
  current_step?: WizardStep;
}

export async function loadDraft(userId: string): Promise<DraftState | null> {
  const [local, remote] = await Promise.all([
    loadLocalDraft(),
    loadRemoteDraft(userId),
  ]);

  // Return whichever is fresher based on updated_at
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;
  return local.updated_at > remote.updated_at ? local : remote;
}

export async function saveDraft(userId: string, state: Partial<DraftState>) {
  await saveLocalDraft(state);  // instant
  await saveRemoteDraft(userId, state);  // async, debounced 1s
}

export async function clearDraft(userId: string) {
  await clearLocalDraft();
  await clearRemoteDraft(userId);
}
```

Debounce DB writes at 1s to avoid hammering Supabase on every keystroke.

### Step 5: Category picker (3 hours — heaviest step)

`src/components/sell/CategoryPicker.tsx`:

Layout: responsive grid of 10 parent categories.

```tsx
// Desktop: 4 cols × 3 rows (with last row being 2+"General" spanning 2 cols)
// Mobile: 2 cols
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
  {CATEGORIES.map(cat => (
    <button
      type="button"
      onClick={() => handleSelect(cat.id)}
      className={cn(
        "flex flex-col items-start justify-end",
        "aspect-[4/5] p-5 rounded-2xl",
        "bg-pure-surface border border-ghost-border",
        "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "hover:-translate-y-1 hover:shadow-card-hover hover:border-warm-amber/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2",
        selected === cat.id && "border-warm-amber ring-2 ring-warm-amber/30 bg-warm-amber/5"
      )}
    >
      <Icon className="size-12 text-warm-amber/20 mb-auto" />
      <h3 className="text-heading-3 font-semibold">{getLocalizedName(cat, locale)}</h3>
      <p className="text-caption text-muted-steel">{subCategoryCount}+ فئة فرعية</p>
    </button>
  ))}
</div>
```

After parent selected, show SubCategoryPicker below with inline scroll + slide-down animation.

### Step 6: Photo uploader (4 hours — complex)

`src/components/sell/PhotoUploader.tsx`:

Features:
- Drag-drop zone (desktop)
- Tap-to-upload (mobile)
- Camera capture (`<input capture="environment">`)
- Client-side resize: 1920x1920 max, WebP quality 0.85
- Drag-reorder with spring animation (use `@dnd-kit/sortable` — add to package.json)
- Delete individual photos
- Set cover (first image is always cover)
- Upload progress per image (shimmer skeleton)
- Enforce per-category min/max:
  - Default: 5-10 images
  - Luxury: 8-10 images required
- Show "Cover" badge on first image
- Error states: file too large, wrong format, upload failed

UX critical: uploading should feel fast + reversible. If user adds 10 images + hits back button, drafts preserve the upload URLs.

Storage path: `{user_uuid}/drafts/{draft_id}/image-{position}-{timestamp}.webp`
On publish: rename prefix from `drafts/` to `listings/{listing_id}/` (or leave and just reference).

### Step 7: Video uploader (luxury only) (2 hours)

`src/components/sell/VideoUploader.tsx`:

Features:
- Tap to select video file
- Camera record option (mobile)
- Client-side duration validation (30-60 seconds)
- Upload progress
- Preview playback inline
- Replace / delete
- Upload limit: 50MB

### Step 8: Details form (1.5 hours)

`src/components/sell/DetailsForm.tsx`:

Fields:
- Title (Input, 5-120 chars, char counter)
- Description (Textarea, 10-5000 chars, char counter)
- Condition (RadioCard group, 6 options)
- Brand (Input, optional, autocomplete from common brands for luxury)
- Model (Input, optional)

Tone:
- Placeholder text that inspires (e.g., "مثل: iPhone 14 Pro Max 256GB باللون الأسود")
- Hint text below each field
- Character counter with amber warning at 80% capacity

### Step 9: Price form (2 hours)

`src/components/sell/PriceForm.tsx`:

Layout:
- Large price input (JetBrains Mono, tabular-nums)
- Currency locked to KWD for V1 (display only)
- 3-mode selector as RadioCard group (horizontal on desktop, stacked mobile)
- Conditional: if `best_offer` selected, show "Minimum offer (optional)" input below

`src/components/sell/PriceModeBadge.tsx` — reusable:

```tsx
const MODE_CONFIG = {
  fixed:      { icon: Lock,    label: 'ثابت',          className: 'bg-zinc-100 text-zinc-700' },
  negotiable: { icon: MessageCircle, label: 'قابل للتفاوض', className: 'bg-amber-surface text-warm-amber' },
  best_offer: { icon: Target,  label: 'يقبل العروض',    className: 'bg-warm-amber/10 text-warm-amber' },
};
```

### Step 10: Location picker (1 hour)

`src/components/sell/LocationForm.tsx`:

- Country: locked to KW (V1)
- City: select dropdown (6 Kuwait governorates from `cities` table)
- Area: cascading select (loads areas when city selected)
- Use Radix Select for accessibility

### Step 11: Delivery options form (45 min)

`src/components/sell/DeliveryOptionsForm.tsx`:

- 3 checkboxes styled as RadioCard (but allow multi-select)
- Default based on category: furniture/home-fitness = pickup only, others = all 3
- At least one required

### Step 12: Authenticity form (luxury only) (1 hour)

`src/components/sell/AuthenticityForm.tsx`:

- Checkbox: "I guarantee authenticity, accept 7-day return if proven fake"
- Required to proceed
- Optional: receipt upload (PDF or image)
- Optional: serial number input
- Show "Documentation Included" badge preview if either provided

### Step 13: Preview step + publish (2 hours)

`src/components/sell/PreviewCard.tsx`:

- Renders the listing exactly as it will appear on public site
- Uses actual ListingCard + ListingDetail components (even if stubbed for now)
- "Edit" link next to each section goes back to that step
- Big "Publish" button at bottom

On publish:
1. Validate all steps server-side
2. Create `listings` row with `status='pending'` (not 'live' — fraud pipeline will flip to live)
3. Attach images from draft
4. Delete draft
5. Redirect to `/listings/[id]` (stub for now, BRIEF-005 builds the page)

### Step 14: Wizard shell + progress (1.5 hours)

`src/components/sell/WizardShell.tsx`:

```tsx
<div className="min-h-dvh-full bg-canvas-zinc">
  <StepIndicator current={currentStep} total={totalSteps} />

  <div className="container max-w-2xl py-8">
    <h1 className="text-display font-bold mb-2">{t(`steps.${step}.title`)}</h1>
    <p className="text-body-large text-muted-steel mb-8">{t(`steps.${step}.subtitle`)}</p>

    {children}
  </div>

  <StepNavigation
    onBack={handleBack}
    onContinue={handleContinue}
    canContinue={isStepValid}
    isLastStep={step === 'preview'}
  />
</div>
```

Progress bar: thin horizontal, amber fill, smooth transition between steps.

Step transitions: slide horizontal (start/end aware for RTL) with spring physics.

### Step 15: "+ Sell" CTA in Nav + i18n + testing (2 hours)

1. Add prominent amber "+ بيع" button in Nav (always visible, desktop + mobile bottom nav)
2. Add `sell.*` namespace to both locales — ~100 keys (steps, labels, errors, hints)
3. Full test matrix:
   - Full flow: category → publish
   - Draft save + resume
   - Back/forward preservation
   - Luxury path (video + authenticity)
   - Mobile 375px all steps
   - RTL + LTR
   - Character limits enforced
   - Images: drag-reorder works
   - Publish → listing created in DB

---

## Acceptance Criteria

### Functionality
- [ ] `/sell` entry resumes draft if exists, else starts Step 1
- [ ] All 7-8 steps validate before allowing next
- [ ] Draft saves every field change (localStorage instant, DB debounced 1s)
- [ ] Draft survives page refresh
- [ ] Draft survives sign-out/sign-in (DB-backed)
- [ ] Back button preserves state
- [ ] Photos upload with progress indicator
- [ ] Photos drag-reorder works desktop + mobile
- [ ] Photos resize to 1920px + convert to WebP before upload
- [ ] Luxury category enforces 8 photos min + video required
- [ ] Price mode Best Offer validates min_offer ≤ price
- [ ] Category-specific delivery defaults pre-selected
- [ ] Location: city dropdown loads areas on select
- [ ] Authenticity form only appears for luxury category
- [ ] Preview step shows WYSIWYG listing
- [ ] Publish creates `listings` row with status='pending'
- [ ] Publish deletes draft + redirects to `/listings/[id]`

### Design
- [ ] Each step feels like a dedicated screen (not form-in-form)
- [ ] Step transitions use spring physics (not linear)
- [ ] Category picker: visual grid, not dropdown
- [ ] Progress bar amber, smooth
- [ ] Photos: drag-reorder animates with spring
- [ ] RTL tested every step, LTR tested every step
- [ ] Mobile 375px: each step usable without scrolling unnecessarily
- [ ] Dark mode tested (or confirmed not implemented yet, as backlog)
- [ ] Zero `left/right/ml/mr/pl/pr` classes
- [ ] Western digits in all price/count displays

### Performance
- [ ] Lighthouse mobile > 90 on /sell entry
- [ ] 10 photos upload in < 30s on 4G (tested)
- [ ] Form re-renders smooth (no jank on typing)

### Security
- [ ] Images uploaded to user-scoped path (RLS enforced)
- [ ] Server-side validation mirrors client (server never trusts client)
- [ ] Publish creates listing with seller_id = auth.uid() (cannot fake)
- [ ] Draft scoped to owner only (RLS)

### Code Quality
- [ ] TypeScript strict passes
- [ ] Lint 0 warnings
- [ ] PhotoUploader tested with edge cases: drag out of bounds, cancel mid-upload, network error

---

## Known Gotchas

1. **`@dnd-kit/sortable` for drag-reorder:** Add to package.json if not present. Handle RTL (swap drag direction).

2. **Draft race condition:** User on 2 tabs editing → last write wins (accept it). Don't try to merge.

3. **Storage cleanup:** If user abandons draft (no publish), orphan images sit in storage. File as backlog: weekly cron cleanup of drafts older than 30 days.

4. **Photo compression budget:** Client-side WebP @ 0.85 = ~200-400KB per photo. 10 photos = 2-4MB per listing. Storage limit check.

5. **Next.js App Router step navigation:** URL-based (`/sell/category`, `/sell/media`) vs state-based. Go URL-based for back/forward support.

6. **Luxury detection:** Check `selectedCategory.requires_video` and `requires_auth_statement` to conditionally show Step 2 video + Step 7. Don't hardcode "luxury" slug.

7. **Image cover:** First image is always cover. On reorder, update DB `position` accordingly. Position 0 = cover.

---

## Post-Completion

1. Commit: `Sprint 2 BRIEF-003: Listing creation flow`
2. Screenshots of each step (desktop + mobile)
3. File backlogs (abandoned draft cleanup, dark mode if deferred, etc.)
4. Fawzi runs full acceptance → next BRIEF-004 (Browse + Search)

---

## Reference Links

- [DESIGN.md Section 18](../DESIGN.md) — Listing Creation Flow
- [DESIGN-EXCELLENCE.md Zone 5](../design/DESIGN-EXCELLENCE.md)
- [@dnd-kit docs](https://dndkit.com/)
- [Supabase Storage docs](https://supabase.com/docs/guides/storage)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial brief — 7-8 step flow, heavy on design quality per Zone 5 |
