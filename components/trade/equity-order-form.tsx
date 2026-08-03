"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { formatCurrency, type SecurityQuote } from "@/lib/securities"
import { createTransaction } from "@/lib/transactions"
import type { TradeAction, TradeOrder } from "@/lib/trade-orders"

// Mount this with `key={quote?.symbol}` from the parent so switching
// securities resets the ticket (quantity, action, confirmation, ...) via
// remount instead of an effect that syncs state to a prop change.
//
// v1 only supports long positions at market price — the backend schema
// rejects short positions and limit orders, so those controls are omitted
// rather than offered and rejected.
export function EquityOrderForm({
  quote,
  onSubmit,
}: {
  quote: SecurityQuote | null
  onSubmit: (order: TradeOrder) => void
}) {
  const [action, setAction] = useState<TradeAction>("buy")
  const [quantity, setQuantity] = useState("100")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<TradeOrder | null>(null)

  const qty = Number(quantity)
  const price = quote?.price ?? 0
  const estimatedTotal = qty > 0 && price > 0 ? qty * price : 0
  const canSubmit = !!quote && qty > 0 && price > 0 && !submitting

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">Estimated total (market price)</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(estimatedTotal, quote?.currency ?? "USD")}
        </span>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {submitting ? "Submitting…" : "Review & Submit Order"}
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
          <AlertTitle>Order submitted</AlertTitle>
          <AlertDescription>
            {confirmation.action === "buy" ? "Bought" : "Sold"}{" "}
            {confirmation.quantity.toLocaleString()} {confirmation.symbol} at{" "}
            {formatCurrency(confirmation.price, quote?.currency ?? "USD")}.
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}
