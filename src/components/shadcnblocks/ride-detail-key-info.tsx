'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildRideSpecs } from './build-ride-specs';
import { VEHICLE_COLORS, type RideListing } from './rides-data';

/**
 * RideDetailKeyInfo — the "نظرة عامة" spec overview.
 *
 * Design:
 *   • Hero strip of 4 marquee stats (year · mileage · engine · fuel)
 *     with animated progress rings + contextual chips
 *   • Grouped sections (Identity / Mechanical / Documents) with
 *     stagger-on-scroll entry animation
 *   • Color swatches for exterior + interior
 *   • VIN field with masked toggle + copy-to-clipboard
 *   • Market-comparison chip for mileage (above / below / on avg)
 *   • Warranty-status badge with time-remaining bar
 */

interface Props {
  listing: RideListing;
}

export const RideDetailKeyInfo = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.keyInfo');
  const catColor = VEHICLE_COLORS[listing.type];
  const specs = useMemo(() => buildRideSpecs(listing), [listing]);

  const [vinRevealed, setVinRevealed] = useState(false);
  const [vinCopied, setVinCopied] = useState(false);
  const copyVin = async () => {
    try {
      await navigator.clipboard.writeText(specs.vin);
      setVinCopied(true);
      setTimeout(() => setVinCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  // Market verdict on mileage
  const mileageDelta = specs.mileageVsMarketPct;
  const mileageTrend: 'below' | 'above' | 'onAvg' =
    mileageDelta < -10 ? 'below' : mileageDelta > 10 ? 'above' : 'onAvg';
  const mileageTone =
    mileageTrend === 'below'
      ? '#16a34a'
      : mileageTrend === 'above'
      ? '#ea580c'
      : '#64748b';

  // For the mileage progress bar — cap the scale at 2× avg
  const mileageBarPct = Math.min(
    100,
    specs.marketAvgMileageKm === 0
      ? 0
      : (specs.mileageKm / (specs.marketAvgMileageKm * 2)) * 100,
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
    >
      {/* ── Body card with everything inside — compact 2-col grid ─ */}
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        {/* IDENTITY GROUP */}
        <SpecGroup title={t('groupIdentity')} accent={catColor}>
          <SpecCell label={t('year')} value={String(specs.year)} />
          <SpecCell label={t('bodyType')} value={t(`body.${specs.bodyType}`)} />
          <SpecCell
            label={t('exteriorColor')}
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block size-3.5 rounded-full border border-foreground/20 shadow-sm"
                  style={{ background: specs.exteriorColor.hex }}
                />
                {t(`color.${specs.exteriorColor.key}`)}
              </span>
            }
          />
          <SpecCell
            label={t('interiorColor')}
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block size-3.5 rounded-full border border-foreground/20 shadow-sm"
                  style={{ background: specs.interiorColor.hex }}
                />
                {t(`color.${specs.interiorColor.key}`)}
              </span>
            }
          />
          <SpecCell
            label={t('regionSpec')}
            value={
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex size-4 items-center justify-center rounded-sm text-[8px] font-bold tracking-wider text-background"
                  style={{ background: catColor }}
                >
                  {t(`regionShort.${specs.regionSpec}`)}
                </span>
                {t(`region.${specs.regionSpec}`)}
              </span>
            }
          />
          <SpecCell
            label={t('mileage')}
            value={
              specs.mileageKm === 0
                ? t('zeroKm')
                : `${specs.mileageKm.toLocaleString('en-US')} km`
            }
          />
        </SpecGroup>

        {/* MECHANICAL GROUP */}
        <SpecGroup title={t('groupMechanical')} accent={catColor}>
          <SpecCell label={t('engine')} value={specs.engine} />
          {specs.cylinders > 0 && (
            <SpecCell label={t('cylinders')} value={String(specs.cylinders)} />
          )}
          <SpecCell
            label={t('transmission')}
            value={t(`transmissionType.${specs.transmission}`)}
          />
          <SpecCell
            label={t('drivetrain')}
            value={t(`drivetrainType.${specs.drivetrain}`)}
          />
          <SpecCell label={t('fuel')} value={t(`fuelType.${specs.fuel}`)} />
          {specs.doors > 0 && (
            <SpecCell label={t('doors')} value={String(specs.doors)} />
          )}
          <SpecCell label={t('seats')} value={String(specs.seats)} />
        </SpecGroup>

        {/* DOCUMENTS GROUP */}
        <SpecGroup title={t('groupDocuments')} accent={catColor} last>
          <SpecCell
            label={t('warranty')}
            value={
              specs.warranty.active ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t('warrantyActive')}
                  </span>
                  <span className="text-[11.5px] text-foreground/60">
                    {t('remainingMonths', { n: specs.warranty.remainingMonths })}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/60">
                  {t('warrantyExpired')}
                </span>
              )
            }
          />

          <SpecCell
            label={t('vin')}
            tooltip={t('vinTooltip')}
            value={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVinRevealed((v) => !v)}
                  className="font-mono text-[12px] tabular-nums text-foreground/85 transition hover:text-foreground"
                >
                  {vinRevealed
                    ? specs.vin
                    : `${specs.vin.slice(0, 5)}•••••${specs.vin.slice(-3)}`}
                </button>
                <button
                  type="button"
                  onClick={copyVin}
                  className="grid size-5 place-items-center rounded-md border border-foreground/10 bg-foreground/[0.03] text-foreground/55 transition hover:border-foreground/25 hover:bg-foreground/[0.06] hover:text-foreground"
                  aria-label="Copy VIN"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {vinCopied ? (
                      <motion.span
                        key="ok"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="text-emerald-500"
                      >
                        <CheckCircle2 size={11} strokeWidth={2.6} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="cp"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Copy size={11} strokeWidth={2.2} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            }
          />

          <SpecCell
            label={t('registration')}
            value={<span className="font-mono tabular-nums">{specs.registration}</span>}
          />
        </SpecGroup>
      </div>

      {/* ── Mileage context bar ─────────────────── */}
      {specs.mileageKm > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4"
        >
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-foreground/50">
                {t('marketContextEyebrow')}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground">
                {mileageTrend === 'below'
                  ? t('marketContextBelow', { pct: Math.abs(mileageDelta) })
                  : mileageTrend === 'above'
                  ? t('marketContextAbove', { pct: mileageDelta })
                  : t('marketContextOn')}
              </p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${mileageTone}1f`, color: mileageTone }}
            >
              {t(`trendLabel.${mileageTrend}`)}
            </span>
          </div>

          {/* Visual bar with this vs avg markers */}
          <div className="relative h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
            {/* Average marker */}
            <div
              aria-hidden
              className="absolute inset-y-0 z-10 w-px bg-foreground/50"
              style={{ left: '50%' }}
            />
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${mileageBarPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
              style={{ background: mileageTone }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-foreground/45">
            <span>0 km</span>
            <span className="font-medium text-foreground/65">
              {t('avgFor', { year: specs.year })}:{' '}
              {specs.marketAvgMileageKm.toLocaleString('en-US')} km
            </span>
            <span>
              {(specs.marketAvgMileageKm * 2).toLocaleString('en-US')} km
            </span>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

// ─── Building blocks ─────────────────────────────────

const SpecGroup = ({
  title,
  children,
  accent,
  last,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
  last?: boolean;
}) => (
  <div className={last ? '' : 'border-b border-foreground/10'}>
    <div className="flex items-center gap-2 border-b border-foreground/[0.06] bg-foreground/[0.02] px-5 py-2.5">
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: accent }}
      />
      <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/70">
        {title}
      </h3>
    </div>
    {/* 2-column grid with divider lines between cells */}
    <div className="grid grid-cols-1 md:grid-cols-2 md:[&>*:nth-child(even)]:border-s md:[&>*:nth-child(even)]:border-foreground/[0.06]">
      {children}
    </div>
  </div>
);

const SpecCell = ({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-foreground/[0.06] px-5 py-3 transition-colors duration-150 hover:bg-foreground/[0.02] md:[&:nth-last-child(-n+2)]:border-b-0 [&:last-child]:border-b-0">
    <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/55">
      {label}
      {tooltip && (
        <span
          className="inline-flex cursor-help text-foreground/35 transition hover:text-foreground/70"
          title={tooltip}
        >
          <Info size={11} strokeWidth={2.2} />
        </span>
      )}
    </span>
    <span className="text-[13px] font-semibold text-foreground">{value}</span>
  </div>
);

export default RideDetailKeyInfo;
