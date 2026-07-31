export type AllocationSlice = {
  label: string
  pct: number
  colorVar: string
}

export const assetAllocation: AllocationSlice[] = [
  { label: "US Stocks", pct: 45, colorVar: "var(--chart-1)" },
  { label: "Intl Stocks", pct: 20, colorVar: "var(--chart-2)" },
  { label: "Bonds", pct: 15, colorVar: "var(--chart-3)" },
  { label: "Real Estate", pct: 10, colorVar: "var(--chart-4)" },
  { label: "Crypto", pct: 5, colorVar: "var(--chart-5)" },
  { label: "Cash", pct: 5, colorVar: "var(--muted-foreground)" },
]

export const portfolioTotalValue = 1_250_000

export type PerformancePoint = {
  month: string
  value: number
}

export const performanceHistory: PerformancePoint[] = [
  { month: "Jan", value: 1_100_000 },
  { month: "Feb", value: 1_150_000 },
  { month: "Mar", value: 1_190_000 },
  { month: "Apr", value: 1_170_000 },
  { month: "May", value: 1_230_000 },
  { month: "Jun", value: 1_247_832.5 },
]

export const performanceBenchmarkLabel = "S&P 500 (+8.2% YTD)"

export type Position = {
  symbol: string
  name: string
  qty: number
  price: number
  marketValue: number
  changePct: number
}

export const topPositions: Position[] = [
  { symbol: "AAPL", name: "Apple Inc.", qty: 320, price: 182.52, marketValue: 58_406.4, changePct: 1.8 },
  { symbol: "MSFT", name: "Microsoft", qty: 150, price: 415.6, marketValue: 62_340.0, changePct: 0.9 },
  { symbol: "TSLA", name: "Tesla Inc.", qty: 110, price: 175.34, marketValue: 19_287.4, changePct: -2.4 },
  { symbol: "NVDA", name: "NVIDIA", qty: 85, price: 875.12, marketValue: 74_385.2, changePct: 4.2 },
  { symbol: "AMZN", name: "Amazon", qty: 200, price: 178.15, marketValue: 35_630.0, changePct: -0.5 },
]

export const totalPositionsCount = 24

export type Transaction = {
  date: string
  type: "BUY" | "SELL"
  asset: string
  qty: number
  price: number
  total: number
}

export const recentTransactions: Transaction[] = [
  { date: "Jun 14, 2024", type: "BUY", asset: "MSFT", qty: 12, price: 415.6, total: 4_987.2 },
  { date: "Jun 11, 2024", type: "SELL", asset: "AAPL", qty: 20, price: 178.5, total: 3_570.0 },
  { date: "Jun 08, 2024", type: "BUY", asset: "NVDA", qty: 10, price: 875.12, total: 8_751.2 },
  { date: "Jun 03, 2024", type: "BUY", asset: "AMZN", qty: 15, price: 181.2, total: 2_718.0 },
  { date: "May 28, 2024", type: "SELL", asset: "TSLA", qty: 50, price: 98.4, total: 4_920.0 },
  { date: "Apr 14, 2024", type: "BUY", asset: "MSFT", qty: 12, price: 415.6, total: 4_987.2 },
  { date: "Apr 11, 2024", type: "SELL", asset: "AAPL", qty: 20, price: 178.5, total: 3_570.0 },
]

export const totalTransactionsCount = 120
