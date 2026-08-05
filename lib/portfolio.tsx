"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { useSessionState } from "@/hooks/use-session"

export type PortfolioSummary = {
  currency: string
  currencySymbol: string
  cashBalance: number
  totalMarketValue: number
  totalShortLiability: number
  totalReturnPercent: number
  totalReturnDollar: number
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await fetch("/api/portfolio/summary")
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Unable to load portfolio summary.")
  }

  const totalReturnDollar =
    data.total_return_dollar ??
    data.total_return_amount ??
    (data.total_market_value && data.total_return_percent !== undefined
      ? (data.total_market_value * data.total_return_percent) / 100
      : 0)

  return {
    currency: data.currency,
    currencySymbol: data.currency_symbol,
    cashBalance: data.cash_balance,
    totalMarketValue: data.total_market_value,
    totalShortLiability: data.total_short_liability,
    totalReturnPercent: data.total_return_percent,
    totalReturnDollar,
  }
}

type PortfolioSummaryContextValue = {
  summary: PortfolioSummary | null
  isLoading: boolean
  isError: boolean
  refresh: () => void
}

const PortfolioSummaryContext = createContext<PortfolioSummaryContextValue>({
  summary: null,
  isLoading: false,
  isError: false,
  refresh: () => {},
})

// Fetches the portfolio summary once per login and exposes `refresh()` so
// callers (e.g. the trade ticket, after a successful order) can force a
// refetch instead of waiting for the next full page load.
export function PortfolioSummaryProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useSessionState()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    if (isAuthLoading) {
      return
    }

    if (!user) {
      setIsSummaryLoading(false)
      setSummary(null)
      setIsError(false)
      return
    }

    setIsSummaryLoading(true)
    setIsError(false)
    getPortfolioSummary()
      .then((result) => {
        if (!cancelled) {
          setSummary(result)
          setIsSummaryLoading(false)
          setIsError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(null)
          setIsSummaryLoading(false)
          setIsError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [user, isAuthLoading, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const isLoading = isAuthLoading || (!!user && isSummaryLoading)

  return (
    <PortfolioSummaryContext.Provider value={{ summary, isLoading, isError, refresh }}>
      {children}
    </PortfolioSummaryContext.Provider>
  )
}

export function usePortfolioSummary(): PortfolioSummaryContextValue {
  return useContext(PortfolioSummaryContext)
}
