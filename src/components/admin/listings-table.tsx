'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  MoreHorizontal,
  PauseCircle,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  approveListing,
  bulkApproveListings,
  bulkHoldListings,
  bulkRejectListings,
  holdListing,
  rejectListing,
  type AdminActionResult,
  type BulkResult,
} from '@/lib/admin/actions';
import {
  LISTING_STATUS_TABS,
  type AdminListingRow,
  type GetListingsPageResult,
  type ListingStatusTab,
  type StatusCounts,
} from '@/lib/admin/types';

interface ListingsTableProps {
  locale: 'ar' | 'en';
  initialTab: ListingStatusTab;
  initialQuery: string;
  initialPage: number;
  pageResult: GetListingsPageResult;
  counts: StatusCounts;
}

/**
 * Moderation table. URL-driven (tab/q/page live in search params) so
 * deep-links + refreshes both restore state. The table itself is
 * optimistic-free: every action submits to a server action, then we rely
 * on `revalidatePath` to refetch and re-render with the new row state.
 *
 * Selection lives in local state only — it resets on navigation (by
 * design; you don't want to accidentally approve a stale selection from
 * a different filter).
 *
 * Single vs bulk flow:
 *   - Single approve/hold → instant (server action via useTransition)
 *   - Single reject       → reason dialog → server action
 *   - Bulk any            → optional confirm → server action, returns
 *                           `BulkResult` with per-id success/failure.
 */
