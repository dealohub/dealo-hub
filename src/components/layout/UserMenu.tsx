'use client';

import { useLocale, useTranslations } from 'next-intl';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, Package, Plus, Settings2, User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { signOut } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
}

/**
 * UserMenu — Radix DropdownMenu replacing the simple display-name link.
 * Trigger: avatar + name (hidden on very narrow screens).
 * Menu: My Profile, My Listings, Edit Profile, Sign Out.
 */
export function UserMenu({ displayName, handle, avatarUrl }: UserMenuProps) {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const profileHref = handle ? `/profile/${handle}` : '/profile/me';

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        asChild
      >
        <button
          type="button"
          aria-label={displayName}
          className="
            inline-flex items-center gap-2
            h-10 ps-1 pe-2 rounded-full
            bg-transparent hover:bg-zinc-100
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-amber focus-visible:ring-offset-2
          "
        >
          <AvatarDisplay src={avatarUrl} name={displayName} size="sm" />
          <span className="hidden sm:inline text-body-small font-medium text-charcoal-ink max-w-[140px] truncate">
            {displayName}
          </span>
          <ChevronDown
            className="hidden sm:block size-3.5 text-muted-steel"
            aria-hidden="true"
          />
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="
            min-w-52 p-1.5 rounded-xl
            bg-pure-surface border border-whisper-divider
            shadow-[0_4px_24px_-8px_rgba(24,24,27,0.15)]
            z-50
            data-[state=open]:animate-fade-in-up
          "
        >
          <div className="px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-body-small font-semibold text-charcoal-ink truncate">
              {displayName}
            </span>
            {handle && (
              <span className="text-caption text-muted-steel font-mono" lang="en">
                @{handle}
              </span>
            )}
          </div>
          <Dropdown.Separator className="h-px bg-whisper-divider my-1" />

          <Item href="/sell" icon={<Plus className="size-4" />}>
            {t('sell')}
          </Item>
          <Item href={profileHref} icon={<User className="size-4" />}>
            {t('profile')}
          </Item>
          <Item href="/my-listings" icon={<Package className="size-4" />}>
            {t('listings')}
          </Item>
          <Item href="/profile/edit" icon={<Settings2 className="size-4" />}>
            {tAuth('editProfile')}
          </Item>

          <Dropdown.Separator className="h-px bg-whisper-divider my-1" />

          <Dropdown.Item
            className={menuItemClass}
            onSelect={e => {
              // Keep the menu open until the server action completes the redirect,
              // otherwise React unmounts the form before it can submit.
              e.preventDefault();
              const fd = new FormData();
              fd.append('locale', locale);
              void signOut(fd);
            }}
          >
            <LogOut className="size-4 text-muted-steel" aria-hidden="true" />
            <span>{tAuth('signOut')}</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

const menuItemClass = cn(
  'w-full flex items-center gap-2',
  'px-2.5 h-9 rounded-md',
  'text-body-small text-charcoal-ink text-start',
  'hover:bg-zinc-100',
  'outline-none',
  'data-[highlighted]:bg-zinc-100',
  'transition-colors duration-150'
);

function Item({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Dropdown.Item asChild>
      <Link href={href} className={menuItemClass}>
        <span className="text-muted-steel" aria-hidden="true">
          {icon}
        </span>
        <span>{children}</span>
      </Link>
    </Dropdown.Item>
  );
}
