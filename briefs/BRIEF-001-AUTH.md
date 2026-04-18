# BRIEF-001: Authentication System
### First Executable Brief for Claude Code

**Status:** 🟢 Ready to execute
**Estimated effort:** 12-16 hours (split across 2-3 Claude Code sessions)
**Sprint:** 1 (Weeks 1-2 of Phase 1)
**Dependencies:** None (foundational)
**Blocks:** BRIEF-002 (Profile Pages), BRIEF-004 (Listing Creation)

---

## Context

Dealo Hub is an AI-Protected C2C marketplace for Kuwait → GCC.
The database schema + Next.js 14 project is already bootstrapped (see `supabase/` + `app/` + `src/`).
We need the first functional user feature: **auth**.

**Read before starting:**
- `planning/MASTER-PLAN.md` — overall context
- `planning/DECISIONS.md` — especially Decision 2 (chat-only, phone hidden)
- `DESIGN.md` Section 22 (anti-patterns) — what NOT to build
- `design/DESIGN-EXCELLENCE.md` — quality bars for auth screens
- `supabase/migrations/0003_profiles.sql` — existing profile schema

---

## Goal

User can:
1. Sign up with Kuwait phone number (+965) — receives SMS OTP, verifies
2. Sign up with email — receives magic link (fallback)
3. Log in with either method
4. Log out
5. Reset password (email flow)
6. Profile auto-created in `profiles` table on signup (trigger already exists)
7. Session persists across page refreshes
8. Protected routes redirect unauthenticated users

