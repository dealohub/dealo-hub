'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RideListing } from './rides-data';

/**
 * RideDetailMobileActionBar — fixed bottom pill that appears on
 * mobile after the user scrolls past the hero, giving Phone +
 * WhatsApp shortcuts without scrolling back up.
 */

interface Props {
  listing: RideListing;
}

const genPhone = (id: number) => {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (
    '+971 4 ' +
    String(1000 + ((h >>> 5) % 9000)) +
    ' ' +
    String(1000 + ((h >>> 9) % 9000))
  );
};

export const RideDetailMobileActionBar = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.purchase');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const phone = genPhone(listing.id);
  const waNumber = phone.replace(/[^0-9]/g, '');
  const waMessage = encodeURIComponent(
    t('waMessage', { title: listing.title, id: listing.id }),
  );

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
              {listing.price}
            </p>
          </div>

          <a
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white transition active:scale-95"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={16} strokeWidth={2.4} />
          </a>
          <a
            href={`tel:${waNumber}`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white transition active:scale-95"
            style={{ background: '#dc2626' }}
          >
            <Phone size={13} strokeWidth={2.4} />
            {t('call')}
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RideDetailMobileActionBar;
