import Link from "next/link"
import { ArrowRightLeft, TrendingUp } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"

const portfolio = {
  totalValue: 1_247_832.5,
  totalReturnPct: 12.4,
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />

      <Separator orientation="vertical" className="hidden h-6 md:block" />

      <div className="hidden items-center gap-6 md:flex">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Portfolio Value
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {currencyFormatter.format(portfolio.totalValue)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Return
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
            <TrendingUp className="size-3.5" />+{portfolio.totalReturnPct}%
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/trade" className={buttonVariants({ size: "sm" })}>
          <ArrowRightLeft />
          Trade
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <ThemeToggle />
      </div>
    </header>
  )
}
