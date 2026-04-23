'use client';

import { useState, useTransition, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Send, Target, Loader2, AlertTriangle } from 'lucide-react';
import { sendMessage } from '@/lib/chat/actions';

/**
 * MessageComposer — textarea + Send button for the thread view.
 *
 * Supports:
 *   - Plain text message (default)
 *   - Offer mode — toggle + amount input; sends sent_as_offer=true
 * Auto-growing textarea, Enter-to-send (Shift+Enter = newline).
 *
 * Filter A (phone-in-text) + Filter C (discriminatory wording) enforce
 * server-side via sendMessage action; errors surface inline.
 */

interface Props {
  conversationId: number;
  currencyCode: 'KWD' | 'USD' | 'AED' | 'SAR';
  blocked?: boolean;
  locale: 'ar' | 'en';
}

export default function MessageComposer({
  conversationId,
  currencyCode,
  blocked,
  locale: _locale,
}: Props) {
  const t = useTranslations('marketplace.chat.thread');
  const tErr = useTranslations('marketplace.chat.errors');
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [body, setBody] = useState('');
  const [isOffer, setIsOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSend =
    !blocked &&
    body.trim().length > 0 &&
    body.trim().length <= 2000 &&
    (!isOffer || parseFloat(offerAmount) > 0);

  function submit() {
    if (!canSend) return;
    setError(null);
    const offerMinor =
      isOffer && offerAmount
        ? Math.round(parseFloat(offerAmount) * 1000)
        : null;

    startTransition(async () => {
      const result = await sendMessage({
        conversation_id: conversationId,
        body: body.trim(),
        sent_as_offer: isOffer,
        offer_amount_minor: offerMinor ?? null,
      });
      if (!result.ok) {
        setError(tErr(result.error as any, { default: tErr('generic') }));
        return;
      }
      // Clear on success — router.refresh() pulls the new message in
      setBody('');
      setOfferAmount('');
      setIsOffer(false);
      router.refresh();
      // Restore focus for continuing to type
      requestAnimationFrame(() => textareaRef.current?.focus());
    });
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // Auto-resize
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  if (blocked) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-600 dark:text-rose-400">
        <AlertTriangle size={18} className="mx-auto mb-1.5" />
        {t('blockedBanner')}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-card p-3">
      {isOffer && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5">
          <Target size={14} className="text-amber-500" />
          <span className="text-xs font-medium text-foreground/70">
            {t('offerAmountLabel')}:
          </span>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {currencyCode}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.001"
            value={offerAmount}
            onChange={e => setOfferAmount(e.target.value)}
            placeholder={t('offerAmountPlaceholder')}
            className="flex-1 rounded-md bg-background px-2 py-1 text-sm outline-none ring-1 ring-border/60 focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            type="button"
            onClick={() => {
              setIsOffer(false);
              setOfferAmount('');
            }}
            className="text-[10px] font-medium text-foreground/60 hover:text-foreground"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={e => {
            setBody(e.target.value);
            autoResize(e.target);
          }}
          onKeyDown={handleKey}
          placeholder={t('composerPlaceholder')}
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{ minHeight: '40px', maxHeight: '160px' }}
        />

        {/* Offer toggle */}
        {!isOffer && (
          <button
            type="button"
            onClick={() => setIsOffer(true)}
            title={t('offerCompose')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
          >
            <Target size={16} />
          </button>
        )}

        {/* Send */}
        <button
          type="button"
          onClick={submit}
          disabled={!canSend || isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} className="rtl:-scale-x-100" />
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-rose-500">
          {error}
        </p>
      )}

      <p className="text-center text-[10px] text-foreground/40">
        {t('phoneRemovedNotice')}
      </p>
    </div>
  );
}
