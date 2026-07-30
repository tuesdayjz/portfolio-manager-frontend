import {
  ArrowLeftRight,
  History,
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Allocations", url: "/allocations", icon: PieChart },
  { title: "Positions", url: "/positions", icon: Wallet },
  { title: "Trade", url: "/trade", icon: ArrowLeftRight },
  { title: "Performance", url: "/performance", icon: LineChart },
  { title: "Transaction History", url: "/transactions", icon: History },
]

export const footerNavItems: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings },
]
