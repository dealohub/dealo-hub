import { useTranslations } from 'next-intl';
import {
  Battery,
  BatteryLow,
  BatteryWarning,
  ShieldCheck,
  Receipt,
  Wrench,
  AlertTriangle,
  Store,
  Package,
  Fingerprint,
} from 'lucide-react';
import type { ElectronicsDetail } from '@/lib/electronics/types';
import {
  batteryHealthBand,
  deviceKindHasBattery,
  deviceKindHasScreen,
} from '@/lib/electronics/validators';

/**
 * Electronics detail — Trust card (unified).
 *
 * Consolidates four trust pillars into one visually coherent card:
 *
 *   1. IMEI / Serial uniqueness (P2) — shows last-4 with explanation,
 *      emphasizes that the number is unique-on-Dealo
 *   2. Battery health (P3) — colored bar + plain-language description
 *   3. Purchase provenance + warranty + receipt (P5, P6) — single
 *      "Where's it warrantied?" block with retailer chip + warranty
 *      status + receipt indicator. Imported listings get a warranty
 *      warning.
 *   4. Repair disclosure (P4) — 4-component chip grid (screen /
 *      battery / back_glass / camera) with 3 states each.
 *
 * Why one card instead of four: buyers scan trust signals holistically
 * (is this device legit?) rather than atomically. One card with
 * accent stripes for each section is easier to parse than four
 * disconnected panels.
 *
 * Rows appear only when the data applies — a speaker listing doesn't
 * show battery, a TV doesn't show repair-screen.
 */

interface Props {
  listing: ElectronicsDetail;
  /** Locale — currently unused here (localisation happens via i18n
   *  keys) but kept on the prop shape so the page composition stays
   *  symmetric with the specs-card / header props. */
  locale: 'ar' | 'en';
}

const REPAIR_STATE_TINT: Record<'original' | 'replaced' | 'unknown', string> = {
  original: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
  replaced: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25',
  unknown: 'bg-foreground/[0.06] text-foreground/65 ring-1 ring-inset ring-foreground/10',
};

