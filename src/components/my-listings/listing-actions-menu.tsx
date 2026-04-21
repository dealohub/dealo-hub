'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MoreVertical,
  CheckCircle2,
  Archive,
  Undo2,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  markListingSold,
  archiveListing,
  republishListing,
  softDeleteListing,
  type ManageActionResult,
} from '@/lib/listings/manage-actions';
import {
  actionsFor,
  type ListingStatus,
  type ManageAction,
} from '@/lib/listings/manage-transitions';

/**
 * Per-listing kebab menu shown on /my-listings cards.
 *
 * Renders only the actions legal for the current status (consults
 * `actionsFor()` from the pure transition policy). Soft-delete is
 * gated by an inline "are you sure?" confirmation step in the same
 * popover — no second-page bounce — because clicks on a phone are
 * easy to misfire and a deleted listing isn't user-recoverable.
 *
 * UX notes:
 *   • Outside-click closes the menu (mousedown — but see chat-dropdown
 *     fix in Phase 5f for why we use 'click' there; for a non-Link
 *     menu mousedown is fine).
 *   • Esc key closes too.
 *   • Errors are inline + transient, not toast — keeps the action
 *     attached to the listing it failed on.
 */

interface Props {
  listingId: number;
  status: ListingStatus;
}

const ICON_BY_ACTION: Record<ManageAction, typeof CheckCircle2> = {
  mark_sold: CheckCircle2,
  archive: Archive,
  republish: Undo2,
  soft_delete: Trash2,
};

const ACTION_TONE: Record<ManageAction, 'default' | 'danger'> = {
  mark_sold: 'default',
  archive: 'default',
  republish: 'default',
  soft_delete: 'danger',
};

export default function ListingActionsMenu({ listingId, status }: Props) {
  const router = useRouter();
  const t = useTranslations('auth.myListings.manage');
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Outside-click + Esc dismissal
  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const allowedActions = actionsFor(status);
  if (allowedActions.length === 0) return null;

  function runAction(action: ManageAction) {
    setError(null);
    startTransition(async () => {
      let result: ManageActionResult;
      switch (action) {
        case 'mark_sold':
          result = await markListingSold(listingId);
          break;
        case 'archive':
          result = await archiveListing(listingId);
          break;
        case 'republish':
          result = await republishListing(listingId);
          break;
        case 'soft_delete':
          result = await softDeleteListing(listingId);
          break;
      }
      if (!result.ok) {
        setError(t(`error.${result.error}` as any));
        return;
      }
      setOpen(false);
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="absolute end-3 top-3 z-20">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={t('menuLabel')}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground/70 shadow-sm ring-1 ring-border/60 backdrop-blur transition hover:bg-background hover:text-foreground"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-1 w-52 overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg"
        >
          {allowedActions.map(action => {
            const Icon = ICON_BY_ACTION[action];
            const tone = ACTION_TONE[action];
            const isDestructiveStep =
              action === 'soft_delete' && confirmDelete;

            // First-click on delete just toggles the confirm step.
            const onClick = () => {
              if (action === 'soft_delete' && !confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              runAction(action);
            };

            return (
              <button
                key={action}
                type="button"
                role="menuitem"
                onClick={onClick}
                disabled={isPending}
                className={
                  'flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ' +
                  (tone === 'danger'
                    ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400'
                    : 'text-foreground/85 hover:bg-foreground/5')
                }
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {!isPending && <Icon size={14} />}
                <span className="flex-1">
                  {isDestructiveStep
                    ? t('confirmDelete')
                    : t(`action.${action}` as any)}
                </span>
              </button>
            );
          })}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-1.5 border-t border-border/40 bg-rose-500/5 px-3 py-2 text-[11px] text-rose-600 dark:text-rose-400"
            >
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
