import {
  Banknote,
  BellRing,
  Calendar,
  ChartBar,
  Fingerprint,
  Gauge,
  Kanban,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Phone,
  ReceiptText,
  Scale,
  ShoppingBagIcon,
  SquareArrowUpRight,
  UserCogIcon,
  Users,
  Warehouse,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        id: "default",
        title: "T\u1ed5ng quan",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "crm",
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        id: "finance",
        title: "Tài chính",
        url: "/dashboard/finance",
        icon: Banknote,
      },
      {
        id: "analytics",
        title: "Ph\u00e2n t\u00edch",
        url: "/dashboard/analytics",
        icon: Gauge,
      },
    ],
  },
  {
    id: 2,
    label: "Qu\u1ea3n l\u00fd",
    items: [
      {
        id: "calendar",
        title: "L\u1ecbch tr\u00ecnh",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        id: "kanban",
        title: "Kanban",
        url: "/kanban",
        icon: Kanban,
      },
      {
        id: "contact",
        title: "Li\u00ean h\u1ec7 m\u1edbi",
        url: "/contacts",
        icon: Phone,
      },
      {
        id: "orders",
        title: "\u0110\u01a1n h\u00e0ng",
        url: "/orders",
        icon: ShoppingBagIcon,
      },
      {
        id: "customer",
        title: "Kh\u00e1ch h\u00e0ng",
        url: "/customers",
        icon: Users,
      },
      {
        id: "operate",
        title: "Kho & V\u1eadn h\u00e0nh",
        url: "/operations",
        icon: Warehouse,
      },
      {
        id: "finance-management",
        title: "T\u00e0i ch\u00ednh",
        url: "/finance",
        icon: Landmark,
      },
      {
        id: "invoice",
        title: "Thu\u1ebf & H\u00f3a \u0111\u01a1n",
        url: "/invoice",
        icon: ReceiptText,
      },
      {
        id: "users",
        title: "Nh\u00e2n s\u1ef1",
        url: "/users",
        icon: UserCogIcon,
      },
      {
        id: "notifications",
        title: "Th\u00f4ng b\u00e1o",
        url: "/notifications",
        icon: BellRing,
      },
      {
        id: "login",
        title: "Ðang nh?p",
        url: "/auth/v1/login",
        icon: Fingerprint,
      },
    ],
  },
  {
    id: 3,
    label: "Legacy",
    items: [
      {
        id: "legacy-dashboards",
        title: "Dashboards",
        subItems: [
          { id: "legacy-default", title: "Default V1", url: "/dashboard/default-v1" },
          { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1" },
          { id: "legacy-finance", title: "Finance V1", url: "/dashboard/finance-v1" },
          { id: "legacy-analytics", title: "Analytics V1", url: "/dashboard/analytics-v1" },
        ],
      },
    ],
  },
  {
    id: 4,
    label: "Kh\u00e1c",
    items: [
      {
        id: "rules",
        title: "Quy t\u1eafc",
        url: "/dashboard/coming-soon",
        icon: Scale,
        // badge: "soon",
        // disabled: true,
      },
      {
        id: "others",
        title: "Kh\u00e1c",
        url: "/dashboard/coming-soon",
        icon: SquareArrowUpRight,
        // badge: "soon",
        // disabled: true,
      },
    ],
  },
];
