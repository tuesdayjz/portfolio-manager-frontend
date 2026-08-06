"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { OptionChainDialog } from "@/components/trade/option-chain-dialog"
import {
  formatCurrency,
  formatExpiry,
  getOptionChain,
  type OptionChain,
  type OptionContract,
  type SecurityQuote,
} from "@/lib/securities"
import { computeOptionGreeks } from "@/lib/option-greeks"
import {
  buildOccSymbol,
  expiryDateValue,
  formatOptionName,
  OPTION_CONTRACT_SIZE,
  type OptionContractDetails,
} from "@/lib/options"
import { createTransaction } from "@/lib/transactions"
import type {
  OptionType,
  TradeAction,
  TradeOrder,
  TradePosition,
} from "@/lib/trade-orders"

type ChainRequest = { symbol: string; date: number | undefined }
type ChainState =
  | { request: ChainRequest; chain: OptionChain }
  | { request: ChainRequest; error: string }
  | null

function chainRequestKeyOf(request: ChainRequest) {
  return `${request.symbol}:${request.date ?? ""}`
}

// Mount this with `key={symbol}` from the parent so switching the
// underlying security resets the ticket via remount instead of an effect
// that syncs state to a prop change.
export function OptionOrderForm({
  symbol,
  quote,
  onSubmit,
}: {
  symbol: string
  quote: SecurityQuote | null
  onSubmit: (order: TradeOrder) => void
}) {
  const [chainDate, setChainDate] = useState<number | undefined>(undefined)
  const [chainState, setChainState] = useState<ChainState>(null)

  const [optionType, setOptionType] = useState<OptionType>("call")
  const [expiry, setExpiry] = useState<string>("")
  const [contractSymbol, setContractSymbol] = useState<string>("")

  const [manualStrike, setManualStrike] = useState("")
  const [manualExpiry, setManualExpiry] = useState("")
  const [manualPremium, setManualPremium] = useState("")

  const [action, setAction] = useState<TradeAction>("buy")
  const [position, setPosition] = useState<TradePosition>("long")
  const [contracts, setContracts] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<TradeOrder | null>(null)

  const chainRequestKey = chainRequestKeyOf({ symbol, date: chainDate })
  const currentChain =
    chainState && chainRequestKeyOf(chainState.request) === chainRequestKey ? chainState : null

  const chainLoading = currentChain === null
  const chain = currentChain && "chain" in currentChain ? currentChain.chain : null
  const chainError = currentChain && "error" in currentChain ? currentChain.error : null
  const usingLiveChain = !!chain && chain.expirations.length > 0

  useEffect(() => {
    let cancelled = false
    getOptionChain(symbol, chainDate)
      .then((result) => {
        if (cancelled) return
        setChainState({ request: { symbol, date: chainDate }, chain: result })
        if (chainDate === undefined && result.expirations.length > 0) {
          setExpiry(String(result.expirations[0]))
        }
      })
      .catch((err) => {
        if (cancelled) return
        setChainState({
          request: { symbol, date: chainDate },
          error: err instanceof Error ? err.message : "Live option chain unavailable.",
        })
      })
    return () => {
      cancelled = true
    }
  }, [symbol, chainDate])

  const contractsForSide: OptionContract[] = chain
    ? optionType === "call"
      ? chain.calls
      : chain.puts
    : []

  const selectedContract = contractsForSide.find(
    (c) => c.contractSymbol === contractSymbol
  )

  const underlyingPrice = quote?.price ?? chain?.underlyingPrice ?? 0

  // Only the one contract the user has selected gets priced — not the rest
  // of the chain — and the closed-form formula below is O(1), so this is
  // cheap to recompute on every relevant change.
  const greeks = useMemo(() => {
    if (!selectedContract || !underlyingPrice) return null
    return computeOptionGreeks({
      optionType,
      underlyingPrice,
      strike: selectedContract.strike,
      expiryUnixSeconds: selectedContract.expiry,
      impliedVolatility: selectedContract.impliedVolatility,
    })
  }, [selectedContract, optionType, underlyingPrice])

  const premium = usingLiveChain
    ? (selectedContract?.lastPrice ?? 0)
    : Number(manualPremium || 0)
  const numContracts = Number(contracts)
  const estimatedTotal = premium > 0 && numContracts > 0 ? premium * numContracts * 100 : 0

  // A zero premium is rejected by the backend, so block it here rather than
  // surfacing a validation error after the round trip.
  const canSubmit =
    premium > 0 &&
    numContracts > 0 &&
    !submitting &&
    (usingLiveChain
      ? !!selectedContract
      : Number(manualStrike) > 0 && manualExpiry !== "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const details: OptionContractDetails = {
      underlying: symbol,
      expiry: usingLiveChain
        ? expiryDateValue(selectedContract?.expiry ?? Number(expiry))
        : manualExpiry,
      optionType,
      strike: usingLiveChain ? (selectedContract?.strike ?? 0) : Number(manualStrike),
    }
    // Yahoo's own contractSymbol wins when we have it - adjusted contracts
    // (e.g. after a split) carry a non-standard root we can't rebuild.
    const contractSymbol = selectedContract?.contractSymbol ?? buildOccSymbol(details)
    const expiryLabel = usingLiveChain ? formatExpiry(Number(expiry)) : manualExpiry

    setSubmitting(true)
    setError(null)

    try {
      // Quantity goes to the backend in shares, and `premium` is the per-share
      // price the user actually saw - passing it avoids re-fetching a contract
      // whose quote may have moved between display and submit.
      const result = await createTransaction({
        ticker: contractSymbol,
        name: formatOptionName(details),
        transactionType: action,
        position,
        quantity: numContracts * OPTION_CONTRACT_SIZE,
        price: premium,
      })

      const order: TradeOrder = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        instrument: "option",
        symbol,
        name: result.name,
        action,
        position,
        quantity: numContracts,
        price: result.executedUnitPrice,
        total: result.executedPrice,
        optionType,
        strike: details.strike,
        expiry: expiryLabel,
      }

      onSubmit(order)
      setConfirmation(order)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleWizardSelect(contract: OptionContract, type: OptionType, date: number) {
    setOptionType(type)
    setChainDate(date)
    setExpiry(String(date))
    setContractSymbol(contract.contractSymbol)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Option Type</Label>
          <SegmentedToggle
            value={optionType}
            onChange={(value) => {
              setOptionType(value)
              setContractSymbol("")
            }}
            options={[
              { value: "call", label: "Call" },
              { value: "put", label: "Put", activeClassName: "text-destructive" },
            ]}
          />
        </div>
        <OptionChainDialog symbol={symbol} quote={quote} onSelect={handleWizardSelect} />
      </div>

      {chainLoading && (
        <p className="text-sm text-muted-foreground">Loading live option chain…</p>
      )}

      {usingLiveChain && chain && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Expiry</Label>
            <Select
              value={expiry}
              onValueChange={(value) => {
                setExpiry(value as string)
                setContractSymbol("")
                setChainDate(Number(value))
              }}
            >
              <SelectTrigger>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Strike / Contract Value</Label>
            <Select value={contractSymbol} onValueChange={(value) => setContractSymbol(value as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Select strike">
                  {(value: string | null) => {
                    const contract = contractsForSide.find((c) => c.contractSymbol === value)
                    return contract
                      ? `${contract.strike.toFixed(2)} / ${contract.lastPrice.toFixed(2)}`
                      : "Select strike"
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {contractsForSide.map((contract) => (
                  <SelectItem key={contract.contractSymbol} value={contract.contractSymbol}>
                    {contract.strike.toFixed(2)} / {contract.lastPrice.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!usingLiveChain && !chainLoading && (
        <>
          {chainError && (
            <p className="text-sm text-muted-foreground">
              {chainError} Enter the contract details manually below.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-strike">Strike</Label>
              <Input
                id="option-strike"
                type="number"
                min={0}
                step={0.5}
                value={manualStrike}
                onChange={(e) => setManualStrike(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-expiry">Expiry</Label>
              <Input
                id="option-expiry"
                type="date"
                value={manualExpiry}
                onChange={(e) => setManualExpiry(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="option-premium">Premium (per share)</Label>
            <Input
              id="option-premium"
              type="number"
              min={0}
              step={0.01}
              value={manualPremium}
              onChange={(e) => setManualPremium(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
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
          <Label>Position</Label>
          <SegmentedToggle
            value={position}
            onChange={setPosition}
            options={[
              { value: "long", label: "Long" },
              { value: "short", label: "Short", activeClassName: "text-destructive" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="option-contracts">Contracts</Label>
        <Input
          id="option-contracts"
          type="number"
          min={1}
          step={1}
          value={contracts}
          onChange={(e) => setContracts(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">Estimated total (× 100 shares/contract)</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(estimatedTotal, quote?.currency ?? "USD")}
        </span>
      </div>

      {greeks && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold">Risk Management</h3>
          <div className="grid grid-cols-5 gap-2 rounded-lg border px-3 py-2.5 text-sm">
            {(
              [
                ["Delta", greeks.delta],
                ["Gamma", greeks.gamma],
                ["Theta", greeks.theta],
                ["Vega", greeks.vega],
                ["Rho", greeks.rho],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {confirmation.action === "buy" ? "Bought" : "Sold"} {confirmation.quantity}{" "}
            {confirmation.quantity === 1 ? "contract" : "contracts"} of{" "}
            {confirmation.symbol} {confirmation.strike?.toFixed(2)}{" "}
            {confirmation.optionType} exp {confirmation.expiry} ({confirmation.position}) at{" "}
            {formatCurrency(confirmation.price, quote?.currency ?? "USD")} premium.
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}
