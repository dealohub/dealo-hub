import { getTranslations } from 'next-intl/server';
import { Sparkles, Wrench, ShieldCheck, FileCheck, MessageCircle } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import ListingCardServices from '@/components/shadcnblocks/listing-card-services';
import {
  getFeaturedServices,
  getServicesForGrid,
  getServiceTaskTypeCounts,
} from '@/lib/services/queries';

/**
 * /services — Phase 8a hub page.
 *
 * 6 sections (narrower than Properties/Electronics because this is the
 * first sub-cat only; adding sections should wait for 8b's task-type
 * expansion):
 *
 *   1. Hero — "vetted providers, real reviews, real prices"
 *   2. Task-type browse strip — 8 tiles with live counts
 *   3. Trust strip — 4 pillars (individual-first, chat-only,
 *      post-completion reviews, Dealo Guarantee)
 *   4. Featured row — 6 top providers by tier + rating
 *   5. Main grid — all 12 active listings, filterable by task_type
 *   6. Footer
 *
 * ISR revalidate=60 (matches rides + properties + electronics).
 */
export const revalidate = 60;

const TASK_TYPE_ICONS: Record<string, typeof Sparkles> = {
  home_cleaning_one_off: Sparkles,
  home_cleaning_recurring: Sparkles,
  handyman_ikea_assembly: Wrench,
  handyman_tv_mount: Wrench,
  handyman_shelf_hang: Wrench,
  handyman_furniture_move: Wrench,
  handyman_basic_painting: Wrench,
  handyman_other: Wrench,
};

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

const TASK_LABELS_EN: Record<string, string> = {
  home_cleaning_one_off: 'One-off cleaning',
  home_cleaning_recurring: 'Recurring cleaning',
  handyman_ikea_assembly: 'IKEA assembly',
  handyman_tv_mount: 'TV mounting',
  handyman_shelf_hang: 'Shelf hanging',
  handyman_furniture_move: 'Furniture moving',
  handyman_basic_painting: 'Painting',
  handyman_other: 'Other tasks',
};

export default async function ServicesHubPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations('servicesHub');
  const locale = params.locale;

  const [featured, grid, taskCounts] = await Promise.all([
    getFeaturedServices({ locale, limit: 6 }),
    getServicesForGrid({ locale, limit: 24 }),
    getServiceTaskTypeCounts(),
  ]);

  const taskLabels = locale === 'ar' ? TASK_LABELS_AR : TASK_LABELS_EN;
  const totalListings = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <EcommerceNavbar1 />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/60">
            <Wrench size={12} />
            {t('heroEyebrow')}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-foreground/70 md:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <StatPill value={totalListings} label={t('heroStatListings')} />
            <StatPill value={5} label={t('heroStatProviders')} />
            <StatPill value={8} label={t('heroStatCompleted')} accent="emerald" />
          </div>
        </div>
      </section>

      <main>
        {/* ── Browse by task type ─────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t('browseTitle')}
            </h2>
            <p className="text-[11px] text-foreground/50">
              {t('browseSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(taskCounts).map(([taskType, count]) => {
              const Icon = TASK_TYPE_ICONS[taskType] ?? Wrench;
              return (
                <div
                  key={taskType}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-3 text-center"
                >
                  <Icon
                    size={18}
                    className={count > 0 ? 'text-primary' : 'text-foreground/30'}
                  />
                  <div className="text-[11px] font-medium leading-tight text-foreground/80">
                    {taskLabels[taskType] ?? taskType}
                  </div>
                  <div className="text-[10px] text-foreground/50">
                    {count} {t('cardListings')}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Trust strip (4 pillars) ─────────────────────────── */}
        <section className="border-y border-border/60 bg-foreground/[0.02]">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <h2 className="mb-5 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t('trustTitle')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <TrustPillar icon={ShieldCheck} title={t('trust1Title')} body={t('trust1Body')} />
              <TrustPillar icon={MessageCircle} title={t('trust2Title')} body={t('trust2Body')} />
              <TrustPillar icon={FileCheck} title={t('trust3Title')} body={t('trust3Body')} />
              <TrustPillar icon={Sparkles} title={t('trust4Title')} body={t('trust4Body')} />
            </div>
          </div>
        </section>

        {/* ── Featured providers ───────────────────────────────── */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
                  ⭐ {t('featuredEyebrow')}
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {t('featuredTitle')}
                </h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((card) => (
                <ListingCardServices key={card.id} card={card} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* ── Main grid ───────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('gridTitle')}
            </h2>
            <p className="text-sm text-foreground/55">
              {grid.length} {t('gridCount')}
            </p>
          </div>
          {grid.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-sm text-foreground/55">
              {t('emptyState')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grid.map((card) => (
                <ListingCardServices key={card.id} card={card} locale={locale} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}

// ---------------------------------------------------------------------------
// Small presentational sub-components
// ---------------------------------------------------------------------------

function StatPill({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: 'emerald';
}) {
  const accentClass =
    accent === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30'
      : 'bg-primary/10 text-primary ring-primary/30';
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${accentClass}`}
    >
      <span className="text-base">{value}</span>
      <span className="text-[11px] font-medium opacity-80">{label}</span>
    </span>
  );
}

function TrustPillar({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <Icon size={20} className="mb-3 text-primary" />
      <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-foreground/60">{body}</p>
    </div>
  );
}
