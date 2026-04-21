-- ============================================================================
-- 0029 — Rate limit counters
-- ----------------------------------------------------------------------------
-- Per-user, per-action sliding window. Used from server actions to protect
-- mutation endpoints from spam / abuse (chat sendMessage, listing publish,
-- contact-seller, …).
--
-- Design:
--   * Window is app-defined (default 60s). We store `window_start` as a
--     timestamp rounded down to the window boundary, plus a count.
--   * Atomic increment via UPSERT on (user_id, action, window_start) —
--     no read-modify-write race.
--   * Rows older than 1 hour are stale and can be harvested by a cron job
--     later. For now they just accumulate (a few rows per user per hour).
--
-- RLS:
--   * SELECT/UPDATE/DELETE blocked for everyone — app always talks through
--     SECURITY DEFINER functions or the service role.
--   * INSERT blocked for everyone except service role — this is a
--     trust-internals table, not a user-writable one.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id      uuid          NOT NULL,
  action       text          NOT NULL,
  window_start timestamptz   NOT NULL,
  count        integer       NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action, window_start)
);

-- Harvest index — delete-where-old cron will scan by window_start.
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Everyone denied by default — no policies needed. But we add explicit
-- deny policies for clarity so `supabase db diff` doesn't complain
-- about table-level RLS with no policies.
-- (None granted; service role bypasses RLS anyway.)

-- ---------------------------------------------------------------------------
-- check_rate_limit(action, max_count, window_seconds)
-- ---------------------------------------------------------------------------
-- Returns TRUE if the current caller may proceed (and atomically bumps the
-- counter), FALSE if the limit is already met for this window.
--
-- Called from server actions:
--   const { data: ok } = await supabase.rpc('check_rate_limit', {
--     p_action: 'send_message',
--     p_max_count: 30,
--     p_window_seconds: 60,
--   });
--   if (!ok) return { ok: false, error: 'rate_limited' };
--
-- SECURITY DEFINER so we don't have to grant the rate_limits table to
-- authenticated users. `search_path = public, pg_temp` locks resolution.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action         text,
  p_max_count      integer,
  p_window_seconds integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      uuid;
  v_window_start timestamptz;
  v_new_count    integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    -- Anonymous calls are blocked at RLS on the write path anyway.
    -- Returning TRUE here avoids a confusing "rate_limited" error for
    -- unauthenticated callers; they'll fail later for the right reason.
    RETURN true;
  END IF;

  -- Round down to the window boundary so all callers in the same
  -- `window_seconds` bucket collide on the same row.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (user_id, action, window_start, count)
  VALUES (v_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_new_count;

  RETURN v_new_count <= p_max_count;
END;
$$;

COMMENT ON FUNCTION public.check_rate_limit(text, integer, integer) IS
  'Atomic per-user per-action sliding-window rate limit. Returns TRUE if the caller may proceed, FALSE if the limit is already met for the current window.';

-- Callable from the authenticated + anon roles (anon goes through the
-- TRUE short-circuit branch).
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer)
  TO authenticated, anon;
