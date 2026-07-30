"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ASSET_CLASSES,
  HOLDINGS,
  OPTION_POSITIONS,
  type AssetClass,
  type HoldingPosition,
  type OptionPosition,
} from "@/lib/positions-data"

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

function DayChange({ percent }: { percent: number }) {
  const positive = percent >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1.5 font-medium",
        positive ? "text-chart-3" : "text-destructive"
      )}
    >
      <Image
        src={positive ? "/kabu_chart_boutou.png" : "/kabu_chart_bouraku.png"}
        alt={positive ? "Price up" : "Price down"}
        width={36}
        height={36}
        className="shrink-0 rounded-sm"
      />
      {positive ? "+" : ""}
      {percent.toFixed(2)}%
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
    <th className="py-2 pr-4 text-right font-medium last:pr-0">
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
// in common (Symbol, Avg Price, Current Price, Today, Market Value) line up
// vertically between the two stacked tables.
const COLUMN_WIDTH = {
  symbol: 200,
  type: 64,
  strike: 84,
  expiry: 104,
  count: 90,
  avgPrice: 100,
  currentPrice: 108,
  today: 132,
  marketValue: 130,
}

const TABLE_MIN_WIDTH = Object.values(COLUMN_WIDTH).reduce((a, b) => a + b, 0)

function HoldingsTable({ positions }: { positions: HoldingPosition[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const marketValue = positions.reduce(
    (sum, p) => sum + p.quantity * p.currentPrice,
    0
  )

  const sortedPositions = useMemo(() => {
    if (!sort) return positions
    const factor = sort.dir === "asc" ? 1 : -1
    return [...positions].sort((a, b) => {
      const aValue =
        sort.key === "today" ? a.dayChangePercent : a.quantity * a.currentPrice
      const bValue =
        sort.key === "today" ? b.dayChangePercent : b.quantity * b.currentPrice
      return (aValue - bValue) * factor
    })
  }, [positions, sort])

  function handleSort(key: SortKey) {
    setSort((current) => nextSortState(current, key))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>{formatCurrency(marketValue)} market value</CardDescription>
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
              style={{ minWidth: TABLE_MIN_WIDTH }}
            >
              <colgroup>
                <col style={{ width: COLUMN_WIDTH.symbol }} />
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
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">Side</th>
                  <th className="py-2 pr-4 font-medium" aria-hidden />
                  <th className="py-2 pr-4 font-medium" aria-hidden />
                  <th className="py-2 pr-4 font-medium">Quantity</th>
                  <th className="py-2 pr-4 font-medium">Avg Price</th>
                  <th className="py-2 pr-4 font-medium">Current Price</th>
                  <SortableHeader sort={sort} sortKey="today" onSort={handleSort}>
                    Today
                  </SortableHeader>
                  <SortableHeader sort={sort} sortKey="marketValue" onSort={handleSort}>
                    Market Value
                  </SortableHeader>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => (
                  <tr key={position.symbol} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-xs text-muted-foreground">{position.name}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          "capitalize",
                          position.side === "short" && "text-destructive"
                        )}
                      >
                        {position.side}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">—</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">—</td>
                    <td className="py-2.5 pr-4">{position.quantity.toLocaleString()}</td>
                    <td className="py-2.5 pr-4">{formatPrice(position.avgPrice)}</td>
                    <td className="py-2.5 pr-4">{formatPrice(position.currentPrice)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      <DayChange percent={position.dayChangePercent} />
                    </td>
                    <td className="py-2.5 pr-0 text-right">
                      {formatCurrency(position.quantity * position.currentPrice)}
                    </td>
                  </tr>
                ))}
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

  const sortedPositions = useMemo(() => {
    if (!sort) return positions
    const factor = sort.dir === "asc" ? 1 : -1
    return [...positions].sort((a, b) => {
      const aValue =
        sort.key === "today" ? a.dayChangePercent : a.contracts * a.currentPrice
      const bValue =
        sort.key === "today" ? b.dayChangePercent : b.contracts * b.currentPrice
      return (aValue - bValue) * factor
    })
  }, [positions, sort])

  function handleSort(key: SortKey) {
    setSort((current) => nextSortState(current, key))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options</CardTitle>
        <CardDescription>{formatCurrency(marketValue)} market value</CardDescription>
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
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Strike</th>
                  <th className="py-2 pr-4 font-medium">Expiry</th>
                  <th className="py-2 pr-4 font-medium">Contracts</th>
                  <th className="py-2 pr-4 font-medium">Avg Price</th>
                  <th className="py-2 pr-4 font-medium">Current Price</th>
                  <SortableHeader sort={sort} sortKey="today" onSort={handleSort}>
                    Today
                  </SortableHeader>
                  <SortableHeader sort={sort} sortKey="marketValue" onSort={handleSort}>
                    Market Value
                  </SortableHeader>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => (
                  <tr
                    key={`${position.symbol}-${position.optionType}-${position.strike}-${position.expiry}`}
                    className="border-b last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-xs text-muted-foreground">{position.name}</div>
                    </td>
                    <td className="py-2.5 pr-4 capitalize">{position.optionType}</td>
                    <td className="py-2.5 pr-4">{formatPrice(position.strike)}</td>
                    <td className="py-2.5 pr-4">{position.expiry}</td>
                    <td className="py-2.5 pr-4">{position.contracts.toLocaleString()}</td>
                    <td className="py-2.5 pr-4">{formatPrice(position.avgPrice)}</td>
                    <td className="py-2.5 pr-4">{formatPrice(position.currentPrice)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      <DayChange percent={position.dayChangePercent} />
                    </td>
                    <td className="py-2.5 pr-0 text-right">
                      {formatCurrency(position.contracts * position.currentPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AssetClassPanel({ assetClass }: { assetClass: AssetClass }) {
  const holdings = HOLDINGS.filter((p) => p.assetClass === assetClass)
  const optionPositions = OPTION_POSITIONS.filter((p) => p.assetClass === assetClass)

  return (
    <div className="flex flex-col gap-4">
      <HoldingsTable positions={holdings} />
      <OptionsTable positions={optionPositions} />
    </div>
  )
}

export default function PositionsPage() {
  const [assetClass, setAssetClass] = useState<AssetClass>(ASSET_CLASSES[0].value)

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={assetClass}
        onValueChange={(value) => setAssetClass(value as AssetClass)}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Positions</h1>
            <p className="text-muted-foreground">
              Your holdings and today&apos;s performance by asset class.
            </p>
          </div>
          <TabsList>
            <TabsIndicator />
            {ASSET_CLASSES.map((option) => (
              <TabsTab key={option.value} value={option.value}>
                {option.label}
              </TabsTab>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <AssetClassPanel assetClass={assetClass} />
    </div>
  )
}
