'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import { startOrResumeConversation } from '@/lib/chat/actions';

/**
 * ContactSellerButton — client-side CTA wrapper.
 *
 * Clicked from any listing detail page (rides or properties). Calls
 * startOrResumeConversation; on success, routes to /messages/[id].
 * On failure (not authed, own listing, etc.), surfaces an inline
 * error + offers a sign-in redirect for the not_authenticated case.
 *
 * Variants:
 *   - 'primary'   — full button with Send icon + "Contact seller"
 *   - 'offer'     — amber Make-offer variant; starts with sent_as_offer=true
 *                   and an empty body (user types their offer in the thread)
 *   - 'compact'   — smaller mobile-actionbar-style button
 */

interface Props {
  listingId: number;
  locale: 'ar' | 'en';
  variant?: 'primary' | 'offer' | 'compact';
  labelOverride?: string;
  className?: string;
}

export default function ContactSellerButton({
  listingId,
  locale,
  variant = 'primary',
  labelOverride,
  className,
}: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const tErr = useTranslations('marketplace.chat.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startOrResumeConversation({
        listing_id: listingId,
        // No opening_message — user writes one in the thread.
        sent_as_offer: false,
        offer_amount_minor: null,
      });
      if (!result.ok) {
        if (result.error === 'not_authenticated') {
          router.push(
            `/${locale}/signin?next=/${locale}/messages&action=contact_seller`,
          );
          return;
        }
        setError(tErr(result.error as any, { default: tErr('generic') }));
        return;
      }
      router.push(`/${locale}/messages/${result.data!.conversation_id}`);
    });
  }

  const defaultLabels = {
    primary: t('panelCtaContactSeller'),
    offer: t('panelCtaMakeOffer'),
    compact: t('mobileChat'),
  };
  const label = labelOverride ?? defaultLabels[variant];

  const classes =
    variant === 'compact'
      ? 'inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'
      : variant === 'offer'
      ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'
      : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className={className ?? ''}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={classes}
      >
        {isPending ? (
          <Loader2 size={variant === 'compact' ? 12 : 16} className="animate-spin" />
        ) : (
          <MessageCircle size={variant === 'compact' ? 12 : 16} />
        )}
        {label}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1 text-[11px] text-rose-500"
        >
          <AlertTriangle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}
