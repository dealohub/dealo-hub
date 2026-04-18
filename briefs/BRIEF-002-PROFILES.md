# BRIEF-002: Profile Pages
### Second Executable Brief for Claude Code

**Status:** 🟢 Ready to execute (after BRIEF-001 accepted + committed)
**Estimated effort:** 14-18 hours (2-3 Claude Code sessions)
**Sprint:** 1 (Weeks 1-2 of Phase 1)
**Dependencies:** BRIEF-001 (Auth) must be complete
**Blocks:** BRIEF-004 (Listing Creation — needs seller profile linked to listings)

---

## Context

BRIEF-001 shipped auth — users can sign up, sign in, sign out. But they have nothing to look at beyond `/my-listings` placeholder. BRIEF-002 builds their identity: public profile page (visible to buyers), edit flow (visible to owner), avatar upload, handle selection, trust signals.

**Read before starting:**
- `planning/DECISIONS.md` — Decision 2 (chat-only, phone NEVER shown to other users)
- `DESIGN.md` Section 10 (SellerProfileCard) + Section 14 (Trust Signal Hierarchy)
- `design/DESIGN-EXCELLENCE.md` — Zone 1 + Zone 7 (mobile-first)
- `supabase/migrations/0003_profiles.sql` — existing profile schema (already has handle, rating_avg, etc.)

---

## Goal

### Buyer-facing (public):
1. View any seller's profile at `/profile/[handle]` or `/profile/u/[uuid]` fallback
2. See: display name, avatar, bio, member-since, trust badges, seller stats (active/sold count), rating
3. NEVER see phone or email (Decision 2 moat)
4. See their public listings (when listings feature exists — Sprint 2)

### Owner-facing (authenticated):
5. Visit `/profile/me` → redirect to `/profile/{their handle or uuid}`
6. Edit profile at `/profile/edit`: display_name, handle, bio, avatar, preferred_locale
7. Upload avatar (drag-drop + crop + WebP conversion + Supabase Storage)
8. Choose handle (unique, `^[a-z0-9_]{3,20}$`, real-time availability check)
9. See warning banners for incomplete profile (no avatar, no bio, no handle)

### Out of scope for BRIEF-002:
- Listings on profile page (placeholder only — BRIEF-004 adds real listings)
- Reviews/ratings display details (basic rating shown, details page later)
- Follow/follower system (not planned)
- Profile verification (ID verification — Phase 2)
- Export account data (Phase 2 GDPR)

---

## Tech Decisions (Locked)

- **Avatar storage:** Supabase Storage bucket `avatars` (public read, auth write)
- **Avatar format:** WebP, 512x512 max, client-side resize before upload
- **Handle validation:** Server-side uniqueness via `profiles.handle UNIQUE` constraint
- **Handle availability check:** Debounced server action, 400ms after typing stops
- **Trust Signals:** Reuse from DESIGN.md Section 14 — reusable component shared with listing detail later
- **Avatar placeholder:** Initials in amber circle (first letter of display_name)

---

## Files to Create/Modify

### Create

```
src/
├── app/
│   └── [locale]/
│       └── (app)/
│           └── profile/
│               ├── me/
│               │   └── page.tsx                  # /profile/me → redirect
│               ├── edit/
│               │   └── page.tsx                  # /profile/edit
│               ├── u/
│               │   └── [uuid]/
│               │       └── page.tsx              # /profile/u/[uuid] fallback (for users without handle)
│               └── [handle]/
│                   ├── page.tsx                  # /profile/[handle] public view
│                   └── not-found.tsx             # custom 404 for invalid handles
├── components/
│   ├── profile/
│   │   ├── ProfileHeader.tsx                     # Avatar + name + handle + trust + member since
│   │   ├── ProfileEditForm.tsx                   # Full edit form (display_name, bio, handle, locale)
│   │   ├── AvatarUpload.tsx                      # Drag-drop + crop + upload
│   │   ├── AvatarDisplay.tsx                     # Avatar image with initials fallback
│   │   ├── HandleInput.tsx                       # Handle input with live availability check
│   │   ├── TrustSignalsStack.tsx                 # ⭐ REUSABLE — will also be used on listing detail
│   │   ├── SellerStatsBar.tsx                    # active + sold counts, monospace
│   │   ├── ProfileCompletionBanner.tsx           # "Complete your profile" CTA
│   │   └── ProfileListingsPlaceholder.tsx        # "Listings coming soon" until BRIEF-004
│   └── ui/
│       ├── Switch.tsx                            # NEW primitive (Radix-based)
│       └── Skeleton.tsx                          # NEW primitive (for loading states)
├── lib/
│   ├── profile/
│   │   ├── actions.ts                            # updateProfile, uploadAvatar, changeHandle, checkHandleAvailability
│   │   ├── validators.ts                         # Zod schemas
│   │   └── queries.ts                            # getProfileByHandle, getProfileByUuid, getCurrentProfile
│   └── supabase/
│       └── storage.ts                            # Avatar upload helpers (bucket setup, signed URLs if needed)
```

