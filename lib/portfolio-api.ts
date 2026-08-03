export type ApiHolding = {
  asset_id: number
  asset_type: string
  average_purchase_price: number
  currency: string
  current_price: number
  day_change_percent: number
  market_value: number
  name: string
  portfolio_id: number
  quantity: number
  sector?: string | null
  symbol: string
}

export type ApiTransaction = {
  asset_id: number
  asset_type: string
  date: string
  name: string
  price: number
  quantity: number
  realized_pl?: number | null
  realized_pl_percent?: number | null
  symbol: string
  total_amount: number
  transaction_id: number
  transaction_type: "buy" | "sell"
}

export type AllocationResponse = {
  as_of: string
  currency: string
  items: { holdings_count: number; name: string; value: number; weight: number }[]
  total_value: number
}

export type HoldingsResponse = {
  items: ApiHolding[]
  pagination: { page: number; per_page: number; total_items: number; total_pages: number }
}

export type TransactionsResponse = {
  items: ApiTransaction[]
  pagination: { page: number; per_page: number; total_items: number; total_pages: number }
  totals: { cost_basis: number; currency: string; realized_pl: number; realized_pl_percent: number; sell_count: number }
}

export type PerformanceResponse = {
  currency: string
  points: { date: string; total_market_value: number }[]
  metrics: {
    portfolio_value: number
    today: { amount: number; percent: number }
    return: { amount: number; percent: number }
    total_return: { amount: number; percent: number }
  }
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
    getPerformance: (range: "1w" | "1m" | "3m" | "6m" | "1y" | "all") =>
      get<PerformanceResponse>("/api/v1/portfolios/performance", { range, interval: "1d" }),
  }
}
