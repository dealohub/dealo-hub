'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getColorSwatch } from '@/lib/rides/color-swatches';
import type { RideDetail } from '@/lib/rides/types';

/**
 * RideDetailKeyInfo — the "نظرة عامة" spec overview.
 *
 * Reads from `listing.specs` (Zod-parsed, camelCase). Fields that
 * aren't set in category_fields simply don't render — clean empty
 * handling over synthesising placeholder values.
 */

interface Props {
  listing: RideDetail;
}

export const RideDetailKeyInfo = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.keyInfo');
  const catColor = listing.catColor;
  const s = listing.specs;

  const [vinRevealed, setVinRevealed] = useState(false);
  const [vinCopied, setVinCopied] = useState(false);
  const copyVin = async () => {
    if (!s.vin) return;
    try {
      await navigator.clipboard.writeText(s.vin);
      setVinCopied(true);
      setTimeout(() => setVinCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const mileageKm = s.mileageKm ?? 0;
  const exteriorHex = getColorSwatch(s.exteriorColor);
  const interiorHex = getColorSwatch(s.interiorColor);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
    >
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        {/* IDENTITY GROUP */}
        <SpecGroup title={t('groupIdentity')} accent={catColor}>
          <SpecCell label={t('year')} value={String(s.year)} />
          {s.bodyStyle && (
            <SpecCell
              label={t('bodyType')}
              value={t(`body.${s.bodyStyle}`)}
            />
          )}
          {s.exteriorColor && (
            <SpecCell
              label={t('exteriorColor')}
              value={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block size-3.5 rounded-full border border-foreground/20 shadow-sm"
                    style={{ background: exteriorHex }}
                  />
                  {s.exteriorColor}
                </span>
              }
            />
          )}
          {s.interiorColor && (
            <SpecCell
              label={t('interiorColor')}
              value={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block size-3.5 rounded-full border border-foreground/20 shadow-sm"
                    style={{ background: interiorHex }}
                  />
                  {s.interiorColor}
                </span>
              }
            />
          )}
          {s.regionSpec && (
            <SpecCell
              label={t('regionSpec')}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-flex size-4 items-center justify-center rounded-sm text-[8px] font-bold tracking-wider text-background"
                    style={{ background: catColor }}
                  >
                    {t(`regionShort.${s.regionSpec}`)}
                  </span>
                  {t(`region.${s.regionSpec}`)}
                </span>
              }
            />
          )}
          <SpecCell
            label={t('mileage')}
            value={
              mileageKm === 0
                ? t('zeroKm')
                : `${mileageKm.toLocaleString('en-US')} km`
            }
          />
        </SpecGroup>

        {/* MECHANICAL GROUP */}
        <SpecGroup title={t('groupMechanical')} accent={catColor}>
          {s.engineCc != null && s.engineCc > 0 && (
            <SpecCell
              label={t('engine')}
              value={
                `${(s.engineCc / 1000).toFixed(1)}L` +
                (s.cylinders && s.cylinders > 0
                  ? ` · ${s.cylinders}-cyl`
                  : '')
              }
            />
          )}
          {s.horsepower != null && (
            <SpecCell
              label={t('horsepower')}
              value={`${s.horsepower.toLocaleString('en-US')} hp`}
            />
          )}
          {s.torqueNm != null && (
            <SpecCell
              label={t('torque')}
              value={`${s.torqueNm.toLocaleString('en-US')} Nm`}
            />
          )}
          <SpecCell
            label={t('transmission')}
            value={t(`transmissionType.${s.transmission}`)}
          />
          {s.drivetrain && (
            <SpecCell
              label={t('drivetrain')}
              value={t(`drivetrainType.${s.drivetrain}`)}
            />
          )}
          <SpecCell label={t('fuel')} value={t(`fuelType.${s.fuelType}`)} />
          {s.doors != null && s.doors > 0 && (
            <SpecCell label={t('doors')} value={String(s.doors)} />
          )}
          {s.seats != null && s.seats > 0 && (
            <SpecCell label={t('seats')} value={String(s.seats)} />
          )}
        </SpecGroup>

        {/* DOCUMENTS GROUP */}
        <SpecGroup title={t('groupDocuments')} accent={catColor} last>
          <SpecCell
            label={t('warranty')}
            value={
              s.warrantyActive ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t('warrantyActive')}
                  </span>
                  {s.warrantyRemainingMonths != null &&
                    s.warrantyRemainingMonths > 0 && (
                      <span className="text-[11.5px] text-foreground/60">
                        {t('remainingMonths', {
                          n: s.warrantyRemainingMonths,
                        })}
                      </span>
                    )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/60">
                  {t('warrantyExpired')}
                </span>
              )
            }
          />

          {s.vin && (
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
                      ? s.vin
                      : `${s.vin.slice(0, 5)}•••••${s.vin.slice(-3)}`}
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
          )}

          {s.registrationRef && (
            <SpecCell
              label={t('registration')}
              value={
                <span className="font-mono tabular-nums">
                  {s.registrationRef}
                </span>
              }
            />
          )}
        </SpecGroup>
      </div>
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
