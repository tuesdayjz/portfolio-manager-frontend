export type CapitalTransactionType = "deposit" | "withdrawal"

export type CapitalTransactionRequest = {
  transactionType: CapitalTransactionType
  amount: number
}

export type CapitalTransactionResult = {
  date: string
  transactionType: CapitalTransactionType
  amount: number
  cashBalance: number
}

export async function createCapitalTransaction(
  request: CapitalTransactionRequest
): Promise<CapitalTransactionResult> {
  const res = await fetch("/api/portfolios/capital", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_type: request.transactionType,
      amount: request.amount,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Unable to complete this transaction.")
  }

  return {
    date: data.date,
    transactionType: data.transaction_type,
    amount: data.amount,
    cashBalance: data.cash_balance,
  }
}
