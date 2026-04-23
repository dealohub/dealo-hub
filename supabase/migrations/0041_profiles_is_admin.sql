-- ============================================================================
-- 0041_profiles_is_admin.sql — Admin Role on Profiles
-- ============================================================================
-- Introduces admin identity for Phase 9 (Admin Dashboard).
--
-- Shape:
--   * is_admin BOOLEAN column on profiles (mirrors is_dealer / is_founding_partner)
--   * Partial index (admins are rare)
--   * SECURITY DEFINER helper public.is_admin(uuid) for RLS policies
--     (avoids recursive RLS evaluation when used inside profile policies)
--   * Convenience public.is_admin() wrapping auth.uid()
--   * Additive RLS: admins can read+update ALL profiles (including banned)
--   * Seed: bootstrap fawzi.al.ibrahim@gmail.com if the profile already exists
--
-- Out of scope for this migration (left for 9b moderation work):
--   * Admin RLS on listings / ai_reviews / reports  — keep SECURITY DEFINER
--     RPCs for admin actions to avoid a policy explosion now. We only need
--     profile-level policies in 9a because the shell reads profile metadata.
--
-- Bootstrap note:
--   If the seed UPDATE is a no-op (user hasn't signed up yet), the account
--   must sign up first, then re-run:
--     UPDATE profiles SET is_admin = true WHERE email = '...';
--   as the service role. This is recorded in PHASE-9-ADMIN-DASHBOARD.md §2.
--
-- Depends on: 0003_profiles.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Column + index
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Partial index — only admin rows. Expected cardinality: <10 for years.
CREATE INDEX profiles_is_admin_idx
  ON profiles (is_admin)
  WHERE is_admin = true;

COMMENT ON COLUMN profiles.is_admin IS
  'True for platform administrators. Drives /admin dashboard access and moderation powers. Flip via service role only.';

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER helper — called from RLS policies on profiles
-- ---------------------------------------------------------------------------
-- Why SECURITY DEFINER:
--   When an RLS policy on `profiles` calls a helper that itself SELECTs from
--   `profiles`, we recurse. SECURITY DEFINER runs as the function owner
--   (postgres role) which bypasses RLS, breaking the loop.
--
-- Why STABLE:
--   The is_admin flag doesn't change within a single statement. STABLE lets
--   the planner cache the result across policy evaluations in one query.
--
-- Why SET search_path:
--   SECURITY DEFINER functions are search-path hijack targets. Lock it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = uid),
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin(UUID) IS
  'Returns true if the given user id is an active admin. SECURITY DEFINER to escape RLS recursion when used inside profile policies.';

-- Zero-arg convenience — reads auth.uid().
-- Makes policy bodies readable: USING (public.is_admin())
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin(auth.uid());
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Shortcut for public.is_admin(auth.uid()). Use in RLS policies.';

-- Grant execute to authenticated users (RLS will still gate the underlying read).
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()     TO authenticated;

-- ---------------------------------------------------------------------------
-- Additive RLS — admins can read + update ALL profiles
-- ---------------------------------------------------------------------------
-- These are ADDITIVE policies. Postgres OR's multiple permissive policies,
-- so the existing "public_read_profiles" (WHERE is_banned = false) + these
-- new admin policies give:
--   * Regular users: see non-banned profiles (existing behavior)
--   * Admins:        see every profile, banned or not
-- ---------------------------------------------------------------------------
CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed — promote fawzi.al.ibrahim@gmail.com if the profile exists
-- ---------------------------------------------------------------------------
-- Idempotent: if the user hasn't signed up yet, this is a no-op and
-- admin must be granted manually post-signup (see header note).
-- ---------------------------------------------------------------------------
UPDATE profiles
SET is_admin = true
WHERE email = 'fawzi.al.ibrahim@gmail.com'
  AND is_admin = false;
