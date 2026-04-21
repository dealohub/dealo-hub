/**
 * Chat types — public shapes for conversations + messages.
 *
 * Snake_case only escapes into this file; mappers in queries.ts emit
 * the camelCase forms consumed by the UI.
 */

export type ConversationId = number;
export type MessageId = number;

/** Mini-listing payload shown in the inbox row + thread header. */
export interface ConversationListing {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  priceMinorUnits: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  vertical: 'rides' | 'properties' | 'other';
}

/** Mini-profile payload shown as the "other party" in the inbox + thread. */
export interface ConversationParty {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isDealer: boolean;
  dealerName: string | null;
}

/** Row shown in the inbox list. */
export interface InboxConversation {
  id: ConversationId;
  listing: ConversationListing;
  otherParty: ConversationParty;
  /** True if the current viewer is the buyer. */
  viewerIsBuyer: boolean;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  archived: boolean;
  blocked: boolean;
}

/** Single message in a thread. */
export interface ChatMessage {
  id: MessageId;
  conversationId: ConversationId;
  senderId: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  sentAsOffer: boolean;
  offerAmountMinor: number | null;
  offerCurrency: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Full thread payload for /messages/[id]. */
export interface ChatThread {
  conversation: InboxConversation;
  messages: ChatMessage[];
}

/** Result type shared by chat server actions. */
export type ChatActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Verticals resolution from listing category.parent.slug. */
export function verticalFromParentSlug(
  parentSlug: string | null | undefined,
): 'rides' | 'properties' | 'other' {
  if (parentSlug === 'automotive') return 'rides';
  if (parentSlug === 'real-estate') return 'properties';
  return 'other';
}

/** Returns the detail-page path for a conversation's listing. */
export function listingDetailPath(
  locale: 'ar' | 'en',
  listing: ConversationListing,
): string {
  if (listing.vertical === 'rides') return `/${locale}/rides/${listing.slug}`;
  if (listing.vertical === 'properties') return `/${locale}/properties/${listing.slug}`;
  return `/${locale}/`;
}
