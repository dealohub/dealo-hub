import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Heart } from 'lucide-react';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';
import SiteFooter from '@/components/shadcnblocks/site-footer';
import ThemeToggle from '@/components/theme-toggle';
import LocaleToggle from '@/components/locale-toggle';
import { createClient } from '@/lib/supabase/server';
import { getSavedListings } from '@/lib/account/queries';
import SearchResultCard from '@/components/search/search-result-card';

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'saved' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SavedListingsPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/saved`);

  const t = await getTranslations({ locale: params.locale, namespace: 'saved' });
  const saved = await getSavedListings(params.locale);

  return (
    <>
      <EcommerceNavbar1 />
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <header className="mb-6">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {saved.length} {saved.length === 1 ? 'listing' : 'listings'}
          </p>
        </header>

        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <Heart size={28} className="text-foreground/30" />
            <div>
              <p className="text-base font-semibold text-foreground">{t('emptyTitle')}</p>
              <p className="mt-1 max-w-sm text-sm text-foreground/60">
                {t('emptyDescription')}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/${params.locale}/categories`}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {t('browseAction')}
              </Link>
              <Link
                href={`/${params.locale}/rides`}
                className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
              >
                /rides
              </Link>
              <Link
                href={`/${params.locale}/properties`}
                className="rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10"
              >
                /properties
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {saved.map(c => (
              <SearchResultCard key={c.id} card={c} locale={params.locale} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
      <ThemeToggle />
      <LocaleToggle />
    </>
  );
}
