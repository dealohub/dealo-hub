'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/format';
import type { RideDetail } from '@/lib/rides/types';

/**
 * RideDetailMobileActionBar — fixed bottom pill that appears on
 * mobile after the user scrolls past the hero, giving quick-contact
 * shortcuts without scrolling back up.
 *
 * Per Decision 2 (chat-only contact), phone numbers are never exposed.
 * The Phone and WhatsApp buttons are visual entry points that will
 * open the in-app chat flow in Phase 5+. For V1 they are wired to
 * noop handlers so the UI stays intact without a broken `tel:` link.
 */

interface Props {
  listing: RideDetail;
  locale: 'ar' | 'en';
}

export const RideDetailMobileActionBar = ({ listing, locale }: Props) => {
  const t = useTranslations('marketplace.rides.detail.purchase');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[60] flex items-center gap-2 rounded-2xl border border-foreground/15 bg-background/95 p-2 shadow-2xl backdrop-blur-lg lg:hidden"
        >
          <div className="min-w-0 flex-1 px-2">
            <p className="truncate text-[10.5px] text-foreground/55">
              {listing.title}
            </p>
            <p className="font-calSans text-[15px] font-extrabold tabular-nums leading-none text-foreground">
              {formatPrice(listing.priceMinorUnits, listing.currencyCode, locale)}
            </p>
          </div>

          {/* Chat (placeholder — opens in Phase 5+ once in-app chat ships) */}
          <button
            type="button"
            aria-label={t('whatsapp')}
            title={t('whatsapp')}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white transition active:scale-95"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={16} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label={t('call')}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white transition active:scale-95"
            style={{ background: '#dc2626' }}
          >
            <Phone size={13} strokeWidth={2.4} />
            {t('call')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RideDetailMobileActionBar;
