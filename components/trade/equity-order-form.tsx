"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { formatCurrency, getEodPrice, type SecurityQuote } from "@/lib/securities"
import { createTransaction } from "@/lib/transactions"
import type { TradeAction, TradeOrder } from "@/lib/trade-orders"

type TradeMode = "live" | "past"

// yyyy-mm-dd in the browser's local timezone, so "today" in the date input's
// `max` matches what the user sees on their clock (Date#toISOString is UTC).
function todayLocalDateValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function formatTradeDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Mount this with `key={quote?.symbol}` from the parent so switching
// securities resets the ticket (quantity, action, confirmation, ...) via
// remount instead of an effect that syncs state to a prop change.
//
// v1 only supports long positions - the backend schema rejects short
// positions and limit orders, so those controls are omitted rather than
// offered and rejected. Live orders execute at market price; "Insert Past
// Trade" lets the user record a historical fill at a price/date they enter.
export function EquityOrderForm({
  quote,
  onSubmit,
}: {
  quote: SecurityQuote | null
  onSubmit: (order: TradeOrder) => void
}) {
  const [mode, setMode] = useState<TradeMode>("live")
  const [action, setAction] = useState<TradeAction>("buy")
  const [quantity, setQuantity] = useState("100")
  const [tradeDate, setTradeDate] = useState("")
  const [pastPrice, setPastPrice] = useState("")
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceFetchError, setPriceFetchError] = useState<string | null>(null)
  const [priceAutofilled, setPriceAutofilled] = useState(false)
  // The actual trading day the autofilled price came from - may differ from
  // `tradeDate` when it falls on a weekend/holiday (falls back to the prior close).
  const [priceAsOfDate, setPriceAsOfDate] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<TradeOrder | null>(null)
  const [confirmationDate, setConfirmationDate] = useState<string | null>(null)

  const isPast = mode === "past"
  const qty = Number(quantity)
  const price = isPast ? Number(pastPrice) : quote?.price ?? 0
  const estimatedTotal = qty > 0 && price > 0 ? qty * price : 0
  const canSubmit =
    !!quote &&
    qty > 0 &&
    price > 0 &&
    !submitting &&
    (!isPast || !!tradeDate)

  // Prefill the price with that day's close whenever the trade date changes,
  // without clobbering a value the user edits afterward for the same date.
  useEffect(() => {
    if (!isPast || !tradeDate || !quote) return

    let cancelled = false
    const symbol = quote.symbol

    // setState calls live inside this callback (not the effect body itself)
    // so they run as a reaction to the fetch, not synchronously on mount.
    void Promise.resolve().then(() => {
      if (cancelled) return
      setPriceLoading(true)
      setPriceFetchError(null)
      setPriceAutofilled(false)
      setPriceAsOfDate(null)

      getEodPrice(symbol, tradeDate)
        .then((result) => {
          if (cancelled) return
          if (result) {
            setPastPrice(result.price.toFixed(2))
            setPriceAutofilled(true)
            setPriceAsOfDate(result.date)
          } else {
            setPriceFetchError("No trading data for this date — enter the price manually.")
          }
        })
        .catch((err) => {
          if (cancelled) return
          setPriceFetchError(
            err instanceof Error ? err.message : "Unable to load the price for this date."
          )
        })
        .finally(() => {
          if (!cancelled) setPriceLoading(false)
        })
    })

    return () => {
      cancelled = true
    }
    // Re-fetch only when the date (or mode) changes, not on every quote
    // refresh - a live price refresh shouldn't clobber a manually edited price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPast, tradeDate, quote?.symbol])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quote || !canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await createTransaction({
        ticker: quote.symbol,
        name: quote.name,
        transactionType: action,
        quantity: qty,
        ...(isPast ? { tradeDate, price } : {}),
      })

      const order: TradeOrder = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        instrument: "equity",
        symbol: result.symbol,
        name: result.name,
        action,
        position: "long",
        quantity: qty,
        price: result.executedUnitPrice,
        total: result.executedPrice,
      }

      onSubmit(order)
      setConfirmation(order)
      setConfirmationDate(isPast ? tradeDate : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Trade Timing</Label>
        <SegmentedToggle
          value={mode}
          onChange={(value) => {
            setMode(value)
            setConfirmation(null)
          }}
          options={[
            { value: "live", label: "Live" },
            { value: "past", label: "Insert Past Trade" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Action</Label>
        <SegmentedToggle
          value={action}
          onChange={setAction}
          options={[
            { value: "buy", label: "Buy" },
            { value: "sell", label: "Sell", activeClassName: "text-destructive" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="equity-quantity">Quantity</Label>
        <Input
          id="equity-quantity"
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      {isPast && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="equity-trade-date">Trade Date</Label>
            <Input
              id="equity-trade-date"
              type="date"
              max={todayLocalDateValue()}
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="equity-past-price">
              Price per share ({quote?.currency ?? "USD"})
            </Label>
            <Input
              id="equity-past-price"
              type="number"
              min={0}
              step="0.01"
              placeholder={priceLoading ? "Loading closing price…" : "0.00"}
              disabled={priceLoading}
              value={pastPrice}
              onChange={(e) => {
                setPastPrice(e.target.value)
                setPriceFetchError(null)
                setPriceAutofilled(false)
                setPriceAsOfDate(null)
              }}
            />
            {priceFetchError && (
              <p className="text-xs text-muted-foreground">{priceFetchError}</p>
            )}
            {priceAutofilled && !priceLoading && priceAsOfDate && pastPrice && (
              <p className="text-xs text-muted-foreground">
                {priceAsOfDate === tradeDate
                  ? `Prefilled with the ${formatTradeDate(priceAsOfDate)} closing price — edit if needed.`
                  : `Prefilled with the ${formatTradeDate(priceAsOfDate)} closing price (last trading day on or before ${formatTradeDate(tradeDate)}) — edit if needed.`}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">
          {isPast ? "Estimated total" : "Estimated total (market price)"}
        </span>
        <span className="font-medium tabular-nums">
          {formatCurrency(estimatedTotal, quote?.currency ?? "USD")}
        </span>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {submitting
          ? "Submitting…"
          : isPast
            ? "Record Past Trade"
            : "Review & Submit Order"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Order failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {confirmation && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>
            {confirmationDate ? "Trade recorded" : "Order submitted"}
          </AlertTitle>
          <AlertDescription>
            {confirmation.action === "buy" ? "Bought" : "Sold"}{" "}
            {confirmation.quantity.toLocaleString()} {confirmation.symbol} at{" "}
            {formatCurrency(confirmation.price, quote?.currency ?? "USD")}
            {confirmationDate ? ` on ${formatTradeDate(confirmationDate)}.` : "."}
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}
