'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { AdminNavGroup as AdminNavGroupType } from '@/data/admin-sidebar';

interface NavGroupProps {
  group: AdminNavGroupType;
}

/**
 * Renders a single sidebar group. Supports two item shapes:
 *   - leaf  → `<Link>` inside `SidebarMenuButton`
 *   - parent with `items` → `<Collapsible>` wrapping a nested sub-menu
 *
 * Active state tracking uses `usePathname()` against the pre-prefixed URL
 * in the schema — no manual locale handling here.
 */
export function NavGroup({ group }: NavGroupProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          // Leaf item → direct link.
          if (!('items' in item)) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isLeafActive(pathname, item.url)}
                  tooltip={item.title}
                >
                  <Link
                    href={item.url}
                    onClick={() => setOpenMobile(false)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Parent with sub-items → collapsible. Defaults open when any
          // sub-item matches the current path so users land on the group
          // already expanded.
          const hasActiveChild = item.items.some((sub) =>
            isLeafActive(pathname, sub.url)
          );
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                    {/* ms-auto so the chevron sits on the end side in
                        both LTR and RTL. The 90° rotation for open state
                        is direction-neutral (points down either way). */}
                    <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isLeafActive(pathname, sub.url)}
                        >
                          <Link
                            href={sub.url}
                            onClick={() => setOpenMobile(false)}
                          >
                            {sub.icon && <sub.icon />}
                            <span>{sub.title}</span>
                            {sub.badge && <NavBadge>{sub.badge}</NavBadge>}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="secondary" className="ms-auto h-5 rounded-full px-1.5 text-[10px]">
      {children}
    </Badge>
  );
}

/**
 * Active-row detection. The dashboard (prefix + no sub-path) is active on
 * exact match only; every other row treats the URL as a prefix so nested
 * routes keep the parent highlighted (e.g. `/admin/listings/123` highlights
 * "Listings").
 */
function isLeafActive(pathname: string, url: string): boolean {
  const current = normalize(pathname);
  const target = normalize(url);
  if (current === target) return true;
  // Treat any non-root target as an active prefix.
  return target !== '/' && current.startsWith(`${target}/`);
}

function normalize(p: string): string {
  const [path] = p.split('?');
  return path.replace(/\/$/, '') || '/';
}

