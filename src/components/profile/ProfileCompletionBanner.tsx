import { getTranslations } from 'next-intl/server';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { PublicProfile } from '@/lib/profile/queries';

interface ProfileCompletionBannerProps {
  profile: PublicProfile;
}

/**
 * ProfileCompletionBanner — amber CTA shown to the owner when profile is
 * missing avatar / bio / handle. Never rendered to other viewers.
 */
export async function ProfileCompletionBanner({ profile }: ProfileCompletionBannerProps) {
  const missing = [
    !profile.avatar_url && 'avatar',
    !profile.bio && 'bio',
    !profile.handle && 'handle',
  ].filter(Boolean) as Array<'avatar' | 'bio' | 'handle'>;

  if (missing.length === 0) return null;

  const t = await getTranslations('profile.completion');

  return (
    <div
      className="
        flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
        p-4 rounded-2xl
        bg-warm-amber/5 border border-warm-amber/20
      "
    >
      <span
        className="
          shrink-0 flex items-center justify-center size-9 rounded-xl
          bg-warm-amber text-white
        "
        aria-hidden="true"
      >
        <Sparkles className="size-4" />
      </span>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p className="text-body font-medium text-charcoal-ink">
          {t('title')}
        </p>
        <p className="text-body-small text-muted-steel">
          {t('subtitle', { missing: missing.map(m => t(`fields.${m}`)).join('، ') })}
        </p>
      </div>

      <Link
        href="/profile/edit"
        className="
          inline-flex items-center gap-1.5 self-start sm:self-center
          px-3 h-9 rounded-lg
          bg-warm-amber text-white
          text-body-small font-semibold
          hover:bg-warm-amber-700
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2
        "
      >
        <span>{t('cta')}</span>
        <ArrowRight className="size-4 rtl:rotate-180" />
      </Link>
    </div>
  );
}
