import { getPerformanceSlice } from "@/lib/mock/performance"
import { HOLDINGS, OPTION_POSITIONS, type AssetClass } from "@/lib/mock/positions"
import { TRANSACTIONS } from "@/lib/mock/transactions"

/**
 * Dashboard mock view models are derived from the detailed-screen fixtures.
 * This keeps every anonymous screen describing one sample portfolio rather
 * than several unrelated sets of numbers.
 */
export type AllocationSlice = {
  label: string
  pct: number
  colorVar: string
}

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equities: "Equities",
  bonds: "Bonds",
  futures: "Futures",
}

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  equities: "var(--equities)",
  bonds: "var(--bonds)",
  futures: "var(--futures)",
}

const marketValueByClass = new Map<AssetClass, number>()
for (const holding of HOLDINGS) {
  marketValueByClass.set(
    holding.assetClass,
    (marketValueByClass.get(holding.assetClass) ?? 0) + holding.quantity * holding.currentPrice
  )
}
for (const option of OPTION_POSITIONS) {
  marketValueByClass.set(
    option.assetClass,
    (marketValueByClass.get(option.assetClass) ?? 0) + option.contracts * option.currentPrice
  )
}

export const portfolioTotalValue = [...marketValueByClass.values()].reduce(
  (total, value) => total + value,
  0
)

export const assetAllocation: AllocationSlice[] = [...marketValueByClass.entries()]
  .map(([assetClass, value]) => ({
    label: ASSET_CLASS_LABELS[assetClass],
    pct: portfolioTotalValue === 0 ? 0 : (value / portfolioTotalValue) * 100,
    colorVar: ASSET_CLASS_COLORS[assetClass],
  }))
  .sort((a, b) => b.pct - a.pct)

export type PerformancePoint = { month: string; value: number }

const sixMonthHistory = getPerformanceSlice("all", 180).points
export const performanceHistory: PerformancePoint[] = Array.from({ length: 6 }, (_, index) => {
  const point = sixMonthHistory[Math.round((index * (sixMonthHistory.length - 1)) / 5)]
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
      new Date(`${point.date}T00:00:00Z`)
    ),
    value: point.value,
  }
})

export const performanceBenchmarkLabel = "Sample portfolio (6M)"

export type Position = {
  symbol: string
  name: string
  qty: number
  price: number
  marketValue: number
  changePct: number
}

export const topPositions: Position[] = HOLDINGS.map((holding) => ({
  symbol: holding.symbol,
  name: holding.name,
  qty: holding.quantity,
  price: holding.currentPrice,
  marketValue: holding.quantity * holding.currentPrice,
  changePct: holding.dayChangePercent,
}))
  .sort((a, b) => b.marketValue - a.marketValue)
  .slice(0, 5)

export const totalPositionsCount = HOLDINGS.length

export type Transaction = {
  date: string
  type: "BUY" | "SELL"
  asset: string
  qty: number
  price: number
  total: number
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
})

export const recentTransactions: Transaction[] = TRANSACTIONS.slice(0, 7).map((transaction) => ({
  date: dateFormatter.format(new Date(`${transaction.date}T00:00:00Z`)),
  type: transaction.type,
  asset: transaction.symbol,
  qty: transaction.quantity,
  price: transaction.price,
  total: transaction.total,
}))

export const totalTransactionsCount = TRANSACTIONS.length
