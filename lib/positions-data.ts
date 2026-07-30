export type AssetClass = "equities" | "fx" | "fixed-income" | "commodities"

export type HoldingSide = "long" | "short"

export type HoldingPosition = {
  symbol: string
  name: string
  assetClass: AssetClass
  side: HoldingSide
  quantity: number
  avgPrice: number
  currentPrice: number
  dayChangePercent: number
}

export type OptionPosition = {
  symbol: string
  name: string
  assetClass: AssetClass
  optionType: "call" | "put"
  strike: number
  expiry: string
  contracts: number
  avgPrice: number
  currentPrice: number
  dayChangePercent: number
}

export const ASSET_CLASSES: { value: AssetClass; label: string }[] = [
  { value: "equities", label: "Equities" },
  { value: "fx", label: "Forex" },
  { value: "fixed-income", label: "Fixed Income" },
  { value: "commodities", label: "Commodities" },
]

export const HOLDINGS: HoldingPosition[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    assetClass: "equities",
    side: "long",
    quantity: 120,
    avgPrice: 168.42,
    currentPrice: 214.32,
    dayChangePercent: 1.24,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    assetClass: "equities",
    side: "short",
    quantity: 60,
    avgPrice: 305.1,
    currentPrice: 421.87,
    dayChangePercent: -0.63,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    assetClass: "equities",
    side: "long",
    quantity: 45,
    avgPrice: 421.88,
    currentPrice: 118.11,
    dayChangePercent: 2.87,
  },
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    assetClass: "fx",
    side: "long",
    quantity: 50000,
    avgPrice: 1.0812,
    currentPrice: 1.0934,
    dayChangePercent: 0.18,
  },
  {
    symbol: "GBP/USD",
    name: "British Pound / US Dollar",
    assetClass: "fx",
    side: "short",
    quantity: 30000,
    avgPrice: 1.2645,
    currentPrice: 1.2588,
    dayChangePercent: -0.32,
  },
  {
    symbol: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    assetClass: "fx",
    side: "long",
    quantity: 40000,
    avgPrice: 148.2,
    currentPrice: 151.76,
    dayChangePercent: 0.47,
  },
  {
    symbol: "UST10Y",
    name: "US Treasury 10-Year Note",
    assetClass: "fixed-income",
    side: "long",
    quantity: 25,
    avgPrice: 98.75,
    currentPrice: 97.42,
    dayChangePercent: -0.21,
  },
  {
    symbol: "LQD",
    name: "iShares Investment Grade Corp Bond ETF",
    assetClass: "fixed-income",
    side: "long",
    quantity: 200,
    avgPrice: 106.3,
    currentPrice: 108.91,
    dayChangePercent: 0.35,
  },
  {
    symbol: "MUB",
    name: "iShares National Muni Bond ETF",
    assetClass: "fixed-income",
    side: "long",
    quantity: 150,
    avgPrice: 104.2,
    currentPrice: 103.55,
    dayChangePercent: -0.09,
  },
  {
    symbol: "GLD",
    name: "Gold",
    assetClass: "commodities",
    side: "long",
    quantity: 80,
    avgPrice: 178.4,
    currentPrice: 224.63,
    dayChangePercent: 0.92,
  },
  {
    symbol: "SLV",
    name: "Silver",
    assetClass: "commodities",
    side: "long",
    quantity: 300,
    avgPrice: 21.15,
    currentPrice: 27.88,
    dayChangePercent: 1.56,
  },
  {
    symbol: "USO",
    name: "Crude Oil",
    assetClass: "commodities",
    side: "short",
    quantity: 100,
    avgPrice: 72.6,
    currentPrice: 68.34,
    dayChangePercent: -1.42,
  },
]

export const OPTION_POSITIONS: OptionPosition[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    assetClass: "equities",
    optionType: "call",
    strike: 220,
    expiry: "2026-09-18",
    contracts: 10,
    avgPrice: 6.2,
    currentPrice: 8.45,
    dayChangePercent: 4.12,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    assetClass: "equities",
    optionType: "put",
    strike: 210,
    expiry: "2026-08-21",
    contracts: 5,
    avgPrice: 9.85,
    currentPrice: 7.3,
    dayChangePercent: -3.28,
  },
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    assetClass: "fx",
    optionType: "call",
    strike: 1.1,
    expiry: "2026-08-15",
    contracts: 8,
    avgPrice: 0.0145,
    currentPrice: 0.0168,
    dayChangePercent: 1.05,
  },
  {
    symbol: "UST10Y",
    name: "US Treasury 10-Year Note",
    assetClass: "fixed-income",
    optionType: "put",
    strike: 96,
    expiry: "2026-10-16",
    contracts: 15,
    avgPrice: 1.35,
    currentPrice: 1.62,
    dayChangePercent: 2.14,
  },
  {
    symbol: "GLD",
    name: "Gold",
    assetClass: "commodities",
    optionType: "call",
    strike: 230,
    expiry: "2026-09-19",
    contracts: 12,
    avgPrice: 4.9,
    currentPrice: 6.1,
    dayChangePercent: 3.67,
  },
]
