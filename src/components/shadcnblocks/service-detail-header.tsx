import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BadgeCheck, Shield, Star, ChevronLeft, User, Wrench, Sparkles } from 'lucide-react';
import type { ServiceDetail } from '@/lib/services/types';

/**
 * Phase 8a — service detail header.
 *
 * Breadcrumb + title + provider mini-strip at the top of the detail
 * page. Mirrors the pattern from electronics-detail-header.tsx +
 * property-detail-header.tsx but adapted for services' profile-first
 * atomic unit (P1).
 */

const TIER_LABELS_AR: Record<ServiceDetail['provider']['verificationTier'], { label: string; Icon: typeof BadgeCheck; cls: string }> = {
  unverified:        { label: 'جديد',         Icon: User,       cls: 'bg-foreground/5 text-foreground/60 ring-border/40' },
  identity_verified: { label: 'هوية موثقة',   Icon: BadgeCheck, cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-500/30' },
  address_verified:  { label: 'عنوان موثق',   Icon: BadgeCheck, cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30' },
  dealo_inspected:   { label: 'محقق من Dealo', Icon: Shield,     cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/30' },
};

const TASK_LABELS_AR: Record<string, string> = {
  home_cleaning_one_off: 'تنظيف شامل',
  home_cleaning_recurring: 'تنظيف دوري',
  handyman_ikea_assembly: 'تركيب IKEA',
  handyman_tv_mount: 'تعليق تلفزيون',
  handyman_shelf_hang: 'تعليق رفوف',
  handyman_furniture_move: 'نقل أثاث داخلي',
  handyman_basic_painting: 'صباغة',
  handyman_other: 'أعمال أخرى',
};

interface Props {
  listing: ServiceDetail;
  locale: 'ar' | 'en';
}

export default async function ServiceDetailHeader({ listing, locale }: Props) {
  const t = await getTranslations('servicesDetail.header');
  const p = listing.provider;
  const tier = TIER_LABELS_AR[p.verificationTier];
  const TierIcon = tier.Icon;
  const taskLabel =
    locale === 'ar'
      ? TASK_LABELS_AR[listing.fields.task_type] ?? listing.fields.task_type
      : listing.fields.task_type.replace(/_/g, ' ');
  const TaskIcon = listing.fields.task_type.startsWith('home_cleaning_') ? Sparkles : Wrench;

  return (
    <section className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[11px] text-foreground/55">
          <Link href={`/${locale}/`} className="hover:text-foreground">
            {t('home')}
          </Link>
          <ChevronLeft size={12} className="rtl:rotate-180" />
          <Link href={`/${locale}/services`} className="hover:text-foreground">
            {t('services')}
          </Link>
          <ChevronLeft size={12} className="rtl:rotate-180" />
          <span className="truncate text-foreground/70">{taskLabel}</span>
        </nav>

        {/* Task chip + tier chip + featured badge */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/30">
            <TaskIcon size={12} />
            {taskLabel}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tier.cls}`}>
            <TierIcon size={12} />
            {tier.label}
          </span>
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/30">
              ⭐ {t('featured')}
            </span>
          )}
          {listing.isHot && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 ring-1 ring-inset ring-rose-500/30">
              🔥 {t('hot')}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
          {listing.title}
        </h1>

        {/* Meta row — provider + rating + completed */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={p.displayName}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-border/60"
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground/10 text-xs font-semibold text-foreground/70 ring-1 ring-border/60">
                {p.displayName[0] ?? '?'}
              </div>
            )}
            <span className="font-semibold text-foreground">{p.displayName}</span>
          </div>
          {p.ratingAvg != null && p.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{p.ratingAvg.toFixed(1)}</span>
              <span className="text-foreground/55">
                · {p.ratingCount} {t('reviews')}
              </span>
            </div>
          )}
          {p.completedBookings > 0 && (
            <span className="text-emerald-700 dark:text-emerald-400">
              ✓ {p.completedBookings} {t('jobsDone')}
            </span>
          )}
          {p.yearsExperience != null && (
            <span className="text-foreground/55">
              {p.yearsExperience}+ {t('yearsExperience')}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
