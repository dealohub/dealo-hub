import { useTranslations, useLocale } from 'next-intl';
import { Target, Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '@/lib/chat/types';
import { formatPrice } from '@/lib/format';
import ServiceMessageCard from './service-message-cards';

/**
 * MessageBubble — a single message in the thread view.
 *
 * Alignment: own messages right (ltr) or left (rtl); other's messages
 * opposite. Offer messages get a distinctive amber bubble + badge.
 * Read receipts: ✓ sent, ✓✓ read (only shown for own messages).
 *
 * Phase 8a: structured services kinds (quote_request, quote_response,
 * booking_proposal, completion_mark) are delegated to
 * ServiceMessageCard — distinct visual treatment per kind.
 */

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
}

const STRUCTURED_KINDS: ReadonlyArray<ChatMessage['kind']> = [
  'quote_request', 'quote_response', 'booking_proposal', 'completion_mark',
];

function formatTime(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleTimeString(
    locale === 'ar' ? 'ar-KW' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn',
    },
  );
}

export default function MessageBubble({ message, isOwn, currencyCode }: Props) {
  const t = useTranslations('marketplace.chat.inbox');
  const locale = useLocale() as 'ar' | 'en';

  const m = message;

  // Phase 8a — structured services kinds render via their own card
  // component. Timestamp + read-receipt footer still rendered below
  // the card for consistency with free_text/offer kinds.
  if (STRUCTURED_KINDS.includes(m.kind)) {
    return (
      <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex w-full flex-col gap-0.5">
          <ServiceMessageCard message={m} isOwn={isOwn} />
          <div
            className={
              'flex items-center gap-1 text-[10px] text-foreground/50 ' +
              (isOwn ? 'justify-end' : 'justify-start')
            }
          >
            <span>{formatTime(m.createdAt, locale)}</span>
            {isOwn && (
              m.readAt ? (
                <CheckCheck size={11} className="text-sky-500" />
              ) : (
                <Check size={11} />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  const isOffer = m.sentAsOffer;

  return (
    <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start')}>
      <div className="flex max-w-[78%] flex-col gap-0.5">
        {/* Offer header */}
        {isOffer && (
          <div
            className={
              'inline-flex items-center gap-1 self-' +
              (isOwn ? 'end' : 'start') +
              ' rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400'
            }
          >
            <Target size={10} strokeWidth={2.5} />
            {t('offerTag')}
          </div>
        )}

        {/* Bubble */}
        <div
          className={
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
            (isOffer
              ? 'bg-amber-500/10 text-foreground ring-1 ring-amber-500/20 ' +
                (isOwn ? 'rounded-ee-sm' : 'rounded-ss-sm')
              : isOwn
              ? 'bg-primary text-primary-foreground rounded-ee-sm'
              : 'bg-foreground/5 text-foreground rounded-ss-sm')
          }
        >
          {isOffer && m.offerAmountMinor != null && (
            <p className="mb-1 font-sans text-lg font-semibold">
              {formatPrice(m.offerAmountMinor, currencyCode, locale)}
            </p>
          )}
          {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
        </div>

        {/* Footer meta */}
        <div
          className={
            'flex items-center gap-1 text-[10px] text-foreground/50 ' +
            (isOwn ? 'justify-end' : 'justify-start')
          }
        >
          <span>{formatTime(m.createdAt, locale)}</span>
          {isOwn && (
            m.readAt ? (
              <CheckCheck size={11} className="text-sky-500" />
            ) : (
              <Check size={11} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
