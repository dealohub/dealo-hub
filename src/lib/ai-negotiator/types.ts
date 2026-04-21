/**
 * AI Negotiator — shared types used across policy + dialogue + provider layers.
 *
 * This file is deliberately tiny. Types that leak across boundaries live
 * here; everything else stays in its module.
 */

/**
 * Classifier output for buyer's message. Drives §P7 handover logic.
 * Matches the `messages.intent_class` CHECK constraint in migration 0030.
 */
export type IntentClass =
  | 'price_offer'
  | 'logistics_question'
  | 'personal_question'
  | 'emotional'
  | 'off_topic';

/** Seller's chosen tone at opt-in (doctrine §P4). */
export type NegotiatorTone = 'professional' | 'warm' | 'concise';

/** The three stages of the AI-negotiation state machine (§P6). */
export type NegotiationStage =
  | 'inactive'
  | 'negotiating'
  | 'awaiting_seller_accept'
  | 'accepted'
  | 'walked';
