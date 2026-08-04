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

/**
 * Item shape for GET /portfolios/transactions.
 * The backend currently returns 501 for this endpoint — it uses TransactionSchema
 * for the response (same as the POST response), which only has these required fields.
 * Optional fields are anticipated extensions for when the list endpoint is implemented.
 */
export type ApiTransaction = {
  // Fields returned by the backend's TransactionSchema (POST response / future GET)
  date: string
  symbol: string
  name: string
  asset_type: string
  executed_price: number
  executed_unit_price: number
  // Fields anticipated for the full GET /portfolios/transactions response
  transaction_type?: "buy" | "sell"
  transaction_id?: string | number
  quantity?: number
  price?: number
  total_amount?: number
  realized_pl?: number | null
  realized_pl_percent?: number | null
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

type PerformanceChange = { amount: number; percent: number }

export type PerformanceResponse = {
  currency: string
  /** Granularity of the chart points (e.g. "1d"). */
  interval: string
  /** Preset range label selected, or null when start_date/end_date were used directly. */
  range: string | null
  start_date: string
  end_date: string
  points: { date: string; total_market_value: number }[]
  metrics: {
    portfolio_value: number
    today: PerformanceChange
    /** Return for the selected period. Key is `return` in JSON (reserved word). */
    return: PerformanceChange
    total_return: PerformanceChange
  }
  /** Pre-computed returns for each standard range, independent of the selected period. */
  return_1d: PerformanceChange
  return_1w: PerformanceChange
  return_1m: PerformanceChange
  return_3m: PerformanceChange
  return_YTD: PerformanceChange
  return_1y: PerformanceChange
  return_total: PerformanceChange
}

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
    /**
     * Fetch portfolio performance for a given range and optional asset type.
     * Valid range values mirror the backend PerformanceRange enum:
     * 1w | 1m | 3m | YTD | 1y | all
     * Note: "6m" is NOT a valid backend range and will result in a 422.
     */
    getPerformance: (range: "1w" | "1m" | "3m" | "YTD" | "1y" | "all", assetType?: string) =>
      get<PerformanceResponse>("/api/v1/portfolios/performance", { range, interval: "1d", asset_type: assetType }),
  }
}
