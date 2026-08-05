export type ApiHolding = {
  ticker: string
  name: string
  asset_type: string
  quantity: number
  average_purchase_price: number
  total_purchase_price: number
  current_price: number
  total_market_value: number
  today_return_percent: number
  total_return_percent: number
  currency: string
}

export type ApiTransaction = {
  transaction_id: string
  asset_type: string
  date: string
  name: string
  executed_unit_price: number
  executed_price: number
  quantity: number
  position: "long" | "short"
  realized_pl?: number | null
  realized_pl_percent?: number | null
  symbol: string
  transaction_type: "buy" | "sell"
}

export type AllocationResponse = {
  as_of: string
  currency: string
  group_by: string
  items: { holdings_count: number; category: string; value: number; weight: number }[]
  total_value: number
}

export type HoldingsResponse = {
  items: ApiHolding[]
  totals: { market_value: number; day_change: number; day_change_percent: number; currency: string }
  pagination: { page: number; per_page: number; total_items: number; total_pages: number }
}

export type TransactionsResponse = {
  items: ApiTransaction[]
  pagination: { page: number; per_page: number; total_items: number; total_pages: number }
  totals: { cost_basis: number; currency: string; realized_pl: number; realized_pl_percent: number; sell_count: number }
}

export type PerformanceResponse = {
  currency: string
  asset_type: string
  points: { date: string; total_market_value: number }[]
  metrics: {
    portfolio_value: number
    today: { amount: number; percent: number }
    return: { amount: number; percent: number }
    total_return: { amount: number; percent: number }
  }
}

/** The `range` selectors accepted by GET /portfolios/performance. */
export type PerformanceRange = "1d" | "1w" | "1m" | "3m" | "YTD" | "1y" | "all"

/**
 * The `asset_type` values the asset-class tabs filter by. `"all"` is the API's
 * own value for "no filter", so it is sent as-is rather than omitted.
 *
 * Note this is narrower than the vocabulary the API can return: the backend also
 * emits `etf`, `fund`, `crypto` and `cash`, none of which have a tab of their own.
 */
export type PortfolioAssetType = "all" | "stock" | "bond" | "futures"

type Fetcher = typeof fetch

export class PortfolioApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "PortfolioApiError"
    this.status = status
  }
}

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_PORTFOLIO_API_URL ?? "http://localhost:5001").replace(/\/$/, "")
}

export function createPortfolioApi(accessToken: string, fetcher: Fetcher = fetch) {
  async function get<T>(path: string, params?: Record<string, string | number | undefined>) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) query.set(key, String(value))
    }
    const response = await fetcher(`${apiBaseUrl()}${path}${query.size ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    })
    if (!response.ok) {
      let message = `Portfolio API request failed (${response.status})`
      try {
        const body = (await response.json()) as { message?: string }
        message = body.message ?? message
      } catch {
        // A non-JSON error response still has a useful status code.
      }
      throw new PortfolioApiError(response.status, message)
    }
    return (await response.json()) as T
  }

  return {
    getAllocation: () => get<AllocationResponse>("/api/v1/portfolios/allocation", { group_by: "asset_type" }),
    getHoldings: (params?: { search?: string; assetType?: string; perPage?: number }) =>
      get<HoldingsResponse>("/api/v1/portfolios/holdings", {
        page: 1,
        per_page: params?.perPage ?? 100,
        search: params?.search,
        asset_type: params?.assetType,
      }),
    getTransactions: (params?: { search?: string; transactionType?: "buy" | "sell"; perPage?: number }) =>
      get<TransactionsResponse>("/api/v1/portfolios/transactions", {
        page: 1,
        per_page: params?.perPage ?? 100,
        search: params?.search,
        transaction_type: params?.transactionType,
      }),
    getPerformance: (range: PerformanceRange, assetType: PortfolioAssetType = "all") =>
      get<PerformanceResponse>("/api/v1/portfolios/performance", {
        range,
        interval: "1d",
        asset_type: assetType,
      }),
  }
}
