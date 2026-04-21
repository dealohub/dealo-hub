/**
 * Listing-status state machine — pure-function policy.
 *
 * The server actions in `manage-actions.ts` enforce these rules
 * server-side, but we extract the rule table here so it's:
 *   • Trivially unit-testable without Supabase mocks.
 *   • Reusable from the UI for "can I show this button?" disclosure.
 *   • The single source of truth — actions consult this; tests
 *     consult this; UI consults this.
 *
 * State graph (current → allowed transitions):
 *
 *   draft     → live           (publish, handled in actions.publishListing)
 *   live      → sold | archived | deleted
 *   sold      → live | archived | deleted     (republish a re-listed item)
 *   archived  → live | sold | deleted          (recover, re-list, drop)
 *   deleted   → (terminal — only support can resurrect)
 *   held      → (admin-only — sellers don't move out of fraud hold)
 *   rejected  → (admin-only)
 *
 * Reference: chk_archived_status DB constraint + listing_status enum
 * (verified 2026-04-21 via direct DB query).
 */

export type ListingStatus =
  | 'draft'
  | 'live'
  | 'sold'
  | 'archived'
  | 'deleted'
  | 'held'
  | 'rejected';

export type ManageAction =
  | 'mark_sold'
  | 'archive'
  | 'republish'
  | 'soft_delete';

const ALLOWED: Record<ManageAction, ReadonlyArray<ListingStatus>> = {
  mark_sold: ['live', 'archived'],
  archive: ['live', 'sold'],
  republish: ['archived', 'sold'],
  // Soft-delete is allowed from any non-terminal state. Listing the
  // valid sources explicitly keeps tests readable + makes adding a new
  // status (e.g. 'paused') a one-line opt-in.
  soft_delete: ['draft', 'live', 'sold', 'archived', 'held', 'rejected'],
};

export function canPerform(action: ManageAction, status: ListingStatus): boolean {
  return ALLOWED[action].includes(status);
}

/**
 * Given the seller's current status, what are the actions the UI
 * should offer? Returned in display order (most-likely action first).
 */
export function actionsFor(status: ListingStatus): ManageAction[] {
  const out: ManageAction[] = [];
  if (canPerform('mark_sold', status)) out.push('mark_sold');
  if (canPerform('archive', status)) out.push('archive');
  if (canPerform('republish', status)) out.push('republish');
  if (canPerform('soft_delete', status)) out.push('soft_delete');
  return out;
}
