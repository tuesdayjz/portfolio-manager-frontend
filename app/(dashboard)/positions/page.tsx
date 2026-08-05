"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { matchesQuery } from "@/lib/search"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { deltaBadgeClass, tradeBadgeClass } from "@/lib/trade-status"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"
import { ASSET_CLASS_TABS, type AssetClassTab } from "@/lib/asset-classes"
import {
  HOLDINGS,
  OPTION_POSITIONS,
  positionAssetLabel,
  type AssetClass,
  type HoldingPosition,
  type OptionPosition,
} from "@/lib/mock/positions"

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  })
}

function GainLoss({
  dollar,
  percent,
}: {
  dollar: number | null
  percent: number | null
}) {
  if (dollar === null || percent === null) {
    return <span className="text-muted-foreground">—</span>
  }

  const positive = dollar >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1.5 font-medium tabular-nums",
        positive ? "text-chart-3" : "text-destructive"
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {positive ? "+" : ""}
      {formatCurrency(dollar)} ({positive ? "+" : ""}
      {percent.toFixed(2)}%)
    </span>
  )
}

function AssetClassBadge({ assetClass }: { assetClass: AssetClass }) {
  const { label, className } = positionAssetLabel(assetClass)
  return (
    <Badge variant="secondary" className={cn("shrink-0", className)}>
      {label}
    </Badge>
  )
}

function assetClassFromApi(assetType: string): AssetClass {
  const type = assetType.toLowerCase()
  if (type.includes("bond") || type.includes("fixed")) return "bonds"
  if (type.includes("commodity") || type.includes("metal") || type.includes("energy") || type.includes("future"))
    return "futures"
  return "equities"
}

function TotalReturn({ dollar, percent }: { dollar: number; percent: number }) {
  const positive = dollar >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        positive ? "text-chart-3" : "text-destructive"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {positive ? "+" : ""}
      {formatCurrency(dollar)} ({positive ? "+" : ""}
      {percent.toFixed(2)}%)
    </span>
  )
}

type SortKey = "today" | "marketValue"
type SortDir = "asc" | "desc"
type SortState = { key: SortKey; dir: SortDir } | null

function nextSortState(current: SortState, key: SortKey): SortState {
  if (current?.key !== key) return { key, dir: "desc" }
  if (current.dir === "desc") return { key, dir: "asc" }
  return null
}

function SortableHeader({
  sort,
  sortKey,
  onSort,
  children,
}: {
  sort: SortState
  sortKey: SortKey
  onSort: (key: SortKey) => void
  children: React.ReactNode
}) {
  const active = sort?.key === sortKey
  return (
    <th className="py-1.5 pr-4 text-right font-medium last:pr-0">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active && "text-foreground"
        )}
      >
        {children}
        {active ? (
          sort.dir === "desc" ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronUp className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" />
        )}
      </button>
    </th>
  )
}

// Shared column widths so the columns that Long Holdings and Options have
// in common line up cleanly.
const COLUMN_WIDTH = {
  symbol: 200,
  assetClass: 110,
  type: 64,
  strike: 84,
  expiry: 104,
  count: 90,
  avgPrice: 100,
  currentPrice: 108,
  today: 240,
  marketValue: 130,
}

const HOLDINGS_COLUMN_WIDTHS = [
  COLUMN_WIDTH.symbol,
  COLUMN_WIDTH.assetClass,
  COLUMN_WIDTH.type,
  COLUMN_WIDTH.count,
  COLUMN_WIDTH.avgPrice,
  COLUMN_WIDTH.currentPrice,
  COLUMN_WIDTH.today,
  COLUMN_WIDTH.marketValue,
]

const HOLDINGS_TABLE_MIN_WIDTH = HOLDINGS_COLUMN_WIDTHS.reduce((a, b) => a + b, 0)
const TABLE_MIN_WIDTH = Object.values(COLUMN_WIDTH).reduce((a, b) => a + b, 0)

