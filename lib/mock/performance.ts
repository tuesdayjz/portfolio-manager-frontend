import {
  ASSET_CLASSES,
  HOLDINGS,
  OPTION_POSITIONS,
  type AssetClass,
} from "@/lib/mock/positions"

export type PerformanceSeriesKey = "all" | AssetClass

export const PERFORMANCE_TABS: { value: PerformanceSeriesKey; label: string }[] = [
  { value: "all", label: "All Holdings" },
  ...ASSET_CLASSES,
]

export type TimeRangeKey = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL"

// Anchoring "today" to a fixed date (rather than `new Date()`) keeps the
// generated history identical between the server render and the client
// hydration pass.
const TODAY = new Date("2026-07-29T00:00:00Z")
const HISTORY_DAYS = 400

function daysSinceYearStart(date: Date) {
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.round((date.getTime() - yearStart.getTime()) / 86_400_000)
}

export const TIME_RANGES: { value: TimeRangeKey; label: string; days: number }[] = [
  { value: "1W", label: "1W", days: 7 },
  { value: "1M", label: "1M", days: 30 },
  { value: "3M", label: "3M", days: 90 },
  { value: "YTD", label: "YTD", days: daysSinceYearStart(TODAY) },
  { value: "1Y", label: "1Y", days: 365 },
  { value: "ALL", label: "All", days: HISTORY_DAYS },
]

function hashSeed(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0
  }
  return hash
}

// Deterministic PRNG (mulberry32) so the same seed always produces the same
// walk — required since this data is generated at module scope and must
// match between server and client renders.
function mulberry32(seed: number) {
  return function random() {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomWalk(seedKey: string, days: number, drift: number, volatility: number) {
  const rand = mulberry32(hashSeed(seedKey))
  const walk = [1]
  for (let i = 1; i <= days; i++) {
    const shock = (rand() - 0.5) * 2 * volatility
    walk.push(walk[i - 1] * (1 + drift + shock))
  }
  return walk
}

// A random walk rescaled so the final point lands exactly on `endValue` —
// used for the portfolio series so the chart ties out to today's real
// market value.
function anchoredWalk(seedKey: string, endValue: number, days: number, drift: number, volatility: number) {
  const walk = randomWalk(seedKey, days, drift, volatility)
  const scale = endValue / walk[days]
  return walk.map((v) => v * scale)
}

type AssetProfile = {
  drift: number
  volatility: number
}

const PROFILES: Record<PerformanceSeriesKey, AssetProfile> = {
  all: { drift: 0.00045, volatility: 0.009 },
  equities: { drift: 0.0006, volatility: 0.013 },
  fx: { drift: 0.00015, volatility: 0.005 },
  "fixed-income": { drift: 0.0002, volatility: 0.004 },
  commodities: { drift: 0.00035, volatility: 0.014 },
}

export type PerformanceSummary = {
  marketValue: number
  costBasis: number
  totalReturnDollar: number
  totalReturnPercent: number
  todayChangeDollar: number
  todayChangePercent: number
}

export function getPerformanceSummary(key: PerformanceSeriesKey): PerformanceSummary {
  const holdings = HOLDINGS.filter((p) => key === "all" || p.assetClass === key)
  const options = OPTION_POSITIONS.filter((p) => key === "all" || p.assetClass === key)

  const marketValue =
    holdings.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0) +
    options.reduce((sum, p) => sum + p.contracts * p.currentPrice, 0)

  const costBasis =
    holdings.reduce((sum, p) => sum + p.quantity * p.avgPrice, 0) +
    options.reduce((sum, p) => sum + p.contracts * p.avgPrice, 0)

  const todayChangeDollar =
    holdings.reduce((sum, p) => sum + p.quantity * p.currentPrice * (p.dayChangePercent / 100), 0) +
    options.reduce((sum, p) => sum + p.contracts * p.currentPrice * (p.dayChangePercent / 100), 0)

  const totalReturnDollar = marketValue - costBasis

  return {
    marketValue,
    costBasis,
    totalReturnDollar,
    totalReturnPercent: costBasis !== 0 ? (totalReturnDollar / costBasis) * 100 : 0,
    todayChangeDollar,
    todayChangePercent: marketValue !== 0 ? (todayChangeDollar / marketValue) * 100 : 0,
  }
}

type HistoryPoint = { date: string; value: number }

const historyCache = new Map<PerformanceSeriesKey, HistoryPoint[]>()

function buildFullHistory(key: PerformanceSeriesKey): HistoryPoint[] {
  const cached = historyCache.get(key)
  if (cached) return cached

  const profile = PROFILES[key]
  const { marketValue } = getPerformanceSummary(key)
  const walk = anchoredWalk(`${key}-portfolio`, marketValue, HISTORY_DAYS, profile.drift, profile.volatility)

  const history: HistoryPoint[] = []
  for (let i = 0; i <= HISTORY_DAYS; i++) {
    const date = new Date(TODAY)
    date.setUTCDate(date.getUTCDate() - (HISTORY_DAYS - i))
    history.push({ date: date.toISOString().slice(0, 10), value: walk[i] })
  }

  historyCache.set(key, history)
  return history
}

export type PerformancePoint = { date: string; value: number }

export type PerformanceSlice = {
  points: PerformancePoint[]
  periodReturnDollar: number
  periodReturnPercent: number
}

export function getPerformanceSlice(key: PerformanceSeriesKey, days: number): PerformanceSlice {
  const full = buildFullHistory(key)
  const start = Math.max(0, full.length - 1 - days)
  const windowed = full.slice(start)

  const first = windowed[0].value
  const last = windowed[windowed.length - 1].value

  return {
    points: windowed,
    periodReturnDollar: last - first,
    periodReturnPercent: first !== 0 ? ((last - first) / first) * 100 : 0,
  }
}
