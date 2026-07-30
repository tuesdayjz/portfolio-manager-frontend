"use client"

import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatCurrency, type SecurityQuote } from "@/lib/securities"

export function QuoteCard({
  quote,
  loading,
  error,
  onRefresh,
}: {
  quote: SecurityQuote | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  if (!quote && !loading && !error) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-3 py-2.5">
      {loading && !quote && (
        <p className="text-sm text-muted-foreground">Fetching live price…</p>
      )}

      {error && !quote && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {quote && (
        <>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">
              {quote.symbol}{" "}
              <span className="font-normal text-muted-foreground">
                {quote.name}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {quote.exchange}
              {quote.marketState && quote.marketState !== "UNKNOWN"
                ? ` · ${quote.marketState}`
                : ""}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="font-medium tabular-nums">
                {formatCurrency(quote.price, quote.currency)}
              </div>
              <div
                className={cn(
                  "text-xs tabular-nums",
                  quote.change >= 0 ? "text-chart-3" : "text-destructive"
                )}
              >
                {quote.change >= 0 ? "+" : ""}
                {quote.change.toFixed(2)} ({quote.change >= 0 ? "+" : ""}
                {quote.changePercent.toFixed(2)}%)
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh price"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
