"use client"

import { useState } from "react"
import { CheckCircle2, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { formatCurrency } from "@/lib/securities"
import { createCapitalTransaction, type CapitalTransactionType } from "@/lib/capital"
import { usePortfolioSummary } from "@/lib/portfolio"

export function CapitalDialog() {
  const { refresh } = usePortfolioSummary()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<CapitalTransactionType>("deposit")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<{
    type: CapitalTransactionType
    amount: number
  } | null>(null)

  const parsedAmount = Number(amount)
  const canSubmit = parsedAmount > 0 && !submitting

  function reset() {
    setType("deposit")
    setAmount("")
    setError(null)
    setConfirmation(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await createCapitalTransaction({
        transactionType: type,
        amount: parsedAmount,
      })
      setConfirmation({ type: result.transactionType, amount: result.amount })
      setAmount("")
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete this transaction.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Wallet />
            Add/Remove Capital
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add/Remove Capital</DialogTitle>
          <DialogDescription>
            Deposit or withdraw cash from your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <SegmentedToggle
              value={type}
              onChange={setType}
              options={[
                { value: "deposit", label: "Deposit" },
                { value: "withdrawal", label: "Withdraw", activeClassName: "text-destructive" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="capital-amount">Amount (USD)</Label>
            <Input
              id="capital-amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Submitting…" : type === "deposit" ? "Deposit" : "Withdraw"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Transaction failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {confirmation && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>
                {confirmation.type === "deposit" ? "Deposit complete" : "Withdrawal complete"}
              </AlertTitle>
              <AlertDescription>
                {confirmation.type === "deposit" ? "Deposited" : "Withdrew"}{" "}
                {formatCurrency(confirmation.amount, "USD")}.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
