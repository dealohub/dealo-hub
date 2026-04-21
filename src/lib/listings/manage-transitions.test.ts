import { describe, it, expect } from 'vitest';
import {
  canPerform,
  actionsFor,
  type ListingStatus,
  type ManageAction,
} from './manage-transitions';

/**
 * State-machine tests for the listing-management actions.
 *
 * Two failure modes the suite locks down:
 *   1. Allowing an illegal transition (e.g. mark a draft as sold) →
 *      DB chk_archived_status would reject anyway, but the user would
 *      see a generic error instead of a clean disabled-button state.
 *   2. Hiding a legal transition (e.g. omitting "republish" from
 *      sold-state actions) → seller can't recover their inventory.
 *
 * The DB enum + chk constraint are verified by direct queries during
 * action testing — these tests are the policy-layer guarantee.
 */

const ALL_STATUSES: ListingStatus[] = [
  'draft',
  'live',
  'sold',
  'archived',
  'deleted',
  'held',
  'rejected',
];
const ALL_ACTIONS: ManageAction[] = ['mark_sold', 'archive', 'republish', 'soft_delete'];

// ---------------------------------------------------------------------------
// canPerform — full transition matrix
// ---------------------------------------------------------------------------

describe('canPerform — exhaustive matrix', () => {
  // Lock the full table down. Any new status enum value will surface
  // here as a missing assertion → forces a deliberate decision.
  const expected: Record<ListingStatus, Record<ManageAction, boolean>> = {
    draft:    { mark_sold: false, archive: false, republish: false, soft_delete: true  },
    live:     { mark_sold: true,  archive: true,  republish: false, soft_delete: true  },
    sold:     { mark_sold: false, archive: true,  republish: true,  soft_delete: true  },
    archived: { mark_sold: true,  archive: false, republish: true,  soft_delete: true  },
    deleted:  { mark_sold: false, archive: false, republish: false, soft_delete: false },
    held:     { mark_sold: false, archive: false, republish: false, soft_delete: true  },
    rejected: { mark_sold: false, archive: false, republish: false, soft_delete: true  },
  };

  for (const status of ALL_STATUSES) {
    for (const action of ALL_ACTIONS) {
      const want = expected[status][action];
      it(`${action} from "${status}" → ${want}`, () => {
        expect(canPerform(action, status)).toBe(want);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Spot-checks on the most-common seller flows
// ---------------------------------------------------------------------------

describe('common seller flows', () => {
  it('live listing offers mark_sold + archive + soft_delete', () => {
    expect(actionsFor('live')).toEqual(['mark_sold', 'archive', 'soft_delete']);
  });
  it('sold listing offers archive + republish + soft_delete', () => {
    expect(actionsFor('sold')).toEqual(['archive', 'republish', 'soft_delete']);
  });
  it('archived listing offers mark_sold + republish + soft_delete', () => {
    expect(actionsFor('archived')).toEqual(['mark_sold', 'republish', 'soft_delete']);
  });
  it('deleted listing offers nothing (terminal)', () => {
    expect(actionsFor('deleted')).toEqual([]);
  });
  it('draft listing only offers soft_delete (publish is its own flow)', () => {
    expect(actionsFor('draft')).toEqual(['soft_delete']);
  });
  it('held / rejected listings only allow soft_delete (admin owns the rest)', () => {
    expect(actionsFor('held')).toEqual(['soft_delete']);
    expect(actionsFor('rejected')).toEqual(['soft_delete']);
  });
});

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

describe('invariants', () => {
  it('deleted is a terminal state — no action recovers it from the seller side', () => {
    for (const action of ALL_ACTIONS) {
      expect(canPerform(action, 'deleted')).toBe(false);
    }
  });

  it('mark_sold never legal from a state that was never live', () => {
    expect(canPerform('mark_sold', 'draft')).toBe(false);
    expect(canPerform('mark_sold', 'held')).toBe(false);
    expect(canPerform('mark_sold', 'rejected')).toBe(false);
  });

  it('republish never legal from a state that wasn\'t the seller\'s own withdraw', () => {
    expect(canPerform('republish', 'draft')).toBe(false);
    expect(canPerform('republish', 'held')).toBe(false);
    expect(canPerform('republish', 'rejected')).toBe(false);
    expect(canPerform('republish', 'live')).toBe(false);
  });

  it('actionsFor preserves the canonical display order', () => {
    // mark_sold → archive → republish → soft_delete
    const sample = actionsFor('archived');
    const indices = sample.map(a => ['mark_sold', 'archive', 'republish', 'soft_delete'].indexOf(a));
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });
});
