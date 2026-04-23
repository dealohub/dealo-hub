import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getThread } from '@/lib/chat/queries';
import { markConversationRead } from '@/lib/chat/actions';
import { listingDetailPath } from '@/lib/chat/types';
import MessageBubble from '@/components/chat/message-bubble';
import MessageComposer from '@/components/chat/message-composer';
import ThreadRealtime from '@/components/chat/thread-realtime';
import EcommerceNavbar1 from '@/components/shadcnblocks/ecommerce-navbar-1';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'marketplace.chat' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function ThreadPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en'; id: string }>;
  }
) {
  const params = await props.params;
  const conversationId = Number(params.id);
  if (!Number.isFinite(conversationId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/messages/${params.id}`);

  const thread = await getThread(conversationId);
  if (!thread) notFound();

  // Mark read on load (fire-and-forget; errors logged, not surfaced)
  await markConversationRead(conversationId);

  const t = await getTranslations({
    locale: params.locale,
    namespace: 'marketplace.chat.thread',
  });

  const { conversation: conv, messages } = thread;

  return (
    <>
      <EcommerceNavbar1 />
      <ThreadRealtime conversationId={conv.id} />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col px-4 py-4 md:py-6">
        {/* Thread header */}
        <header className="mb-3 flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3">
          <Link
            href={`/${params.locale}/messages`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground"
            title={t('backToInbox')}
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
          </Link>

          {/* Listing mini */}
          <Link
            href={listingDetailPath(params.locale, conv.listing)}
            className="group flex min-w-0 flex-1 items-center gap-2.5"
          >
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-foreground/5">
              {conv.listing.cover ? (
                <Image
                  src={conv.listing.cover}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-foreground/40">
                  <MessageCircle size={14} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                {conv.otherParty.dealerName || conv.otherParty.displayName}
              </p>
              <p className="truncate text-[10px] text-foreground/55">
                {conv.listing.title}
              </p>
            </div>
            <ExternalLink size={12} className="flex-shrink-0 text-foreground/40 rtl:-scale-x-100" />
          </Link>
        </header>

        {/* Blocked-by-other-side banner */}
        {conv.blocked && (
          <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-600 dark:text-rose-400">
            {t('theyBlockedBanner')}
          </div>
        )}

        {/* Messages list */}
        <div className="flex-1 space-y-3 overflow-y-auto py-2">
          {messages.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-2 text-center">
              <MessageCircle size={24} className="text-foreground/30" />
              <p className="font-semibold text-foreground">{t('emptyThreadTitle')}</p>
              <p className="max-w-sm text-xs leading-relaxed text-foreground/55">
                {t('emptyThreadBody')}
              </p>
            </div>
          ) : (
            messages.map(m => (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={m.senderId === user.id}
                currencyCode={conv.listing.currencyCode}
              />
            ))
          )}
        </div>

        {/* Composer */}
        <div className="mt-3">
          <MessageComposer
            conversationId={conv.id}
            currencyCode={conv.listing.currencyCode}
            blocked={conv.blocked}
            locale={params.locale}
          />
        </div>
      </main>
    </>
  );
}
