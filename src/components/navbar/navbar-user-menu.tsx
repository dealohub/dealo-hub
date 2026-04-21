'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CircleUserRound,
  MessageCircle,
  Package,
  Heart,
  UserRound,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/lib/auth/actions';

/**
 * NavbarUserMenu — auth-aware account button in the navbar.
 *
 * Phase 5f — replaces the decorative <CircleUserRound /> icon that
 * never reflected whether the user was signed in. Three states:
 *
 *   - Loading (brief, until session resolves)
 *       → compact icon placeholder, no flash of "Sign in" if session
 *         is actually present
 *   - Signed-out
 *       → "تسجيل الدخول" link to /signin
 *   - Signed-in
 *       → avatar (initial) + dropdown: Messages (unread badge),
 *         My listings, Saved, Profile, Sign out
 *
 * Uses the browser Supabase client to read session + unread count,
 * then subscribes to onAuthStateChange so a sign-in/out in another
 * tab (or via a server action that revalidates '/') updates this
 * navbar without a hard reload.
 */

interface Props {
  locale: 'ar' | 'en';
}

interface UserState {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  unreadCount: number;
}

export default function NavbarUserMenu({ locale }: Props) {
  const t = useTranslations('marketplace.navbar');
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; user: UserState }
  >({ status: 'loading' });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Resolve session + profile + unread count. Re-run on auth changes.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!auth.user) {
        setState({ status: 'signed-out' });
        return;
      }

      // Fetch profile (display_name, handle, avatar_url) and unread
      // counts in parallel. Both respect RLS — the profile query only
      // returns our own row; the conversations query only rows where
      // we are buyer or seller.
      const [{ data: profile }, { data: convs }] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, handle, avatar_url')
          .eq('id', auth.user.id)
          .maybeSingle(),
        supabase
          .from('conversations')
          .select('buyer_id, buyer_unread_count, seller_unread_count'),
      ]);

      if (cancelled) return;
      const unreadCount = (convs ?? []).reduce((sum, row: any) => {
        const isBuyer = row.buyer_id === auth.user!.id;
        return sum + (isBuyer ? row.buyer_unread_count : row.seller_unread_count) || 0;
      }, 0);

      setState({
        status: 'signed-in',
        user: {
          userId: auth.user.id,
          displayName:
            (profile as any)?.display_name ||
            auth.user.email?.split('@')[0] ||
            '',
          handle: (profile as any)?.handle ?? null,
          avatarUrl: (profile as any)?.avatar_url ?? null,
          unreadCount,
        },
      });
    }

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Click-outside to close menu.
  //
  // Uses 'click' (not 'mousedown'): with mousedown, pressing on a menu
  // item was tearing the menu down before the item's native click
  // could fire, so navigation never happened. With 'click' the Link
  // runs its router.push first, then this handler is a no-op anyway
  // because the navigation re-renders the tree.
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [menuOpen]);

  // Loading — plain icon, no label flash
  if (state.status === 'loading') {
    return (
      <span
        className="grid h-9 w-9 place-items-center rounded-md text-foreground/40"
        aria-busy="true"
        aria-label={t('account')}
      >
        <CircleUserRound size={18} />
      </span>
    );
  }

  // Signed-out — link straight to /signin
  if (state.status === 'signed-out') {
    return (
      <Link
        href={`/${locale}/signin`}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-foreground/80 ring-1 ring-border/60 transition hover:bg-muted hover:text-foreground"
      >
        <CircleUserRound size={14} />
        {t('login')}
      </Link>
    );
  }

  const { user } = state;
  const initial = (user.displayName || '?').charAt(0).toUpperCase();
  const profilePath = user.handle
    ? `/${locale}/profile/${user.handle}`
    : `/${locale}/profile/edit`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary ring-1 ring-primary/20 transition hover:bg-primary/20"
        title={user.displayName}
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
        {user.unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {user.unreadCount > 9 ? '9+' : user.unreadCount}
          </span>
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full mt-2 w-56 origin-top-end overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg"
        >
          <div className="border-b border-border/50 px-3 py-2.5">
            <div className="truncate text-xs font-semibold text-foreground">
              {user.displayName}
            </div>
            {user.handle && (
              <div className="truncate text-[10px] text-foreground/55">
                @{user.handle}
              </div>
            )}
          </div>

          <MenuLink
            href={`/${locale}/messages`}
            icon={MessageCircle}
            label={t('menuMessages')}
            badge={user.unreadCount > 0 ? user.unreadCount : undefined}
            onClick={() => setMenuOpen(false)}
          />
          <MenuLink
            href={`/${locale}/my-listings`}
            icon={Package}
            label={t('menuMyListings')}
            onClick={() => setMenuOpen(false)}
          />
          <MenuLink
            href={`/${locale}/saved`}
            icon={Heart}
            label={t('menuSaved')}
            onClick={() => setMenuOpen(false)}
          />
          <MenuLink
            href={profilePath}
            icon={UserRound}
            label={t('menuProfile')}
            onClick={() => setMenuOpen(false)}
          />

          <form
            action={signOut}
            className="border-t border-border/50"
          >
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-xs text-foreground/80 transition hover:bg-muted hover:text-foreground"
            >
              <LogOut size={14} className="flex-shrink-0 text-foreground/50" />
              <span>{t('menuSignOut')}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: typeof MessageCircle;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-foreground/80 transition hover:bg-muted hover:text-foreground"
    >
      <Icon size={14} className="flex-shrink-0 text-foreground/50" />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
