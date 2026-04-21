import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { reactToBuyerMessage, type ReactInput } from '@/lib/ai-negotiator/orchestrator';
import { selectProvider } from '@/lib/ai-negotiator/providers/select';
import type { NegotiatorTone } from '@/lib/ai-negotiator/types';
import type { PromptContext } from '@/lib/ai-negotiator/prompts';

/**
 * Chat → AI Negotiator hook.
 *
 * Called from `sendMessage` **after** the buyer's message is persisted
 * to the `messages` table. If the listing has `negotiation_enabled`
 * and the incoming message is from the buyer (not the seller), the
 * hook:
 *
 *   1. Loads the listing + conversation state (floor, history,
 *      counters) using the admin client — RLS would hide the floor
 *      from everyone except the seller, and this code path runs for
 *      the buyer's session.
 *   2. Classifies + decides a policy move + drafts a reply via the
 *      orchestrator.
 *   3. Persists the draft to `ai_message_log` with `scheduled_send_at`
 *      set — the flusher (Phase 6c cron or polling worker) reads the
 *      due rows and inserts the actual `messages` row at that time.
 *      This creates the human-like cadence (§P14) without needing a
 *      true timer inside the server action.
 *   4. On handoff: sets `conversations.ai_negotiation_stage='inactive'`
 *      and flags the buyer's message with `needs_human_followup=true`.
 *
 * Fail-open semantics: any exception inside this hook is swallowed
 * and logged — it must NEVER prevent the buyer's message from
 * reaching the conversation. The engine is a secondary surface; the
 * primary duty (deliver the buyer's message) already completed
 * upstream before this is called.
 *
 * Reference: planning/PHASE-6A-AI-NEGOTIATOR.md §P6 (state machine),
 *            §P8 (audit trail), §P14 (cadence).
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AiHookInput {
  /** ID of the just-inserted buyer message. */
  messageId: number;
  /** Conversation the message belongs to. */
  conversationId: number;
  /** Buyer user id (the sender of `messageId`). */
  buyerId: string;
  /** Raw buyer text. Already filtered for phone + discriminatory wording. */
  buyerText: string;
}

/**
 * Top-level entrypoint. Never throws. Logs any internal failures.
 */
