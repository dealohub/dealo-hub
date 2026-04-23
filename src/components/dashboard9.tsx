"use client";

import {
  BarChart3,
  Bell,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Package,
  RotateCcw,
  Settings,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import * as React from "react";
import type { TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

type NavItem = {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive?: boolean;
  children?: NavItem[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

type UserData = {
  name: string;
  email: string;
  avatar: string;
};

type SidebarData = {
  logo: {
    src: string;
    alt: string;
    title: string;
    description: string;
  };
  navGroups: NavGroup[];
  footerGroup: NavGroup;
  user?: UserData;
};

type RichMetricStatItem = {
  title: string;
  value: number;
  trendValue: number;
  footerDelta: number;
  footerSubtextCount: number;
};

type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: OrderStatus;
};

type FulfillmentItem = {
  order: string;
  shipped: Date;
  progress: number;
  segments: number[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const numberFormatter = new Intl.NumberFormat("en-US");
const trendPercentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const dashboardRangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const dashboardRangeStart = new Date(2025, 0, 1);
const dashboardRangeEnd = new Date(2025, 0, 31);
const dashboardDateRangeLabel =
  typeof dashboardRangeFormatter.formatRange === "function"
    ? dashboardRangeFormatter.formatRange(
        dashboardRangeStart,
        dashboardRangeEnd,
      )
    : `${dashboardRangeFormatter.format(
        dashboardRangeStart,
      )} – ${dashboardRangeFormatter.format(dashboardRangeEnd)}`;

const formatTrendValue = (trendValue: number) => {
  return trendPercentFormatter.format(trendValue / 100);
};

// The project stores base tokens (`--background`, `--muted`, …) as HSL triplets
// without the `hsl()` wrapper, then re-exports properly-wrapped colors via the
// `@theme inline` block as `--color-background`, `--color-muted`, etc. The raw
// triplet is not a valid CSS color, so `color-mix()` silently fails when fed
// `var(--background)`. We use the wrapped `--color-*` tokens here instead —
// this keeps the original dashboard9 palette math intact while rendering
// against Dealo's real design tokens.
const mixBase = "var(--color-background)";

const palette = {
  primary: "var(--primary)",
  secondary: {
    light: `color-mix(in oklch, var(--primary) 75%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--primary) 85%, ${mixBase})`,
  },
  tertiary: {
    light: `color-mix(in oklch, var(--primary) 55%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--primary) 65%, ${mixBase})`,
  },
  quaternary: {
    light: `color-mix(in oklch, var(--primary) 40%, ${mixBase})`,
    dark: `color-mix(in oklch, var(--primary) 45%, ${mixBase})`,
  },
};

// Label strings carry translation keys (relative to `admin.dashboard9`).
// Components resolve them via `useTranslations` at render time.
const sidebarData: SidebarData = {
  logo: {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblocks-logo.svg",
    alt: "brand.title",
    title: "brand.title",
    description: "brand.description",
  },
  navGroups: [
    {
      title: "nav.main",
      defaultOpen: true,
      items: [
        {
          label: "nav.dashboard",
          icon: LayoutDashboard,
          href: "#",
          isActive: true,
        },
        { label: "nav.orders", icon: ClipboardList, href: "#" },
        { label: "nav.returns", icon: RotateCcw, href: "#" },
      ],
    },
    {
      title: "nav.catalog",
      defaultOpen: true,
      items: [
        {
          label: "nav.products",
          icon: Box,
          href: "#",
          children: [
            { label: "nav.allProducts", icon: Package, href: "#" },
            { label: "nav.categories", icon: Package, href: "#" },
            { label: "nav.inventory", icon: Package, href: "#" },
          ],
        },
        { label: "nav.shipping", icon: Truck, href: "#" },
      ],
    },
    {
      title: "nav.customers",
      defaultOpen: false,
      items: [
        { label: "nav.allCustomers", icon: Users, href: "#" },
        { label: "nav.messages", icon: MessageSquare, href: "#" },
      ],
    },
    {
      title: "nav.analytics",
      defaultOpen: false,
      items: [
        { label: "nav.overview", icon: Globe, href: "#" },
        { label: "nav.reports", icon: BarChart3, href: "#" },
        { label: "nav.finances", icon: Wallet, href: "#" },
      ],
    },
  ],
  footerGroup: {
    title: "nav.settings",
    items: [{ label: "nav.settings", icon: Settings, href: "#" }],
  },
  user: {
    name: "John Doe",
    email: "john@acme.store",
    avatar:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/avatar-1.webp",
  },
};

// `title` carries a translation key (under `admin.dashboard9.kpi`).
const richMetricStats: RichMetricStatItem[] = [
  {
    title: "kpi.inStoreSales",
    value: 7820.75,
    trendValue: 4.3,
    footerDelta: 322.5,
    footerSubtextCount: 5000,
  },
  {
    title: "kpi.websiteSales",
    value: 985_937.45,
    trendValue: 12.5,
    footerDelta: 109_500,
    footerSubtextCount: 21_000,
  },
  {
    title: "kpi.wholesale",
    value: 124_650,
    trendValue: 6.8,
    footerDelta: 7_935,
    footerSubtextCount: 890,
  },
];

const monthLabel = (monthIndex: number) =>
  monthFormatter.format(new Date(2025, monthIndex, 1));

const salesPipelineData: Record<
  string,
  { week: string; month: string; orders: number; sales: number }[]
> = {
  q1: [
    { week: "W1", month: monthLabel(0), orders: 220, sales: 5100 },
    { week: "W2", month: monthLabel(0), orders: 480, sales: 11200 },
    { week: "W3", month: monthLabel(0), orders: 390, sales: 9400 },
    { week: "W4", month: monthLabel(0), orders: 150, sales: 3600 },
    { week: "W5", month: monthLabel(1), orders: 310, sales: 7400 },
    { week: "W6", month: monthLabel(1), orders: 540, sales: 13100 },
    { week: "W7", month: monthLabel(1), orders: 460, sales: 10800 },
    { week: "W8", month: monthLabel(1), orders: 200, sales: 4700 },
    { week: "W9", month: monthLabel(2), orders: 130, sales: 3100 },
    { week: "W10", month: monthLabel(2), orders: 420, sales: 10200 },
    { week: "W11", month: monthLabel(2), orders: 510, sales: 12400 },
    { week: "W12", month: monthLabel(2), orders: 350, sales: 8500 },
  ],
  q2: [
    { week: "W1", month: monthLabel(3), orders: 410, sales: 9800 },
    { week: "W2", month: monthLabel(3), orders: 280, sales: 6700 },
    { week: "W3", month: monthLabel(3), orders: 120, sales: 2900 },
    { week: "W4", month: monthLabel(3), orders: 350, sales: 8400 },
    { week: "W5", month: monthLabel(4), orders: 520, sales: 12600 },
    { week: "W6", month: monthLabel(4), orders: 470, sales: 11300 },
    { week: "W7", month: monthLabel(4), orders: 190, sales: 4500 },
    { week: "W8", month: monthLabel(4), orders: 100, sales: 2400 },
    { week: "W9", month: monthLabel(5), orders: 330, sales: 7900 },
    { week: "W10", month: monthLabel(5), orders: 490, sales: 11800 },
    { week: "W11", month: monthLabel(5), orders: 540, sales: 13000 },
    { week: "W12", month: monthLabel(5), orders: 260, sales: 6200 },
  ],
  q3: [
    { week: "W1", month: monthLabel(6), orders: 180, sales: 4200 },
    { week: "W2", month: monthLabel(6), orders: 520, sales: 12800 },
    { week: "W3", month: monthLabel(6), orders: 480, sales: 11500 },
    { week: "W4", month: monthLabel(6), orders: 120, sales: 2800 },
    { week: "W5", month: monthLabel(7), orders: 90, sales: 2100 },
    { week: "W6", month: monthLabel(7), orders: 450, sales: 10500 },
    { week: "W7", month: monthLabel(7), orders: 510, sales: 12200 },
    { week: "W8", month: monthLabel(7), orders: 480, sales: 11000 },
    { week: "W9", month: monthLabel(8), orders: 200, sales: 4800 },
    { week: "W10", month: monthLabel(8), orders: 150, sales: 3500 },
    { week: "W11", month: monthLabel(8), orders: 380, sales: 9200 },
    { week: "W12", month: monthLabel(8), orders: 420, sales: 10100 },
  ],
  q4: [
    { week: "W1", month: monthLabel(9), orders: 300, sales: 7200 },
    { week: "W2", month: monthLabel(9), orders: 160, sales: 3800 },
    { week: "W3", month: monthLabel(9), orders: 440, sales: 10600 },
    { week: "W4", month: monthLabel(9), orders: 530, sales: 12900 },
    { week: "W5", month: monthLabel(10), orders: 380, sales: 9100 },
    { week: "W6", month: monthLabel(10), orders: 140, sales: 3400 },
    { week: "W7", month: monthLabel(10), orders: 250, sales: 6000 },
    { week: "W8", month: monthLabel(10), orders: 500, sales: 12100 },
    { week: "W9", month: monthLabel(11), orders: 550, sales: 13300 },
    { week: "W10", month: monthLabel(11), orders: 470, sales: 11400 },
    { week: "W11", month: monthLabel(11), orders: 210, sales: 5000 },
    { week: "W12", month: monthLabel(11), orders: 340, sales: 8200 },
  ],
};

const fullYearData = [
  { monthIndex: 0, thisYear: 42000, prevYear: 38000 },
  { monthIndex: 1, thisYear: 38000, prevYear: 45000 },
  { monthIndex: 2, thisYear: 52000, prevYear: 41000 },
  { monthIndex: 3, thisYear: 45000, prevYear: 48000 },
  { monthIndex: 4, thisYear: 58000, prevYear: 44000 },
  { monthIndex: 5, thisYear: 41000, prevYear: 52000 },
  { monthIndex: 6, thisYear: 55000, prevYear: 47000 },
  { monthIndex: 7, thisYear: 48000, prevYear: 53000 },
  { monthIndex: 8, thisYear: 62000, prevYear: 49000 },
  { monthIndex: 9, thisYear: 54000, prevYear: 58000 },
  { monthIndex: 10, thisYear: 67000, prevYear: 52000 },
  { monthIndex: 11, thisYear: 71000, prevYear: 61000 },
].map(({ monthIndex, ...entry }) => ({
  month: monthLabel(monthIndex),
  ...entry,
}));

type TimePeriod = "6months" | "year";

// Localized period labels live inside `RevenueFlowChart` so they flip with
// the active next-intl locale.

function getDataForPeriod(period: TimePeriod) {
  if (period === "6months") {
    return fullYearData.slice(0, 6);
  }
  return fullYearData;
}

const orderStatuses: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const statusStyles: Record<OrderStatus, string> = {
  Processing:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-400/20",
  Shipped:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20",
  Delivered:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20",
  Cancelled:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20",
};

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customer: "Sarah Johnson",
    status: "Delivered",
    total: 2499.0,
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customer: "Michael Chen",
    status: "Shipped",
    total: 1348.0,
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customer: "Emma Wilson",
    status: "Processing",
    total: 1198.0,
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customer: "James Rodriguez",
    status: "Delivered",
    total: 799.0,
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    customer: "Lisa Park",
    status: "Cancelled",
    total: 599.0,
  },
  {
    id: "6",
    orderNumber: "ORD-2024-006",
    customer: "David Kim",
    status: "Shipped",
    total: 5498.0,
  },
  {
    id: "7",
    orderNumber: "ORD-2024-007",
    customer: "Anna Martinez",
    status: "Delivered",
    total: 1199.0,
  },
  {
    id: "8",
    orderNumber: "ORD-2024-008",
    customer: "Robert Taylor",
    status: "Processing",
    total: 1128.0,
  },
  {
    id: "9",
    orderNumber: "ORD-2024-009",
    customer: "Jennifer Lee",
    status: "Shipped",
    total: 449.0,
  },
  {
    id: "10",
    orderNumber: "ORD-2024-010",
    customer: "William Brown",
    status: "Delivered",
    total: 2199.0,
  },
  {
    id: "11",
    orderNumber: "ORD-2024-011",
    customer: "Sophia Davis",
    status: "Cancelled",
    total: 349.0,
  },
  {
    id: "12",
    orderNumber: "ORD-2024-012",
    customer: "Daniel Garcia",
    status: "Processing",
    total: 899.0,
  },
];

const fulfillmentData: FulfillmentItem[] = [
  {
    order: "ORD-4821",
    shipped: new Date(2025, 0, 27),
    progress: 92,
    segments: [
      0.9, 0.7, 1.0, 0.8, 0.6, 0.9, 1.0, 0.7, 0.5, 0.8, 0.9, 1.0, 0.6, 0.7, 0.8,
      0.9, 1.0, 0.5, 0.7, 0.8, 0.9, 0.6, 1.0, 0.8, 0.7, 0.3, 0.2, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4819",
    shipped: new Date(2025, 0, 26),
    progress: 78,
    segments: [
      0.8, 0.6, 0.9, 0.7, 1.0, 0.5, 0.8, 0.9, 0.6, 0.7, 1.0, 0.8, 0.5, 0.9, 0.7,
      0.6, 0.8, 1.0, 0.7, 0.5, 0.2, 0.1, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
      0.1,
    ],
  },
  {
    order: "ORD-4815",
    shipped: new Date(2025, 0, 25),
    progress: 100,
    segments: [
      1.0, 0.9, 0.8, 1.0, 0.7, 0.9, 1.0, 0.8, 0.6, 0.9, 1.0, 0.7, 0.8, 0.9, 1.0,
      0.6, 0.8, 0.9, 1.0, 0.7, 0.9, 0.8, 1.0, 0.6, 0.9, 0.7, 1.0, 0.8, 0.9, 1.0,
    ],
  },
  {
    order: "ORD-4812",
    shipped: new Date(2025, 0, 24),
    progress: 65,
    segments: [
      0.9, 1.0, 0.7, 0.8, 0.6, 0.9, 0.5, 0.8, 1.0, 0.7, 0.9, 0.6, 0.8, 0.5, 0.7,
      1.0, 0.6, 0.9, 0.8, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4808",
    shipped: new Date(2025, 0, 23),
    progress: 43,
    segments: [
      0.8, 0.7, 1.0, 0.6, 0.9, 0.8, 0.5, 0.7, 1.0, 0.9, 0.6, 0.8, 0.7, 0.1, 0.1,
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4805",
    shipped: new Date(2025, 0, 22),
    progress: 100,
    segments: [
      0.9, 0.8, 1.0, 0.7, 0.9, 0.6, 1.0, 0.8, 0.7, 0.9, 1.0, 0.8, 0.6, 0.9, 0.7,
      1.0, 0.8, 0.9, 0.7, 1.0, 0.8, 0.9, 0.6, 1.0, 0.7, 0.8, 0.9, 1.0, 0.8, 0.9,
    ],
  },
  {
    order: "ORD-4801",
    shipped: new Date(2025, 0, 21),
    progress: 88,
    segments: [
      1.0, 0.8, 0.7, 0.9, 0.6, 1.0, 0.8, 0.5, 0.9, 0.7, 1.0, 0.8, 0.6, 0.9, 0.7,
      0.8, 1.0, 0.6, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4798",
    shipped: new Date(2025, 0, 20),
    progress: 55,
    segments: [
      0.7, 0.9, 1.0, 0.6, 0.8, 0.9, 0.7, 1.0, 0.5, 0.8, 0.6, 0.9, 0.1, 0.1, 0.1,
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4794",
    shipped: new Date(2025, 0, 19),
    progress: 100,
    segments: [
      0.8, 1.0, 0.9, 0.7, 0.8, 1.0, 0.6, 0.9, 0.8, 1.0, 0.7, 0.9, 0.8, 1.0, 0.6,
      0.9, 0.7, 1.0, 0.8, 0.9, 0.7, 1.0, 0.8, 0.6, 0.9, 1.0, 0.7, 0.8, 0.9, 1.0,
    ],
  },
  {
    order: "ORD-4790",
    shipped: new Date(2025, 0, 18),
    progress: 71,
    segments: [
      0.9, 0.6, 0.8, 1.0, 0.7, 0.9, 0.5, 0.8, 1.0, 0.6, 0.9, 0.7, 0.8, 0.5, 0.3,
      0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4786",
    shipped: new Date(2025, 0, 17),
    progress: 35,
    segments: [
      1.0, 0.8, 0.9, 0.7, 0.6, 0.8, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
      0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
    ],
  },
  {
    order: "ORD-4782",
    shipped: new Date(2025, 0, 16),
    progress: 96,
    segments: [
      0.8, 0.9, 1.0, 0.7, 0.8, 0.9, 1.0, 0.6, 0.8, 0.9, 1.0, 0.7, 0.9, 0.8, 1.0,
      0.6, 0.9, 0.7, 1.0, 0.8, 0.9, 0.6, 1.0, 0.8, 0.7, 0.9, 1.0, 0.8, 0.3, 0.1,
    ],
  },
];

// Chart configs that need translated labels (`orders`, `sales`, `thisYear`,
// `prevYear`) live inside their consuming components so they flip with the
// active locale. Only `createHighlightBarShape` stays at module scope.

const createHighlightBarShape = (fill: string) => (props: unknown) => {
  const { x, y, width, height, index } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
  };
  const isHighlight = index === 5;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      opacity={isHighlight ? 1 : 0.45}
      rx={4}
      ry={4}
    />
  );
};

// `revenueFlowChartConfig` is defined inside `RevenueFlowChart` so its
// `thisYear` / `prevYear` legend labels flip with the active locale.

const tableHeadClass = "text-xs font-medium text-muted-foreground sm:text-sm";

const SidebarLogo = ({ logo }: { logo: SidebarData["logo"] }) => {
  // The fields on `logo` carry translation keys (e.g. "brand.title"). Resolve
  // them here so the i18n lookup happens once per render near the JSX that
  // consumes the text.
  const t = useTranslations("admin.dashboard9");
  const title = t(logo.title);
  const description = t(logo.description);
  const alt = t(logo.alt);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={title}>
          <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary">
            <img
              src={logo.src}
              alt={alt}
              width={24}
              height={24}
              className="size-6 text-primary-foreground invert dark:invert-0"
            />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">{title}</span>
            <span className="text-xs text-muted-foreground">
              {description}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const NavMenuItem = ({ item }: { item: NavItem }) => {
  // `item.label` is a translation key under `admin.dashboard9` (e.g.
  // "nav.dashboard"). Resolve once at the top so both the tooltip and the
  // visible span stay in sync.
  const t = useTranslations("admin.dashboard9");
  const Icon = item.icon;
  const label = t(item.label);
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={item.isActive}
          tooltip={label}
        >
          <a href={item.href}>
            <Icon className="size-4" aria-hidden="true" />
            <span>{label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={item.isActive} tooltip={label}>
            <Icon className="size-4" aria-hidden="true" />
            <span>{label}</span>
            <ChevronRight
              className="ms-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100"
              aria-hidden="true"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton asChild isActive={child.isActive}>
                  <a href={child.href}>{t(child.label)}</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const NavUser = ({ user }: { user: UserData }) => {
  const t = useTranslations("admin.dashboard9.userMenu");
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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="me-2 size-4" aria-hidden="true" />
              {t("account")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="me-2 size-4" aria-hidden="true" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  // Group titles in `sidebarData.navGroups` are stored as translation keys
  // (e.g. "nav.main"). Resolve them here — `NavMenuItem` resolves its own
  // labels individually.
  const t = useTranslations("admin.dashboard9");
  const locale = useLocale();
  const side = locale === "ar" ? "right" : "left";
  return (
    <Sidebar side={side} variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <SidebarLogo logo={sidebarData.logo} />
          <SidebarTrigger className="ms-auto group-data-[collapsible=icon]:ms-0" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{t(group.title)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem key={item.label} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {sidebarData.user && <NavUser user={sidebarData.user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const DashboardHeader = () => {
  const t = useTranslations("admin.dashboard9.header");
  return (
    <header className="flex w-full items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-base font-medium text-pretty">{t("title")}</h1>
        <p className="hidden text-xs text-muted-foreground lg:block">
          {t("subtitle")}
        </p>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground lg:inline">
          {dashboardDateRangeLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-label={t("allPlatforms")}
        >
          <Globe className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("allPlatforms")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-label={t("allProducts")}
        >
          <span className="hidden sm:inline">{t("allProducts")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          aria-label={t("export")}
        >
          <Download className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("export")}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={t("notifications")}
        >
          <Bell className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={t("help")}
        >
          <HelpCircle className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
};

const AccountingStatsCards = () => {
  // `stat.title` is a translation key (e.g. "kpi.inStoreSales"), resolved at
  // render. The delta + footer subtext use ICU-style placeholders from the
  // message catalog so AR and EN each own their own grammar around the
  // currency/count values.
  const t = useTranslations("admin.dashboard9.kpi");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {richMetricStats.map((stat) => {
        const isPositive = stat.trendValue > 0;
        const isNeutral = stat.trendValue === 0;

        const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

        const trendClass = isNeutral
          ? "text-foreground bg-muted"
          : isPositive
            ? "text-success border-success/20 bg-success/10"
            : "text-destructive border-destructive/20 bg-destructive/10";

        const formattedTrend = formatTrendValue(stat.trendValue);
        const deltaPrefix =
          stat.footerDelta > 0 ? "+" : stat.footerDelta < 0 ? "-" : "";
        const footerLabel = `${deltaPrefix}${currencyFormatter.format(
          Math.abs(stat.footerDelta),
        )} ${t("fromLastMonth")}`;
        const footerSubtext = t("basedOn", {
          count: numberFormatter.format(stat.footerSubtextCount),
        });

        return (
          <Card key={stat.title} className="@container/card shadow-none">
            <CardHeader className="flex items-start justify-between gap-2">
              <div>
                <CardDescription className="font-medium">
                  {t(
                    stat.title.replace(/^kpi\./, "") as
                      | "inStoreSales"
                      | "websiteSales"
                      | "wholesale",
                  )}
                </CardDescription>
                <CardTitle className="text-2xl font-bold @[600px]/card:text-4xl @[800px]/card:text-5xl">
                  {currencyFormatter.format(stat.value)}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn("gap-1 px-1.5 py-0.5", trendClass)}
              >
                <Icon className="size-3" aria-hidden="true" />
                {formattedTrend}
              </Badge>
            </CardHeader>

            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="line-clamp-1 flex items-center gap-1.5 font-medium">
                <span
                  className={
                    isNeutral
                      ? ""
                      : isPositive
                        ? "text-success"
                        : "text-destructive"
                  }
                >
                  {footerLabel}
                </span>
                <Icon
                  className={cn(
                    "size-3.5",
                    isNeutral
                      ? "text-muted-foreground"
                      : isPositive
                        ? "text-success"
                        : "text-destructive",
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {footerSubtext}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

function PipelineTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {valueFormatter(Number(entry.value))}
      </p>
    </div>
  );
}

const SalesPipelineChart = () => {
  const t = useTranslations("admin.dashboard9.pipeline");
  const tRevenue = useTranslations("admin.dashboard9.revenue");
  // Chart configs must live inside the component so the legend/tooltip labels
  // flip languages with the active locale.
  const ordersBarConfigLocalized = {
    orders: { label: tRevenue("ordersLabel"), color: palette.primary },
  } satisfies ChartConfig;
  const salesBarConfigLocalized = {
    sales: { label: tRevenue("salesLabel"), theme: palette.secondary },
  } satisfies ChartConfig;

  const [searchParams, setSearchParams] = React.useState(
    () =>
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      ),
  );

  const quarter = searchParams.get("quarter") ?? "q1";

  const handleQuarterChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("quarter", value);
    setSearchParams(next);
    window.history.replaceState(null, "", `?${next.toString()}`);
  };

  const data = salesPipelineData[quarter] ?? salesPipelineData.q1;
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border bg-card">
      <div className="flex h-14 items-center justify-between border-b px-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7 sm:size-8"
            aria-label={t("title")}
          >
            <BarChart3
              className="size-4 text-muted-foreground sm:size-[18px]"
              aria-hidden="true"
            />
          </Button>
          <h2 className="text-sm font-medium text-pretty sm:text-base">
            {t("title")}
          </h2>
        </div>

        <Select value={quarter} onValueChange={handleQuarterChange}>
          <SelectTrigger
            className="h-7 w-[120px] text-xs"
            aria-label={t("selectQuarter")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="q1">{t("q1")}</SelectItem>
            <SelectItem value="q2">{t("q2")}</SelectItem>
            <SelectItem value="q3">{t("q3")}</SelectItem>
            <SelectItem value="q4">{t("q4")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 sm:grid-cols-[1fr_auto_1fr] sm:p-5">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {numberFormatter.format(totalOrders)}
            </p>
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
              {t("totalOrders")}
            </p>
          </div>
          <div className="min-h-0 w-full min-w-0 flex-1">
            <ChartContainer config={ordersBarConfigLocalized} className="h-full w-full">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  dx={-5}
                  width={40}
                />
                <Tooltip
                  cursor={{ fillOpacity: 0.05 }}
                  content={
                    <PipelineTooltip
                      valueFormatter={(v) => numberFormatter.format(v)}
                    />
                  }
                />
                <Bar
                  dataKey="orders"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-orders)"
                  shape={createHighlightBarShape("var(--color-orders)")}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="hidden w-px self-stretch bg-border sm:block" />

        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {compactCurrencyFormatter.format(totalSales)}
            </p>
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
              {t("totalSales")}
            </p>
          </div>
          <div className="min-h-0 w-full min-w-0 flex-1">
            <ChartContainer config={salesBarConfigLocalized} className="h-full w-full">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  dx={-5}
                  width={40}
                />
                <Tooltip
                  cursor={{ fillOpacity: 0.05 }}
                  content={
                    <PipelineTooltip
                      valueFormatter={(v) => currencyFormatter.format(v)}
                    />
                  }
                />
                <Bar
                  dataKey="sales"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-sales)"
                  shape={createHighlightBarShape("var(--color-sales)")}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Label strings are passed in as props rather than called through
// `useTranslations` here, because recharts renders `<Tooltip content={…}>`
// with a React element, but then reconstructs it through its own mechanism —
// calling hooks in that mount path has been flaky in prior experiments. The
// parent resolves strings with `useTranslations` and passes them down.
type CustomTooltipLabels = {
  thisYear: string;
  prevYear: string;
  vsLastYearTemplate: (pct: number) => string;
};

function CustomTooltip({
  active,
  payload,
  label,
  colors,
  labels,
}: TooltipProps<number, string> & {
  colors: { primary: string; secondary: string };
  labels: CustomTooltipLabels;
}) {
  if (!active || !payload?.length) return null;

  const thisYear = payload.find((p) => p.dataKey === "thisYear")?.value || 0;
  const prevYear = payload.find((p) => p.dataKey === "prevYear")?.value || 0;
  const diff = Number(thisYear) - Number(prevYear);
  const percentage = prevYear ? Math.round((diff / Number(prevYear)) * 100) : 0;
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-lg border border-border bg-popover p-2 shadow-lg sm:p-3">
      <p className="mb-1.5 text-xs font-medium text-foreground sm:mb-2 sm:text-sm">
        {label}, {currentYear}
      </p>
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="size-2 rounded-full sm:size-2.5"
            style={{ backgroundColor: colors.primary }}
          />
          <span className="text-[10px] text-muted-foreground sm:text-sm">
            {labels.thisYear}
          </span>
          <span className="text-[10px] font-medium text-foreground sm:text-sm">
            {currencyFormatter.format(Number(thisYear))}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="size-2 rounded-full sm:size-2.5"
            style={{ backgroundColor: colors.secondary }}
          />
          <span className="text-[10px] text-muted-foreground sm:text-sm">
            {labels.prevYear}
          </span>
          <span className="text-[10px] font-medium text-foreground sm:text-sm">
            {currencyFormatter.format(Number(prevYear))}
          </span>
        </div>
        <div className="mt-1 border-t border-border pt-1">
          <span
            className={cn(
              "text-[10px] font-medium sm:text-xs",
              diff >= 0 ? "text-emerald-500" : "text-red-500",
            )}
          >
            {labels.vsLastYearTemplate(percentage)}
          </span>
        </div>
      </div>
    </div>
  );
}

const RevenueFlowChart = () => {
  const t = useTranslations("admin.dashboard9.revenue");
  const tTooltip = useTranslations("admin.dashboard9.tooltip");

  // Localized twin of the module-level `periodLabels` — lives in the
  // component so the dropdown + header flip with the locale.
  const periodLabelsLocalized: Record<TimePeriod, string> = {
    "6months": t("last6Months"),
    year: t("lastYear"),
  };

  const revenueFlowChartConfigLocalized = {
    thisYear: { label: t("thisYear"), color: palette.primary },
    prevYear: { label: t("prevYear"), theme: palette.secondary },
  } satisfies ChartConfig;

  const tooltipLabels: CustomTooltipLabels = {
    thisYear: tTooltip("thisYear"),
    prevYear: tTooltip("prevYear"),
    vsLastYearTemplate: (pct: number) => {
      const prefix = pct >= 0 ? "+" : "";
      return tTooltip("vsLastYear", { pct: `${prefix}${pct}` });
    },
  };

  const [period, setPeriod] = React.useState<TimePeriod>("year");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextPeriod = params.get("period");
    if (nextPeriod === "6months" || nextPeriod === "year") {
      setPeriod(nextPeriod);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (period !== "year") {
      params.set("period", period);
    } else {
      params.delete("period");
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}`
      : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [period]);

  const chartData = getDataForPeriod(period);
  const totalRevenue = chartData.reduce((acc, item) => acc + item.thisYear, 0);

  const periodLabel = periodLabelsLocalized[period];
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl border bg-card p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">
            {currencyFormatter.format(totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("title", { period: periodLabel })}
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex sm:gap-5">
          <div className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full sm:size-3"
              style={{ backgroundColor: palette.primary }}
            />
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              {t("thisYear")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full sm:size-3"
              style={{ backgroundColor: palette.secondary.light }}
            />
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              {t("prevYear")}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8"
              aria-label={t("selectTimePeriod")}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("timePeriod")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(periodLabelsLocalized) as TimePeriod[]).map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={period === key}
                onCheckedChange={() => setPeriod(key)}
              >
                {periodLabelsLocalized[key]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-[200px] w-full min-w-0 sm:h-[240px] lg:h-[280px]">
        <ChartContainer
          config={revenueFlowChartConfigLocalized}
          className="h-full w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10 }}
              dx={-5}
              tickFormatter={(value) => compactCurrencyFormatter.format(value)}
              width={40}
            />
            <Tooltip
              content={
                <CustomTooltip
                  colors={{
                    primary: "var(--color-thisYear)",
                    secondary: "var(--color-prevYear)",
                  }}
                  labels={tooltipLabels}
                />
              }
              cursor={{ strokeOpacity: 0.2 }}
            />
            <Line
              type="linear"
              dataKey="thisYear"
              stroke="var(--color-thisYear)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ fill: "var(--color-thisYear)", strokeWidth: 0, r: 2 }}
              activeDot={{ r: 3.5, fill: "var(--color-thisYear)" }}
            />
            <Line
              type="linear"
              dataKey="prevYear"
              stroke="var(--color-prevYear)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.5}
              dot={{
                fill: "var(--color-prevYear)",
                fillOpacity: 0.5,
                strokeWidth: 0,
                r: 2,
              }}
              activeDot={{
                r: 3.5,
                fill: "var(--color-prevYear)",
                fillOpacity: 0.5,
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};

// Maps the runtime `OrderStatus` identifier to its translation-key suffix
// inside `admin.dashboard9.orders.statuses.*`.
const statusKey: Record<OrderStatus, string> = {
  Processing: "processing",
  Shipped: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const RecentOrdersTable = () => {
  const t = useTranslations("admin.dashboard9.orders");
  const tStatuses = useTranslations("admin.dashboard9.orders.statuses");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">(
    "all",
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const pageSize = 6;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextStatus = params.get("status");
    if (
      nextStatus &&
      (nextStatus === "all" ||
        orderStatuses.includes(nextStatus as OrderStatus))
    ) {
      setStatusFilter(nextStatus as OrderStatus | "all");
    }
    const nextPage = Number(params.get("page"));
    if (!Number.isNaN(nextPage) && nextPage > 0) {
      setCurrentPage(nextPage);
    }
    setIsHydrated(true);
  }, []);

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  React.useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    if (currentPage > 1) {
      params.set("page", String(currentPage));
    } else {
      params.delete("page");
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}`
      : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [statusFilter, currentPage, isHydrated]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const startRow = filteredOrders.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endRow = Math.min(currentPage * pageSize, filteredOrders.length);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-pretty sm:text-base">
            {t("title")}
          </h2>
          <span className="ms-1 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset sm:text-xs dark:bg-gray-800/50 dark:text-gray-400 dark:ring-gray-400/20">
            {filteredOrders.length}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 sm:h-9 sm:gap-2"
            >
              <span className="text-xs sm:text-sm">
                {statusFilter === "all"
                  ? t("all")
                  : tStatuses(statusKey[statusFilter])}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>{t("filterByStatus")}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={statusFilter === "all"}
              onCheckedChange={() => setStatusFilter("all")}
            >
              {t("allStatuses")}
            </DropdownMenuCheckboxItem>
            {orderStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter === status}
                onCheckedChange={() => setStatusFilter(status)}
              >
                {tStatuses(statusKey[status])}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto px-4 pt-3 pb-4 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className={tableHeadClass}>{t("orderRef")}</TableHead>
              <TableHead className={tableHeadClass}>{t("buyer")}</TableHead>
              <TableHead className={tableHeadClass}>{t("total")}</TableHead>
              <TableHead className={tableHeadClass}>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                    {order.customer}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-foreground tabular-nums sm:text-sm">
                    {currencyFormatter.format(order.total)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-medium sm:text-xs",
                        statusStyles[order.status],
                      )}
                    >
                      {tStatuses(statusKey[order.status])}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-[10px] text-muted-foreground sm:px-6 sm:text-xs">
        <span>
          {t("pagination", {
            from: startRow,
            to: endRow,
            total: filteredOrders.length,
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={t("prevPage")}
          >
            <PrevIcon className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={t("nextPage")}
          >
            <NextIcon className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FulfillmentPanel = () => {
  const t = useTranslations("admin.dashboard9.fulfillment");
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-pretty">{t("title")}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={t("refresh")}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("options")}
              >
                <MoreHorizontal className="size-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{t("exportCsv")}</DropdownMenuItem>
              <DropdownMenuItem>{t("viewAllOrders")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <div className="flex items-center border-b pe-3 pb-2 text-[10px] text-muted-foreground">
          <span className="w-20 shrink-0">{t("order")}</span>
          <span className="flex-1">{t("status")}</span>
          <span className="w-8 shrink-0 text-right">{t("delivery")}</span>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="divide-y pe-3">
            {fulfillmentData.map((row) => (
              <div
                key={row.order}
                className="flex items-center gap-2 py-2.5 text-xs"
              >
                <span className="w-20 shrink-0 font-medium">{row.order}</span>
                <div className="flex min-w-0 flex-1 items-center gap-px overflow-hidden">
                  {row.segments.slice(0, 15).map((opacity, i) => {
                    const filled = i < Math.round((row.progress / 100) * 15);
                    return (
                      <div
                        key={i}
                        className="h-2.5 w-2 shrink-0 rounded-[1px]"
                        style={{
                          // `--muted` is an HSL triplet, not a color — use
                          // the wrapped `--color-muted` exposed via @theme.
                          backgroundColor: filled
                            ? palette.primary
                            : "var(--color-muted)",
                          opacity: filled ? opacity : 0.2,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="w-8 shrink-0 text-right font-medium">
                  {row.progress}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <main
      id="dashboard-main"
      tabIndex={-1}
      className="w-full flex-1 space-y-4 overflow-auto bg-background p-3 sm:space-y-6 sm:p-4 md:p-6"
    >
      <AccountingStatsCards />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[3fr_2fr]">
        <SalesPipelineChart />
        <RevenueFlowChart />
      </div>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
        <RecentOrdersTable />
        <FulfillmentPanel />
      </div>
    </main>
  );
};

const Dashboard9 = ({ className }: { className?: string }) => {
  const t = useTranslations("admin.dashboard9.a11y");
  return (
    <TooltipProvider>
      <SidebarProvider className={cn("bg-sidebar", className)}>
        <a
          href="#dashboard-main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-ring"
        >
          {t("skipToMain")}
        </a>
        <AppSidebar />
        <div className="h-svh w-full overflow-hidden lg:p-2">
          <div className="flex h-full w-full flex-col items-center justify-start overflow-hidden bg-background lg:rounded-xl lg:border">
            <DashboardHeader />
            <DashboardContent />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export { Dashboard9 };
