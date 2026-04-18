import { getTranslations } from 'next-intl/server';
import { Settings2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from './AvatarDisplay';
import { TrustSignalsStack } from './TrustSignalsStack';
import { SellerStatsBar } from './SellerStatsBar';
import type { PublicProfile } from '@/lib/profile/queries';

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwner: boolean;
}

/**
 * ProfileHeader — public profile hero block.
 *
 * Layout:
 *   mobile:  avatar on top (centered), details below
 *   ≥ sm:    avatar at start, details on end
 *
 * The "Edit profile" CTA only appears when `isOwner` is true.
 */
export async function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
  const t = await getTranslations('profile.header');

  return (
    <section
      className="
        flex flex-col sm:flex-row gap-5 sm:gap-6
        items-center sm:items-start
        text-center sm:text-start
      "
    >
      <AvatarDisplay
        src={profile.avatar_url}
        name={profile.display_name}
        size="xl"
        className="shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-col gap-3 items-center sm:items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 text-charcoal-ink truncate">
            {profile.display_name}
          </h1>
          {profile.handle ? (
            <p className="text-body-small text-muted-steel font-mono" lang="en">
              @{profile.handle}
            </p>
          ) : isOwner ? (
            <p className="text-body-small text-muted-steel">{t('noHandleYet')}</p>
          ) : null}
        </div>

        {/* Trust signals (server component — awaits translations). */}
        <TrustSignalsStack signals={profile} />

        {/* Bio, if present. Preserve line breaks + RTL alignment. */}
        {profile.bio && (
          <p className="max-w-prose text-body text-charcoal-ink whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <SellerStatsBar
          activeCount={profile.active_listings_count}
          soldCount={profile.sold_listings_count}
          ratingAvg={profile.rating_avg}
          ratingCount={profile.rating_count}
        />

        {/* Owner-only edit CTA */}
        {isOwner && (
          <Link href="/profile/edit" className="mt-1">
            <Button variant="secondary" size="sm">
              <Settings2 className="size-4" />
              <span>{t('editProfile')}</span>
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
