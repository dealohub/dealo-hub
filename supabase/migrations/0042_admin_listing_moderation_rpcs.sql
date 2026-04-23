-- ============================================================================
-- 0042_admin_listing_moderation_rpcs.sql — Admin Listing Moderation
-- ============================================================================
-- Supplies the SECURITY DEFINER RPCs the /admin/listings surface calls to
-- move listings through the moderation flow.
--
-- Why RPCs (not direct UPDATEs from the client):
--   Admins shouldn't rely on RLS to gate writes — every mutation ships a
--   server-side `is_admin` check via SECURITY DEFINER. If a non-admin client
--   somehow invokes the RPC it raises `unauthorized` instead of silently
--   succeeding through a loose policy.
--
-- State transitions:
--   approve: status ∈ {held, draft} → live
--            fraud_status → approved_manual
--            published_at set if null (first publish)
--   reject:  status ANY → rejected
--            fraud_status → rejected
--            fraud_flags += {type:'admin_rejection', reason, by, at}
--   hold:    status ∈ {live, draft} → held
--            fraud_status → held
--            fraud_flags += {type:'admin_hold', by, at}
--
-- Audit:
--   Lightweight for Phase 9a — we append to fraud_flags JSONB. A proper
--   admin_audit_log table lands in Phase 9c. The fraud_flags trail is
--   sufficient to answer "who rejected this and why" during the single-admin
--   window.
--
-- Badge counts:
--   `admin_badges()` returns held / ai_held / pending_reports counts for the
--   sidebar red-dot indicators. Single round trip; no per-badge query.
--
-- Depends on: 0005_listings.sql, 0041_profiles_is_admin.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: raise unauthorized if current user is not admin
-- ---------------------------------------------------------------------------
-- Inlined at the top of every RPC below. Lifted into its own function to keep
-- the check uniform (single place to edit if the rule changes).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.assert_admin() IS
  'Raises insufficient_privilege (42501) if auth.uid() is not an admin. Called from the top of every admin_* RPC.';

-- ---------------------------------------------------------------------------
-- admin_approve_listing(listing_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_listing(p_listing_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_status listing_status;
BEGIN
  PERFORM public.assert_admin();

  SELECT status INTO v_current_status
  FROM listings
  WHERE id = p_listing_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status NOT IN ('held', 'draft', 'rejected') THEN
    RAISE EXCEPTION 'cannot approve listing in status %', v_current_status
      USING ERRCODE = '22023'; -- invalid_parameter_value
  END IF;

  UPDATE listings
  SET
    status          = 'live',
    fraud_status    = 'approved_manual',
    fraud_checked_at = NOW(),
    published_at    = COALESCE(published_at, NOW()),
    expires_at      = COALESCE(published_at, NOW()) + INTERVAL '30 days',
    updated_at      = NOW()
  WHERE id = p_listing_id;
END;
$$;

COMMENT ON FUNCTION public.admin_approve_listing(UUID) IS
  'Moves a held/draft/rejected listing to live. Sets fraud_status=approved_manual. Sets published_at if first publish. Admin-only.';

-- ---------------------------------------------------------------------------
-- admin_reject_listing(listing_id, reason)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reject_listing(
  p_listing_id BIGINT,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  PERFORM public.assert_admin();

  v_admin_id := auth.uid();

  IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
    RAISE EXCEPTION 'rejection reason is required' USING ERRCODE = '22023';
  END IF;

  UPDATE listings
  SET
    status         = 'rejected',
    fraud_status   = 'rejected',
    fraud_checked_at = NOW(),
    fraud_flags    = fraud_flags || jsonb_build_array(
      jsonb_build_object(
        'type',   'admin_rejection',
        'reason', p_reason,
        'by',     v_admin_id,
        'at',     NOW()
      )
    ),
    updated_at     = NOW()
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.admin_reject_listing(UUID, TEXT) IS
  'Rejects a listing with a required reason. Reason appended to fraud_flags with admin uuid + timestamp. Admin-only.';

-- ---------------------------------------------------------------------------
-- admin_hold_listing(listing_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_hold_listing(p_listing_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_status listing_status;
  v_admin_id       UUID;
BEGIN
  PERFORM public.assert_admin();

  v_admin_id := auth.uid();

  SELECT status INTO v_current_status
  FROM listings
  WHERE id = p_listing_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'listing not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status NOT IN ('live', 'draft') THEN
    RAISE EXCEPTION 'cannot hold listing in status %', v_current_status
      USING ERRCODE = '22023';
  END IF;

  UPDATE listings
  SET
    status         = 'held',
    fraud_status   = 'held',
    fraud_checked_at = NOW(),
    fraud_flags    = fraud_flags || jsonb_build_array(
      jsonb_build_object(
        'type', 'admin_hold',
        'by',   v_admin_id,
        'at',   NOW()
      )
    ),
    updated_at     = NOW()
  WHERE id = p_listing_id;
END;
$$;

COMMENT ON FUNCTION public.admin_hold_listing(UUID) IS
  'Moves a live/draft listing to held for admin review. Admin-only.';

-- ---------------------------------------------------------------------------
-- admin_badges() — sidebar red-dot counts
-- ---------------------------------------------------------------------------
-- One round-trip replaces three separate COUNT(*) queries. Callers render
-- the whole object and pick the field they need.
--
-- Counts:
--   held_count           — listings awaiting admin moderation
--   ai_held_count        — ai_reviews rows with status='held' (Phase 9b queue)
--   pending_reports_count — user reports pending triage
--
-- Returns zeros if any of the source tables/columns aren't live yet (Phase 9b
-- adds ai_reviews surface, 9c activates reports UI); callers stay stable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_badges()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_held_count            INT := 0;
  v_ai_held_count         INT := 0;
  v_pending_reports_count INT := 0;
BEGIN
  PERFORM public.assert_admin();

  SELECT COUNT(*) INTO v_held_count
  FROM listings
  WHERE status = 'held';

  -- ai_reviews / reports may not exist in every env; guard with to_regclass.
  IF to_regclass('public.ai_reviews') IS NOT NULL THEN
    EXECUTE $q$
      SELECT COUNT(*)::int FROM public.ai_reviews WHERE status = 'held'
    $q$ INTO v_ai_held_count;
  END IF;

  IF to_regclass('public.reports') IS NOT NULL THEN
    EXECUTE $q$
      SELECT COUNT(*)::int FROM public.reports WHERE status = 'pending'
    $q$ INTO v_pending_reports_count;
  END IF;

  RETURN jsonb_build_object(
    'held_count',            v_held_count,
    'ai_held_count',         v_ai_held_count,
    'pending_reports_count', v_pending_reports_count
  );
END;
$$;

COMMENT ON FUNCTION public.admin_badges() IS
  'Returns {held_count, ai_held_count, pending_reports_count} for admin sidebar red-dots. Admin-only; gracefully returns 0 for tables that do not yet exist.';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- RPCs are SECURITY DEFINER with an internal is_admin() gate, so granting
-- EXECUTE to `authenticated` is safe — the function raises unauthorized for
-- non-admins. Anonymous cannot call (no auth.uid()).
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_approve_listing(BIGINT)         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reject_listing(BIGINT, TEXT)    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hold_listing(BIGINT)            FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_badges()                        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_admin()                        FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_approve_listing(BIGINT)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(BIGINT, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hold_listing(BIGINT)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_badges()                       TO authenticated;
-- assert_admin() is an internal helper; no direct grants needed.
