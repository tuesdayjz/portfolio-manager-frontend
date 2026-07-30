"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  formatExpiry,
  getOptionChain,
  type OptionChain,
  type OptionContract,
  type SecurityQuote,
} from "@/lib/securities"
import type { OptionType } from "@/lib/trade-orders"

type ChainRow = {
  strike: number
  call?: OptionContract
  put?: OptionContract
}

export function OptionChainDialog({
  symbol,
  quote,
  onSelect,
}: {
  symbol: string
  quote: SecurityQuote | null
  onSelect: (contract: OptionContract, type: OptionType, date: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [chainDate, setChainDate] = useState<number | undefined>(undefined)
  const [chain, setChain] = useState<OptionChain | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const atmRowRef = useRef<HTMLTableRowElement | null>(null)
  const hasScrolledToAtmRef = useRef(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getOptionChain(symbol, chainDate)
      .then((result) => {
        if (cancelled) return
        setChain(result)
        if (chainDate === undefined && result.expirations.length > 0) {
          setChainDate(result.expirations[0])
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Option chain is unavailable.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, symbol, chainDate])

  const underlyingPrice = quote?.price ?? chain?.underlyingPrice ?? 0

  const rows = useMemo<ChainRow[]>(() => {
    if (!chain) return []
    const byStrike = new Map<number, ChainRow>()
    for (const call of chain.calls) {
      byStrike.set(call.strike, { strike: call.strike, call })
    }
    for (const put of chain.puts) {
      const existing = byStrike.get(put.strike)
      if (existing) existing.put = put
      else byStrike.set(put.strike, { strike: put.strike, put })
    }
    return Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike)
  }, [chain])

  const atmStrike = useMemo(() => {
    if (rows.length === 0 || !underlyingPrice) return null
    return rows.reduce((closest, row) =>
      Math.abs(row.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice)
        ? row
        : closest
    ).strike
  }, [rows, underlyingPrice])

  useLayoutEffect(() => {
    if (!open) {
      hasScrolledToAtmRef.current = false
      return
    }
    if (hasScrolledToAtmRef.current || rows.length === 0 || atmStrike === null) return
    atmRowRef.current?.scrollIntoView({ block: "center" })
    hasScrolledToAtmRef.current = true
  }, [open, rows, atmStrike])

  function handlePick(contract: OptionContract | undefined, type: OptionType) {
    if (!contract || chainDate === undefined) return
    onSelect(contract, type, chainDate)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Table2 />
            Options Wizard
          </Button>
        }
      />
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{symbol} Option Chain</DialogTitle>
          <DialogDescription>
            Underlying {formatCurrency(underlyingPrice, quote?.currency ?? "USD")} · click a
            row to load that contract into the ticket.
          </DialogDescription>
        </DialogHeader>

        {chain && chain.expirations.length > 0 && (
          <Select
            value={chainDate !== undefined ? String(chainDate) : ""}
            onValueChange={(value) => setChainDate(Number(value as string))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select expiry">
                {(value: string | null) => (value ? formatExpiry(Number(value)) : "Select expiry")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {chain.expirations.map((exp) => (
                <SelectItem key={exp} value={String(exp)}>
                  {formatExpiry(exp)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Loading option chain…</p>
        )}
        {error && <p className="text-sm text-muted-foreground">{error}</p>}

        {!error && rows.length > 0 && (
          <div className="max-h-[55vh] overflow-auto rounded-lg border">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-popover">
                <tr className="text-xs text-muted-foreground">
                  <th colSpan={3} className="border-b px-2 py-1.5 text-center font-medium">
                    Calls
                  </th>
                  <th className="border-b px-2 py-1.5 text-center font-medium">Strike</th>
                  <th colSpan={3} className="border-b px-2 py-1.5 text-center font-medium">
                    Puts
                  </th>
                </tr>
                <tr className="text-xs text-muted-foreground">
                  <th className="border-b px-2 py-1 text-right font-medium">Last</th>
                  <th className="border-b px-2 py-1 text-right font-medium">Bid</th>
                  <th className="border-b px-2 py-1 text-right font-medium">Ask</th>
                  <th className="border-b px-2 py-1 text-center font-medium"></th>
                  <th className="border-b px-2 py-1 text-right font-medium">Bid</th>
                  <th className="border-b px-2 py-1 text-right font-medium">Ask</th>
                  <th className="border-b px-2 py-1 text-right font-medium">Last</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const callItm = row.strike < underlyingPrice
                  const putItm = row.strike > underlyingPrice
                  const isAtm = row.strike === atmStrike
                  return (
                    <tr
                      key={row.strike}
                      ref={isAtm ? atmRowRef : undefined}
                      className={cn("border-b last:border-b-0", isAtm && "bg-accent/40")}
                    >
                      <td
                        onClick={() => handlePick(row.call, "call")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          callItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.call ? row.call.lastPrice.toFixed(2) : "—"}
                      </td>
                      <td
                        onClick={() => handlePick(row.call, "call")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          callItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.call ? row.call.bid.toFixed(2) : "—"}
                      </td>
                      <td
                        onClick={() => handlePick(row.call, "call")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          callItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.call ? row.call.ask.toFixed(2) : "—"}
                      </td>
                      <td className="px-2 py-1 text-center font-medium tabular-nums">
                        {row.strike.toFixed(2)}
                      </td>
                      <td
                        onClick={() => handlePick(row.put, "put")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          putItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.put ? row.put.bid.toFixed(2) : "—"}
                      </td>
                      <td
                        onClick={() => handlePick(row.put, "put")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          putItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.put ? row.put.ask.toFixed(2) : "—"}
                      </td>
                      <td
                        onClick={() => handlePick(row.put, "put")}
                        className={cn(
                          "cursor-pointer px-2 py-1 text-right tabular-nums hover:bg-accent",
                          putItm && "bg-emerald-100 dark:bg-emerald-950/50"
                        )}
                      >
                        {row.put ? row.put.lastPrice.toFixed(2) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
