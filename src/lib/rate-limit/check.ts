/**
 * Rate limit check helper.
 *
 * Thin wrapper around the `check_rate_limit` Postgres RPC. Server
 * actions call this BEFORE doing any expensive work to short-circuit
 * spam. Tuning is per-call: each action decides its own budget.
 *
 * Default fail-open: if the RPC errors (e.g. DB hiccup) we let the
 * action through rather than lock everyone out. The RPC itself is
 * idempotent and the cost is a single atomic UPSERT, so the rare
 * extra action through is a fair trade.
 */

import { createClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/observability/capture';

export interface RateLimitOpts {
  /** Action identifier — namespace your limits, e.g. 'chat.send_message'. */
  action: string;
  /** Max permitted count within the window. */
  max: number;
  /** Window in seconds. Default 60. */
  windowSeconds?: number;
}

/**
 * Returns TRUE if the caller is within their limit (and the counter
 * was bumped). Returns FALSE if they've exhausted the window.
 */
export async function checkRateLimit(opts: RateLimitOpts): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_action: opts.action,
      p_max_count: opts.max,
      p_window_seconds: opts.windowSeconds ?? 60,
    });
    if (error) {
      captureError(error, { scope: 'rate-limit.rpc', tags: { action: opts.action } });
      return true; // fail open
    }
    return data === true;
  } catch (err) {
    captureError(err, { scope: 'rate-limit.catch', tags: { action: opts.action } });
    return true; // fail open
  }
}
