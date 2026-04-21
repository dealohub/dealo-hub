import { useTranslations } from 'next-intl';
import { ShieldCheck, Scale, DoorOpen, CalendarCheck2, BadgeCheck } from 'lucide-react';

/**
 * Properties hub — trust strip.
 *
 * 5-pillar editorial section explicitly naming the Dubizzle KW gaps
 * Dealo closes (Law 74 clarity, no discriminatory filters, structured
 * diwaniya, chalet booking data, Dealo Inspected tier).
 *
 * This is the marketing voice of the doctrine — a single place the
 * founder can point reporters / investors / buyers to for the
 * differentiation narrative.
 */

export default function PropertiesTrustStrip() {
  const t = useTranslations('marketplace.properties.hub.trustStrip');

  const pillars = [
    {
      icon: <Scale size={20} className="text-amber-500" strokeWidth={2.25} />,
      title: t('pillar1Title'),
      body: t('pillar1Body'),
    },
    {
      icon: <ShieldCheck size={20} className="text-sky-500" strokeWidth={2.25} />,
      title: t('pillar2Title'),
      body: t('pillar2Body'),
    },
    {
      icon: <DoorOpen size={20} className="text-amber-600" strokeWidth={2.25} />,
      title: t('pillar3Title'),
      body: t('pillar3Body'),
    },
    {
      icon: <CalendarCheck2 size={20} className="text-sky-600" strokeWidth={2.25} />,
      title: t('pillar4Title'),
      body: t('pillar4Body'),
    },
    {
      icon: <BadgeCheck size={20} className="text-emerald-500" strokeWidth={2.25} />,
      title: t('pillar5Title'),
      body: t('pillar5Body'),
    },
  ];

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-background via-foreground/[0.015] to-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-foreground/60">{t('subline')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-5 transition hover:border-border"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
                {p.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="text-xs leading-relaxed text-foreground/60">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
