
"use client"

import Link from "next/link"
import { AlertCircle, ArrowRightLeft, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { CapitalDialog } from "@/components/trade/capital-dialog"
import { portfolioTotalShortLiability, portfolioTotalValue } from "@/lib/mock/dashboard"
import { getPerformanceSummary } from "@/lib/mock/performance"
import { usePortfolioSummary } from "@/lib/portfolio"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { useSession } from "@/lib/auth"

const mockPortfolio = getPerformanceSummary("all")

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function SiteHeader() {
  const user = useSession()
  const { summary, isLoading, isError, refresh } = usePortfolioSummary()

  const isLoggedIn = !!user
  const showSkeleton = isLoggedIn && isLoading
  const hasFetchFailed = isLoggedIn && !isLoading && (isError || !summary)

  const { data: perfData } = usePortfolioQuery(
    isLoggedIn,
    (api) => api.getPerformance("all", "all")
  )

  const totalAssets = summary
    ? summary.totalMarketValue
    : isLoggedIn
    ? 0
    : portfolioTotalValue
  const totalUsableCash = summary ? summary.cashBalance : 0
  const totalLiabilities = summary
    ? summary.totalShortLiability
    : isLoggedIn
    ? 0
    : portfolioTotalShortLiability
  const totalReturnPercent = perfData
    ? perfData.metrics.total_return.percent
    : summary
    ? summary.totalReturnPercent
    : isLoggedIn
    ? 0
    : mockPortfolio.totalReturnPercent
  const isPositiveReturn = totalReturnPercent >= 0

  return (
    <header className="bg-background sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />

      <Separator orientation="vertical" className="hidden h-6 md:block" />

      <div className="hidden items-center gap-6 md:flex">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Assets
          </span>
          {showSkeleton ? (
            <Skeleton className="h-5 w-24 my-0.5" />
          ) : (
            <span className="text-sm font-semibold tabular-nums">
              {currencyFormatter.format(totalAssets)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Usable Cash
          </span>
          {showSkeleton ? (
            <Skeleton className="h-5 w-20 my-0.5" />
          ) : (
            <span className="text-sm font-semibold tabular-nums">
              {currencyFormatter.format(totalUsableCash)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Liabilities
          </span>
          {showSkeleton ? (
            <Skeleton className="h-5 w-20 my-0.5" />
          ) : (
            <span className="text-sm font-semibold tabular-nums text-destructive">
              {currencyFormatter.format(totalLiabilities)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Total Gain/Loss
          </span>
          {showSkeleton ? (
            <Skeleton className="h-5 w-16 my-0.5" />
          ) : (
            <span
              className={
                "flex items-center gap-1 text-sm font-semibold tabular-nums " +
                (isPositiveReturn ? "text-chart-3" : "text-destructive")
              }
            >
              {isPositiveReturn ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {isPositiveReturn ? "+" : ""}
              {totalReturnPercent.toFixed(2)}%
            </span>
          )}
        </div>

        {hasFetchFailed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                onClick={refresh}
                className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors rounded-md bg-amber-500/10 px-2 py-1"
                aria-label="Failed to retrieve live portfolio data. Click to retry."
              >
                <AlertCircle className="size-3.5" />
                <span>Fetch failed</span>
                <RefreshCw className="size-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Failed to retrieve portfolio data. Showing default $0.00 / 0.0%. Click to retry.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {summary && <CapitalDialog />}
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
