export type SecuritySearchResult = {
  symbol: string
  name: string
  exchange: string
  type: string
}

export type SecurityQuote = {
  symbol: string
  name: string
  currency: string
  exchange: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  marketState: string
  asOf: number
}

export type OptionContract = {
  contractSymbol: string
  strike: number
  lastPrice: number
  bid: number
  ask: number
  expiry: number
}

export type OptionChain = {
  symbol: string
  underlyingPrice: number
  expirations: number[]
  calls: OptionContract[]
  puts: OptionContract[]
}

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type SecurityHistory = {
  symbol: string
  currency: string
  candles: Candle[]
}

export const CHART_PERIODS = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"] as const
export type ChartPeriod = (typeof CHART_PERIODS)[number]

export type ApiError = { error: string }

export async function searchSecurities(query: string): Promise<SecuritySearchResult[]> {
  if (!query.trim()) return []
  const res = await fetch(`/api/securities/search?q=${encodeURIComponent(query)}`)
  const data = await res.json()
  return (data.results ?? []) as SecuritySearchResult[]
}

export async function getQuote(symbol: string): Promise<SecurityQuote> {
  const res = await fetch(`/api/securities/quote?symbol=${encodeURIComponent(symbol)}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as ApiError).error ?? "Unable to load live price.")
  }
  return data as SecurityQuote
}

export async function getOptionChain(symbol: string, date?: number): Promise<OptionChain> {
  const params = new URLSearchParams({ symbol })
  if (date) params.set("date", String(date))
  const res = await fetch(`/api/securities/options?${params.toString()}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as ApiError).error ?? "Unable to load option chain.")
  }
  return data as OptionChain
}

export async function getHistory(
  symbol: string,
  period: ChartPeriod
): Promise<SecurityHistory> {
  const params = new URLSearchParams({ symbol, period })
  const res = await fetch(`/api/securities/history?${params.toString()}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as ApiError).error ?? "Unable to load historical prices.")
  }
  return data as SecurityHistory
}

export function formatCurrency(value: number, currency = "USD") {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 10 ? 4 : 2,
  })
}

export function formatExpiry(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
