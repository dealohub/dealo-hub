import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  ShieldAlert,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { getAdminBadges, getListingStatusCounts } from '@/lib/admin/queries';

/**
 * Admin landing page.
 *
 * Phase 9a ships this as a scaffolded overview — three status tiles
 * (held / live / rejected counts) and a single call-to-action that
 * deep-links into the moderation queue. Not a dashboard yet (no charts,
 * no trendlines) — that belongs to Phase 9b after we've validated the
 * shell and moderation loop in production.
 *
 * The tiles live on a plain grid, no card-in-card nesting, no colored
 * side stripes, no gradient text. Each tile is a single bordered surface
 * with a small icon, a number, and a label.
 */

export async function generateMetadata(props: {
  params: Promise<{ locale: 'ar' | 'en' }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: `${t('dashboard.title')} · Dealo`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminDashboardPage(props: {
  params: Promise<{ locale: 'ar' | 'en' }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  // Parallel fetch — both are cached per request.
  const [badges, counts] = await Promise.all([
    getAdminBadges(),
    getListingStatusCounts(),
  ]);

  const listingsHref = `/${locale}/admin/listings?tab=held`;

  return (
    <>
      <AdminHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <section
          aria-label={t('dashboard.statsLabel')}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatTile
            icon={ShieldAlert}
            label={t('dashboard.stats.held')}
            value={badges.held_count}
            accent="warning"
          />
          <StatTile
            icon={CheckCircle2}
            label={t('dashboard.stats.live')}
            value={counts.live}
            accent="success"
          />
          <StatTile
            icon={AlertTriangle}
            label={t('dashboard.stats.rejected')}
            value={counts.rejected}
            accent="danger"
          />
        </section>

        <section className="border-border/60 bg-muted/30 rounded-xl border p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">
                {t('dashboard.queue.title')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('dashboard.queue.body', { count: badges.held_count })}
              </p>
            </div>
            <Button asChild>
              <Link href={listingsHref} className="inline-flex items-center gap-2">
                <ListChecks className="size-4" />
                <span>{t('dashboard.queue.cta')}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: 'warning' | 'success' | 'danger';
}

/**
 * Single status tile. Kept minimal: icon, label, big number. Accent is
 * expressed as a small circular icon chip (no full-surface tint, no left
 * stripe) so all three tiles read as siblings with the same visual weight.
 */
function StatTile({ icon: Icon, label, value, accent }: StatTileProps) {
  const chip =
    accent === 'warning'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      : accent === 'success'
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400';

  return (
    <div className="border-border/60 bg-card rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${chip}`}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground truncate text-xs font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-foreground mt-0.5 text-2xl font-semibold tabular-nums">
            {formatCount(value)}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  // Locale-agnostic compact display; Arabic digits render via the font's
  // OpenType tables without needing `toLocaleString('ar')` here.
  return new Intl.NumberFormat('en-US').format(n);
}
