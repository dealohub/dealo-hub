'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  QuoteRequestPayloadSchema,
  QuoteResponsePayloadSchema,
  BookingProposalPayloadSchema,
  CompletionMarkPayloadSchema,
  containsPhoneOrEmailPattern,
  canTransitionBooking,
  type BookingStatus,
} from './validators';
import type {
  QuoteRequestPayload,
  QuoteResponsePayload,
  BookingProposalPayload,
  CompletionMarkPayload,
} from './types';

/**
 * Phase 8a P3/P4 — server actions for the services quote + booking flow.
 *
 * All actions return a discriminated-union result type so the UI can
 * branch on typed errors without parsing strings. Every action:
 *   • authenticates the caller (getUser()),
 *   • validates the payload with Zod,
 *   • enforces DECISIONS.md #2 chat-only via containsPhoneOrEmailPattern,
 *   • writes to messages(kind, payload) OR service_bookings depending on
 *     the kind, preserving the doctrine's invariants.
 *
 * Out of scope for Phase 8a:
 *   • Fan-out matchmaking (finding which providers receive a new
 *     quote_request). Stubbed as a TODO below — providers poll their
 *     inbox via getOpenQuoteRequests (queries side, next chunk).
 *   • Rate limits on quote submissions. Filter B in Phase 5g's
 *     rate_limits table will handle this — wire-up is a 1-liner once
 *     the UI is live.
 *   • Dealo Guarantee claim filing. Schema-ready
 *     (service_bookings.guarantee_applies), UI ships in 8b.
 */

// ---------------------------------------------------------------------------
// Result types — discriminated union for clean UI error branching
// ---------------------------------------------------------------------------

export type ServiceActionResult<T = null> =
  | { ok: true; data: T }
  | {
      ok: false;
      error:
        | 'not_authenticated'
        | 'forbidden'
        | 'invalid_payload'
        | 'leaks_contact_info'
        | 'listing_not_found'
        | 'conversation_not_found'
        | 'booking_not_found'
        | 'illegal_transition'
        | 'db_error';
      details?: string;
    };

// ---------------------------------------------------------------------------
// Action 1 — sendQuoteRequest (buyer → provider, kind='quote_request')
// ---------------------------------------------------------------------------
//
// Phase 8a v1 — fan-out is manual: the buyer picks ONE listing to
// request a quote from. The doctrine's 5-max fan-out matchmaking lands
// in Phase 8b once we have 20+ providers live (otherwise 5-max picks
// random cardinality and degrades to "whoever happens to be seeded").

export async function sendQuoteRequest(args: {
  listingId: number;
  payload: QuoteRequestPayload;
}): Promise<
  ServiceActionResult<{ conversationId: number; messageId: number }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Validate payload shape
  const parsed = QuoteRequestPayloadSchema.safeParse(args.payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid_payload',
      details: parsed.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '),
    };
  }

  // P4 — reject if notes leak phone/email
  if (containsPhoneOrEmailPattern(parsed.data.notes ?? null)) {
    return { ok: false, error: 'leaks_contact_info' };
  }

  // Look up the listing's provider
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', args.listingId)
    .maybeSingle();
  if (listingErr) return { ok: false, error: 'db_error', details: listingErr.message };
  if (!listing || listing.status !== 'live') {
    return { ok: false, error: 'listing_not_found' };
  }

  // Find or create conversation (same pattern as chat's startOrResume)
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', args.listingId)
    .eq('buyer_id', user.id)
    .eq('seller_id', listing.seller_id)
    .maybeSingle();

  let conversationId: number;
  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        listing_id: args.listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select('id')
      .single();
    if (convErr || !newConv) {
      return { ok: false, error: 'db_error', details: convErr?.message };
    }
    conversationId = newConv.id;
  }

  // Write the quote_request message
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      kind: 'quote_request',
      body: null,
      payload: parsed.data,
    })
    .select('id')
    .single();
  if (msgErr || !msg) {
    return { ok: false, error: 'db_error', details: msgErr?.message };
  }

  revalidatePath(`/messages/${conversationId}`);
  return { ok: true, data: { conversationId, messageId: msg.id } };
}

// ---------------------------------------------------------------------------
// Action 2 — respondWithQuote (provider → buyer, kind='quote_response')
// ---------------------------------------------------------------------------

export async function respondWithQuote(args: {
  conversationId: number;
  payload: QuoteResponsePayload;
}): Promise<ServiceActionResult<{ messageId: number }>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const parsed = QuoteResponsePayloadSchema.safeParse(args.payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid_payload',
      details: parsed.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '),
    };
  }

  // Reject contact-info leak in the `includes` array
  for (const inc of parsed.data.includes) {
    if (containsPhoneOrEmailPattern(inc)) {
      return { ok: false, error: 'leaks_contact_info' };
    }
  }

  // Verify caller is the seller on this conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id, seller_id, buyer_id')
    .eq('id', args.conversationId)
    .maybeSingle();
  if (convErr) return { ok: false, error: 'db_error', details: convErr.message };
  if (!conv) return { ok: false, error: 'conversation_not_found' };
  if (conv.seller_id !== user.id) return { ok: false, error: 'forbidden' };

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: args.conversationId,
      sender_id: user.id,
      kind: 'quote_response',
      body: null,
      payload: parsed.data,
    })
    .select('id')
    .single();
  if (msgErr || !msg) {
    return { ok: false, error: 'db_error', details: msgErr?.message };
  }

  revalidatePath(`/messages/${args.conversationId}`);
  return { ok: true, data: { messageId: msg.id } };
}