export function ListingsTable({
  locale,
  initialTab,
  initialQuery,
  pageResult,
  counts,
}: ListingsTableProps) {
  const t = useTranslations('admin.listings');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();

  // Local search input state mirrors URL but debounces pushes so each
  // keystroke doesn't trigger a full server round-trip.
  const [query, setQuery] = React.useState(initialQuery);

  React.useEffect(() => {
    if (query === initialQuery) return;
    const handle = window.setTimeout(() => {
      setParam({ q: query || null, page: null });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Selection — stored as a Set of row IDs. Cleared whenever the page's
  // row set changes (i.e. tab / search / page change).
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const rowIds = React.useMemo(
    () => pageResult.rows.map((r) => r.id),
    [pageResult.rows]
  );
  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set<number>();
      for (const id of prev) if (rowIds.includes(id)) next.add(id);
      return next;
    });
  }, [rowIds]);

  // Reject dialog state — single or bulk.
  const [rejectTarget, setRejectTarget] = React.useState<
    { mode: 'single'; id: number; title: string } | { mode: 'bulk'; ids: number[] } | null
  >(null);
  const [rejectReason, setRejectReason] = React.useState('');

  // Last error — shown inline above the table. Auto-cleared on next
  // action so the banner doesn't stick around.
  const [error, setError] = React.useState<string | null>(null);

  const pushParam = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, pathname, router]
  );

  function setParam(patch: Record<string, string | null>) {
    pushParam(patch);
  }

  function handleTabChange(value: string) {
    setSelected(new Set());
    pushParam({ tab: value === 'held' ? null : value, page: null });
  }

  function handlePrevPage() {
    if (pageResult.page <= 1) return;
    pushParam({ page: String(pageResult.page - 1) });
  }
  function handleNextPage() {
    if (pageResult.page >= pageResult.totalPages) return;
    pushParam({ page: String(pageResult.page + 1) });
  }

  function toggleRow(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rowIds) : new Set());
  }

  function runResult(result: AdminActionResult) {
    if (!result.ok) {
      setError(mapErrorCode(t, result.error));
    } else {
      setError(null);
    }
  }

  function runBulkResult(result: BulkResult) {
    if (result.failures.length > 0) {
      setError(
        t('errors.bulkPartial', {
          ok: result.successes,
          fail: result.failures.length,
        })
      );
    } else {
      setError(null);
    }
    setSelected(new Set());
  }

  function approveOne(id: number) {
    setError(null);
    startTransition(async () => runResult(await approveListing(id)));
  }
  function holdOne(id: number) {
    setError(null);
    startTransition(async () => runResult(await holdListing(id)));
  }
  function openRejectSingle(row: AdminListingRow) {
    setRejectReason('');
    setRejectTarget({ mode: 'single', id: row.id, title: row.title });
  }
  function openRejectBulk() {
    if (selected.size === 0) return;
    setRejectReason('');
    setRejectTarget({ mode: 'bulk', ids: Array.from(selected) });
  }
  function submitReject() {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setError(t('errors.reasonTooShort'));
      return;
    }
    setError(null);
    if (rejectTarget.mode === 'single') {
      const id = rejectTarget.id;
      startTransition(async () => {
        const r = await rejectListing(id, reason);
        runResult(r);
        setRejectTarget(null);
      });
    } else {
      const ids = rejectTarget.ids;
      startTransition(async () => {
        const r = await bulkRejectListings(ids, reason);
        runBulkResult(r);
        setRejectTarget(null);
      });
    }
  }

  function approveBulk() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setError(null);
    startTransition(async () => runBulkResult(await bulkApproveListings(ids)));
  }
  function holdBulk() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setError(null);
    startTransition(async () => runBulkResult(await bulkHoldListings(ids)));
  }

  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      {/* Filter bar: tabs + search. Stacks on mobile, inline on desktop. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={initialTab} onValueChange={handleTabChange}>
          <TabsList className="flex h-auto flex-wrap gap-1 bg-transparent p-0">
            {LISTING_STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-muted data-[state=active]:text-foreground h-8 gap-1.5 rounded-full border border-transparent px-3 text-xs font-medium data-[state=active]:border-border"
              >
                <span>{t(`tabs.${tab}`)}</span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {counts[tab] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-9 ps-9"
            aria-label={t('searchAriaLabel')}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs"
        >
          {error}
        </div>
      )}

      {selected.size > 0 && (
        <BulkActionBar
          t={t}
          count={selected.size}
          disabled={isPending}
          onApprove={approveBulk}
          onHold={holdBulk}
          onReject={openRejectBulk}
          onClear={() => setSelected(new Set())}
        />
      )}

      <div className="border-border/60 overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-10 ps-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label={t('a11y.selectAll')}
                />
              </TableHead>
              <TableHead className="w-14">{t('cols.image')}</TableHead>
              <TableHead>{t('cols.title')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('cols.seller')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('cols.category')}
              </TableHead>
              <TableHead>{t('cols.status')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('cols.price')}
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                {t('cols.created')}
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageResult.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center">
                  <EmptyState
                    title={t('empty.title')}
                    body={t('empty.body')}
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageResult.rows.map((row) => (
                <ListingRow
                  key={row.id}
                  locale={locale}
                  row={row}
                  selected={selected.has(row.id)}
                  disabled={isPending}
                  onToggle={(v) => toggleRow(row.id, v)}
                  onApprove={() => approveOne(row.id)}
                  onHold={() => holdOne(row.id)}
                  onReject={() => openRejectSingle(row)}
                  t={t}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col-reverse items-start gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {t('pagination.summary', {
            from: pageResult.total === 0 ? 0 : (pageResult.page - 1) * pageResult.pageSize + 1,
            to: Math.min(pageResult.page * pageResult.pageSize, pageResult.total),
            total: pageResult.total,
          })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={pageResult.page <= 1 || isPending}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            <span>{t('pagination.prev')}</span>
          </Button>
          <span className="text-muted-foreground tabular-nums">
            {t('pagination.pageOf', {
              page: pageResult.page,
              total: pageResult.totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pageResult.page >= pageResult.totalPages || isPending}
          >
            <span>{t('pagination.next')}</span>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <RejectDialog
        target={rejectTarget}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => setRejectTarget(null)}
        onSubmit={submitReject}
        disabled={isPending}
        t={t}
      />
    </div>
  );
}

// ===========================================================================
// Row
// ===========================================================================

type ListingsT = ReturnType<typeof useTranslations>;

interface ListingRowProps {
  locale: 'ar' | 'en';
  row: AdminListingRow;
  selected: boolean;
  disabled: boolean;
  onToggle: (v: boolean) => void;
  onApprove: () => void;
  onHold: () => void;
  onReject: () => void;
  t: ListingsT;
}

function ListingRow({
  locale,
  row,
  selected,
  disabled,
  onToggle,
  onApprove,
  onHold,
  onReject,
  t,
}: ListingRowProps) {
  const publicHref = `/${locale}/listings/${row.id}`;
  const categoryLabel =
    locale === 'ar'
      ? row.category_name_ar ?? row.category_name_en ?? '—'
      : row.category_name_en ?? row.category_name_ar ?? '—';
  const sellerLabel = row.seller_name ?? row.seller_handle ?? '—';
  const price = formatPrice(row.price_minor_units, row.currency_code, locale);
  const created = formatDate(row.created_at, locale);

  return (
    <TableRow data-state={selected ? 'selected' : undefined}>
      <TableCell className="ps-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onToggle(v === true)}
          aria-label={t('a11y.selectRow', { title: row.title })}
        />
      </TableCell>
      <TableCell>
        <Thumb url={row.thumbnail_url} alt={row.title} />
      </TableCell>
      <TableCell>
        {/* Fixed-width block so `truncate` actually clips; table-cell
            `max-width` alone is ignored by HTML table auto layout. */}
        <div className="w-[14rem] md:w-[16rem] xl:w-[20rem]">
          <Link
            href={publicHref}
            className="group/title flex min-w-0 items-center gap-1.5 font-medium hover:underline"
            target="_blank"
          >
            <span className="truncate">{row.title}</span>
            <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-60" />
          </Link>
          <p className="text-muted-foreground text-[11px] tabular-nums">#{row.id}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="truncate text-sm">{sellerLabel}</p>
        {row.seller_handle && (
          <p className="text-muted-foreground truncate text-[11px]">
            @{row.seller_handle}
          </p>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="text-muted-foreground text-xs">{categoryLabel}</span>
      </TableCell>
      <TableCell>
        <StatusBadges status={row.status} fraudStatus={row.fraud_status} t={t} />
      </TableCell>
      <TableCell className="hidden md:table-cell tabular-nums">{price}</TableCell>
      <TableCell className="hidden xl:table-cell text-muted-foreground text-xs">
        {created}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t('a11y.rowActions', { title: row.title })}
              disabled={disabled}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={onApprove}>
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
              {t('actions.approve')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onHold}>
              <PauseCircle className="text-amber-600 dark:text-amber-400" />
              {t('actions.hold')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onReject} className="text-destructive focus:text-destructive">
              <XCircle />
              {t('actions.reject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div
        aria-hidden
        className="bg-muted flex size-10 items-center justify-center rounded-md"
      >
        <ImageOff className="text-muted-foreground size-4" />
      </div>
    );
  }
  return (
    <div className="bg-muted relative size-10 overflow-hidden rounded-md">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

function StatusBadges({
  status,
  fraudStatus,
  t,
}: {
  status: string;
  fraudStatus: string;
  t: ListingsT;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="secondary" className={`${statusTint(status)} border-0 text-[10px]`}>
        {t(`statuses.${status}`)}
      </Badge>
      {shouldShowFraud(fraudStatus) && (
        <Badge variant="outline" className="text-muted-foreground gap-1 border-dashed text-[10px]">
          <ShieldAlert className="size-3" />
          {t(`fraud.${fraudStatus}`)}
        </Badge>
      )}
    </div>
  );
}

function shouldShowFraud(s: string) {
  return s === 'flagged' || s === 'held' || s === 'rejected';
}

function statusTint(status: string) {
  switch (status) {
    case 'live':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'held':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
    case 'rejected':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-400';
    case 'sold':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-400';
    case 'draft':
    case 'archived':
    case 'deleted':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatPrice(minor: number, currency: string, locale: 'ar' | 'en') {
  // Dealo stores minor units (fils for KWD, etc). KWD uses 3 decimals, most
  // other Gulf currencies use 2. Intl.NumberFormat handles this correctly
  // when we pass a currency code.
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
      style: 'currency',
      currency: currency || 'KWD',
      maximumFractionDigits: currency === 'KWD' ? 3 : 2,
    }).format(minor / (currency === 'KWD' ? 1000 : 100));
  } catch {
    return `${minor} ${currency}`;
  }
}

function formatDate(iso: string, locale: 'ar' | 'en') {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ===========================================================================
// Bulk action bar
// ===========================================================================

interface BulkActionBarProps {
  count: number;
  disabled: boolean;
  onApprove: () => void;
  onHold: () => void;
  onReject: () => void;
  onClear: () => void;
  t: ListingsT;
}

function BulkActionBar({
  count,
  disabled,
  onApprove,
  onHold,
  onReject,
  onClear,
  t,
}: BulkActionBarProps) {
  return (
    <div className="bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
      <span className="text-sm font-medium">
        {t('bulk.selected', { count })}
      </span>
      <span className="text-muted-foreground me-auto text-xs">
        {t('bulk.pickAction')}
      </span>
      <Button size="sm" variant="outline" onClick={onApprove} disabled={disabled}>
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        {t('actions.approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={onHold} disabled={disabled}>
        <PauseCircle className="size-4 text-amber-600 dark:text-amber-400" />
        {t('actions.hold')}
      </Button>
      <Button size="sm" variant="destructive" onClick={onReject} disabled={disabled}>
        <XCircle className="size-4" />
        {t('actions.reject')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={disabled}>
        {t('bulk.clear')}
      </Button>
    </div>
  );
}

// ===========================================================================
// Reject dialog
// ===========================================================================

interface RejectDialogProps {
  target:
    | { mode: 'single'; id: number; title: string }
    | { mode: 'bulk'; ids: number[] }
    | null;
  reason: string;
  onReasonChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  disabled: boolean;
  t: ListingsT;
}

function RejectDialog({
  target,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  disabled,
  t,
}: RejectDialogProps) {
  const open = target !== null;
  const title =
    target?.mode === 'bulk'
      ? t('reject.titleBulk', { count: target.ids.length })
      : t('reject.titleSingle');
  const description =
    target?.mode === 'bulk'
      ? t('reject.bodyBulk')
      : t('reject.bodySingle', { title: target?.mode === 'single' ? target.title : '' });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onCancel() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">{t('reject.reasonLabel')}</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={t('reject.reasonPlaceholder')}
            rows={4}
            maxLength={500}
            required
          />
          <p className="text-muted-foreground text-xs">
            {t('reject.reasonHint', { max: 500 })}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={disabled}>
              {t('reject.cancel')}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={onSubmit}
            disabled={disabled || reason.trim().length < 3}
          >
            {t('reject.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================================================
// Empty state
// ===========================================================================

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <CheckCircle2 className="text-muted-foreground size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{body}</p>
    </div>
  );
}

// ===========================================================================
// Error mapping
// ===========================================================================

function mapErrorCode(
  t: ListingsT,
  code: 'not_authenticated' | 'unauthorized' | 'invalid_input' | 'rpc_failed'
): string {
  switch (code) {
    case 'not_authenticated':
      return t('errors.notAuthenticated');
    case 'unauthorized':
      return t('errors.unauthorized');
    case 'invalid_input':
      return t('errors.invalidInput');
    case 'rpc_failed':
    default:
      return t('errors.rpcFailed');
  }
}