### Modify

```
src/components/layout/Nav.tsx                    # Avatar dropdown with profile link (replaces simple name)
messages/ar.json                                 # Add profile.* namespace
messages/en.json                                 # Add profile.* namespace
src/app/[locale]/(app)/my-listings/page.tsx      # Add link to own profile
supabase/migrations/0011_avatars_bucket.sql      # NEW — Supabase Storage bucket + RLS policies
```

---

## Step-by-Step Implementation

### Step 1: Supabase Storage bucket for avatars (30 min)

Create migration `supabase/migrations/0011_avatars_bucket.sql`:

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- public read
  2097152,  -- 2MB limit (avatars are small)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: anyone can read
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- RLS: authenticated users can upload their own avatar (path must start with their uid)
CREATE POLICY "avatars_user_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: users can update their own avatar
CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: users can delete their own avatar
CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

Path convention: `avatars/{user_uuid}/avatar-{timestamp}.webp`

Apply via Supabase MCP or dashboard SQL editor.

### Step 2: UI primitives — Switch + Skeleton (1.5 hours)

1. `src/components/ui/Switch.tsx` — built on `@radix-ui/react-switch` (already in package.json)
   - Amber when on, zinc when off
   - Size: sm (32x18) and md (44x24)
   - Focus-visible ring amber
   - Label support (clickable)
   - RTL tested

2. `src/components/ui/Skeleton.tsx`
   - Animated shimmer (use `animate-shimmer` from existing Tailwind)
   - Rounded variants: sm/md/lg/full
   - No spinners anywhere (DESIGN.md Section 22)

### Step 3: Validators (45 min)

`src/lib/profile/validators.ts`:

```typescript
import { z } from 'zod';

export const HandleSchema = z
  .string()
  .regex(/^[a-z0-9_]{3,20}$/, { message: 'handle_invalid_format' })
  .refine(h => !h.startsWith('_') && !h.endsWith('_'), { message: 'handle_underscore_edges' });

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'name_too_short' })
  .max(50, { message: 'name_too_long' });

export const BioSchema = z
  .string()
  .trim()
  .max(300, { message: 'bio_too_long' })
  .optional()
  .nullable();

export const LocaleSchema = z.enum(['ar', 'en']);

export const ProfileUpdateSchema = z.object({
  display_name: DisplayNameSchema,
  handle: HandleSchema.optional().nullable(),
  bio: BioSchema,
  preferred_locale: LocaleSchema,
});

export const AvatarUploadSchema = z.object({
  file_size: z.number().max(2 * 1024 * 1024, { message: 'avatar_too_large' }),
  mime_type: z.enum(['image/webp', 'image/jpeg', 'image/png'], { message: 'avatar_invalid_format' }),
});
```

Reserved handles (to block): `admin`, `root`, `dealo`, `dealohub`, `support`, `help`, `api`, `auth`, `me`, `edit`, `profile`, `settings`, `test`. Reject these in the action.

### Step 4: Profile queries (1 hour)

`src/lib/profile/queries.ts`:

```typescript
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function getProfileByHandle(handle: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, handle, avatar_url, bio, country_code, preferred_locale, phone_verified_at, id_verified_at, is_founding_partner, rating_avg, rating_count, active_listings_count, sold_listings_count, created_at')
    .eq('handle', handle)
    .eq('is_banned', false)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getProfileByUuid(uuid: string) {
  // Same but by id — fallback when user has no handle yet
}

export async function getCurrentProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')  // full profile for owner
    .eq('id', user.id)
    .single();

  return data;
}

export async function checkHandleAvailability(handle: string, currentUserId?: string) {
  const supabase = createAdminClient();  // bypass RLS for availability check
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle.toLowerCase())
    .maybeSingle();

  if (!data) return { available: true };
  if (currentUserId && data.id === currentUserId) return { available: true };  // user's own handle
  return { available: false };
}
```

### Step 5: Server actions (1.5 hours)

`src/lib/profile/actions.ts`:

