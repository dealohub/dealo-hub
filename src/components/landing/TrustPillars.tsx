import { useTranslations } from 'next-intl';
import { MessageCircle, ShieldCheck, PenTool, type LucideIcon } from 'lucide-react';

/**
 * TrustPillars — the 3-pillar differentiation story.
 *
 * Each pillar = one anti-Dubizzle moat:
 *   1. Chat-only (phone hidden)
 *   2. AI-Protected (fraud pipeline)
 *   3. Human-Written (no AI-generated spam)
 *
 * This section is the narrative core of the landing page.
 */
export function TrustPillars() {
  const t = useTranslations('landing.trust');

  const pillars: Array<{ icon: LucideIcon; key: 'chat' | 'ai' | 'human' }> = [
    { icon: MessageCircle, key: 'chat' },
    { icon: ShieldCheck, key: 'ai' },
    { icon: PenTool, key: 'human' },
  ];

  return (
    <section className="py-section bg-pure-surface">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-12 max-w-3xl">
          <span className="typo-label text-muted-steel">{t('eyebrow')}</span>
          <h2 className="text-display font-bold text-charcoal-ink">{t('heading')}</h2>
          <p className="text-body-large text-muted-steel">{t('subheading')}</p>
        </div>

        {/* 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map(({ icon: Icon, key }) => (
            <article
              key={key}
              className="
                flex flex-col gap-4 p-6 lg:p-8
                rounded-2xl bg-deep-layer
                border border-whisper-divider
              "
            >
              {/* Icon badge */}
              <div className="
                flex items-center justify-center
                size-12 rounded-xl
                bg-warm-amber/10 text-warm-amber
              ">
                <Icon className="size-6" strokeWidth={2} />
              </div>

              <h3 className="text-heading-2 font-bold text-charcoal-ink">
                {t(`pillars.${key}.title`)}
              </h3>

              <p className="text-body text-muted-steel leading-relaxed">
                {t(`pillars.${key}.description`)}
              </p>

              {/* Differentiator bullet — anti-competitor framing */}
              <p className="
                text-body-small text-charcoal-ink font-medium
                mt-auto pt-4 border-t border-ghost-border
              ">
                {t(`pillars.${key}.vsCompetitor`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
