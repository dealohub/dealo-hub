import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Info, MessageCircle, Sparkles } from 'lucide-react';
import type { ServiceDetail } from '@/lib/services/types';
import { formatPrice } from '@/lib/format';
import ContactSellerButton from '@/components/chat/contact-seller-button';

/**
 * Phase 8a — sticky purchase panel on /services/[slug].
 *
 * Right-column CTA surface carrying P7 transparent price + P8 Dealo
 * Guarantee callout + chat-only contact (DECISIONS #2).
 *
 * Phase 8a = only chat CTA. The structured quote_request primitive
 * ships in chunk 4 (needs server action + chat kind-dispatcher wiring).
 * For now, clicking Contact opens the existing chat conversation with
 * the provider — that's the fallback path until quote_request lands.
 */

interface Props {
  listing: ServiceDetail;
  locale: 'ar' | 'en';
}

export default async function ServiceDetailPurchasePanel({ listing, locale }: Props) {
  const t = await getTranslations('servicesDetail.purchase');
  const f = listing.fields;

  // Price lines
  const hourlyLine =
    f.hourly_rate_minor_units != null
      ? formatPrice(f.hourly_rate_minor_units, 'KWD', locale)
      : null;
  const fixedLine =
    f.fixed_price_minor_units != null
      ? formatPrice(f.fixed_price_minor_units, 'KWD', locale)
      : null;

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        {/* Price block */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-foreground/50">
            {t('priceLabel')}
          </div>
          {f.price_mode === 'hourly' && hourlyLine && (
            <div className="mt-1">
              <span className="font-display text-3xl font-bold text-foreground">
                {hourlyLine}
              </span>
              <span className="ms-2 text-sm text-foreground/55">
                / {t('hour')}
              </span>
              {f.min_hours && (
                <div className="mt-1 text-xs text-foreground/60">
                  {t('minHours', { hours: f.min_hours })}
                </div>
              )}
            </div>
          )}
          {f.price_mode === 'fixed' && fixedLine && (
            <div className="mt-1">
              <span className="font-display text-3xl font-bold text-foreground">
                {fixedLine}
              </span>
              <span className="ms-2 text-sm text-foreground/55">{t('fixedPrice')}</span>
            </div>
          )}
          {f.price_mode === 'hybrid' && (
            <div className="mt-1 space-y-2">
              {hourlyLine && (
                <div>
                  <span className="font-display text-2xl font-bold text-foreground">
                    {hourlyLine}
                  </span>
                  <span className="ms-2 text-sm text-foreground/55">/ {t('hour')}</span>
                  {f.min_hours && (
                    <span className="ms-2 text-xs text-foreground/55">
                      · {t('minHoursShort', { hours: f.min_hours })}
                    </span>
                  )}
                </div>
              )}
              <div className="h-px bg-border/50" />
              {fixedLine && (
                <div>
                  <span className="font-display text-2xl font-bold text-foreground">
                    {fixedLine}
                  </span>
                  <span className="ms-2 text-sm text-foreground/55">{t('fixedAlt')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA primary — chat (phase 8a fallback until quote_request ships) */}
        <ContactSellerButton
          listingId={listing.id}
          locale={locale}
          variant="primary"
          labelOverride={t('contactCta')}
        />

        {/* CTA secondary — Request quote (stub, visibly scheduled for chunk 4) */}
        <div className="mt-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-center">
          <Sparkles size={14} className="mx-auto mb-1 text-primary" />
          <p className="text-[11px] font-semibold text-foreground">
            {t('quoteFlowTitle')}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-foreground/60">
            {t('quoteFlowBody')}
          </p>
        </div>

        {/* P8 — Dealo Guarantee */}
        <div className="mt-4 rounded-xl bg-emerald-500/5 p-3 ring-1 ring-inset ring-emerald-500/20">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('guaranteeTitle')}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/70">
                {t('guaranteeBody')}
              </p>
            </div>
          </div>
        </div>

        {/* DECISIONS.md #2 — chat-only invariant callout */}
        <div className="mt-3 flex items-start gap-2 text-[10.5px] leading-relaxed text-foreground/55">
          <Info size={11} className="mt-0.5 shrink-0" />
          <p>
            <MessageCircle size={11} className="me-1 inline" />
            {t('chatOnlyNote')}
          </p>
        </div>
      </div>
    </aside>
  );
}
