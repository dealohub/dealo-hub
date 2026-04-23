import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MessageCircle, Tag } from 'lucide-react';
import type { InboxConversation } from '@/lib/chat/types';
import { formatPrice } from '@/lib/format';

/**
 * ConversationListItem — a single row in the /messages inbox.
 *
 * Layout: listing cover (left) + other-party display name + listing
 * title (middle) + timestamp + unread badge (right). Unread rows get
 * a subtle accent ring.
 */

function formatTimestamp(iso: string | null, locale: 'ar' | 'en'): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - date.getTime();
  const min = ms / 60000;
  const hr = min / 60;
  const days = hr / 24;
  if (min < 1)
    return locale === 'ar' ? 'الآن' : 'now';
  if (min < 60) return locale === 'ar' ? `منذ ${Math.floor(min)} دقيقة` : `${Math.floor(min)}m`;
  if (hr < 24) return locale === 'ar' ? `منذ ${Math.floor(hr)} ساعة` : `${Math.floor(hr)}h`;
  if (days < 7) return locale === 'ar' ? `منذ ${Math.floor(days)} يوم` : `${Math.floor(days)}d`;
  return date.toLocaleDateString(locale === 'ar' ? 'ar-KW' : 'en-US', {
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
  });
}

interface Props {
  conversation: InboxConversation;
  locale: 'ar' | 'en';
}

export default function ConversationListItem({ conversation, locale }: Props) {
  const t = useTranslations('marketplace.chat.inbox');
  const c = conversation;
  const hasUnread = c.unreadCount > 0;

  return (
    <Link
      href={`/${locale}/messages/${c.id}`}
      className={
        'group flex gap-3 rounded-xl border p-3 transition ' +
        (hasUnread
          ? 'border-primary/40 bg-primary/[0.03] hover:bg-primary/[0.06]'
          : 'border-border/50 bg-card hover:border-border hover:bg-foreground/[0.02]')
      }
    >
      {/* Listing cover */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
        {c.listing.cover ? (
          <Image
            src={c.listing.cover}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/40">
            <MessageCircle size={18} />
          </div>
        )}
      </div>

      {/* Middle */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={
              'truncate text-sm ' +
              (hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90')
            }
          >
            {c.otherParty.dealerName || c.otherParty.displayName}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-foreground/60">
            <Tag size={8} />
            {c.viewerIsBuyer ? t('youBuyer') : t('youSeller')}
          </span>
        </div>

        <p className="mt-0.5 truncate text-[11px] text-foreground/55">
          {c.listing.title}
        </p>

        <p
          className={
            'mt-1 line-clamp-1 text-xs ' +
            (hasUnread ? 'font-medium text-foreground/80' : 'text-foreground/55')
          }
        >
          {c.lastMessagePreview ?? <span className="italic opacity-60">—</span>}
        </p>
      </div>

      {/* Right meta */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-foreground/50">
          {formatTimestamp(c.lastMessageAt ?? c.createdAt, locale)}
        </span>
        {hasUnread && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {c.unreadCount}
          </span>
        )}
        {!hasUnread && c.blocked && (
          <span className="text-[9px] font-medium uppercase tracking-wider text-rose-500">
            blocked
          </span>
        )}
        <span className="text-[10px] font-medium text-foreground/60">
          {formatPrice(c.listing.priceMinorUnits, c.listing.currencyCode, locale)}
        </span>
      </div>
    </Link>
  );
}