export async function maybeFireAiNegotiator(input: AiHookInput): Promise<void> {
  try {
    await runAiNegotiatorPipeline(input);
  } catch (err) {
    console.error(
      '[chat/ai-hook] orchestrator failure — silent fallback:',
      err instanceof Error ? err.message : err,
    );
  }
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

async function runAiNegotiatorPipeline(input: AiHookInput): Promise<void> {
  const admin = createAdminClient();

  // ── Load conversation + listing snapshot ──────────────────────────
  // We embed the listing row so one round-trip gets everything. Admin
  // client bypasses RLS → it's the only way to legitimately read
  // `ai_floor_minor_units` (seller's secret).
  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .select(
      `
        id, listing_id, buyer_id, seller_id, ai_negotiation_stage,
        listing:listings!conversations_listing_id_fkey (
          id, title, title_ar, title_en,
          price_minor_units, currency_code,
          negotiation_enabled, ai_floor_minor_units, ai_settings
        )
      `,
    )
    .eq('id', input.conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    console.error(
      '[chat/ai-hook] load conversation failed:',
      convErr?.message,
    );
    return;
  }

  // Guard: only fire when the sender is the buyer (not the seller).
  if ((conv as any).buyer_id !== input.buyerId) return;

  const listing = (conv as any).listing;
  if (!listing) return;
  if (!listing.negotiation_enabled) return;
  // Stage `accepted` / `walked` → terminal, no more AI messages.
  const stage = (conv as any).ai_negotiation_stage as string;
  if (stage === 'accepted' || stage === 'walked') return;

  // ── Gather context counters ───────────────────────────────────────
  const { count: totalMessages } = await admin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', input.conversationId);
  const { count: aiMessagesSent } = await admin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', input.conversationId)
    .eq('ai_generated', true);

  // Latest unaccepted buyer offer (for carry-through across turns
  // where the buyer drops the number).
  const { data: lastOfferRow } = await admin
    .from('messages')
    .select('offer_amount_minor')
    .eq('conversation_id', input.conversationId)
    .eq('sender_id', input.buyerId)
    .eq('sent_as_offer', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const previousOfferMinor =
    ((lastOfferRow as any)?.offer_amount_minor as number | null | undefined) ??
    null;

  // Last 4 turns for LLM context.
  const { data: recentMsgs } = await admin
    .from('messages')
    .select('body, sender_id, created_at')
    .eq('conversation_id', input.conversationId)
    .order('created_at', { ascending: false })
    .limit(4);
  const history = ((recentMsgs ?? []) as any[])
    .slice()
    .reverse()
    .map(m => ({
      role: m.sender_id === input.buyerId ? ('user' as const) : ('assistant' as const),
      content: m.body as string,
    }));

  // ── Language + tone heuristics ────────────────────────────────────
  // Tone comes from ai_settings.tone (seller-configurable). Default: warm.
  const tone = (pickTone(listing.ai_settings) ?? 'warm') as NegotiatorTone;
  // Language: peek at buyer text. Arabic letters present → ar, else en.
  const language: PromptContext['language'] = /[\u0600-\u06FF]/.test(input.buyerText)
    ? 'ar'
    : 'en';

  // Title for prompt — prefer buyer's language, fall back to whatever exists.
  const titleForPrompt =
    (language === 'ar'
      ? (listing.title_ar as string | null) ?? (listing.title as string)
      : (listing.title_en as string | null) ?? (listing.title as string)) ?? '';

  // Currency → minor-unit multiplier. KWD uses 1000 (fils); USD/AED/SAR
  // use 100. The `PromptContext.currency` union is narrowed to these
  // four today. Defensive default: KWD (the only on-platform currency).
  const currency = (listing.currency_code as PromptContext['currency']) ?? 'KWD';
  const minorUnitsPerMajor = currency === 'KWD' ? 1000 : 100;

  // ── Build orchestrator input ──────────────────────────────────────
  const reactInput: ReactInput = {
    buyerText: input.buyerText,
    language,
    tone,
    listing: {
      listPriceMinor: Number(listing.price_minor_units),
      floorMinor:
        listing.ai_floor_minor_units != null
          ? Number(listing.ai_floor_minor_units)
          : null,
      currency,
      minorUnitsPerMajor,
      titleForPrompt,
    },
    conversation: {
      messageCount: totalMessages ?? 0,
      aiMessagesSent: aiMessagesSent ?? 0,
      history,
      previousOfferMinor,
    },
    provider: selectProvider(),
    nowMs: Date.now(),
  };

  const result = await reactToBuyerMessage(reactInput);

  // ── Act on the result ─────────────────────────────────────────────
  if (result.kind === 'no_action') {
    return;
  }

  if (result.kind === 'handoff') {
    // Flag the buyer's message + bring the conversation back to a state
    // where the seller sees a plain inbox row (stage 'inactive').
    await admin
      .from('messages')
      .update({
        intent_class: result.intent,
        needs_human_followup: true,
      })
      .eq('id', input.messageId);

    // Stage transition: `negotiating` → `inactive` isn't in the state
    // machine, but `awaiting_seller_accept` → `inactive` isn't either —
    // we only touch stage when it's still 'inactive'/'negotiating'.
    if (stage !== 'awaiting_seller_accept') {
      await admin
        .from('conversations')
        .update({ ai_negotiation_stage: 'inactive' })
        .eq('id', input.conversationId);
    }
    return;
  }

  // Happy path: reply_scheduled. Persist to ai_message_log with a
  // scheduled_send_at so the flusher picks it up at the right time.
  const scheduledSendAt = new Date(result.scheduledSendAtMs).toISOString();

  await admin.from('ai_message_log').insert({
    conversation_id: input.conversationId,
    seller_id: (conv as any).seller_id,
    model: result.draft.model,
    prompt_hash: result.draft.promptHashPrefix,
    draft_text: result.draft.draftText,
    filter_actions:
      result.safety.safe === false
        ? (result.safety.filterActions as unknown as object)
        : [],
    tokens_input: result.draft.tokensInput,
    tokens_output: result.draft.tokensOutput,
    latency_ms: result.draft.latencyMs,
    scheduled_send_at: scheduledSendAt,
  });

  // Stage transition: move to 'negotiating' on first AI reply, or to
  // 'awaiting_seller_accept' when the policy chose accept_offer. The
  // trigger installed by migration 0030 enforces legal transitions.
  const nextStage =
    result.move.kind === 'accept_offer'
      ? 'awaiting_seller_accept'
      : 'negotiating';
  if (stage !== nextStage) {
    await admin
      .from('conversations')
      .update({ ai_negotiation_stage: nextStage })
      .eq('id', input.conversationId);
  }

  // Also tag the buyer's message with the classifier output so the
  // seller dashboard can later render a "buyer intent" chip.
  await admin
    .from('messages')
    .update({ intent_class: result.intent })
    .eq('id', input.messageId);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickTone(settings: unknown): NegotiatorTone | null {
  if (!settings || typeof settings !== 'object') return null;
  const t = (settings as Record<string, unknown>).tone;
  if (t === 'warm' || t === 'professional' || t === 'concise') return t;
  return null;
}
