import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Package, Plus } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { createClient } from '@/lib/supabase/server';
import { getMyListings } from '@/lib/account/queries';
import SearchResultCard from '@/components/search/search-result-card';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth' });
  return { title: `${t('myListings')} · Dealo Hub`, robots: { index: false, follow: false } };
}

const STATUS_TINT: Record<string, string> = {
  live: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  draft: 'bg-foreground/10 text-foreground/70',
  sold: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  archived: 'bg-foreground/10 text-foreground/60',
  held: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  rejected: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  deleted: 'bg-foreground/5 text-foreground/50',
};

export default async function MyListingsPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(`/${params.locale}/signin?next=/${params.locale}/my-listings`);

  const listings = await getMyListings(params.locale);
  const live = listings.filter(l => l.status === 'live');
  const drafts = listings.filter(l => l.status === 'draft');
  const archived = listings.filter(l => l.status === 'archived' || l.status === 'sold');

  return (
    <>
      <EcommerceNavbar1 />
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              My listings
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              {listings.length} total · {live.length} live
            </p>
          </div>
          <Link
            href={`/${params.locale}/sell`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus size={14} />
            New listing
          </Link>
        </header>

        {listings.length === 0 ? (
          <EmptyState locale={params.locale} />
        ) : (
          <div className="space-y-8">
            <Section title="Live" cards={live} emptyHint="Publish your first listing to start getting messages." />
            {drafts.length > 0 && (
              <Section title="Drafts" cards={drafts} emptyHint="" />
            )}
            {archived.length > 0 && (
              <Section title="Archived / Sold" cards={archived} emptyHint="" />
            )}
          </div>
        )}
      </main>
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}

function Section({
  title,
  cards,
  emptyHint,
}: {
  title: string;
  cards: Array<{ status: string } & any>;
  emptyHint: string;
}) {
  if (cards.length === 0 && !emptyHint) return null;
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60">
        {title} · {cards.length}
      </h2>
      {cards.length === 0 ? (
        <p className="text-sm text-foreground/50">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {cards.map(c => (
            <div key={c.id} className="relative">
              <span
                className={
                  'absolute end-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ' +
                  (STATUS_TINT[c.status] ?? 'bg-foreground/5 text-foreground/60')
                }
              >
                {c.status}
              </span>
              <SearchResultCard card={c} locale="ar" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ locale }: { locale: 'ar' | 'en' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
      <Package size={30} className="text-foreground/30" />
      <div>
        <p className="text-base font-semibold text-foreground">
          You haven't listed anything yet
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Selling a car, apartment, or laptop? Start your first listing now.
        </p>
      </div>
      <Link
        href={`/${locale}/sell`}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <Plus size={14} />
        Create a listing
      </Link>
    </div>
  );
}
