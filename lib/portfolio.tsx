"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { useSession } from "@/lib/auth"

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

type PortfolioSummaryContextValue = {
  summary: PortfolioSummary | null
  refresh: () => void
}

const PortfolioSummaryContext = createContext<PortfolioSummaryContextValue>({
  summary: null,
  refresh: () => {},
})

// Fetches the portfolio summary once per login and exposes `refresh()` so
// callers (e.g. the trade ticket, after a successful order) can force a
// refetch instead of waiting for the next full page load.
export function PortfolioSummaryProvider({ children }: { children: React.ReactNode }) {
  const user = useSession()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (!user) {
      return
    }

    getPortfolioSummary()
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })
    return () => {
      cancelled = true
    }
  }, [user, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  return (
    <PortfolioSummaryContext.Provider value={{ summary, refresh }}>
      {children}
    </PortfolioSummaryContext.Provider>
  )
}

export function usePortfolioSummary(): PortfolioSummaryContextValue {
  return useContext(PortfolioSummaryContext)
}
