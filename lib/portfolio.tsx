"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { useSessionState } from "@/hooks/use-session"

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
  isLoading: boolean
  refresh: () => void
}

const PortfolioSummaryContext = createContext<PortfolioSummaryContextValue>({
  summary: null,
  isLoading: false,
  refresh: () => {},
})

// Fetches the portfolio summary once per login and exposes `refresh()` so
// callers (e.g. the trade ticket, after a successful order) can force a
// refetch instead of waiting for the next full page load.
export function PortfolioSummaryProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useSessionState()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (isAuthLoading) {
      return
    }

    if (!user) {
      setIsSummaryLoading(false)
      setSummary(null)
      return
    }

    setIsSummaryLoading(true)
    getPortfolioSummary()
      .then((result) => {
        if (!cancelled) {
          setSummary(result)
          setIsSummaryLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null)
          setIsSummaryLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, isAuthLoading, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const isLoading = isAuthLoading || (!!user && isSummaryLoading)

  return (
    <PortfolioSummaryContext.Provider value={{ summary, isLoading, refresh }}>
      {children}
    </PortfolioSummaryContext.Provider>
  )
}

export function usePortfolioSummary(): PortfolioSummaryContextValue {
  return useContext(PortfolioSummaryContext)
}