```typescript
'use server';

export async function updateProfile(formData: FormData) {
  // Validate with ProfileUpdateSchema
  // Check auth
  // Check handle uniqueness if changed
  // Update profiles table
  // Revalidate relevant paths
  // Return { ok, fieldErrors }
}

export async function uploadAvatar(file: File) {
  // Validate file size + mime
  // Resize client-side before calling this (action receives already-sized File)
  // Upload to avatars/{user_id}/avatar-{timestamp}.webp
  // Delete old avatar if exists
  // Update profiles.avatar_url with public URL
  // Return { ok, url } or { ok: false, error }
}

export async function checkHandleAvailabilityAction(handle: string) {
  // Debounced from client
  // Validates format
  // Checks DB
  // Returns { available, reason? }
}
```

### Step 6: Avatar upload component (3 hours)

`src/components/profile/AvatarUpload.tsx` — the heaviest piece.

Features:
- Current avatar preview (or initials fallback)
- "Change avatar" button opens file picker
- Drag-drop zone (desktop)
- Camera capture (mobile via PWA API)
- Client-side resize to 512x512 using canvas
- WebP conversion before upload
- Upload progress indicator (skeletal, not spinner)
- Success animation on completion
- Error state with retry

Use `<input type="file" accept="image/*" capture="user">` for mobile camera.

Resize algorithm:
```typescript
async function resizeImage(file: File, maxSize = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/webp', 0.9));
}
```

### Step 7: AvatarDisplay + initials fallback (30 min)

`src/components/profile/AvatarDisplay.tsx`:

```tsx
interface AvatarDisplayProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarDisplay({ src, name, size = 'md', className }: AvatarDisplayProps) {
  const initials = getInitials(name);  // first letter of first word + first letter of last word

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={sizeMap[size]}
        height={sizeMap[size]}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-warm-amber/10 text-warm-amber font-semibold',
        sizeClassMap[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
```

### Step 8: TrustSignalsStack (reusable component) (1.5 hours)

`src/components/profile/TrustSignalsStack.tsx` — will also be used on listing detail in Sprint 4.

Order (per DESIGN.md Section 14):
1. 🏆 Founding Partner (if `is_founding_partner`)
2. ✓ ID Verified (if `id_verified_at`) — V2 but display already
3. ✓ Phone Verified (if `phone_verified_at`)
4. ⭐ Rating if >= 4.5 stars + at least 3 reviews
5. 📅 Member since > 6 months (if `created_at` older than 180 days)

Layout: horizontal row of pill badges, wraps on mobile. Max 3 on ListingCard (compact mode).

### Step 9: SellerStatsBar (45 min)

`src/components/profile/SellerStatsBar.tsx`:

```tsx
<div className="flex items-center gap-4 font-mono-data text-body-small">
  <span>
    <strong>{formatCount(activeCount, locale)}</strong>
    <span className="text-muted-steel"> {t('activeListings')}</span>
  </span>
  <span className="text-whisper-divider">·</span>
  <span>
    <strong>{formatCount(soldCount, locale)}</strong>
    <span className="text-muted-steel"> {t('sold')}</span>
  </span>
  {rating && (
    <>
      <span className="text-whisper-divider">·</span>
      <span className="flex items-center gap-1">
        <StarIcon className="size-3.5 text-caution-flax" />
        <strong>{rating.toFixed(1)}</strong>
        <span className="text-muted-steel">({ratingCount})</span>
      </span>
    </>
  )}
</div>
```

### Step 10: ProfileHeader (1 hour)

`src/components/profile/ProfileHeader.tsx` — compose Avatar + name + handle + stats + trust signals.

Layout:
- Desktop: avatar 96px on start, details on end
- Mobile: avatar 72px on top, centered details below

Show "Edit Profile" button only if viewing own profile (pass `isOwner` prop).

### Step 11: Public profile page (1.5 hours)

`src/app/[locale]/(app)/profile/[handle]/page.tsx`:

```tsx
export async function generateMetadata({ params }) {
  const profile = await getProfileByHandle(params.handle);
  if (!profile) return {};

  return {
    title: `${profile.display_name} · Dealo Hub`,
    description: profile.bio ?? `Seller on Dealo Hub with ${profile.active_listings_count} active listings`,
    openGraph: {
      title: profile.display_name,
      description: profile.bio,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function PublicProfilePage({ params }) {
  const profile = await getProfileByHandle(params.handle);
  if (!profile) notFound();

  const currentUser = await getCurrentProfile();
  const isOwner = currentUser?.id === profile.id;

  return (
    <main>
      <ProfileHeader profile={profile} isOwner={isOwner} />
      <TrustSignalsStack signals={profile} />
      <SellerStatsBar {...profile} />
      {/* Listings placeholder until BRIEF-004 */}
      <ProfileListingsPlaceholder sellerId={profile.id} />
    </main>
  );
}
```

### Step 12: Edit profile page (2 hours)

`src/app/[locale]/(app)/profile/edit/page.tsx`:
- Protected route (middleware enforces)
- Shows ProfileEditForm with current values pre-filled
- Live handle availability check
- Success state after save (toast + redirect to public profile)

