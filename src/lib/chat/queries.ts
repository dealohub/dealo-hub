import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type {
  InboxConversation,
  ChatMessage,
  ChatThread,
} from './types';
import { verticalFromParentSlug } from './types';

/**
 * Chat read-side queries.
 *
 * All queries run as the signed-in user; RLS ensures only their
 * conversations/messages come back. We don't manually filter by
 * auth.uid() in most queries — that's the policy's job.
 */

// ---------------------------------------------------------------------------
// Raw row shapes for the joins we read
// ---------------------------------------------------------------------------

interface RawListingMini {
  id: number;
  slug: string;
  title: string;
  price_minor_units: number | string;
  currency_code: string;
  listing_images: { url: string; position: number }[] | null;
  category:
    | {
        slug: string;
        parent_id: number | null;
      }
    | null;
}

interface RawProfileMini {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_dealer: boolean;
  dealer_name: string | null;
}

interface RawConversationRow {
  id: number;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  buyer_archived: boolean;
  seller_archived: boolean;
  buyer_blocked: boolean;
  seller_blocked: boolean;
  created_at: string;
  listing: RawListingMini | null;
  buyer: RawProfileMini | null;
  seller: RawProfileMini | null;
}

interface RawMessageRow {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  sent_as_offer: boolean;
  offer_amount_minor: number | string | null;
  offer_currency: string | null;
  read_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function coverFromImages(imgs: { url: string; position: number }[] | null): string | null {
  if (!imgs || imgs.length === 0) return null;
  return imgs.slice().sort((a, b) => a.position - b.position)[0]?.url ?? null;
}

function mapInbox(
  row: RawConversationRow,
  viewerId: string,
  parentSlugById: Map<number, string>,
): InboxConversation | null {
  if (!row.listing || !row.buyer || !row.seller) return null;
  const viewerIsBuyer = row.buyer_id === viewerId;
  const otherRaw = viewerIsBuyer ? row.seller : row.buyer;

  const parentId = row.listing.category?.parent_id ?? null;
  const parentSlug = parentId != null ? parentSlugById.get(parentId) ?? null : null;

  return {
    id: row.id,
    listing: {
      id: row.listing.id,
      slug: row.listing.slug,
      title: row.listing.title,
      cover: coverFromImages(row.listing.listing_images),
      priceMinorUnits: Number(row.listing.price_minor_units),
      currencyCode: row.listing.currency_code as InboxConversation['listing']['currencyCode'],
      vertical: verticalFromParentSlug(parentSlug),
    },
    otherParty: {
      id: otherRaw.id,
      displayName: otherRaw.display_name,
      avatarUrl: otherRaw.avatar_url,
      isDealer: otherRaw.is_dealer,
      dealerName: otherRaw.dealer_name,
    },
    viewerIsBuyer,
    unreadCount: viewerIsBuyer ? row.buyer_unread_count : row.seller_unread_count,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    archived: viewerIsBuyer ? row.buyer_archived : row.seller_archived,
    blocked: viewerIsBuyer ? row.buyer_blocked : row.seller_blocked,
  };
}

function mapMessage(row: RawMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    sentAsOffer: row.sent_as_offer,
    offerAmountMinor: row.offer_amount_minor != null ? Number(row.offer_amount_minor) : null,
    offerCurrency: row.offer_currency,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// SELECT strings
// ---------------------------------------------------------------------------

/**
 * NOTE: we fetch the listing's category with only `slug, parent_id` —
 * NOT a nested `parent:categories!...` embed. PostgREST's self-FK
 * resolution on `categories.parent_id → categories.id` is unreliable
 * in our schema cache (same gotcha noted in landing/queries.ts). We
 * look up parent slugs in a second round-trip and stitch in-code.
 */
const CONVERSATION_SELECT = `
  id, buyer_id, seller_id, last_message_at, last_message_preview,
  buyer_unread_count, seller_unread_count,
  buyer_archived, seller_archived, buyer_blocked, seller_blocked,
  created_at,
  listing:listings!conversations_listing_id_fkey (
    id, slug, title, price_minor_units, currency_code,
    listing_images ( url, position ),
    category:categories!listings_category_id_fkey (
      slug, parent_id
    )
  ),
  buyer:profiles!conversations_buyer_id_fkey (
    id, display_name, avatar_url, is_dealer, dealer_name
  ),
  seller:profiles!conversations_seller_id_fkey (
    id, display_name, avatar_url, is_dealer, dealer_name
  )
` as const;

/** Batch-fetch parent slugs for a set of parent_ids (one DB round-trip). */
async function fetchParentSlugMap(
  supabase: ReturnType<typeof createClient>,
  parentIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const uniq = Array.from(new Set(parentIds.filter((n): n is number => n != null)));
  if (uniq.length === 0) return map;
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug')
    .in('id', uniq);
  if (error || !data) return map;
  for (const row of data as { id: number; slug: string }[]) {
    map.set(row.id, row.slug);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Inbox list for the signed-in user — conversations they participate
 * in as either buyer or seller. Ordered by last_message_at DESC.
 *
 * RLS handles the buyer/seller filter; we don't do it in app code.
 */
export const getInbox = cache(async function getInbox(opts: {
  includeArchived?: boolean;
} = {}): Promise<InboxConversation[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    console.error('[chat/queries] getInbox error:', error.message);
    return [];
  }
  if (!data) return [];

  const rows = data as unknown as RawConversationRow[];
  const parentIds = rows
    .map(r => r.listing?.category?.parent_id)
    .filter((n): n is number => typeof n === 'number');
  const parentSlugById = await fetchParentSlugMap(supabase, parentIds);

  const mapped = rows
    .map(r => mapInbox(r, user.id, parentSlugById))
    .filter((x): x is InboxConversation => x !== null);

  if (opts.includeArchived) return mapped;
  return mapped.filter(c => !c.archived);
});

/**
 * Total unread count across all the viewer's conversations.
 * Drives the navbar messages badge.
 */
export const getUnreadCount = cache(async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id, buyer_unread_count, seller_unread_count');

  if (error || !data) return 0;

  return data.reduce((acc, row: any) => {
    const isBuyer = row.buyer_id === user.id;
    const count = isBuyer ? row.buyer_unread_count : row.seller_unread_count;
    return acc + (count ?? 0);
  }, 0);
});

/**
 * Fetch a thread: conversation header + all messages ordered by
 * created_at ASC. RLS blocks access if the caller isn't a participant.
 */
export const getThread = cache(async function getThread(
  conversationId: number,
): Promise<ChatThread | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch header
  const { data: convRow, error: convErr } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr) {
    console.error('[chat/queries] getThread header error:', convErr.message);
    return null;
  }
  if (!convRow) return null;

  const convTyped = convRow as unknown as RawConversationRow;
  const parentId = convTyped.listing?.category?.parent_id;
  const parentSlugById = await fetchParentSlugMap(
    supabase,
    typeof parentId === 'number' ? [parentId] : [],
  );
  const header = mapInbox(convTyped, user.id, parentSlugById);
  if (!header) return null;

  // Fetch messages
  const { data: msgs, error: msgsErr } = await supabase
    .from('messages')
    .select(
      'id, conversation_id, sender_id, body, media_url, media_type, sent_as_offer, offer_amount_minor, offer_currency, read_at, created_at',
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (msgsErr) {
    console.error('[chat/queries] getThread messages error:', msgsErr.message);
    return { conversation: header, messages: [] };
  }

  return {
    conversation: header,
    messages: ((msgs ?? []) as unknown as RawMessageRow[]).map(mapMessage),
  };
});
