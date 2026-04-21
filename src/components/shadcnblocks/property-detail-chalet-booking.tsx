import { useTranslations } from 'next-intl';
import { CalendarCheck2, Sunset, Sunrise, Sparkles, Moon } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';

/**
 * Property detail — chalet availability (Doctrine P4).
 *
 * Shown only when property_type='chalet' AND rent sub-cat AND the
 * listing carries an `availability` sub-object (required by Zod).
 *
 * This is the Dealo differentiator — Dubizzle KW has 9 chalet rentals
 * total (2026-04-21 DOM probe) with no booking primitives. Ours
 * surfaces min/max stay, check-in/out times, cleaning fee, weekend
 * premium, and 4 seasonal multipliers (summer / winter / Ramadan /
 * Eid) — the data actually needed to price a weekend getaway.
 *
 * Phase 4e will wire actual date-picker + availability calendar on
 * top of this schema. Phase 4b ships the *display*.
 */

interface Props {
  listing: PropertyDetail;
}

export default function PropertyDetailChaletBooking({ listing }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;
  const a = f.availability;

  // Only render for chalet rent listings with an availability object
  if (!a || f.propertyType !== 'chalet') return null;
  if (
    listing.subCat !== 'property-for-rent' &&
    listing.subCat !== 'rooms-for-rent'
  )
    return null;

  const sm = a.seasonalMultipliers;
  const hasSeasonal =
    !!sm && (sm.summer != null || sm.winter != null || sm.ramadan != null || sm.eid != null);

  return (
    <section className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-sky-500/10 p-5 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <CalendarCheck2 size={18} className="text-sky-500" strokeWidth={2.25} />
        <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
          {t('bookingTitle')}
        </h2>
      </div>

      {/* Primary stay facts */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          icon={<Moon size={14} />}
          label={t('bookingMinStay', { n: a.minStayNights })}
        />
        {a.maxStayNights != null && (
          <Fact
            icon={<Moon size={14} />}
            label={t('bookingMaxStay', { n: a.maxStayNights })}
          />
        )}
        {a.checkInTime && (
          <Fact
            icon={<Sunset size={14} />}
            label={t('bookingCheckIn', { time: a.checkInTime })}
          />
        )}
        {a.checkOutTime && (
          <Fact
            icon={<Sunrise size={14} />}
            label={t('bookingCheckOut', { time: a.checkOutTime })}
          />
        )}
      </div>

      {/* Fees row */}
      {(a.cleaningFeeKwd != null || a.weekendPremiumPct != null) && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-foreground/80">
          {a.cleaningFeeKwd != null && (
            <span className="rounded-full bg-foreground/5 px-3 py-1">
              {t('bookingCleaningFee', { amount: a.cleaningFeeKwd })}
            </span>
          )}
          {a.weekendPremiumPct != null && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-700 dark:text-amber-400">
              {t('bookingWeekendPremium', { pct: a.weekendPremiumPct })}
            </span>
          )}
        </div>
      )}

      {/* Seasonal multipliers */}
      {hasSeasonal && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">
            <Sparkles size={12} /> {t('bookingSeasonalTitle')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {sm?.summer != null && (
              <SeasonChip label={t('bookingSeasonSummer', { mult: sm.summer })} />
            )}
            {sm?.winter != null && (
              <SeasonChip label={t('bookingSeasonWinter', { mult: sm.winter })} />
            )}
            {sm?.ramadan != null && (
              <SeasonChip label={t('bookingSeasonRamadan', { mult: sm.ramadan })} />
            )}
            {sm?.eid != null && (
              <SeasonChip label={t('bookingSeasonEid', { mult: sm.eid })} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 text-sm">
      <span className="text-sky-500">{icon}</span>
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}

function SeasonChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-400">
      {label}
    </span>
  );
}
