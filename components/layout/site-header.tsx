"use client"

import Link from "next/link"
import { ArrowRightLeft, TrendingDown, TrendingUp } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { portfolioTotalValue } from "@/lib/mock/dashboard"
import { getPerformanceSummary } from "@/lib/mock/performance"
import { useSession } from "@/lib/auth"
import { usePortfolioSummary } from "@/lib/portfolio"

const mockPortfolio = getPerformanceSummary("all")

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function SiteHeader() {
  const user = useSession()
  const isLoggedIn = !!user
  const { summary } = usePortfolioSummary()

  // For logged-in users, rely solely on summary data (defaulting to 0 before load/if empty).
  // Mock data is reserved exclusively for guests/demo view.
  const totalAssets = isLoggedIn
    ? summary
      ? summary.totalMarketValue + summary.cashBalance
      : 0
    : portfolioTotalValue

  const totalUsableCash = isLoggedIn
    ? summary
      ? summary.cashBalance
      : 0
    : 0

  const totalReturnPercent = isLoggedIn
    ? summary
      ? summary.totalReturnPercent
      : 0
    : mockPortfolio.totalReturnPercent

  const isPositiveReturn = totalReturnPercent >= 0

  return (
    <header className="bg-background sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />

      <Separator orientation="vertical" className="hidden h-6 md:block" />

      <div className="hidden items-center gap-6 md:flex">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Assets
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {currencyFormatter.format(totalAssets)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Usable Cash
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {currencyFormatter.format(totalUsableCash)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Return
          </span>
          <span
            className={
              "flex items-center gap-1 text-sm font-semibold tabular-nums " +
              (isPositiveReturn ? "text-primary" : "text-destructive")
            }
          >
            {isPositiveReturn ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {isPositiveReturn ? "+" : ""}
            {totalReturnPercent.toFixed(1)}%
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