export default function ElectronicsDetailTrustCard({ listing }: Props) {
  const t = useTranslations('electronicsDetail');
  const f = listing.fields;

  // ── Battery-band visual ───────────────────────────────────────────
  const band = batteryHealthBand(f.batteryHealthPct ?? null);
  const bandFill =
    band === 'green' ? 'bg-emerald-500'
    : band === 'amber' ? 'bg-amber-500'
    : band === 'red' ? 'bg-rose-500'
    : 'bg-foreground/20';
  const bandMessage =
    band === 'green' ? t('batteryHealthStrong')
    : band === 'amber' ? t('batteryHealthFair')
    : band === 'red' ? t('batteryHealthWeak')
    : t('batteryUndisclosed');

  const showBatterySection = deviceKindHasBattery(f.deviceKind);
  const showRepairSection = deviceKindHasScreen(f.deviceKind);
  const isImported = f.purchaseSource === 'imported';

  // Which repair components to render for this device kind. Screen +
  // back_glass make sense for phones/tablets/watches; laptops skip
  // back_glass; TVs skip back_glass + battery. Simplified heuristic
  // — we show all non-null disclosures plus the core set for the kind.
  const repairItems: Array<{
    key: 'screen' | 'battery' | 'back_glass' | 'camera';
    state: 'original' | 'replaced' | 'unknown';
  }> = [];
  if (showRepairSection && f.repairScreen)
    repairItems.push({ key: 'screen', state: f.repairScreen });
  if (showBatterySection && f.repairBattery)
    repairItems.push({ key: 'battery', state: f.repairBattery });
  if ((f.deviceKind === 'phone' || f.deviceKind === 'tablet' || f.deviceKind === 'smart_watch') && f.repairBackGlass)
    repairItems.push({ key: 'back_glass', state: f.repairBackGlass });
  if (
    (f.deviceKind === 'phone' ||
      f.deviceKind === 'tablet' ||
      f.deviceKind === 'laptop' ||
      f.deviceKind === 'camera') &&
    f.repairCamera
  )
    repairItems.push({ key: 'camera', state: f.repairCamera });

  return (
    <section
      aria-label="Trust panel"
      className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm"
    >
      <header className="flex items-center gap-2 border-b border-border/40 bg-emerald-500/[0.04] px-5 py-3">
        <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
          {t('trustPanelTitle')}
        </h2>
      </header>

      <div className="divide-y divide-border/40">
        {/* ── 1. IMEI / Serial uniqueness ── */}
        {f.serialOrImeiLast4 && (
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Fingerprint size={14} />
            </span>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t('imeiTitle')}
              </h3>
              <p className="text-sm text-foreground/80">
                {t('imeiLastDigits', { digits: f.serialOrImeiLast4 })}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {t('imeiUniqueBadge')}
              </p>
              <p className="text-[11px] text-foreground/55">{t('imeiHelp')}</p>
            </div>
          </div>
        )}

        {/* ── 2. Battery health ── */}
        {showBatterySection && (
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
              {f.batteryHealthPct == null ? (
                <BatteryWarning size={14} className="text-amber-600 dark:text-amber-400" />
              ) : band === 'red' ? (
                <BatteryLow size={14} className="text-rose-600 dark:text-rose-400" />
              ) : (
                <Battery size={14} className="text-foreground/60" />
              )}
            </span>
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('batteryHealthTitle')}
                </h3>
                {f.batteryHealthPct != null && (
                  <span className="text-base font-semibold text-foreground tabular-nums">
                    {f.batteryHealthPct}%
                  </span>
                )}
              </div>
              {f.batteryHealthPct != null && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                  <div
                    className={`h-full transition-all ${bandFill}`}
                    style={{ width: `${f.batteryHealthPct}%` }}
                  />
                </div>
              )}
              <p
                className={
                  'text-xs ' +
                  (band === 'red'
                    ? 'text-rose-600 dark:text-rose-400'
                    : band === 'amber'
                      ? 'text-amber-700 dark:text-amber-400'
                      : band === 'green'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400')
                }
              >
                {bandMessage}
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Provenance + warranty + receipt ── */}
        {(f.purchaseSource || f.warrantyActive != null || f.hasOriginalReceipt != null) && (
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400">
              <Store size={14} />
            </span>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t('trustPanelWhere')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {f.purchaseSource && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-foreground/85 ring-1 ring-inset ring-foreground/10">
                    {t(`purchaseSource.${f.purchaseSource}` as any)}
                  </span>
                )}
                {f.warrantyActive && f.warrantyEndDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    <ShieldCheck size={11} />
                    {t('trustPanelWarrantyActive', { date: f.warrantyEndDate })}
                  </span>
                )}
                {f.warrantyActive === false && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-foreground/65 ring-1 ring-inset ring-foreground/10">
                    {t('trustPanelWarrantyNone')}
                  </span>
                )}
                {f.hasOriginalReceipt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-400 ring-1 ring-inset ring-sky-500/20">
                    <Receipt size={11} />
                    {t('trustPanelReceipt')}
                  </span>
                )}
              </div>
              {isImported && (
                <p className="inline-flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  {t('trustPanelImported')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Repair disclosure ── */}
        {repairItems.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/60">
              <Wrench size={14} />
            </span>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t('repairTitle')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {repairItems.map(r => (
                  <span
                    key={r.key}
                    className={
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
                      REPAIR_STATE_TINT[r.state]
                    }
                  >
                    <span className="text-foreground/50">
                      {t(`repairComponent.${r.key}` as any)}:
                    </span>
                    <span>{t(`repairState.${r.state}` as any)}</span>
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-foreground/55">{t('repairHint')}</p>
            </div>
          </div>
        )}

        {/* ── 5. Accessories included ── */}
        {f.accessoriesIncluded.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground/60">
              <Package size={14} />
            </span>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t('accessoriesTitle')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {f.accessoriesIncluded.map(a => (
                  <span
                    key={a}
                    className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-foreground/80 ring-1 ring-inset ring-foreground/10"
                  >
                    {t(`accessories.${a}` as any)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
