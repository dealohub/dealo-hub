'use client';

import { motion } from 'framer-motion';
import {
  ChevronRight,
  ShieldCheck,
  Shield,
  Flame,
  Star,
  Sparkles,
  Wrench,
  User,
  MapPin,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ServiceDetail } from '@/lib/services/types';

const TASK_COLOR: Record<string, string> = {
  home_cleaning_one_off:   '#0ea5e9',
  home_cleaning_recurring: '#0ea5e9',
  handyman_ikea_assembly:  '#f59e0b',
  handyman_tv_mount:       '#3b82f6',
  handyman_shelf_hang:     '#84cc16',
  handyman_furniture_move: '#f97316',
  handyman_basic_painting: '#ec4899',
  handyman_other:          '#78716c',
};

const TIER_I18N_KEY: Record<string, string> = {
  unverified:        'tierUnverified',
  identity_verified: 'tierIdentityVerified',
  address_verified:  'tierAddressVerified',
  dealo_inspected:   'tierDealoInspected',
};

const TASK_LABELS_EN: Record<string, string> = {
  home_cleaning_one_off:   'One-off cleaning',
  home_cleaning_recurring: 'Regular cleaning',
  handyman_ikea_assembly:  'IKEA assembly',
  handyman_tv_mount:       'TV mounting',
  handyman_shelf_hang:     'Shelf hanging',
  handyman_furniture_move: 'Furniture moving',
  handyman_basic_painting: 'Painting',
  handyman_other:          'Handyman tasks',
};

const TASK_LABELS_AR: Record<string, string> = {
  home_cleaning_one_off:   'تنظيف شامل',
  home_cleaning_recurring: 'تنظيف دوري',
  handyman_ikea_assembly:  'تركيب IKEA',
  handyman_tv_mount:       'تعليق تلفزيون',
  handyman_shelf_hang:     'تعليق رفوف',
  handyman_furniture_move: 'نقل أثاث داخلي',
  handyman_basic_painting: 'صباغة',
  handyman_other:          'أعمال أخرى',
};

interface Props {
  listing: ServiceDetail;
  locale: 'ar' | 'en';
}

