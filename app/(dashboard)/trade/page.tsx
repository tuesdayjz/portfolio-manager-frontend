"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { EquityOrderForm } from "@/components/trade/equity-order-form"
import { OptionOrderForm } from "@/components/trade/option-order-form"
import { QuoteCard } from "@/components/trade/quote-card"
import { SecuritySearch } from "@/components/trade/security-search"
import { CandlestickChart } from "@/components/trade/candlestick-chart"
import {
  getQuote,
  type SecurityQuote,
  type SecuritySearchResult,
} from "@/lib/securities"
import { useSession } from "@/lib/auth"
import { usePortfolioSummary } from "@/lib/portfolio"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"

type TradeTab = "equity" | "options"

// Options only make sense on equity-style underlyings in this app - bonds and
// futures/commodities don't get an options ticket. Yahoo's `quoteType` on the
// search result tells us this before the asset is ever registered on the backend.
function optionsSupportedForType(type: string | null): boolean {
  if (!type) return true
  const upper = type.toUpperCase()
  return upper !== "BOND" && upper !== "FUTURE"
}

export default function TradePage() {
  const [tab, setTab] = useState<TradeTab>("equity")
  const user = useSession()
  const isLoggedIn = !!user
  const { refresh: refreshPortfolioSummary } = usePortfolioSummary()

  const [symbol, setSymbol] = useState<string | null>(null)
  const [symbolType, setSymbolType] = useState<string | null>(null)
  const [quote, setQuote] = useState<SecurityQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const optionsSupported = optionsSupportedForType(symbolType)

  async function loadQuote(sym: string) {
    setQuoteLoading(true)
    setQuoteError(null)
    try {
      const result = await getQuote(sym)
      setQuote(result)
    } catch (err) {
      setQuote(null)
      setQuoteError(err instanceof Error ? err.message : "Unable to load live price.")
    } finally {
      setQuoteLoading(false)
    }
  }

  function handleSelect(result: SecuritySearchResult) {
    setSymbol(result.symbol)
    setSymbolType(result.type)
    if (!optionsSupportedForType(result.type)) setTab("equity")
    void loadQuote(result.symbol)
  }

  function handleOrder() {
    refreshPortfolioSummary()
  }

  return (
    <div className="relative">
      <div
        className={
          isLoggedIn
            ? "mx-auto flex w-full max-w-6xl flex-col gap-6"
            : "mx-auto flex w-full max-w-6xl flex-col gap-6 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <div>
          <h1 className="text-2xl font-semibold">Trade</h1>
          <p className="text-muted-foreground">
            Search a security for its live price and chart, then build your order.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <SecuritySearch onSelect={handleSelect} className="max-w-md" />
          <QuoteCard
            quote={quote}
            loading={quoteLoading}
            error={quoteError}
            onRefresh={() => symbol && loadQuote(symbol)}
          />
        </div>

        {symbol ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
            <Card>
              <CardHeader>
                <Tabs value={tab} onValueChange={(value) => setTab(value as TradeTab)}>
                  <TabsList>
                    <TabsIndicator />
                    <TabsTab value="equity">Buy/Sell</TabsTab>
                    {optionsSupported && <TabsTab value="options">Options</TabsTab>}
                  </TabsList>
                </Tabs>
                {!optionsSupported && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Options aren&apos;t available for bonds or futures.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {tab === "options" && optionsSupported ? (
                  <OptionOrderForm key={symbol} symbol={symbol} quote={quote} onSubmit={handleOrder} />
                ) : (
                  <EquityOrderForm key={symbol} quote={quote} onSubmit={handleOrder} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <CandlestickChart symbol={symbol} currency={quote?.currency ?? "USD"} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Search for a security above to pull its live price, interactive chart, and place
              an order.
            </CardContent>
          </Card>
        )}
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
