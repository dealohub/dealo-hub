import { useTranslations } from 'next-intl';
import { Shield, MessageCircle, Video } from 'lucide-react';
import { WaitlistForm } from '@/components/landing/WaitlistForm';

/**
 * Hero — Landing page primary section.
 *
 * Layout: Left-Aligned Asymmetric Split (DESIGN.md Section 7)
 * - Desktop: 55%/45% split (content / visual)
 * - Mobile: stacked, content first, visual below
 *
 * NO centered hero. NO stock imagery. NO generic CTAs.
 * The visual right-side is a stacked "deck" of trust-signal cards.
 */
export function Hero() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative min-h-dvh-hero overflow-hidden">
      {/* Ambient background — subtle zinc gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-canvas-zinc via-pure-surface to-canvas-zinc"
      />

      <div className="container relative py-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[55%_45%] lg:gap-12 items-center">
          {/* ───── Left: Content (55%) ───── */}
          <div className="flex flex-col gap-6 max-w-xl">
            {/* Pre-heading badge */}
            <span className="
              inline-flex items-center gap-1.5 self-start
              rounded-full border border-warm-amber/30
              bg-warm-amber/5 px-3 py-1
              typo-label text-warm-amber
            ">
              <Shield className="size-3" />
              {t('badge')}
            </span>

            {/* Headline */}
            <h1 className="
              text-display-xl font-extrabold tracking-tight text-charcoal-ink
              leading-[1.05]
            ">
              {t('headlinePrefix')}
              <span className="text-warm-amber">{t('headlineAccent')}</span>
              {t('headlineSuffix')}
            </h1>

            {/* Subline */}
            <p className="text-body-large text-muted-steel max-w-lg leading-relaxed">
              {t('subline')}
            </p>

            {/* Inline trust signals */}
            <ul className="flex flex-wrap gap-3 mt-2">
              <li className="inline-flex items-center gap-1.5 text-body-small text-charcoal-ink">
                <MessageCircle className="size-4 text-success-sage" />
                {t('pill1')}
              </li>
              <li className="inline-flex items-center gap-1.5 text-body-small text-charcoal-ink">
                <Shield className="size-4 text-success-sage" />
                {t('pill2')}
              </li>
              <li className="inline-flex items-center gap-1.5 text-body-small text-charcoal-ink">
                <Video className="size-4 text-success-sage" />
                {t('pill3')}
              </li>
            </ul>

            {/* Waitlist form */}
            <div className="mt-4">
              <WaitlistForm />
            </div>
          </div>

          {/* ───── Right: Asymmetric card deck (45%) ───── */}
          <HeroCardDeck />
        </div>
      </div>
    </section>
  );
}

/**
 * Decorative asymmetric card stack — 3 placeholder "feature listing" cards.
 * Fanned at slight angles to feel editorial, not grid-uniform.
 */
function HeroCardDeck() {
  const t = useTranslations('landing.hero.cards');

  const cards = [
    {
      category: t('card1Category'),
      title: t('card1Title'),
      tag: t('card1Tag'),
      tagColor: 'text-success-sage bg-success-sage/10',
      rotate: 'lg:rotate-[-2deg]',
      offset: 'lg:translate-y-0',
    },
    {
      category: t('card2Category'),
      title: t('card2Title'),
      tag: t('card2Tag'),
      tagColor: 'text-warm-amber bg-warm-amber/10',
      rotate: 'lg:rotate-[1deg]',
      offset: 'lg:translate-y-6',
    },
    {
      category: t('card3Category'),
      title: t('card3Title'),
      tag: t('card3Tag'),
      tagColor: 'text-charcoal-ink bg-zinc-100',
      rotate: 'lg:rotate-[-1deg]',
      offset: 'lg:translate-y-3',
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="
        relative hidden lg:flex flex-col gap-4
      "
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`
            rounded-2xl bg-pure-surface border border-ghost-border p-5
            shadow-card
            transition-transform duration-300
            hover:-translate-y-1 hover:shadow-card-hover
            ${card.rotate} ${card.offset}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="typo-label text-muted-steel">{card.category}</span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 typo-label ${card.tagColor}`}>
              {card.tag}
            </span>
          </div>

          <h3 className="text-heading-3 font-semibold mb-1">{card.title}</h3>

          {/* Placeholder media bar */}
          <div className="h-16 rounded-lg bg-gradient-to-br from-canvas-zinc to-deep-layer mt-3" />
        </div>
      ))}
    </div>
  );
}