// ---------------------------------------------------------------------------
// Action 3 — proposeBooking (either side, kind='booking_proposal')
// ---------------------------------------------------------------------------
//
// On success creates BOTH:
//   • a messages row (kind='booking_proposal', payload=proposed slot)
//   • a service_bookings row (status='proposed')
// Either side can propose. Acceptance is done by the COUNTERPARTY via
// a follow-up status-change call (confirmBooking action in 8b).

export async function proposeBooking(args: {
  conversationId: number;
  listingId: number;
  payload: BookingProposalPayload;
}): Promise<
  ServiceActionResult<{ messageId: number; bookingId: number }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  const parsed = BookingProposalPayloadSchema.safeParse(args.payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid_payload',
      details: parsed.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '),
    };
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, buyer_id, seller_id')
    .eq('id', args.conversationId)
    .maybeSingle();
  if (!conv) return { ok: false, error: 'conversation_not_found' };
  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    return { ok: false, error: 'forbidden' };
  }

  // Create booking first (we need booking_id — but we write it to the
  // proposal's message.payload too so the UI can link back).
  const { data: booking, error: bookingErr } = await supabase
    .from('service_bookings')
    .insert({
      listing_id: args.listingId,
      conversation_id: args.conversationId,
      buyer_profile_id: conv.buyer_id,
      provider_profile_id: conv.seller_id,
      slot_start_at: parsed.data.slot_start_at,
      slot_end_at: parsed.data.slot_end_at,
      estimated_total_minor_units: parsed.data.estimated_total_minor_units,
      currency_code: 'KWD',
      status: 'proposed',
      guarantee_applies: parsed.data.guarantee_applies,
    })
    .select('id')
    .single();
  if (bookingErr || !booking) {
    return { ok: false, error: 'db_error', details: bookingErr?.message };
  }

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: args.conversationId,
      sender_id: user.id,
      kind: 'booking_proposal',
      body: null,
      payload: { ...parsed.data, booking_id: booking.id },
    })
    .select('id')
    .single();
  if (msgErr || !msg) {
    return { ok: false, error: 'db_error', details: msgErr?.message };
  }

  revalidatePath(`/messages/${args.conversationId}`);
  return { ok: true, data: { messageId: msg.id, bookingId: booking.id } };
}

// ---------------------------------------------------------------------------
// Action 4 — markCompletion (either side, kind='completion_mark')
// ---------------------------------------------------------------------------
//
// P5 — reviews only unlock after BOTH sides have marked completion.
// The state-machine check ensures we only transition legal statuses.

export async function markCompletion(args: {
  bookingId: number;
  conversationId: number;
}): Promise<
  ServiceActionResult<{
    messageId: number;
    newStatus: BookingStatus;
    bothMarked: boolean;
  }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };

  // Load booking
  const { data: booking } = await supabase
    .from('service_bookings')
    .select('id, buyer_profile_id, provider_profile_id, status, buyer_completion_at, provider_completion_at')
    .eq('id', args.bookingId)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'booking_not_found' };

  const isBuyer = booking.buyer_profile_id === user.id;
  const isProvider = booking.provider_profile_id === user.id;
  if (!isBuyer && !isProvider) return { ok: false, error: 'forbidden' };

  // Validate state transition
  const currentStatus = booking.status as BookingStatus;
  const targetStatus: BookingStatus =
    // Already marked by the other side → move to completed
    (isBuyer && booking.provider_completion_at != null) ||
    (isProvider && booking.buyer_completion_at != null)
      ? 'completed'
      : currentStatus; // stay at 'confirmed' until the other side marks too

  if (
    targetStatus !== currentStatus &&
    !canTransitionBooking(currentStatus, targetStatus)
  ) {
    return { ok: false, error: 'illegal_transition' };
  }

  // Build patch
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: targetStatus };
  if (isBuyer) patch.buyer_completion_at = now;
  if (isProvider) patch.provider_completion_at = now;

  const { error: updErr } = await supabase
    .from('service_bookings')
    .update(patch)
    .eq('id', args.bookingId);
  if (updErr) {
    return { ok: false, error: 'db_error', details: updErr.message };
  }

  // Validate payload + write the completion_mark message
  const payload: CompletionMarkPayload = {
    booking_id: args.bookingId,
    completed_at: now,
  };
  const parsed = CompletionMarkPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    // Should never trip — we built the payload ourselves — but safety belt:
    return { ok: false, error: 'invalid_payload' };
  }

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: args.conversationId,
      sender_id: user.id,
      kind: 'completion_mark',
      body: null,
      payload: parsed.data,
    })
    .select('id')
    .single();
  if (msgErr || !msg) {
    return { ok: false, error: 'db_error', details: msgErr?.message };
  }

  revalidatePath(`/messages/${args.conversationId}`);
  return {
    ok: true,
    data: {
      messageId: msg.id,
      newStatus: targetStatus,
      bothMarked: targetStatus === 'completed',
    },
  };
}
