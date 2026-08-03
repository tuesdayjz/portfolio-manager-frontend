export type PortfolioSummary = {
  currency: string
  currencySymbol: string
  cashBalance: number
  totalMarketValue: number
  totalReturnPercent: number
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await fetch("/api/portfolio/summary")
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Unable to load portfolio summary.")
  }

  return {
    currency: data.currency,
    currencySymbol: data.currency_symbol,
    cashBalance: data.cash_balance,
    totalMarketValue: data.total_market_value,
    totalReturnPercent: data.total_return_percent,
  }
}
