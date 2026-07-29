import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, LineChart, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

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
    <header className="bg-background sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
          <LineChart className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          PortfolioIQ
        </span>
      </Link>

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
        <Button variant="outline" size="sm">
          <ArrowDownLeft />
          Sell
        </Button>
        <Button size="sm">
          <ArrowUpRight />
          Buy
        </Button>
      </div>
    </header>
  )
}