function HoldingsTable({ positions }: { positions: HoldingPosition[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const marketValue = positions.reduce(
    (sum, p) => sum + p.quantity * p.currentPrice,
    0
  )
  const costBasis = positions.reduce((sum, p) => sum + p.quantity * p.avgPrice, 0)
  const totalReturnDollar = positions.reduce((sum, p) => {
    const gainPerUnit =
      p.side === "short" ? p.avgPrice - p.currentPrice : p.currentPrice - p.avgPrice
    return sum + gainPerUnit * p.quantity
  }, 0)
  const totalReturnPercent = costBasis !== 0 ? (totalReturnDollar / costBasis) * 100 : 0

  const sortedPositions = useMemo(() => {
    if (!sort) return positions
    const factor = sort.dir === "asc" ? 1 : -1
    return [...positions].sort((a, b) => {
      const aGain =
        (a.side === "short" ? a.avgPrice - a.currentPrice : a.currentPrice - a.avgPrice) *
        a.quantity
      const bGain =
        (b.side === "short" ? b.avgPrice - b.currentPrice : b.currentPrice - b.avgPrice) *
        b.quantity
      const aValue = sort.key === "today" ? aGain : a.quantity * a.currentPrice
      const bValue = sort.key === "today" ? bGain : b.quantity * b.currentPrice
      return (aValue - bValue) * factor
    })
  }, [positions, sort])

  function handleSort(key: SortKey) {
    setSort((current) => nextSortState(current, key))
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>{formatCurrency(marketValue)} market value</CardDescription>
        <CardAction className="flex flex-col items-end gap-0.5">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Total Unrealized Gain/Loss for Current Holdings
          </span>
          <TotalReturn dollar={totalReturnDollar} percent={totalReturnPercent} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No holdings in this asset class.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed text-sm"
              style={{ minWidth: HOLDINGS_TABLE_MIN_WIDTH }}
            >
              <colgroup>
                <col style={{ width: COLUMN_WIDTH.symbol }} />
                <col style={{ width: COLUMN_WIDTH.assetClass }} />
                <col style={{ width: COLUMN_WIDTH.type }} />
                <col style={{ width: COLUMN_WIDTH.count }} />
                <col style={{ width: COLUMN_WIDTH.avgPrice }} />
                <col style={{ width: COLUMN_WIDTH.currentPrice }} />
                <col style={{ width: COLUMN_WIDTH.today }} />
                <col style={{ width: COLUMN_WIDTH.marketValue }} />
              </colgroup>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Symbol</th>
                  <th className="py-1.5 pr-4 font-medium">Asset Class</th>
                  <th className="py-1.5 pr-4 font-medium">Side</th>
                  <th className="py-1.5 pr-4 font-medium">Quantity</th>
                  <th className="py-1.5 pr-4 font-medium">Avg Price</th>
                  <th className="py-1.5 pr-4 font-medium">Current Price</th>
                  <SortableHeader sort={sort} sortKey="today" onSort={handleSort}>
                    Unrealized Gain/Loss
                  </SortableHeader>
                  <SortableHeader sort={sort} sortKey="marketValue" onSort={handleSort}>
                    Market Value
                  </SortableHeader>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => {
                  const gainDollar =
                    (position.side === "short"
                      ? position.avgPrice - position.currentPrice
                      : position.currentPrice - position.avgPrice) * position.quantity
                  const costBasis = position.quantity * position.avgPrice
                  const gainPercent =
                    costBasis !== 0 ? (gainDollar / costBasis) * 100 : 0

                  return (
                    <tr key={position.symbol} className="border-b last:border-0">
                      <td className="py-1.5 pr-4">
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-xs text-muted-foreground">{position.name}</div>
                      </td>
                      <td className="py-1.5 pr-4">
                        <AssetClassBadge assetClass={position.assetClass} />
                      </td>
                      <td className="py-1.5 pr-4">
                        <Badge variant="secondary" className={`capitalize ${tradeBadgeClass}`}>
                          {position.side}
                        </Badge>
                      </td>
                      <td className="py-1.5 pr-4">{position.quantity.toLocaleString()}</td>
                      <td className="py-1.5 pr-4">{formatPrice(position.avgPrice)}</td>
                      <td className="py-1.5 pr-4">{formatPrice(position.currentPrice)}</td>
                      <td className="py-1.5 pr-4 text-right">
                        <GainLoss dollar={gainDollar} percent={gainPercent} />
                      </td>
                      <td className="py-1.5 pr-0 text-right">
                        {formatCurrency(position.quantity * position.currentPrice)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OptionsTable({ positions }: { positions: OptionPosition[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const marketValue = positions.reduce(
    (sum, p) => sum + p.contracts * p.currentPrice,
    0
  )
  const costBasis = positions.reduce((sum, p) => sum + p.contracts * p.avgPrice, 0)
  const totalReturnDollar = positions.reduce(
    (sum, p) => sum + (p.currentPrice - p.avgPrice) * p.contracts,
    0
  )
  const totalReturnPercent = costBasis !== 0 ? (totalReturnDollar / costBasis) * 100 : 0

  const sortedPositions = useMemo(() => {
    if (!sort) return positions
    const factor = sort.dir === "asc" ? 1 : -1
    return [...positions].sort((a, b) => {
      const aGain = (a.currentPrice - a.avgPrice) * a.contracts
      const bGain = (b.currentPrice - b.avgPrice) * b.contracts
      const aValue = sort.key === "today" ? aGain : a.contracts * a.currentPrice
      const bValue = sort.key === "today" ? bGain : b.contracts * b.currentPrice
      return (aValue - bValue) * factor
    })
  }, [positions, sort])

  function handleSort(key: SortKey) {
    setSort((current) => nextSortState(current, key))
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Options</CardTitle>
        <CardDescription>{formatCurrency(marketValue)} market value</CardDescription>
        <CardAction className="flex flex-col items-end gap-0.5">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Total Return
          </span>
          <TotalReturn dollar={totalReturnDollar} percent={totalReturnPercent} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No options positions in this asset class.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed text-sm"
              style={{ minWidth: TABLE_MIN_WIDTH }}
            >
              <colgroup>
                <col style={{ width: COLUMN_WIDTH.symbol }} />
                <col style={{ width: COLUMN_WIDTH.assetClass }} />
                <col style={{ width: COLUMN_WIDTH.type }} />
                <col style={{ width: COLUMN_WIDTH.strike }} />
                <col style={{ width: COLUMN_WIDTH.expiry }} />
                <col style={{ width: COLUMN_WIDTH.count }} />
                <col style={{ width: COLUMN_WIDTH.avgPrice }} />
                <col style={{ width: COLUMN_WIDTH.currentPrice }} />
                <col style={{ width: COLUMN_WIDTH.today }} />
                <col style={{ width: COLUMN_WIDTH.marketValue }} />
              </colgroup>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Symbol</th>
                  <th className="py-1.5 pr-4 font-medium">Asset Class</th>
                  <th className="py-1.5 pr-4 font-medium">Type</th>
                  <th className="py-1.5 pr-4 font-medium">Strike</th>
                  <th className="py-1.5 pr-4 font-medium">Expiry</th>
                  <th className="py-1.5 pr-4 font-medium">Contracts</th>
                  <th className="py-1.5 pr-4 font-medium">Avg Price</th>
                  <th className="py-1.5 pr-4 font-medium">Current Price</th>
                  <SortableHeader sort={sort} sortKey="today" onSort={handleSort}>
                    Unrealized Gain/Loss
                  </SortableHeader>
                  <SortableHeader sort={sort} sortKey="marketValue" onSort={handleSort}>
                    Market Value
                  </SortableHeader>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => {
                  const gainDollar =
                    (position.currentPrice - position.avgPrice) * position.contracts
                  const costBasis = position.contracts * position.avgPrice
                  const gainPercent =
                    costBasis !== 0 ? (gainDollar / costBasis) * 100 : 0

                  return (
                    <tr
                      key={`${position.symbol}-${position.optionType}-${position.strike}-${position.expiry}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-1.5 pr-4">
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-xs text-muted-foreground">{position.name}</div>
                      </td>
                      <td className="py-1.5 pr-4">
                        <AssetClassBadge assetClass={position.assetClass} />
                      </td>
                      <td className="py-1.5 pr-4">
                        <Badge variant="outline" className="capitalize">
                          {position.optionType}
                        </Badge>
                      </td>
                      <td className="py-1.5 pr-4">{formatPrice(position.strike)}</td>
                      <td className="py-1.5 pr-4">{position.expiry}</td>
                      <td className="py-1.5 pr-4">{position.contracts.toLocaleString()}</td>
                      <td className="py-1.5 pr-4">{formatPrice(position.avgPrice)}</td>
                      <td className="py-1.5 pr-4">{formatPrice(position.currentPrice)}</td>
                      <td className="py-1.5 pr-4 text-right">
                        <GainLoss dollar={gainDollar} percent={gainPercent} />
                      </td>
                      <td className="py-1.5 pr-0 text-right">
                        {formatCurrency(position.contracts * position.currentPrice)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssetClassPanel({
  assetClass,
  holdings,
  optionPositions,
}: {
  assetClass: AssetClassTab
  holdings: HoldingPosition[]
  optionPositions: OptionPosition[]
}) {
  const holdingsInClass = assetClass === "all"
    ? holdings
    : holdings.filter((p) => p.assetClass === assetClass)
  const optionsInClass = assetClass === "all"
    ? optionPositions
    : optionPositions.filter((p) => p.assetClass === assetClass)

  return (
    <div className="flex flex-col gap-4">
      <HoldingsTable positions={holdingsInClass} />
      <OptionsTable positions={optionsInClass} />
    </div>
  )
}

export default function PositionsPage() {
  const [assetClass, setAssetClass] = useState<AssetClassTab>("all")
  const [query, setQuery] = useState("")
  const user = useSession()
  const isLoggedIn = !!user
  const { data, isLoading, error } = usePortfolioQuery(isLoggedIn, (api) => api.getHoldings({ perPage: 100 }))

  // Only use mock data for non-logged-in users
  const holdings = useMemo(() => {
    return data
      ? data.items.map((holding) => ({
          symbol: holding.ticker,
          name: holding.name,
          assetClass: assetClassFromApi(holding.asset_type),
          side: "long" as const,
          quantity: holding.quantity,
          avgPrice: holding.average_purchase_price,
          currentPrice: holding.current_price,
          dayChangePercent: holding.today_return_percent,
        }))
      : isLoggedIn ? [] : HOLDINGS
  }, [data, isLoggedIn])
  // The current backend contract exposes holdings only; keep the existing sample
  // option positions for visitors until options are added to that contract.
  const optionPositions = useMemo(
    () => (isLoggedIn ? [] : OPTION_POSITIONS),
    [isLoggedIn]
  )

  // Filter by asset class
  const holdingsByClass = useMemo(() => {
    if (assetClass === "all") return holdings
    return holdings.filter((p) => p.assetClass === assetClass)
  }, [holdings, assetClass])

  const optionsByClass = useMemo(() => {
    if (assetClass === "all") return optionPositions
    return optionPositions.filter((p) => p.assetClass === assetClass)
  }, [optionPositions, assetClass])

  const filteredHoldings = useMemo(
    () => holdingsByClass.filter((p) => matchesQuery(query, p.symbol, p.name)),
    [holdingsByClass, query]
  )
  const filteredOptions = useMemo(
    () => optionsByClass.filter((p) => matchesQuery(query, p.symbol, p.name)),
    [optionsByClass, query]
  )

  return (
    <div className="relative">
      <div
        className={
          isLoggedIn
            ? "mx-auto flex w-full max-w-6xl flex-col gap-6"
            : "mx-auto flex w-full max-w-6xl flex-col gap-6 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Positions</h1>
            <p className="text-muted-foreground">
              Your holdings and today&apos;s performance by asset class.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol or name..."
              className="pl-8"
            />
          </div>
        </div>

        <Tabs
          value={assetClass}
          onValueChange={(value) => setAssetClass(value as AssetClassTab)}
          className="flex flex-col gap-6"
        >
          <TabsList>
            <TabsIndicator />
            {ASSET_CLASS_TABS.map((option) => (
              <TabsTab key={option.value} value={option.value}>
                {option.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>

        {isLoggedIn && isLoading ? (
          <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isLoggedIn && error ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                Failed to load positions
              </CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
            </CardContent>
          </Card>
        ) : filteredHoldings.length === 0 && filteredOptions.length === 0 ? (
          query ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No positions match &quot;{query}&quot;.
            </p>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No positions in this asset class.
            </p>
          )
        ) : (
          <AssetClassPanel
            assetClass={assetClass}
            holdings={filteredHoldings}
            optionPositions={filteredOptions}
          />
        )}
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
