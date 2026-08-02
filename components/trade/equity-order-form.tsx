"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { formatCurrency, type SecurityQuote } from "@/lib/securities"
import type { TradeAction, TradeOrder, TradePosition } from "@/lib/trade-orders"

// Mount this with `key={quote?.symbol}` from the parent so switching
// securities resets the ticket (quantity, action, confirmation, ...) via
// remount instead of an effect that syncs state to a prop change.
export function EquityOrderForm({
  quote,
  onSubmit,
}: {
  quote: SecurityQuote | null
  onSubmit: (order: TradeOrder) => void
}) {
  const [action, setAction] = useState<TradeAction>("buy")
  const [position, setPosition] = useState<TradePosition>("long")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")
  const [quantity, setQuantity] = useState("100")
  const [confirmation, setConfirmation] = useState<TradeOrder | null>(null)

  const qty = Number(quantity)
  const price = orderType === "market" ? (quote?.price ?? 0) : Number(limitPrice || 0)
  const estimatedTotal = qty > 0 && price > 0 ? qty * price : 0
  const canSubmit = !!quote && qty > 0 && price > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quote || !canSubmit) return

    const order: TradeOrder = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      instrument: "equity",
      symbol: quote.symbol,
      name: quote.name,
      action,
      position,
      quantity: qty,
      price,
      total: estimatedTotal,
    }

    onSubmit(order)
    setConfirmation(order)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Action</Label>
          <SegmentedToggle
            value={action}
            onChange={setAction}
            options={[
              { value: "buy", label: "Buy" },
              { value: "sell", label: "Sell" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Position</Label>
          <SegmentedToggle
            value={position}
            onChange={setPosition}
            options={[
              { value: "long", label: "Long" },
              { value: "short", label: "Short" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Label>Order Type</Label>
          <SegmentedToggle
            value={orderType}
            onChange={setOrderType}
            options={[
              { value: "market", label: "Market" },
              { value: "limit", label: "Limit" },
            ]}
          />
        </div>
      </div>

      {orderType === "limit" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="equity-limit-price">Limit Price</Label>
          <Input
            id="equity-limit-price"
            type="number"
            min={0}
            step={0.01}
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={quote ? quote.price.toFixed(2) : "0.00"}
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">Estimated total</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(estimatedTotal, quote?.currency ?? "USD")}
        </span>
      </div>

      <Button type="submit" variant={action === "sell" ? "destructive" : "default"} disabled={!canSubmit}>
        Review &amp; Submit Order
      </Button>

      {confirmation && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Order submitted</AlertTitle>
          <AlertDescription>
            {confirmation.action === "buy" ? "Bought" : "Sold"}{" "}
            {confirmation.quantity.toLocaleString()} {confirmation.symbol} (
            {confirmation.position}) at{" "}
            {formatCurrency(confirmation.price, quote?.currency ?? "USD")}. This is a
            simulated order for demonstration only — no real funds or trades are
            executed.
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}
