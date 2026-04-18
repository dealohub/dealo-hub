import { getTranslations } from 'next-intl/server';
import { PackageOpen } from 'lucide-react';

/**
 * ProfileListingsPlaceholder — empty state until BRIEF-004 ships listing creation.
 * Once listings exist, the Sprint-2 page will swap this out for a real grid.
 */
export async function ProfileListingsPlaceholder() {
  const t = await getTranslations('profile.listings');

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-heading-2 text-charcoal-ink">{t('title')}</h2>
      <div
        className="
          flex flex-col items-center gap-2 py-12 px-4
          rounded-2xl border border-whisper-divider bg-canvas-zinc
          text-center
        "
      >
        <span
          className="
            flex items-center justify-center size-12 rounded-full
            bg-pure-surface border border-whisper-divider text-muted-steel
          "
        >
          <PackageOpen className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <p className="text-body text-charcoal-ink">{t('placeholderTitle')}</p>
        <p className="text-body-small text-muted-steel">{t('placeholderSubtitle')}</p>
      </div>
    </section>
  );
}