export default function ServiceDetailHeader({ listing, locale }: Props) {
  const t = useTranslations('servicesDetail.header');
  const p = listing.provider;
  const taskType = listing.fields.task_type;
  const catColor = TASK_COLOR[taskType] ?? '#64748b';
  const taskLabel =
    locale === 'ar'
      ? (TASK_LABELS_AR[taskType] ?? taskType)
      : (TASK_LABELS_EN[taskType] ?? taskType);
  const tierLabel = t(TIER_I18N_KEY[p.verificationTier] as any ?? 'tierUnverified');
  const isVerified = p.verificationTier !== 'unverified';
  const isInspected = p.verificationTier === 'dealo_inspected';
  const isCleaning = taskType.startsWith('home_cleaning_');
  const TaskIcon = isCleaning ? Sparkles : Wrench;

  const providerInitials = p.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');

  return (
    <section className="relative w-full overflow-hidden border-b border-foreground/10 bg-background">
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(700px 280px at 85% 0%, ${catColor}1a, transparent 55%), radial-gradient(500px 220px at 10% 100%, ${catColor}12, transparent 60%)`,
        }}
      />
      {/* Shimmer scan line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-full"
        style={{
          background:
            'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-6 pt-5 md:pb-8 md:pt-6">
        {/* Breadcrumb — centered */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-[11.5px] text-foreground/55"
        >
          <Link href={`/${locale}`} className="transition hover:text-foreground">
            {t('home')}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <Link href={`/${locale}/services`} className="transition hover:text-foreground">
            {t('services')}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <span
            className="inline-flex items-center gap-1.5 font-medium"
            style={{ color: catColor }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: catColor }}
            />
            {taskLabel}
          </span>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <span className="truncate font-medium text-foreground/80">{listing.title}</span>
        </nav>

        {/* Title block — centered hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          {/* Badges row */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
            {/* Task chip */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{
                background: `${catColor}1a`,
                color: catColor,
                border: `1px solid ${catColor}44`,
              }}
            >
              <TaskIcon size={9} strokeWidth={2.6} />
              {taskLabel}
            </span>

            {/* Verification tier */}
            {isVerified ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isInspected
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-blue-400/30 bg-blue-400/10 text-blue-400'
                }`}
              >
                {isInspected ? (
                  <Shield size={10} strokeWidth={2.4} />
                ) : (
                  <ShieldCheck size={10} strokeWidth={2.4} />
                )}
                {tierLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                <User size={9} strokeWidth={2.4} />
                New
              </span>
            )}

            {listing.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C9A86A]">
                ◆ {t('featured')}
              </span>
            )}

            {listing.isHot && (
              <motion.span
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame size={10} strokeWidth={2.4} />
                {t('hot')}
              </motion.span>
            )}
          </div>

          {/* H1 */}
          <h1 className="font-calSans text-[28px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-[36px] lg:text-[44px]">
            {listing.title}
          </h1>

          {/* Spec line — provider + rating + jobs */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-foreground/65 md:text-[14px]">
            <span className="font-semibold text-foreground/85">{p.displayName}</span>

            {p.ratingAvg != null && p.ratingCount > 0 && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1.5">
                  <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                  <strong className="font-semibold text-foreground/85">
                    {p.ratingAvg.toFixed(1)}
                  </strong>
                  <span>({p.ratingCount} {t('reviews')})</span>
                </span>
              </>
            )}

            {p.completedBookings > 0 && (
              <>
                <Dot />
                <span>
                  ✓{' '}
                  <strong className="font-semibold text-foreground/85">
                    {p.completedBookings}
                  </strong>{' '}
                  {t('jobsDone')}
                </span>
              </>
            )}

            {listing.servedGovernorates.length > 0 && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={12} strokeWidth={2.2} className="text-foreground/40" />
                  Kuwait
                </span>
              </>
            )}
          </p>
        </motion.div>

        {/* Provider strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-foreground/10 pt-4"
        >
          {/* Provider avatar + name */}
          <div className="flex items-center gap-3">
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={p.displayName}
                className="size-10 rounded-xl object-cover ring-1 ring-foreground/10"
              />
            ) : (
              <div
                className="grid size-10 place-items-center rounded-xl text-[11px] font-extrabold tracking-tight"
                style={{ background: `${catColor}18`, color: catColor }}
              >
                {providerInitials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold text-foreground">
                  {p.displayName}
                </span>
                {isInspected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
                    <path
                      d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z"
                      fill="#F59E0B"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-foreground/45">
                {tierLabel}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px]">
            {p.ratingAvg != null && (
              <StatChip
                icon={<Star size={12} fill="#F59E0B" stroke="#F59E0B" />}
                value={p.ratingAvg.toFixed(1)}
                label={`(${p.ratingCount})`}
              />
            )}
            {p.completedBookings > 0 && (
              <StatChip value={p.completedBookings} label={t('jobsDone')} />
            )}
            {p.yearsExperience != null && (
              <StatChip value={`${p.yearsExperience}+`} label={t('yearsExperience')} />
            )}
            <StatChip value={`#${listing.id}`} label={t('statListingId')} mono />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const Dot = () => <span className="text-foreground/20">·</span>;

const StatChip = ({
  icon,
  value,
  label,
  mono,
}: {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  mono?: boolean;
}) => (
  <span className="inline-flex items-center gap-1.5 text-foreground/55">
    {icon && <span className="text-foreground/40">{icon}</span>}
    <span
      className={
        'font-semibold text-foreground/85 ' +
        (mono ? 'font-mono text-[11px]' : 'tabular-nums')
      }
    >
      {value}
    </span>
    <span className="text-foreground/45">{label}</span>
  </span>
);
