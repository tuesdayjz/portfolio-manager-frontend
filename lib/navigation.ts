import {
  ArrowLeftRight,
  History,
  LayoutDashboard,
  LineChart,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

// Regular, read-only report pages. Rendered as the standard sidebar list.
export const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Positions", url: "/positions", icon: Wallet },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Transaction History", url: "/transactions", icon: History },
]

// Trade is an action, not a report, and is intentionally left out of the
// dashboard's own content. It's rendered separately (below the items above)
// with a distinct, higher-emphasis style so it stands out as a call to action
// rather than just another page in the list.
export const tradeNavItem: NavItem = {
  title: "Trade",
  url: "/trade",
  icon: ArrowLeftRight,
}

export const footerNavItems: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings },
]
