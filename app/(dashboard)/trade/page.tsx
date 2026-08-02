"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { EquityOrderForm } from "@/components/trade/equity-order-form"
import { OptionOrderForm } from "@/components/trade/option-order-form"
import { QuoteCard } from "@/components/trade/quote-card"
import { SecuritySearch } from "@/components/trade/security-search"
import { CandlestickChart } from "@/components/trade/candlestick-chart"
import {
  formatCurrency,
  getQuote,
  type SecurityQuote,
  type SecuritySearchResult,
} from "@/lib/securities"
import type { TradeOrder } from "@/lib/trade-orders"
import { tradeBadgeClass } from "@/lib/trade-status"
import { useSession } from "@/lib/auth"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"

type TradeTab = "equity" | "options"

function OrderHistory({ orders }: { orders: TradeOrder[] }) {
  if (orders.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Ticket History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="secondary" className={tradeBadgeClass}>
                  {order.action}
                </Badge>
                <span className="font-medium">{order.symbol}</span>
                {order.instrument === "option" && (
                  <span className="text-muted-foreground">
                    {order.strike?.toFixed(2)} {order.optionType} exp {order.expiry}
                  </span>
                )}
                <span className="capitalize text-muted-foreground">{order.position}</span>
              </div>
              <div className="shrink-0 text-right">
                <div className="tabular-nums">
                  {order.quantity.toLocaleString()}{" "}
                  {order.instrument === "option" ? "contracts" : "shares"}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(order.total)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TradePage() {
  const [tab, setTab] = useState<TradeTab>("equity")
  const [orders, setOrders] = useState<TradeOrder[]>([])
  const user = useSession()
  const isLoggedIn = !!user

  const [symbol, setSymbol] = useState<string | null>(null)
  const [quote, setQuote] = useState<SecurityQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

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
    void loadQuote(result.symbol)
  }

  function handleOrder(order: TradeOrder) {
    setOrders((current) => [order, ...current])
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
                    <TabsTab value="options">Options</TabsTab>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {tab === "equity" ? (
                  <EquityOrderForm key={symbol} quote={quote} onSubmit={handleOrder} />
                ) : (
                  <OptionOrderForm key={symbol} symbol={symbol} quote={quote} onSubmit={handleOrder} />
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

        <OrderHistory orders={orders} />
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
