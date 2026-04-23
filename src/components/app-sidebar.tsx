"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLocale, useTranslations } from "next-intl"

type SidebarUser = {
  name: string
  email: string
  avatar: string
}

const DEMO_USER: SidebarUser = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: SidebarUser }) {
  // Prop overrides the hardcoded demo user so the real logged-in admin
  // shows in the footer NavUser widget. Nav labels flow through next-intl
  // so the sidebar reads naturally in AR (RTL) and EN.
  const sidebarUser = user ?? DEMO_USER
  const locale = useLocale()
  const side = locale === "ar" ? "right" : "left"
  const t = useTranslations("admin.sidebar")

  const navMain = [
    { title: t("items.dashboard"), url: "#", icon: LayoutDashboardIcon },
    { title: t("items.lifecycle"), url: "#", icon: ListIcon },
    { title: t("items.analytics"), url: "#", icon: BarChartIcon },
    { title: t("items.projects"), url: "#", icon: FolderIcon },
    { title: t("items.team"), url: "#", icon: UsersIcon },
  ]

  const navSecondary = [
    { title: t("items.settings"), url: "#", icon: SettingsIcon },
    { title: t("items.getHelp"), url: "#", icon: HelpCircleIcon },
    { title: t("items.search"), url: "#", icon: SearchIcon },
  ]

  const documents = [
    { name: t("items.dataLibrary"), url: "#", icon: DatabaseIcon },
    { name: t("items.reports"), url: "#", icon: ClipboardListIcon },
    { name: t("items.wordAssistant"), url: "#", icon: FileIcon },
  ]

  return (
    <Sidebar side={side} collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{t("brand")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
