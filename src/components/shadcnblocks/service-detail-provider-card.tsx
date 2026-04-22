import { getTranslations } from 'next-intl/server';
import { BadgeCheck, Shield, Globe, MapPin, Calendar, Users, Sparkles, ClipboardCheck } from 'lucide-react';
import type { ServiceDetail } from '@/lib/services/types';

/**
 * Phase 8a — provider card (expanded, on detail page left column).
 *
 * Surfaces all P2 + P9 signals + the static provider facts:
 *   - verification tier (with icon + color)
 *   - attestation status (both P9 timestamps shown as compact "verified"
 *     marks — actual timestamps are for internal audit, not public)
 *   - completed bookings + rating
 *   - languages spoken
 *   - governorates + areas served
 *   - team size + experience + supplies_included
 */

const TIER_LABELS_AR: Record<ServiceDetail['provider']['verificationTier'], { label: string; Icon: typeof BadgeCheck; cls: string; desc: string }> = {
  unverified:        { label: 'جديد',         Icon: BadgeCheck, cls: 'bg-foreground/5 text-foreground/60',
    desc: 'لم يكمل التحقق بعد. تواصل بحذر.' },
  identity_verified: { label: 'هوية موثقة',   Icon: BadgeCheck, cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    desc: 'تم التحقق من الهوية المدنية ورقم الهاتف.' },
  address_verified:  { label: 'عنوان موثق',   Icon: BadgeCheck, cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    desc: 'هوية + عنوان PACI مؤكّد.' },
  dealo_inspected:   { label: 'محقق من Dealo', Icon: Shield,     cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    desc: 'مزوّد مرخّص تجارياً، تمّت زيارة مكتبه أو الاطلاع على ترخيصه.' },
};

const LANGUAGE_LABELS_AR: Record<string, string> = {
  ar: 'العربية', en: 'English', hi: 'हिन्दी', ur: 'اردو', tl: 'Tagalog', ml: 'മലയാളം',
};

const GOV_LABELS_AR: Record<string, string> = {
  capital: 'العاصمة', hawalli: 'حولي', farwaniya: 'الفروانية',
  mubarak_al_kabeer: 'مبارك الكبير', ahmadi: 'الأحمدي', jahra: 'الجهراء',
};

const AVAILABILITY_LABELS_AR: Record<string, string> = {
  daytime_weekdays: 'نهار أيام العمل',
  daytime_weekends: 'نهار نهاية الأسبوع',
  evenings: 'مساءً',
  flexible: 'مرن — معظم الأوقات',
};

interface Props {
  listing: ServiceDetail;
  /** Reserved for future locale-aware rendering; kept on the prop so
   *  the page composition can pass it without TS errors when we wire
   *  per-locale formatting in a later chunk. */
  locale: 'ar' | 'en';
}

export default async function ServiceDetailProviderCard({ listing }: Props) {
  const t = await getTranslations('servicesDetail.provider');
  const p = listing.provider;
  const f = listing.fields;
  const tier = TIER_LABELS_AR[p.verificationTier];
  const TierIcon = tier.Icon;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <BadgeCheck size={16} className="text-primary" />
        {t('title')}
      </h2>

      {/* Tier strip with description */}
      <div className={`rounded-xl ${tier.cls} ring-1 ring-inset ring-current/20 p-3`}>
        <div className="flex items-start gap-2">
          <TierIcon size={16} className="mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold">{tier.label}</div>
            <p className="mt-1 text-[11px] leading-relaxed opacity-80">{tier.desc}</p>
          </div>
        </div>
      </div>

      {/* Quick facts grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Fact Icon={Users} label={t('teamSize')} value={`${f.team_size}`} />
        {f.years_experience != null && (
          <Fact Icon={Calendar} label={t('experience')} value={`${f.years_experience}+ ${t('years')}`} />
        )}
        <Fact Icon={Sparkles} label={t('availability')} value={AVAILABILITY_LABELS_AR[f.availability_summary] ?? f.availability_summary} />
        <Fact Icon={ClipboardCheck} label={t('supplies')}
          value={f.supplies_included ? t('suppliesIncluded') : t('suppliesExtra')} />
      </div>

      {/* Languages */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
          <Globe size={11} /> {t('languages')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.spokenLanguages.map((l) => (
            <span key={l} className="rounded-md bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
              {LANGUAGE_LABELS_AR[l] ?? l}
            </span>
          ))}
        </div>
      </div>

      {/* Governorates */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
          <MapPin size={11} /> {t('serviceAreas')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listing.servedGovernorates.map((g) => (
            <span key={g} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              {GOV_LABELS_AR[g] ?? g}
            </span>
          ))}
        </div>
      </div>

      {/* P9 attestations — compact "both on file" check */}
      <div className="mt-4 rounded-xl border border-dashed border-border/50 bg-foreground/[0.02] p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground/70">
          <BadgeCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
          {t('attestationsTitle')}
        </div>
        <p className="text-[11px] leading-relaxed text-foreground/60">
          {t('attestationsBody')}
        </p>
      </div>
    </div>
  );
}

function Fact({
  Icon, label, value,
}: {
  Icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon size={12} className="mt-0.5 shrink-0 text-foreground/50" />
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">
          {label}
        </div>
        <div className="font-semibold text-foreground/90">{value}</div>
      </div>
    </div>
  );
}
