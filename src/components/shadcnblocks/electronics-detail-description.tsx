import { useTranslations } from 'next-intl';
import type { ElectronicsDetail } from '@/lib/electronics/types';

/**
 * Electronics detail — description block.
 *
 * Plain-text pre-wrap render of the seller's free description. We
 * deliberately keep this minimal — structured fields already
 * captured the important signals (specs, battery, provenance,
 * repairs). Description is for storytelling / context.
 *
 * Stats strip shown at the bottom: views, saves, inquiries, photos.
 */

interface Props {
  listing: ElectronicsDetail;
}

export default function ElectronicsDetailDescription({ listing }: Props) {
  const t = useTranslations('electronicsDetail');
  return (
    <section className="space-y-4" aria-label="Description">
      <header>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t('descriptionTitle')}
        </h2>
      </header>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/85">
        {listing.description}
      </p>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/40 pt-4 text-[11px] text-foreground/55">
        <span>
          <strong className="text-foreground/80 tabular-nums">
            {listing.viewCount.toLocaleString('en-US')}
          </strong>{' '}
          {t('statViews')}
        </span>
        <span>
          <strong className="text-foreground/80 tabular-nums">
            {listing.saveCount.toLocaleString('en-US')}
          </strong>{' '}
          {t('statSaves')}
        </span>
        <span>
          <strong className="text-foreground/80 tabular-nums">
            {listing.chatInitiationCount.toLocaleString('en-US')}
          </strong>{' '}
          {t('statInquiries')}
        </span>
        <span>
          <strong className="text-foreground/80 tabular-nums">
            {listing.images.length}
          </strong>{' '}
          {t('statPhotos')}
        </span>
      </div>
    </section>
  );
}
