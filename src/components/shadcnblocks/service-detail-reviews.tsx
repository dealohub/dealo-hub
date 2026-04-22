import { getTranslations } from 'next-intl/server';
import { Star, Check, Clock, Sparkles, Coins } from 'lucide-react';
import { getReviewsForProvider, type ServiceReviewRow } from '@/lib/services/queries';

/**
 * Phase 8a — post-completion reviews panel.
 *
 * Renders up to 10 most recent reviews for a provider. Each review
 * shows rating + body + tag chips (on-time / clean-work / fair-price).
 * Reviews are keyed to completed bookings (P5 invariant).
 */

function ReviewRow({ review, locale }: { review: ServiceReviewRow; locale: 'ar' | 'en' }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);
  const date = new Date(review.createdAt).toLocaleDateString(
    locale === 'ar' ? 'ar-KW' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  return (
    <article className="border-b border-border/40 py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {review.reviewerAvatarUrl ? (
            <img
              src={review.reviewerAvatarUrl}
              alt={review.reviewerDisplayName}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-border/60"
            />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-foreground/10 text-[11px] font-semibold text-foreground/70">
              {review.reviewerDisplayName[0] ?? '?'}
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-foreground">
              {review.reviewerDisplayName}
            </div>
            <div className="flex items-center gap-0.5">
              {stars.map((filled, i) => (
                <Star
                  key={i}
                  size={11}
                  className={
                    filled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-foreground/20'
                  }
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-[10.5px] text-foreground/50">{date}</span>
      </div>

      {review.body && (
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
          {review.body}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {review.tagOnTime === true && <Tag Icon={Clock} label="في الوقت" />}
        {review.tagCleanWork === true && <Tag Icon={Sparkles} label="شغل نظيف" />}
        {review.tagFairPrice === true && <Tag Icon={Coins} label="سعر عادل" />}
      </div>
    </article>
  );
}

function Tag({ Icon, label }: { Icon: typeof Check; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
      <Icon size={10} />
      {label}
    </span>
  );
}

interface Props {
  providerId: string;
  locale: 'ar' | 'en';
}

export default async function ServiceDetailReviews({ providerId, locale }: Props) {
  const t = await getTranslations('servicesDetail.reviews');
  const reviews = await getReviewsForProvider(providerId, 10);

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 p-6 text-center">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5">
          <Star size={14} className="text-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">{t('emptyTitle')}</p>
        <p className="mt-1 text-[11px] text-foreground/60">{t('emptyBody')}</p>
      </div>
    );
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border/50 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {t('title')}
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-foreground">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-[11px] text-foreground/55">
            · {reviews.length} {t('reviews')}
          </span>
        </div>
      </header>

      <div className="px-4">
        {reviews.map((r) => (
          <ReviewRow key={r.id} review={r} locale={locale} />
        ))}
      </div>
    </div>
  );
}
