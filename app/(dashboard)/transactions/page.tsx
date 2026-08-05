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
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { matchesQuery } from "@/lib/search"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { sideBadgeClass, tradeBadgeClass } from "@/lib/trade-status"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"
import {
  TRANSACTIONS,
  TOTAL_TRANSACTIONS_COUNT,
  type TransactionRecord,
  type TransactionType,
} from "@/lib/mock/transactions"
import type { AssetClass } from "@/lib/mock/positions"

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Buy orders are a cash outflow, so they're shown in parentheses (accounting
// convention); sell orders are a cash inflow and shown plain. This is the
// opposite of the Positions page, where a short's market value (a liability)
// is what's parenthesized.
function formatTradeTotal(total: number, type: TransactionType) {
  return type === "BUY" ? `(${formatCurrency(total)})` : formatCurrency(total)
}

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  })
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

function assetClassFromApi(assetType: string): string {
  const type = assetType.toLowerCase()
  if (type.includes("bond") || type.includes("fixed")) return "bonds"
  if (type.includes("commodity") || type.includes("metal") || type.includes("energy") || type.includes("future"))
    return "futures"
  return "equities"
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

type SortKey = "date" | "quantity" | "price" | "total" | "gain"
type SortDir = "asc" | "desc"
type SortState = { key: SortKey; dir: SortDir }

const DEFAULT_SORT: SortState = { key: "date", dir: "desc" }

function nextSortState(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, dir: "desc" }
  return { key, dir: current.dir === "desc" ? "asc" : "desc" }
}

function sortValue(record: TransactionRecord, key: SortKey) {
  switch (key) {
    case "date":
      return record.date
    case "quantity":
      return record.quantity
    case "price":
      return record.price
    case "total":
      return record.total
    case "gain":
      return record.realizedGainDollar
  }
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
  const active = sort.key === sortKey
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

const TYPE_TABS: { value: "all" | TransactionType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
]

function TransactionsTable({
  transactions,
  sort,
  onSort,
}: {
  transactions: TransactionRecord[]
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <SortableHeader sort={sort} sortKey="date" onSort={onSort}>
              Date
            </SortableHeader>
            <th className="py-1.5 pr-4 pl-4 text-left font-medium">Type</th>
            <th className="py-1.5 pr-4 text-left font-medium">Asset</th>
            <th className="py-1.5 pr-4 text-left font-medium">Side</th>
            <SortableHeader sort={sort} sortKey="quantity" onSort={onSort}>
              Quantity
            </SortableHeader>
            <SortableHeader sort={sort} sortKey="price" onSort={onSort}>
              Price
            </SortableHeader>
            <SortableHeader sort={sort} sortKey="total" onSort={onSort}>
              Total
            </SortableHeader>
            <SortableHeader sort={sort} sortKey="gain" onSort={onSort}>
              Realized Gain / Loss
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b last:border-0">
              <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                {formatDate(tx.date)}
              </td>
              <td className="py-2 pr-4 pl-4">
                <Badge variant="secondary" className={tradeBadgeClass}>
                  {tx.type}
                </Badge>
              </td>
              <td className="py-2 pr-4">
                <div className="font-medium">{tx.symbol}</div>
                <div className="text-xs text-muted-foreground">{tx.name}</div>
              </td>
              <td className="py-2 pr-4">
                <Badge
                  variant="secondary"
                  className={cn("capitalize", sideBadgeClass(tx.position ?? "long"))}
                >
                  {tx.position ?? "long"}
                </Badge>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {tx.quantity.toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatPrice(tx.price)}
              </td>
              <td className="py-2 pr-4 text-right font-medium tabular-nums">
                {formatTradeTotal(tx.total, tx.type)}
              </td>
              <td className="py-2 pr-0 text-right">
                <GainLoss
                  dollar={tx.realizedGainDollar}
                  percent={tx.realizedGainPercent}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TransactionsPage() {
  const user = useSession()
  const isLoggedIn = !!user

  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const { data, isLoading, error } = usePortfolioQuery(isLoggedIn, (api) => api.getTransactions({ perPage: 100 }))

  // Only use mock data for non-logged-in users
  const transactions = useMemo<TransactionRecord[]>(() => {
    if (data) {
      return data.items.map((transaction) => ({
        id: transaction.transaction_id,
        date: transaction.date.slice(0, 10),
        type: transaction.transaction_type.toUpperCase() as TransactionType,
        symbol: transaction.symbol,
        name: transaction.name,
        assetClass: assetClassFromApi(transaction.asset_type) as AssetClass,
        position: transaction.position,
        quantity: transaction.quantity,
        price: transaction.executed_unit_price,
        total: transaction.executed_price,
        realizedGainDollar: transaction.realized_pl ?? null,
        realizedGainPercent: transaction.realized_pl_percent ?? null,
      }))
    }
    return isLoggedIn ? [] : TRANSACTIONS
  }, [data, isLoggedIn])
  const totalTransactionsCount = data?.pagination.total_items ?? TOTAL_TRANSACTIONS_COUNT

  function handleSort(key: SortKey) {
    setSort((current) => nextSortState(current, key))
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false
      return matchesQuery(query, tx.symbol, tx.name, tx.type)
    })
  }, [transactions, query, typeFilter])

  const sortedTransactions = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1
    return [...filteredTransactions].sort((a, b) => {
      const aValue = sortValue(a, sort.key)
      const bValue = sortValue(b, sort.key)

      // Keep BUY orders' empty (null) gain/loss pinned to the bottom
      // regardless of sort direction, instead of interleaving with real values.
      if (aValue === null || bValue === null) {
        if (aValue === null && bValue === null) return 0
        return aValue === null ? 1 : -1
      }

      if (aValue < bValue) return -1 * factor
      if (aValue > bValue) return 1 * factor
      return 0
    })
  }, [filteredTransactions, sort])

  const realizedGainDollar = filteredTransactions.reduce(
    (sum, tx) => sum + (tx.realizedGainDollar ?? 0),
    0
  )
  const realizedCostBasis = filteredTransactions.reduce((sum, tx) => {
    if (tx.realizedGainDollar === null) return sum
    return sum + (tx.total - tx.realizedGainDollar)
  }, 0)
  const realizedGainPercent =
    realizedCostBasis !== 0 ? (realizedGainDollar / realizedCostBasis) * 100 : 0

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
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Transaction History
            </h1>
            <p className="text-muted-foreground text-sm">
              A record of every buy and sell in your account.
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
              disabled={isLoading}
            />
          </div>
        </div>

        {isLoggedIn && isLoading && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Loading transactions...</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoggedIn && error && (
          <Card size="sm" className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" />
                Failed to load transactions
              </CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please check your connection and try again. If the problem persists, contact support.
              </p>
            </CardContent>
          </Card>
        )}

        {(!isLoggedIn || (!isLoading && !error)) && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} of {totalTransactionsCount}{" "}
                transactions{!isLoggedIn && " (demo data)"}
              </CardDescription>
              <CardAction className="flex items-center gap-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Realized P&L
                </span>
                <GainLoss dollar={realizedGainDollar} percent={realizedGainPercent} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as "all" | TransactionType)}
              >
                <TabsList>
                  <TabsIndicator />
                  {TYPE_TABS.map((option) => (
                    <TabsTab key={option.value} value={option.value}>
                      {option.label}
                    </TabsTab>
                  ))}
                </TabsList>
              </Tabs>

              {sortedTransactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {query ? `No transactions match "${query}".` : "No transactions yet."}
                </p>
              ) : (
                <TransactionsTable
                  transactions={sortedTransactions}
                  sort={sort}
                  onSort={handleSort}
                />
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}