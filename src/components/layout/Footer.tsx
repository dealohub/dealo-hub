import { useTranslations } from 'next-intl';

/**
 * Minimal pre-launch footer.
 * Will expand to include links to about, safety, terms, etc. in Sprint 2+.
 */
export function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-whisper-divider bg-pure-surface">
      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-body-small text-muted-steel">
          © {year} Dealo Hub. {t('allRightsReserved')}
        </p>

        <p className="typo-label text-muted-steel">
          {t('launchingSoonInKuwait')}
        </p>
      </div>
    </footer>
  );
}
