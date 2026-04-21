import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * AI draft flusher.
 *
 * Reads `ai_message_log` rows whose `scheduled_send_at` has passed
 * AND whose `sent_text` is still null, inserts an actual
 * `messages` row for each (with `ai_generated=true`), and flips the
 * log row's `sent_text` so we don't double-fire.
 *
 * Scheduling model (§P14): the orchestrator records a scheduled send
 * timestamp; this flusher is the side-channel that actually dispatches
 * the reply at the right moment. Three call paths:
 *
 *   1. **Vercel Cron** (prod) — `POST /api/cron/ai-flush` every minute.
 *   2. **Manual dev trigger** — `scripts/flush-ai-drafts.ts` from the
 *      CLI when local-testing a negotiation flow.
 *   3. **Test harness** — direct import; bypasses HTTP + cron.
 *
 * The flusher is intentionally minimal. No retries, no LLM re-runs —
 * if an insert fails mid-batch, the row stays due and next tick picks
 * it up. Idempotency is enforced by the `sent_text IS NULL` WHERE clause.
 *
 * Reference: planning/PHASE-6A-AI-NEGOTIATOR.md §P14 (cadence),
 *            §P8 (audit trail — we stamp sent_text on success so the
 *            log reflects what the buyer actually saw).
 */

export interface FlushReport {
  /** Total rows matched (due + unsent). */
  candidates: number;
  /** Successfully inserted messages. */
  dispatched: number;
  /** Rows skipped because the conversation has since gone terminal. */
  skipped: number;
  /** Insert-level failures (details in console). */
  failed: number;
}

export async function flushDueAiDrafts(
  opts: { limit?: number; nowMs?: number } = {},
): Promise<FlushReport> {
  const admin = createAdminClient();
  const now = new Date(opts.nowMs ?? Date.now()).toISOString();
  const limit = opts.limit ?? 50;

  const { data: due, error } = await admin
    .from('ai_message_log')
    .select('id, conversation_id, seller_id, draft_text')
    .is('sent_text', null)
    .not('scheduled_send_at', 'is', null)
    .lte('scheduled_send_at', now)
    .order('scheduled_send_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[ai-flusher] load due drafts failed:', error.message);
    return { candidates: 0, dispatched: 0, skipped: 0, failed: 0 };
  }

  const rows = due ?? [];
  let dispatched = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows as Array<{
    id: number;
    conversation_id: number;
    seller_id: string;
    draft_text: string;
  }>) {
    // Re-check the conversation state before dispatching. If the seller
    // has since marked the buyer's message handled, or the stage moved
    // to `accepted` / `walked`, we drop the draft instead of posting it.
    const { data: conv } = await admin
      .from('conversations')
      .select('ai_negotiation_stage')
      .eq('id', row.conversation_id)
      .maybeSingle();
    const stage = (conv as any)?.ai_negotiation_stage as string | undefined;
    if (stage === 'accepted' || stage === 'walked') {
      // Stamp sent_text as empty marker so it doesn't queue again.
      await admin
        .from('ai_message_log')
        .update({ sent_text: '' })
        .eq('id', row.id);
      skipped += 1;
      continue;
    }

    // Insert the actual message as the seller (AI speaks on seller's
    // behalf per doctrine §P3 — disclosure badge comes from
    // ai_generated=true + the UI renders it separately).
    const { data: msg, error: msgErr } = await admin
      .from('messages')
      .insert({
        conversation_id: row.conversation_id,
        sender_id: row.seller_id,
        body: row.draft_text,
        ai_generated: true,
      })
      .select('id')
      .single();

    if (msgErr || !msg) {
      console.error(
        '[ai-flusher] dispatch failed for log %d: %s',
        row.id,
        msgErr?.message,
      );
      failed += 1;
      continue;
    }

    await admin
      .from('ai_message_log')
      .update({
        sent_text: row.draft_text,
        message_id: msg.id,
      })
      .eq('id', row.id);
    dispatched += 1;
  }

  return {
    candidates: rows.length,
    dispatched,
    skipped,
    failed,
  };
}
