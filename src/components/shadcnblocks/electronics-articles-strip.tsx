import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen } from 'lucide-react';

/**
 * Electronics hub — editorial articles strip.
 *
 * 3 hand-authored guides covering the highest-friction GCC
 * tech-buying questions that map back to the Phase 7 doctrine
 * pillars:
 *
 *   1. "How to verify an IMEI at handover"     (pillar P2)
 *   2. "Battery health explained — green / amber / red" (pillar P3)
 *   3. "Badal safely — the 5-step handshake"   (pillar P8)
 *
 * Content stays hardcoded in the i18n JSON (electronicsHub.articles)
 * for now. When the CMS lands this component rewires to a fetch.
 * Mirrors the structure of properties-articles-strip.
 */

export default function ElectronicsArticlesStrip() {
  const t = useTranslations('electronicsHub.articles');

  const articles = [
    {
      tag: t('article1Tag'),
      title: t('article1Title'),
      excerpt: t('article1Excerpt'),
      readTime: t('article1ReadTime'),
    },
    {
      tag: t('article2Tag'),
      title: t('article2Title'),
      excerpt: t('article2Excerpt'),
      readTime: t('article2ReadTime'),
    },
    {
      tag: t('article3Tag'),
      title: t('article3Title'),
      excerpt: t('article3Excerpt'),
      readTime: t('article3ReadTime'),
    },
  ];

  return (
    <section className="border-t border-border/40 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/60">
              <BookOpen size={12} />
              {t('eyebrow')}
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h2>
          </div>
          <Link
            href="#"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-foreground/70 transition hover:text-foreground sm:inline-flex"
          >
            {t('viewAll')}
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((a, i) => (
            <article
              key={i}
              className="group rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="mb-3">
                <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                  {a.tag}
                </span>
              </div>
              <h3 className="mb-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                {a.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-foreground/60">
                {a.excerpt}
              </p>
              <p className="mt-3 text-[11px] text-foreground/50">
                {a.readTime}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
