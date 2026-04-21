'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  containsPhoneNumber,
  containsDiscriminatoryWording,
} from '@/lib/listings/validators';
import { checkRateLimit } from '@/lib/rate-limit/check';
import type { ChatActionResult } from './types';

/**
 * Chat server actions.
 *
 * - startOrResumeConversation — called from "Contact seller" CTAs.
 *   If a conversation already exists for (listing, current user as
 *   buyer), return its id. Otherwise create.
 * - sendMessage — append a message to an existing conversation.
 *   Enforces Filter A (phone-in-text) + Filter C (discriminatory
 *   wording) at submit.
 * - markRead — wraps the mark_conversation_read RPC so callers don't
 *   touch SQL directly.
 * - archiveConversation / blockConversation — participant-side flags.
 */

const MessageBodySchema = z
  .string()
  .trim()
  .min(1, { message: 'message_empty' })
  .max(2000, { message: 'message_too_long' });

const StartConversationSchema = z.object({
  listing_id: z.number().int().positive(),
  opening_message: MessageBodySchema.optional(),
  sent_as_offer: z.boolean().optional(),
  offer_amount_minor: z.number().int().positive().optional().nullable(),
});

const SendMessageSchema = z.object({
  conversation_id: z.number().int().positive(),
  body: MessageBodySchema,
  sent_as_offer: z.boolean().optional(),
  offer_amount_minor: z.number().int().positive().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Filter A + C — shared gate before any message write
// ---------------------------------------------------------------------------

function checkMessageContent(
  body: string,
): { ok: true } | { ok: false; error: 'phone_not_allowed' | 'discriminatory_not_allowed' } {
  if (containsPhoneNumber(body)) {
    return { ok: false, error: 'phone_not_allowed' };
  }
  if (containsDiscriminatoryWording(body)) {
    return { ok: false, error: 'discriminatory_not_allowed' };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Start or resume a conversation for the current buyer on a listing.
// ---------------------------------------------------------------------------

export async function startOrResumeConversation(
  raw: z.infer<typeof StartConversationSchema>,
): Promise<ChatActionResult<{ conversation_id: number }>> {
  const parsed = StartConversationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'validation_failed' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Resolve seller + listing currency from the listing row
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .select('id, seller_id, currency_code, status')
    .eq('id', parsed.data.listing_id)
    .maybeSingle();

  if (listingErr || !listing) return { ok: false, error: 'listing_not_found' };
  if (listing.status !== 'live') return { ok: false, error: 'listing_not_live' };
  if (listing.seller_id === user.id) return { ok: false, error: 'own_listing' };

  // Rate limit: 10 fresh conversations / 10 minutes / user. Re-opening
  // an existing conversation with the same seller is idempotent on our
  // side, so this is specifically about bot-driven spam fanouts.
  const within = await checkRateLimit({
    action: 'chat.start_conversation',
    max: 10,
    windowSeconds: 600,
  });
  if (!within) return { ok: false, error: 'rate_limited' };

  // Filter A + C on opening message if provided
  if (parsed.data.opening_message) {
    const gate = checkMessageContent(parsed.data.opening_message);
    if (!gate.ok) return { ok: false, error: gate.error };
  }

  // Upsert-by-unique: try insert; if it fails with 23505 (unique violation),
  // select existing.
  const { data: inserted, error: insertErr } = await supabase
    .from('conversations')
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    })
    .select('id')
    .single();

  let conversationId: number;
  if (insertErr) {
    // Already exists — look it up
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .maybeSingle();
    if (!existing) {
      console.error('[chat/actions] startOrResume insert failed + no existing row:', insertErr.message);
      return { ok: false, error: 'start_failed' };
    }
    conversationId = existing.id as number;
  } else {
    conversationId = inserted!.id as number;
  }

  // Append opening message if provided
  if (parsed.data.opening_message) {
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: parsed.data.opening_message,
      sent_as_offer: parsed.data.sent_as_offer ?? false,
      offer_amount_minor: parsed.data.offer_amount_minor ?? null,
      offer_currency:
        parsed.data.sent_as_offer && parsed.data.offer_amount_minor
          ? listing.currency_code
          : null,
    });
    if (msgErr) {
      console.error('[chat/actions] opening message insert failed:', msgErr.message);
      // Conversation exists; surface partial-success with the id so the UI
      // can still open the thread.
      return { ok: true, data: { conversation_id: conversationId } };
    }
  }

  revalidatePath('/messages');
  return { ok: true, data: { conversation_id: conversationId } };
}

