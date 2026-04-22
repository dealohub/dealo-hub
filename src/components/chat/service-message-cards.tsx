import { useTranslations, useLocale } from 'next-intl';
import {
  ClipboardList,
  DollarSign,
  Calendar,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { ChatMessage } from '@/lib/chat/types';

/**
 * Phase 8a P4 — structured chat cards.
 *
 * Renders the 4 services-vertical message kinds inside the existing
 * /messages/[id] thread UI. Each kind gets its own card: quote_request
 * (buyer's structured need), quote_response (provider's price+slot),
 * booking_proposal (either side — slot to confirm), completion_mark
 * (either side — job done marker).
 *
 * Layout rule: same 78% max-width as MessageBubble so thread rhythm
 * holds. Own messages right-aligned (ltr) / left-aligned (rtl), peer
 * messages opposite — matches MessageBubble pattern.
 */

const TASK_LABELS_AR: Record<string, string> = {
  home_cleaning_one_off: 'تنظيف شامل',
  home_cleaning_recurring: 'تنظيف دوري',
  handyman_ikea_assembly: 'تركيب IKEA',
  handyman_tv_mount: 'تعليق تلفزيون',
  handyman_shelf_hang: 'تعليق رفوف',
  handyman_furniture_move: 'نقل أثاث',
  handyman_basic_painting: 'صباغة',
  handyman_other: 'أعمال أخرى',
};

const TIME_WINDOW_LABELS_AR: Record<string, string> = {
  morning: 'صباحاً',
  afternoon: 'ظهراً',
  evening: 'مساءً',
  flexible: 'مرن',
};

const GOV_LABELS_AR: Record<string, string> = {
  capital: 'العاصمة',
  hawalli: 'حولي',
  farwaniya: 'الفروانية',
  mubarak_al_kabeer: 'مبارك الكبير',
  ahmadi: 'الأحمدي',
  jahra: 'الجهراء',
};

function taskLabel(taskType: string, locale: 'ar' | 'en'): string {
  if (locale === 'ar') return TASK_LABELS_AR[taskType] ?? taskType;
  return taskType.replace(/_/g, ' ');
}

function timeWindowLabel(win: string, locale: 'ar' | 'en'): string {
  if (locale === 'ar') return TIME_WINDOW_LABELS_AR[win] ?? win;
  return win;
}

function govLabel(g: string, locale: 'ar' | 'en'): string {
  if (locale === 'ar') return GOV_LABELS_AR[g] ?? g;
  return g.replace(/_/g, ' ');
}

function formatSlot(iso: string, locale: 'ar' | 'en'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// 1. quote_request card (buyer → provider)
// ---------------------------------------------------------------------------

function QuoteRequestCard({
  payload,
  isOwn,
  locale,
}: {
  payload: Record<string, unknown>;
  isOwn: boolean;
  locale: 'ar' | 'en';
}) {
  const t = useTranslations('servicesChat.quoteRequest');
  const p = payload as {
    sub_cat?: string;
    task_type?: string;
    bedrooms?: number;
    area_m2?: number;
    preferred_date_window?: string;
    preferred_time_window?: string;
    notes?: string;
    job_governorate?: string;
  };

  return (
    <div
      className={
        'w-full max-w-[78%] rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 ' +
        (isOwn ? 'ms-auto' : '')
      }
    >
      <header className="mb-2.5 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400">
          <ClipboardList size={14} />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            {t('title')}
          </div>
          <div className="text-xs font-medium text-foreground">
            {p.task_type ? taskLabel(p.task_type, locale) : '—'}
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        {p.job_governorate && (
          <>
            <dt className="text-foreground/55">{t('governorate')}</dt>
            <dd className="font-medium text-foreground/90">
              {govLabel(p.job_governorate, locale)}
            </dd>
          </>
        )}
        {p.preferred_date_window && (
          <>
            <dt className="text-foreground/55">{t('dateWindow')}</dt>
            <dd className="font-medium text-foreground/90">{p.preferred_date_window}</dd>
          </>
        )}
        {p.preferred_time_window && (
          <>
            <dt className="text-foreground/55">{t('timeWindow')}</dt>
            <dd className="font-medium text-foreground/90">
              {timeWindowLabel(p.preferred_time_window, locale)}
            </dd>
          </>
        )}
        {p.bedrooms != null && (
          <>
            <dt className="text-foreground/55">{t('bedrooms')}</dt>
            <dd className="font-medium text-foreground/90">{p.bedrooms}</dd>
          </>
        )}
        {p.area_m2 != null && (
          <>
            <dt className="text-foreground/55">{t('areaM2')}</dt>
            <dd className="font-medium text-foreground/90">{p.area_m2} م²</dd>
          </>
        )}
      </dl>

      {p.notes && (
        <p className="mt-2.5 whitespace-pre-wrap rounded-lg bg-background/60 p-2.5 text-[12px] italic text-foreground/75">
          "{p.notes}"
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. quote_response card (provider → buyer)
// ---------------------------------------------------------------------------

function QuoteResponseCard({
  payload,
  isOwn,
  locale,
}: {
  payload: Record<string, unknown>;
  isOwn: boolean;
  locale: 'ar' | 'en';
}) {
  const t = useTranslations('servicesChat.quoteResponse');
  const p = payload as {
    price_minor_units?: number;
    price_mode?: 'fixed' | 'hourly_x_hours';
    hours?: number;
    includes?: string[];
    earliest_slot?: string;
    expires_at?: string;
  };

  return (
    <div
      className={
        'w-full max-w-[78%] rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 ' +
        (isOwn ? 'ms-auto' : '')
      }
    >
      <header className="mb-2.5 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <DollarSign size={14} />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          {t('title')}
        </div>
      </header>

      {/* Big price */}
      {p.price_minor_units != null && (
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-foreground">
            {formatPrice(p.price_minor_units, 'KWD', locale)}
          </span>
          <span className="text-[11px] text-foreground/55">
            {p.price_mode === 'hourly_x_hours' && p.hours
              ? `· ${p.hours} ${t('hours')}`
              : `· ${t('fixedPrice')}`}
          </span>
        </div>
      )}

      {/* Slot */}
      {p.earliest_slot && (
        <div className="mb-2 flex items-center gap-1.5 text-[12px] text-foreground/80">
          <Calendar size={12} className="text-foreground/55" />
          <span className="text-foreground/55">{t('earliestSlot')}</span>
          <span className="font-medium">{formatSlot(p.earliest_slot, locale)}</span>
        </div>
      )}

      {/* Expires */}
      {p.expires_at && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-foreground/60">
          <Clock size={11} />
          <span>
            {t('expiresAt')}: {formatSlot(p.expires_at, locale)}
          </span>
        </div>
      )}

      {/* Includes list */}
      {p.includes && p.includes.length > 0 && (
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-foreground/55">
            {t('includes')}
          </div>
          <ul className="space-y-0.5">
            {p.includes.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[12px] text-foreground/80">
                <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. booking_proposal card
// ---------------------------------------------------------------------------

function BookingProposalCard({
  payload,
  isOwn,
  locale,
}: {
  payload: Record<string, unknown>;
  isOwn: boolean;
  locale: 'ar' | 'en';
}) {
  const t = useTranslations('servicesChat.bookingProposal');
  const p = payload as {
    slot_start_at?: string;
    slot_end_at?: string;
    estimated_total_minor_units?: number;
    guarantee_applies?: boolean;
  };

  return (
    <div
      className={
        'w-full max-w-[78%] rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 ' +
        (isOwn ? 'ms-auto' : '')
      }
    >
      <header className="mb-2.5 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
          <Calendar size={14} />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
          {t('title')}
        </div>
      </header>

      {p.slot_start_at && p.slot_end_at && (
        <div className="mb-2 text-[13px] font-semibold text-foreground">
          {formatSlot(p.slot_start_at, locale)} → {formatSlot(p.slot_end_at, locale)}
        </div>
      )}

      {p.estimated_total_minor_units != null && (
        <div className="mb-2 text-[12px]">
          <span className="text-foreground/55">{t('estimate')}: </span>
          <span className="font-semibold text-foreground">
            {formatPrice(p.estimated_total_minor_units, 'KWD', locale)}
          </span>
        </div>
      )}

      {p.guarantee_applies && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-500/10 p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          <ShieldCheck size={12} className="mt-0.5 shrink-0" />
          <span>{t('guarantee')}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. completion_mark card
// ---------------------------------------------------------------------------

function CompletionMarkCard({
  payload,
  isOwn,
  locale,
}: {
  payload: Record<string, unknown>;
  isOwn: boolean;
  locale: 'ar' | 'en';
}) {
  const t = useTranslations('servicesChat.completionMark');
  const p = payload as { booking_id?: number; completed_at?: string };

  return (
    <div
      className={
        'w-fit max-w-[78%] inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/25 ' +
        (isOwn ? 'ms-auto' : '')
      }
    >
      <Check size={12} />
      {t('marked')}
      {p.completed_at && (
        <span className="text-emerald-800/60 dark:text-emerald-300/60">
          · {formatSlot(p.completed_at, locale)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Router — ServiceMessageCard dispatches by kind
// ---------------------------------------------------------------------------

export default function ServiceMessageCard({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const locale = useLocale() as 'ar' | 'en';
  const payload = (message.payload ?? {}) as Record<string, unknown>;

  switch (message.kind) {
    case 'quote_request':
      return <QuoteRequestCard payload={payload} isOwn={isOwn} locale={locale} />;
    case 'quote_response':
      return <QuoteResponseCard payload={payload} isOwn={isOwn} locale={locale} />;
    case 'booking_proposal':
      return <BookingProposalCard payload={payload} isOwn={isOwn} locale={locale} />;
    case 'completion_mark':
      return <CompletionMarkCard payload={payload} isOwn={isOwn} locale={locale} />;
    default:
      return null;
  }
}
