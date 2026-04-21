import { useTranslations } from 'next-intl';
import { Search, ShieldCheck, CalendarCheck2, Building2 } from 'lucide-react';

/**
 * Properties hub — hero section.
 *
 * Three-part layout: headline + search input + doctrine stats strip.
 * Stats drive doctrine immediately: "N Dealo Inspected" is our lead
 * trust signal; "N chalets" calls out the Dubizzle gap.
 *
 * Server component — the search input POSTs to the grid section on
 * submit (Phase 4c+1 wires the actual handler).
 */

interface Props {
  totalListings: number;
  inspectedCount: number;
  chaletCount: number;
}

export default function PropertiesHeroSplit({
  totalListings,
  inspectedCount,
  chaletCount,
}: Props) {
  const t = useTranslations('marketplace.properties.hub.hero');

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-background to-background/50">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {t('eyebrow')}
          </p>
          <h1 className="text-balance font-sans text-4xl font-semibold tracking-tight text-foreground md:text-[56px] md:leading-[1.05]">
            {t('headline')}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/70 md:text-base">
            {t('subline')}
          </p>
        </div>

        {/* Search */}
        <form className="mt-8 flex max-w-2xl items-stretch gap-2">
          <div className="relative flex h-12 flex-1 items-center rounded-xl bg-card px-4 shadow-sm ring-1 ring-border/60 focus-within:ring-2 focus-within:ring-primary/40">
            <Search size={16} className="me-2 text-foreground/50" />
            <input
              type="search"
              name="q"
              placeholder={t('searchPlaceholder')}
              className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            {t('searchCta')}
          </button>
        </form>

        {/* Stats strip */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Stat
            icon={<Building2 size={18} className="text-primary" />}
            value={totalListings.toLocaleString('en-US')}
            label={t('statsListings')}
          />
          <Stat
            icon={<ShieldCheck size={18} className="text-emerald-500" />}
            value={inspectedCount.toLocaleString('en-US')}
            label={t('statsInspected')}
            accent="emerald"
          />
          <Stat
            icon={<CalendarCheck2 size={18} className="text-sky-500" />}
            value={chaletCount.toLocaleString('en-US')}
            label={t('statsChalets')}
            accent="sky"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: 'emerald' | 'sky';
}) {
  const ring =
    accent === 'emerald'
      ? 'ring-emerald-500/20 bg-emerald-500/5'
      : accent === 'sky'
      ? 'ring-sky-500/20 bg-sky-500/5'
      : 'ring-border/60 bg-card';
  return (
    <div className={'flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ' + ring}>
      {icon}
      <div>
        <div className="text-lg font-semibold text-foreground">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-foreground/60">
          {label}
        </div>
      </div>
    </div>
  );
}