// ---------------------------------------------------------------------------
// Send a message to an existing conversation.
// ---------------------------------------------------------------------------

export async function sendMessage(
  raw: z.infer<typeof SendMessageSchema>,
): Promise<ChatActionResult<{ message_id: number }>> {
  const parsed = SendMessageSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors))
        fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'validation_failed', fieldErrors };
  }

  const gate = checkMessageContent(parsed.data.body);
  if (!gate.ok) return { ok: false, error: gate.error };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Rate limit: 30 messages / minute / user across all conversations.
  // Tuned for an engaged negotiation (a few back-and-forths per second)
  // without letting a bot fire thousands.
  const within = await checkRateLimit({
    action: 'chat.send_message',
    max: 30,
    windowSeconds: 60,
  });
  if (!within) return { ok: false, error: 'rate_limited' };

  // For offers, resolve currency from the conversation's listing
  let offer_currency: string | null = null;
  if (parsed.data.sent_as_offer && parsed.data.offer_amount_minor) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('listing:listings!conversations_listing_id_fkey ( currency_code )')
      .eq('id', parsed.data.conversation_id)
      .maybeSingle();
    offer_currency =
      ((conv as any)?.listing?.currency_code as string | undefined) ?? 'KWD';
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: parsed.data.conversation_id,
      sender_id: user.id,
      body: parsed.data.body,
      sent_as_offer: parsed.data.sent_as_offer ?? false,
      offer_amount_minor: parsed.data.offer_amount_minor ?? null,
      offer_currency,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[chat/actions] sendMessage error:', error?.message);
    return { ok: false, error: 'send_failed' };
  }

  revalidatePath(`/messages/${parsed.data.conversation_id}`);
  revalidatePath('/messages');
  return { ok: true, data: { message_id: data.id as number } };
}

// ---------------------------------------------------------------------------
// Mark conversation read (resets unread_count + stamps read_at).
// ---------------------------------------------------------------------------

export async function markConversationRead(
  conversationId: number,
): Promise<ChatActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) {
    console.error('[chat/actions] markRead error:', error.message);
    return { ok: false, error: 'mark_read_failed' };
  }
  revalidatePath('/messages');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Participant flags — archive / unarchive / block / unblock.
// ---------------------------------------------------------------------------

async function setParticipantFlag(
  conversationId: number,
  field: 'buyer_archived' | 'seller_archived' | 'buyer_blocked' | 'seller_blocked',
  value: boolean,
): Promise<ChatActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Resolve whether the caller is buyer or seller (also enforces membership)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: 'conversation_not_found' };
  const isBuyer = (conv as any).buyer_id === user.id;
  const isSeller = (conv as any).seller_id === user.id;
  if (!isBuyer && !isSeller) return { ok: false, error: 'not_a_participant' };

  // Pick the flag column that corresponds to the caller's side
  const actualField =
    field.startsWith('buyer_') && isBuyer
      ? field
      : field.startsWith('seller_') && isSeller
      ? field
      : null;
  if (!actualField) return { ok: false, error: 'wrong_side' };

  const { error } = await supabase
    .from('conversations')
    .update({ [actualField]: value })
    .eq('id', conversationId);
  if (error) {
    console.error('[chat/actions] setParticipantFlag error:', error.message);
    return { ok: false, error: 'update_failed' };
  }
  revalidatePath('/messages');
  return { ok: true };
}

export async function archiveConversation(
  conversationId: number,
  viewerIsBuyer: boolean,
): Promise<ChatActionResult> {
  return setParticipantFlag(
    conversationId,
    viewerIsBuyer ? 'buyer_archived' : 'seller_archived',
    true,
  );
}

export async function unarchiveConversation(
  conversationId: number,
  viewerIsBuyer: boolean,
): Promise<ChatActionResult> {
  return setParticipantFlag(
    conversationId,
    viewerIsBuyer ? 'buyer_archived' : 'seller_archived',
    false,
  );
}

export async function blockConversation(
  conversationId: number,
  viewerIsBuyer: boolean,
): Promise<ChatActionResult> {
  return setParticipantFlag(
    conversationId,
    viewerIsBuyer ? 'buyer_blocked' : 'seller_blocked',
    true,
  );
}

export async function unblockConversation(
  conversationId: number,
  viewerIsBuyer: boolean,
): Promise<ChatActionResult> {
  return setParticipantFlag(
    conversationId,
    viewerIsBuyer ? 'buyer_blocked' : 'seller_blocked',
    false,
  );
}
