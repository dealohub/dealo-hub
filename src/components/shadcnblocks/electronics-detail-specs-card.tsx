import { useTranslations } from 'next-intl';
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Calendar,
  Layers,
  Camera,
} from 'lucide-react';
import type { ElectronicsDetail } from '@/lib/electronics/types';

/**
 * Electronics detail — Specs card.
 *
 * Sub-cat-driven spec table. Shows only the rows that apply to the
 * device kind, so a phone listing never shows an empty "RAM" row and
 * a TV listing never shows a "battery cycles" row.
 *
 * Layout: 2-column definition list on sm+, single column below.
 * Each row: icon + localised label + value. Icons are subtle (stone
 * tone, 14px) to avoid visual noise.
 */

interface Props {
  listing: ElectronicsDetail;
  locale: 'ar' | 'en';
}

interface Row {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function ElectronicsDetailSpecsCard({ listing, locale }: Props) {
  const t = useTranslations('electronicsDetail');
  const tSell = useTranslations('sell.step.electronics');
  const f = listing.fields;

  const rows: Row[] = [];

  rows.push({
    key: 'device',
    icon: <Layers size={14} />,
    label: t('specsDeviceKind'),
    value: tSell(`deviceKind.${f.deviceKind}` as any),
  });

  if (f.storageGb != null) {
    rows.push({
      key: 'storage',
      icon: <HardDrive size={14} />,
      label: t('specsStorage'),
      value: `${f.storageGb} GB`,
    });
  }
  if (f.ramGb != null) {
    rows.push({
      key: 'ram',
      icon: <MemoryStick size={14} />,
      label: t('specsRam'),
      value: `${f.ramGb} GB`,
    });
  }
  if (f.screenSizeInches != null) {
    const size = locale === 'ar' ? `${f.screenSizeInches} إنش` : `${f.screenSizeInches}"`;
    rows.push({
      key: 'screen',
      icon: <Monitor size={14} />,
      label: t('specsScreen'),
      value: size,
    });
  }
  if (f.resolution) {
    rows.push({
      key: 'resolution',
      icon: <Monitor size={14} />,
      label: t('specsResolution'),
      value: f.resolution.toUpperCase(),
    });
  }
  if (f.lensMount) {
    rows.push({
      key: 'lens',
      icon: <Camera size={14} />,
      label: t('specsLensMount'),
      value: tSell(`lensMount.${f.lensMount}` as any),
    });
  }
  if (f.yearOfPurchase) {
    rows.push({
      key: 'year',
      icon: <Calendar size={14} />,
      label: t('specsYearOfPurchase'),
      value: String(f.yearOfPurchase),
    });
  }

  return (
    <section aria-label="Specifications" className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
      <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/70">
        <Cpu size={14} />
        {t('specsTitle')}
      </h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {rows.map(r => (
          <div
            key={r.key}
            className="flex items-baseline justify-between gap-3 border-b border-border/30 py-2 last:border-b-0"
          >
            <dt className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
              <span className="text-foreground/45">{r.icon}</span>
              {r.label}
            </dt>
            <dd className="text-end text-sm text-foreground/85">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
