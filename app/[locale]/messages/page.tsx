import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getInbox } from '@/lib/chat/queries';
import ConversationListItem from '@/components/chat/conversation-list-item';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'marketplace.chat' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function MessagesInboxPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
    searchParams: Promise<{ tab?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/messages`);

  const t = await getTranslations({
    locale: params.locale,
    namespace: 'marketplace.chat.inbox',
  });

  const tab = searchParams.tab === 'archived' ? 'archived' : 'active';
  const conversations = await getInbox({ includeArchived: true });
  const active = conversations.filter(c => !c.archived);
  const archived = conversations.filter(c => c.archived);
  const visible = tab === 'archived' ? archived : active;

  return (
    <>
      <EcommerceNavbar1 />
      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">{t('subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-5 inline-flex rounded-lg bg-foreground/5 p-1">
          <TabLink
            href={`/${params.locale}/messages`}
            active={tab === 'active'}
            label={`${t('tabActive')} (${active.length})`}
          />
          <TabLink
            href={`/${params.locale}/messages?tab=archived`}
            active={tab === 'archived'}
            label={`${t('tabArchived')} (${archived.length})`}
          />
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center">
            <MessageCircle size={28} className="text-foreground/30" />
            <div>
              <p className="font-semibold text-foreground">
                {tab === 'archived' ? t('emptyArchivedTitle') : t('emptyActiveTitle')}
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                {tab === 'archived' ? t('emptyArchivedBody') : t('emptyActiveBody')}
              </p>
            </div>
            {tab === 'active' && (
              <Link
                href={`/${params.locale}/properties`}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t('browseCta')}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(c => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                locale={params.locale}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        'rounded-md px-3 py-1.5 text-xs font-medium transition ' +
        (active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-foreground/60 hover:text-foreground')
      }
    >
      {label}
    </Link>
  );
}
