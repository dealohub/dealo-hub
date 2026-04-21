'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Rocket,
  Loader2,
  AlertTriangle,
  Edit,
  MapPin,
  Truck,
  Package,
} from 'lucide-react';
import { publishListing } from '@/lib/listings/actions';
import type { Condition, PriceMode, DeliveryOption } from '@/lib/listings/validators';

/**
 * PreviewPublish — Step 8 of /sell.
 *
 * Read-only summary of every step + "Publish" button. On publish, the
 * server action validates via PublishSchema, inserts into `listings`,
 * moves draft images to the listing folder, kicks off embedding, and
 * redirects to the new listing's vertical detail page (rides/properties)
 * based on category.
 *
 * Validation failures surface field errors below the relevant section
 * with an "Edit" link back to the matching step.
 */

export interface PreviewData {
  title: string;
  description: string;
  condition: Condition;
  brand: string | null;
  model: string | null;
  priceMinorUnits: number;
  priceMode: PriceMode;
  minOfferMinorUnits: number | null;
  cityName: string;
  areaName: string | null;
  deliveryOptions: DeliveryOption[];
  imageUrls: string[];
  categoryName: string;
}

interface Props {
  locale: 'ar' | 'en';
  data: PreviewData;
}

function formatPrice(minor: number, locale: 'ar' | 'en'): string {
  const kwd = minor / 1000;
  return kwd.toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-US', {
    numberingSystem: 'latn',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export default function PreviewPublish({ locale, data }: Props) {
  const t = useTranslations('sell.step.preview');
  const tSection = useTranslations('sell.step.preview.section');
  const tCond = useTranslations('sell.condition');
  const tMode = useTranslations('sell.priceMode');
  const tDelivery = useTranslations('sell.delivery');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handlePublish() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await publishListing(locale);
      // publishListing either redirects (success — this path never returns)
      // or returns { ok: false, error, fieldErrors? }
      if (result && !('ok' in result === false)) {
        // Should not reach here on success (redirect throws)
      }
      if (result && 'ok' in result && result.ok === false) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  }

  const hasValidationErrors = Object.keys(fieldErrors).length > 0;
  const deliveryIcon = (opt: DeliveryOption) =>
    opt === 'pickup' ? MapPin : opt === 'seller_delivers' ? Truck : Package;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* Cover image */}
        {data.imageUrls[0] && (
          <div className="relative aspect-[16/9] w-full bg-foreground/5">
            <Image
              src={data.imageUrls[0]}
              alt={data.title}
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
              priority
            />
            {data.imageUrls.length > 1 && (
              <div className="absolute bottom-2 end-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
                +{data.imageUrls.length - 1}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 p-5">
          {/* Category + edit */}
          <SummaryRow
            label={tSection('category')}
            editHref={`/${locale}/sell/category`}
            editLabel={t('edit')}
            value={data.categoryName}
          />

          {/* Title */}
          <div className="space-y-1">
            <h2 className="font-sans text-xl font-semibold leading-tight text-foreground">
              {data.title}
            </h2>
            {(data.brand || data.model) && (
              <p className="text-xs text-foreground/60">
                {[data.brand, data.model].filter(Boolean).join(' · ')}
              </p>
            )}
            <Link
              href={`/${locale}/sell/details`}
              className="inline-flex items-center gap-1 text-[11px] text-foreground/60 transition hover:text-foreground"
            >
              <Edit size={10} />
              {t('edit')}
            </Link>
          </div>

          {/* Description */}
          <div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {data.description}
            </p>
          </div>

          {/* Price */}
          <div className="rounded-xl bg-foreground/[0.03] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-2xl font-semibold text-foreground">
                {formatPrice(data.priceMinorUnits, locale)} KWD
              </span>
              <span className="text-xs text-foreground/60">
                {tMode(`${data.priceMode}.label` as any)}
              </span>
            </div>
            {data.priceMode === 'best_offer' && data.minOfferMinorUnits && (
              <div className="mt-1 text-xs text-foreground/60">
                {t('minOfferLabel')}: {formatPrice(data.minOfferMinorUnits, locale)} KWD
              </div>
            )}
            <div className="mt-2 text-xs">
              <span className="text-foreground/60">{t('conditionLabel')}: </span>
              <span className="font-medium text-foreground">
                {tCond(data.condition as any)}
              </span>
            </div>
            <Link
              href={`/${locale}/sell/price`}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-foreground/60 transition hover:text-foreground"
            >
              <Edit size={10} />
              {t('edit')}
            </Link>
          </div>

          {/* Location */}
          <SummaryRow
            label={tSection('location')}
            editHref={`/${locale}/sell/location`}
            editLabel={t('edit')}
            value={[data.cityName, data.areaName].filter(Boolean).join(' · ')}
          />

          {/* Delivery */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                {tSection('delivery')}
              </span>
              <Link
                href={`/${locale}/sell/delivery`}
                className="inline-flex items-center gap-1 text-[11px] text-foreground/60 transition hover:text-foreground"
              >
                <Edit size={10} />
                {t('edit')}
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.deliveryOptions.map(opt => {
                const Icon = deliveryIcon(opt);
                return (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs text-foreground/80"
                  >
                    <Icon size={11} />
                    {tDelivery(`${opt}.label` as any)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {hasValidationErrors && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
        >
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={12} />
            {t('validationFailed')}
          </p>
          <ul className="ms-5 list-disc space-y-0.5">
            {Object.entries(fieldErrors).map(([k, v]) => (
              <li key={k}>
                <code className="font-mono text-[10px]">{k}</code>: {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && !hasValidationErrors && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </div>
      )}

      {/* Publish button */}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t('publishing')}
          </>
        ) : (
          <>
            <Rocket size={18} />
            {t('publish')}
          </>
        )}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  editHref,
  editLabel,
}: {
  label: string;
  value: string;
  editHref: string;
  editLabel: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          {label}
        </span>
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 text-[11px] text-foreground/60 transition hover:text-foreground"
        >
          <Edit size={10} />
          {editLabel}
        </Link>
      </div>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
