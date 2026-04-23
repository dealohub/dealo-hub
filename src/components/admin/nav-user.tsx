'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { signOut } from '@/lib/auth/actions';
import type { AdminUser } from '@/data/admin-sidebar';

interface NavUserProps {
  locale: 'ar' | 'en';
  user: AdminUser;
}

/**
 * Sidebar-footer user widget. Click → dropdown with profile link + sign-out.
 *
 * Sign-out uses the existing `signOut` server action; we submit via a plain
 * `<form action={signOut}>` so it works without JS and revalidates the
 * layout. The locale hidden-input mirrors the navbar user menu pattern so
 * redirect-after-sign-out lands on the right locale home.
 *
 * Dropdown side:
 *   On desktop the sidebar lives on one side of the viewport (start edge).
 *   The dropdown should open toward the center, which is:
 *     - LTR (sidebar on left)  → open to the `right`
 *     - RTL (sidebar on right) → open to the `left`
 */
export function NavUser({ locale, user }: NavUserProps) {
  const t = useTranslations('admin.userMenu');
  const { isMobile } = useSidebar();
  const dropdownSide = isMobile ? 'bottom' : locale === 'ar' ? 'left' : 'right';
  const profileHref = `/${locale}/profile`;

  const initials = getInitials(user.displayName) || 'DA';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                {user.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                )}
                <AvatarFallback className="rounded-lg text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{user.displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={dropdownSide}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  )}
                  <AvatarFallback className="rounded-lg text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{user.displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <UserRound />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              {/* `asChild` + a form means the menu item itself is the
                  submit button — one tab stop, one click to sign out. */}
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-hidden transition-colors select-none"
                >
                  <LogOut />
                  {t('signOut')}
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * Pull initials from a display name. Handles Arabic names by taking the
 * first character of the first two whitespace-separated tokens, which
 * works for "فوزي الإبراهيم" → "فا" and "Fawzi Alibrahim" → "FA".
 */
function getInitials(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (tokens.length === 0) return '';
  return tokens.map((t) => t[0]).join('').toUpperCase();
}