**Out of scope for BRIEF-001:**
- Profile editing UI (that's BRIEF-002)
- Avatar upload (BRIEF-003)
- Social login (Phase 2)
- Account deletion flow (Phase 2)

---

## Tech Decisions (Locked)

- **Auth provider:** Supabase Auth
- **SMS provider:** Twilio Programmable Messaging (production)
  - Twilio supports Kuwait: +965 numbers, ~$0.045/SMS
  - Alternative: MessageBird (similar pricing, also supports Kuwait)
- **Dev mode:** Supabase Auth with test OTPs (no real SMS)
- **Phone validation:** `libphonenumber-js/min` (already in package.json)
- **Session management:** Supabase SSR cookies (middleware.ts already handles)
- **Password requirements:** 10+ chars, at least 1 number, at least 1 letter

---

## Files to Create/Modify

### Create

```
src/
├── app/
│   └── [locale]/
│       ├── (auth)/                              NEW route group
│       │   ├── layout.tsx                        # Centered auth layout
│       │   ├── signin/
│       │   │   └── page.tsx                      # /signin
│       │   ├── signup/
│       │   │   └── page.tsx                      # /signup
│       │   ├── verify-otp/
│       │   │   └── page.tsx                      # /verify-otp
│       │   ├── reset-password/
│       │   │   ├── page.tsx                      # /reset-password
│       │   │   └── confirm/
│       │   │       └── page.tsx                  # /reset-password/confirm
│       │   └── auth-callback/
│       │       └── route.ts                      # OAuth callback (future)
│       └── (app)/                                NEW route group — authenticated
│           └── layout.tsx                        # Protected layout (redirects to /signin if not auth)
├── components/
│   ├── auth/
│   │   ├── PhoneInput.tsx                        # E.164 phone input with GCC picker
│   │   ├── OtpInput.tsx                          # 6-digit OTP input, auto-advance
│   │   ├── AuthCard.tsx                          # Centered card layout for forms
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── AuthMethodToggle.tsx                  # Phone / Email switcher
│   └── ui/
│       ├── Input.tsx                             # Base input primitive
│       ├── Label.tsx
│       └── FormMessage.tsx                       # Error/help text
├── lib/
│   ├── auth/
│   │   ├── actions.ts                            # Server actions (signUp, signIn, signOut)
│   │   ├── validators.ts                         # Zod schemas for auth forms
│   │   └── phone.ts                              # Phone formatting helpers
│   └── supabase/
│       └── middleware-auth.ts                    # Auth helper for middleware
```

### Modify

```
middleware.ts                                    # Add auth session refresh + protected route check
app/[locale]/page.tsx                            # Add auth state check (for Nav signin/signout toggle)
messages/ar.json                                 # Add auth namespace
messages/en.json                                 # Add auth namespace
src/components/layout/Nav.tsx                    # Add signin/signup CTAs when not authenticated
.env.example                                     # Add TWILIO_* variables
```

---

## Step-by-Step Implementation

### Step 1: Environment + Supabase Auth config (30 min)

1. In Supabase Dashboard > Authentication > Providers:
   - Enable Phone (Twilio)
   - Enable Email (default)
   - Disable anonymous sign-ins
2. Configure Twilio:
   - Create Twilio account (if not already)
   - Purchase a Kuwait virtual number OR use Twilio Verify
   - Add credentials to Supabase
3. Update `.env.example`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_MESSAGING_SERVICE_SID=MGxxxxx
   ```
4. Test: in Supabase SQL editor, create test user with phone. Verify `profiles` row auto-created by trigger (`handle_new_user`).

### Step 2: Build base UI primitives (2 hours)

1. `src/components/ui/Input.tsx`:
   - Base `<input>` with DESIGN.md styling
   - Variants: text, email, password, tel, number
   - Size: md (48px) and sm (40px)
   - Focus: amber ring + shadow glow
   - Error state: border-danger-coral + aria-invalid

2. `src/components/ui/Label.tsx`:
   - Simple label, always visible above input
   - Required asterisk in muted-steel (not red)

3. `src/components/ui/FormMessage.tsx`:
   - Error: AlertCircle icon + text in danger-coral
   - Help: InfoIcon + text in muted-steel
   - Success: CheckCircle + text in success-sage

4. Test all with RTL + LTR, mobile + desktop.

### Step 3: PhoneInput + OtpInput components (3 hours)

1. `src/components/auth/PhoneInput.tsx`:
   - Uses `react-phone-number-input` (already in package.json)
   - Limit countries: ['KW', 'SA', 'AE', 'BH', 'QA', 'OM']
   - Default: 'KW'
   - Style: match Input.tsx design language
   - Validates on change, shows error below
   - Outputs E.164 format (+96512345678)

2. `src/components/auth/OtpInput.tsx`:
   - 6 individual input boxes
   - Auto-advance on digit entry
   - Auto-submit when all 6 filled
   - Paste support: paste "123456" fills all boxes
   - Error state animation: shake (spring physics)
   - Resend CTA with 60-second cooldown counter

### Step 4: Auth server actions (2 hours)

`src/lib/auth/actions.ts`:

```typescript
'use server';

// signUpWithPhone(phone: string)
//   → sends OTP via Supabase Auth + Twilio
//   → redirects to /verify-otp?phone=+965xxx

// verifyOtp(phone: string, otp: string)
//   → validates with Supabase Auth
//   → creates profile (via trigger)
//   → sets session cookie
//   → redirects to /welcome (onboarding) or /

// signInWithPhone(phone: string)
//   → sends OTP
//   → /verify-otp

// signUpWithEmail(email: string, password: string, displayName: string)
//   → Supabase signUp
//   → sends confirmation email
//   → shows "check your email" state

// signInWithEmail(email: string, password: string)
//   → Supabase signIn
//   → sets session
//   → redirects to /

// signOut()
//   → clears session
//   → redirects to /

// resetPassword(email: string)
//   → sends reset link email

// updatePassword(newPassword: string)
//   → validates strength
//   → updates auth.users
```

All actions validate with Zod (see `src/lib/auth/validators.ts`).

### Step 5: Validators (1 hour)

`src/lib/auth/validators.ts`:

```typescript
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const PhoneSchema = z.string().refine(
  v => isValidPhoneNumber(v, 'KW') || isValidPhoneNumber(v),
  { message: 'phone.invalid' }
);

export const OtpSchema = z.string().regex(/^\d{6}$/, { message: 'otp.invalid_format' });

export const PasswordSchema = z
  .string()
  .min(10, { message: 'password.too_short' })
  .regex(/[a-zA-Z]/, { message: 'password.needs_letter' })
  .regex(/\d/, { message: 'password.needs_number' });

export const EmailSchema = z.string().email({ message: 'email.invalid' });

export const DisplayNameSchema = z
  .string()
  .min(2, { message: 'name.too_short' })
  .max(50, { message: 'name.too_long' });

export const SignUpPhoneSchema = z.object({
  phone: PhoneSchema,
  display_name: DisplayNameSchema,
});

export const SignUpEmailSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  display_name: DisplayNameSchema,
});

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  otp: OtpSchema,
});
```

### Step 6: Pages — signup, signin, verify-otp (3 hours)

1. `(auth)/layout.tsx`:
   - Centered card layout
   - Brand in top center
   - "Already have an account? Sign in →" link in footer
   - Full viewport height, gradient background (subtle)

2. `(auth)/signup/page.tsx`:
   - Method toggle (Phone / Email) at top
   - Phone form by default
   - Form fields: display_name + phone OR email + password
   - Submit button: primary amber, loading state with spinner
   - Terms acceptance checkbox
   - Link: "Already have an account? Sign in"

3. `(auth)/signin/page.tsx`:
   - Same method toggle
   - Phone: just phone field (OTP sent)
   - Email: email + password
   - "Forgot password?" link (email flow only)
   - Link: "Don't have an account? Sign up"

4. `(auth)/verify-otp/page.tsx`:
   - Shows phone number masked: "+965 XX XX **78"
   - OtpInput component
   - Resend button with cooldown
   - Back button to change phone
   - Auto-verify when 6 digits entered

5. `(auth)/reset-password/page.tsx` + confirm subpage

### Step 7: Middleware auth enforcement (1.5 hours)

Update `middleware.ts`:

```typescript
// After existing locale/country logic:
const supabase = createMiddlewareClient({ req: request, res: response });
const { data: { session } } = await supabase.auth.getSession();