### Step 13: Profile completion banner (1 hour)

Show at top of public profile (when owner views own) if:
- No avatar
- No bio
- No handle

"Complete your profile to build trust with buyers" CTA → `/profile/edit`

### Step 14: Nav avatar dropdown (1 hour)

Replace current simple "Fawzi Test | تسجيل الخروج" with:
- Avatar + name triggers dropdown
- Menu: My Profile, My Listings, Messages, Settings, Sign Out
- Radix `DropdownMenu` primitive

### Step 15: i18n strings + testing (1.5 hours)

Add `profile.*` namespace to both locales. Full test matrix.

---

## Acceptance Criteria

### Functionality
- [ ] `/profile/me` redirects to `/profile/[my_handle]` or `/profile/u/[my_uuid]` if no handle yet
- [ ] Public `/profile/[handle]` accessible to anyone (auth not required)
- [ ] Invalid handle shows custom 404 (not generic)
- [ ] Owner sees "Edit Profile" button, others don't
- [ ] Phone and email NEVER appear on public profile (Decision 2 enforced)
- [ ] Edit form validates + saves successfully
- [ ] Handle availability checks in real-time (debounced 400ms)
- [ ] Reserved handles blocked server-side
- [ ] Avatar upload: file selected → resized → uploaded → URL saved → display updates
- [ ] Old avatar deleted from storage when new one uploaded
- [ ] Avatar initials fallback shows when no avatar_url
- [ ] TrustSignalsStack shows correct badges based on profile data
- [ ] Seller stats read from profiles table (active_listings_count, sold_listings_count)
- [ ] Profile completion banner appears only when incomplete + owner viewing

### Design
- [ ] RTL + LTR tested on every screen
- [ ] Mobile iPhone SE 375px: profile page readable, edit form usable
- [ ] Avatar initials fallback looks intentional (amber circle + letter)
- [ ] TrustSignalsStack pills wrap cleanly on mobile
- [ ] Profile page feels premium (typography hierarchy, spacing, whitespace)
- [ ] No `left/right/ml/mr/pl/pr` classes anywhere
- [ ] Focus states on every interactive element (Nav dropdown, form fields, avatar upload)

### Performance
- [ ] Lighthouse mobile > 90 on profile page
- [ ] Avatar upload completes in < 3s on 4G (for 2MB source image)
- [ ] WebP conversion working (check network tab: uploaded file is image/webp)

### Security
- [ ] Users cannot update other users' profiles (RLS enforced)
- [ ] Users cannot upload avatars to other users' paths (Storage RLS)
- [ ] Reserved handles rejected server-side
- [ ] Handle regex enforced client + server
- [ ] Avatar file size + mime validated client + server
- [ ] Phone/email never exposed in public profile API response

### Code Quality
- [ ] TypeScript strict mode passes
- [ ] ESLint 0 warnings
- [ ] TrustSignalsStack is reusable (takes profile subset, works for listing detail later)

---

## Known Gotchas

1. **Next.js Image + Supabase Storage:** Add `**.supabase.co` to `next.config.js` `images.remotePatterns` (already there from Week 1).

2. **Avatar caching:** Use timestamp in filename (`avatar-1729000000.webp`) so old cache invalidates. Don't use `avatar.webp` — browsers will cache old version.

3. **Handle case sensitivity:** Lowercase on store, lowercase on lookup. `CITEXT` column in schema already handles this.

4. **Bio in Arabic:** test with RTL text + mixed Arabic/English. Line breaks preserved.

5. **Avatar deletion:** If user uploads new avatar, old file should be deleted. Use Supabase Storage delete API. If deletion fails, log but don't fail upload.

6. **Next-intl `profile.*` namespace:** remember underscore keys in Zod messages (learned from BRIEF-001).

7. **Profile completion banner:** don't show to other users viewing your incomplete profile — only when owner views own.

---

## Post-Completion

1. Report acceptance test results to Fawzi
2. Commit with: `Sprint 1 BRIEF-002: Profile pages`
3. File any discovered backlog items
4. Await Fawzi acceptance → commit → next brief (BRIEF-003 or continue Sprint 1)

---

## Reference Links

- [Supabase Storage docs](https://supabase.com/docs/guides/storage)
- [Radix Switch docs](https://www.radix-ui.com/primitives/docs/components/switch)
- [DESIGN.md Section 10 SellerProfileCard](../DESIGN.md)
- [DESIGN.md Section 14 Trust Signal Hierarchy](../DESIGN.md)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial brief — Profile pages with avatar upload, handle selection, trust signals. Reusable TrustSignalsStack for listings later. |
