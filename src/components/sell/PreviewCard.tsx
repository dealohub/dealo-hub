'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Pencil,
  Video as VideoIcon,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { PriceModeBadge } from './PriceModeBadge';
import { publishListing } from '@/lib/listings/actions';
import type {
  Condition,
  DeliveryOption,
  PriceMode,
} from '@/lib/listings/validators';
import { cn } from '@/lib/utils';

interface PreviewCardProps {
  draft: {
    title: string;
    description: string;
    condition: Condition | null;
    brand: string | null;
    model: string | null;
    category_name: string;
    subcategory_name: string | null;
    price_minor_units: number | null;
    price_mode: PriceMode | null;
    min_offer_minor_units: number | null;
    city_name: string;
    area_name: string | null;
    delivery_options: DeliveryOption[];
    authenticity_confirmed: boolean;
    has_receipt: boolean;
    serial_number: string | null;
    image_urls: string[];
    video_url: string | null;
    is_luxury: boolean;
  };
}

function formatKwd(minor: number | null): string {
  if (minor == null) return '—';
  const n = minor / 1000;
  return `${Number.isInteger(n) ? n : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} KWD`;
}

export function PreviewCard({ draft }: PreviewCardProps) {
  const locale = useLocale();
  const t = useTranslations('sell.step.preview');
  const tCond = useTranslations('sell.condition');
  const tDelivery = useTranslations('sell.delivery');
  const tErr = useTranslations('sell.errors');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function publish() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await publishListing(locale === 'en' ? 'en' : 'ar');
      // publishListing redirects on success; we only reach here on failure.
      if (res && 'ok' in res && res.ok === false) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cover + gallery strip */}
      {draft.image_urls.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-whisper-divider bg-canvas-zinc">
            <Image
              src={draft.image_urls[0]}
              alt={draft.title}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              priority
            />
            {draft.video_url && (
              <span className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-charcoal-ink/80 text-white text-caption backdrop-blur-sm">
                <VideoIcon className="size-3" strokeWidth={2} />
                <span>{t('videoIncluded')}</span>
              </span>
            )}
          </div>
          {draft.image_urls.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {draft.image_urls.slice(1, 6).map((url, i) => (
                <div
                  key={url}
                  className="relative aspect-square rounded-lg overflow-hidden bg-canvas-zinc border border-whisper-divider"
                >
                  <Image
                    src={url}
                    alt={`photo-${i + 2}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title + price row */}
      <div className="flex flex-col gap-2">
        <h2 className="text-heading-1 text-charcoal-ink">{draft.title || '—'}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-display font-mono tabular-nums text-charcoal-ink" lang="en">
            {formatKwd(draft.price_minor_units)}
          </span>
          {draft.price_mode && <PriceModeBadge mode={draft.price_mode} size="md" />}
        </div>
        {draft.price_mode === 'best_offer' && draft.min_offer_minor_units != null && (
          <p className="text-body-small text-muted-steel">
            {t('minOfferLabel')}: <span lang="en">{formatKwd(draft.min_offer_minor_units)}</span>
          </p>
        )}
      </div>

      {/* Details section */}
      <SectionRow
        title={t('section.category')}
        editHref="/sell/category"
        editLabel={t('edit')}
      >
        <p className="text-body text-charcoal-ink">
          {draft.category_name}
          {draft.subcategory_name && (
            <>
              <span className="mx-2 text-muted-steel" aria-hidden="true">·</span>
              {draft.subcategory_name}
            </>
          )}
        </p>
      </SectionRow>

      <SectionRow
        title={t('section.description')}
        editHref="/sell/details"
        editLabel={t('edit')}
      >
        <p className="text-body text-charcoal-ink whitespace-pre-line">
          {draft.description || '—'}
        </p>
        {(draft.brand || draft.model) && (
          <p className="text-body-small text-muted-steel mt-2">
            {[draft.brand, draft.model].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-body-small text-muted-steel mt-1">
          {t('conditionLabel')}:{' '}
          {draft.condition ? tCond(`${draft.condition}.label`) : '—'}
        </p>
      </SectionRow>

      <SectionRow
        title={t('section.location')}
        editHref="/sell/location"
        editLabel={t('edit')}
      >
        <p className="flex items-center gap-1.5 text-body text-charcoal-ink">
          <MapPin className="size-4 text-muted-steel" aria-hidden="true" />
          <span>{draft.area_name ? `${draft.area_name}, ${draft.city_name}` : draft.city_name}</span>
        </p>
      </SectionRow>

      <SectionRow
        title={t('section.delivery')}
        editHref="/sell/delivery"
        editLabel={t('edit')}
      >
        <div className="flex flex-wrap gap-1.5">
          {draft.delivery_options.map(opt => (
            <span
              key={opt}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-canvas-zinc text-body-small text-charcoal-ink border border-whisper-divider"
            >
              {tDelivery(`${opt}.label`)}
            </span>
          ))}
        </div>
      </SectionRow>

      {draft.is_luxury && (
        <SectionRow
          title={t('section.authenticity')}
          editHref="/sell/authenticity"
          editLabel={t('edit')}
        >
          <ul className="flex flex-col gap-1 text-body-small text-charcoal-ink">
            <li className="flex items-center gap-1.5">
              {draft.authenticity_confirmed ? (
                <CheckCircle2 className="size-4 text-success-sage" />
              ) : (
                <AlertCircle className="size-4 text-danger-coral" />
              )}
              {t('authConfirmed')}
            </li>
            {draft.has_receipt && (
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-success-sage" />
                {t('receiptIncluded')}
              </li>
            )}
            {draft.serial_number && (
              <li className="flex items-center gap-1.5 font-mono" lang="en">
                <ShieldCheck className="size-4 text-success-sage" />#{draft.serial_number}
              </li>
            )}
          </ul>
        </SectionRow>
      )}

      {/* Errors */}
      {error === 'validation_failed' && Object.keys(fieldErrors).length > 0 && (
        <FormMessage tone="error">
          {t('validationFailed')}:{' '}
          {Object.entries(fieldErrors)
            .map(([k, v]) => `${k}: ${tErr(v)}`)
            .join(' · ')}
        </FormMessage>
      )}
      {error && error !== 'validation_failed' && (
        <FormMessage tone="error">{tErr(error)}</FormMessage>
      )}

      {/* Publish CTA */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isPending}
          onClick={publish}
        >
          {isPending ? t('publishing') : t('publish')}
        </Button>
      </div>
    </div>
  );
}

function SectionRow({
  title,
  editHref,
  editLabel,
  children,
}: {
  title: string;
  editHref: string;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-2 p-4 rounded-2xl',
        'bg-pure-surface border border-whisper-divider'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-body-small font-semibold text-muted-steel uppercase tracking-wide">
          {title}
        </h3>
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 text-body-small text-muted-steel hover:text-warm-amber-700 underline-offset-2 hover:underline"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          <span>{editLabel}</span>
        </Link>
      </div>
      <div>{children}</div>
    </section>
  );
}