// Refresh session if present
if (session) {
  await supabase.auth.refreshSession();
}

// Protected routes (under (app) group):
const protectedPaths = ['/my-listings', '/messages', '/profile', '/sell'];
const isProtected = protectedPaths.some(p => request.nextUrl.pathname.includes(p));

if (isProtected && !session) {
  return NextResponse.redirect(new URL(`/${locale}/signin`, request.url));
}
```

### Step 8: Nav integration (1 hour)

Update `src/components/layout/Nav.tsx`:
- Read session from Supabase server-side
- If authenticated: show avatar dropdown (Profile, My Listings, Sign Out)
- If not: show "Sign in" button (secondary) + "Sign up" button (primary)

### Step 9: i18n strings (1 hour)

Add to `messages/ar.json` + `messages/en.json`:

```json
{
  "auth": {
    "signup": {
      "title": "...",
      "methodPhone": "بالهاتف",
      "methodEmail": "بالبريد",
      "phoneLabel": "رقم الهاتف",
      "otpSent": "تم إرسال الرمز إلى {phone}",
      "resend": "إعادة إرسال ({seconds}s)",
      ...
    },
    "signin": { ... },
    "errors": {
      "phone.invalid": "رقم الهاتف غير صحيح",
      "otp.invalid_format": "الرمز يجب أن يكون 6 أرقام",
      "password.too_short": "كلمة المرور قصيرة جداً",
      ...
    }
  }
}
```

### Step 10: Testing + QA (2 hours)

Test matrix:
- [ ] Sign up with phone +965, receive OTP (use Twilio test mode in dev)
- [ ] Sign up with email, receive confirmation email
- [ ] Sign in with phone after signup
- [ ] Sign in with email after signup
- [ ] Sign out clears session
- [ ] Session persists after page refresh
- [ ] Access `/my-listings` when not signed in → redirects to `/signin`
- [ ] After signin, redirected back to originally requested page
- [ ] Invalid phone shows inline error
- [ ] Invalid OTP shows shake animation + error
- [ ] Resend button respects 60s cooldown
- [ ] Forgot password sends email
- [ ] Reset password updates auth.users
- [ ] Profile row auto-created (check `profiles` table)
- [ ] RTL layout on all auth screens
- [ ] Mobile iPhone SE 375px all screens pass
- [ ] Dark mode works on all auth screens (if enabled)
- [ ] Lighthouse mobile > 90 on each auth screen

---

## Acceptance Criteria (Pass/Fail)

Must PASS all for sprint to close:

### Functionality
- [ ] Phone signup → OTP → verify → profile created + session active
- [ ] Email signup → email confirm → session active
- [ ] Sign in (both methods) works after signup
- [ ] Sign out clears session
- [ ] Forgot password full flow works
- [ ] Protected routes redirect to signin
- [ ] Session refreshes on long-lived pages

### Design
- [ ] All screens pass design QA (DESIGN-EXCELLENCE.md Zone 1 + Zone 7)
- [ ] RTL tested on every screen (no `left/right` classes — ESLint enforced)
- [ ] Mobile-first: iPhone SE 375px tested
- [ ] Loading states: skeleton shimmer, not spinners
- [ ] Error states: inline amber border + danger-coral text + AlertCircle icon
- [ ] Focus-visible: amber ring + 2px offset on every interactive element

### Performance
- [ ] Lighthouse mobile > 90 on signup, signin, verify-otp pages
- [ ] OTP verification round-trip < 1s
- [ ] No console errors or warnings

### Security
- [ ] Passwords never logged or exposed
- [ ] OTP codes expire after 10 minutes
- [ ] Rate limiting: max 5 OTP requests per phone per hour
- [ ] CSRF: server actions use form `action={...}` pattern
- [ ] Phone number validated client + server (never trust client alone)

### Code Quality
- [ ] TypeScript strict mode passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No `any` types
- [ ] All Zod schemas tested with valid + invalid inputs

---

## Known Gotchas

1. **Supabase SSR cookies:** Auth state in server components requires `createServerClient`, not browser client. Already handled in `src/lib/supabase/server.ts`.

2. **RTL in OtpInput:** The 6 boxes should be flex-row but text/cursor order depends on locale. Test both directions.

3. **Twilio Kuwait regulations:** Sender ID registration may be required for production. Dev mode uses Supabase's built-in test OTP (SMS not sent).

4. **Phone normalization:** Always store as E.164 in DB (`+96512345678`). Display can be formatted (`+965 12 345 678`).

5. **Next.js middleware limits:** Middleware can't use Supabase client fully — use `@supabase/ssr` middleware helper.

6. **Profile trigger timing:** `handle_new_user` trigger fires after auth.users insert. Ensure your flow doesn't query `profiles` before the trigger completes (rare race condition).

---

## Post-Completion

Once this brief is done, Claude Code should:
1. Update `README.md` with "Sprint 1 deliverable: Auth ✅"
2. Create `CHANGELOG.md` entry
3. Commit with message: `Sprint 1: Authentication system (BRIEF-001)`
4. Request review from Fawzi
5. Fawzi runs manual acceptance tests
6. Claude/Fawzi prepares BRIEF-002 (Profile Pages)

---

## Reference Links

- [Supabase Auth docs](https://supabase.com/docs/guides/auth)
- [Twilio + Supabase integration](https://supabase.com/docs/guides/auth/phone-login/twilio)
- [libphonenumber-js docs](https://www.npmjs.com/package/libphonenumber-js)
- [Next.js middleware docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-04-18 | 1.0 | Initial brief — ready for Claude Code execution |
