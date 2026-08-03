import type { TradeAction } from "@/lib/trade-orders"

export type TransactionRequest = {
  ticker: string
  name: string
  transactionType: TradeAction
  quantity: number
}

export type TransactionResult = {
  date: string
  symbol: string
  name: string
  assetType: string
  executedPrice: number
  executedUnitPrice: number
}

export async function createTransaction(
  order: TransactionRequest
): Promise<TransactionResult> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticker: order.ticker,
      name: order.name,
      position: "long",
      order_type: "market",
      transaction_type: order.transactionType,
      quantity: order.quantity,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Unable to place order.")
  }

  return {
    date: data.date,
    symbol: data.symbol,
    name: data.name,
    assetType: data.asset_type,
    executedPrice: data.executed_price,
    executedUnitPrice: data.executed_unit_price,
  }
}
