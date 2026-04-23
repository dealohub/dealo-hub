'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavGroup } from '@/components/admin/nav-group';
import { NavUser } from '@/components/admin/nav-user';
import type { AdminNavGroup, AdminUser } from '@/data/admin-sidebar';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  locale: 'ar' | 'en';
  navGroups: AdminNavGroup[];
  user: AdminUser;
}

/**
 * Composed sidebar for the admin shell.
 *
 * Layout:
 *   ┌──────────────────────────┐
 *   │ Brand (Dealo · admin)    │  SidebarHeader
 *   ├──────────────────────────┤
 *   │ Moderation               │  SidebarContent
 *   │   • Dashboard            │     (NavGroup per schema group)
 *   │   • Listings    ⋯ 3      │
 *   │ …                        │
 *   ├──────────────────────────┤
 *   │ Fawzi · fawzi@…    ⌄     │  SidebarFooter → NavUser
 *   └──────────────────────────┘
 *
 * `collapsible="icon"` so the admin can squeeze the sidebar into a 48 px
 * rail on narrow viewports without losing navigation — icons + tooltips
 * carry the affordance.
 */
export function AppSidebar({
  locale,
  navGroups,
  user,
  ...sidebarProps
}: AppSidebarProps) {
  const homeHref = `/${locale}/admin`;

  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip="Dealo admin"
            >
              <Link href={homeHref} aria-label="Dealo admin home">
                {/* Brand mark — a simple monogram in a soft surface. Kept
                    inline (no separate component) because it's 10 lines
                    of markup and adding a Dealo logo component now would
                    ship an abstraction with one caller. */}
                <span
                  aria-hidden
                  className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md font-semibold"
                >
                  D
                </span>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">Dealo</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {locale === 'ar' ? 'لوحة الإدارة' : 'admin console'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} group={group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser locale={locale} user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
