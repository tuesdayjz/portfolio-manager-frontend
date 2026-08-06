import type { OptionType } from "@/lib/trade-orders"

/**
 * Shares per option contract. Yahoo quotes option premiums per share, and the
 * backend stores `quantity` in the units the price is quoted in, so an order
 * for N contracts is persisted as `N * OPTION_CONTRACT_SIZE` shares. That keeps
 * cost basis, cash movement and valuation working without a separate
 * multiplier column - only display converts back to contracts.
 */
export const OPTION_CONTRACT_SIZE = 100

export type OptionContractDetails = {
  underlying: string
  /** yyyy-mm-dd */
  expiry: string
  optionType: OptionType
  strike: number
}

// e.g. AAPL260807C00325000 -> AAPL, 26-08-07, call, 325
// Root symbol, YYMMDD, C|P, then the strike in thousandths padded to 8 digits.
const OCC_SYMBOL_PATTERN = /^([A-Z0-9.]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/

/** Build the OCC contract symbol the backend keys the asset on. */
export function buildOccSymbol({
  underlying,
  expiry,
  optionType,
  strike,
}: OptionContractDetails): string {
  const [year, month, day] = expiry.split("-")
  const strikeThousandths = String(Math.round(strike * 1000)).padStart(8, "0")
  return `${underlying.toUpperCase()}${year.slice(2)}${month}${day}${
    optionType === "call" ? "C" : "P"
  }${strikeThousandths}`
}

/**
 * Recover the contract details from an OCC symbol, so holdings and transactions
 * coming back from the backend (which stores only the ticker) can be displayed
 * with a strike and expiry. Returns null for anything that isn't an OCC symbol.
 */
export function parseOccSymbol(symbol: string): OptionContractDetails | null {
  const match = OCC_SYMBOL_PATTERN.exec(symbol.trim().toUpperCase())
  if (!match) return null

  const [, underlying, year, month, day, type, strikeThousandths] = match
  const expiry = `20${year}-${month}-${day}`

  // Reject impossible dates (e.g. month 13) that still match the digit pattern.
  const parsed = new Date(`${expiry}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCMonth() + 1 !== Number(month)) {
    return null
  }

  return {
    underlying,
    expiry,
    optionType: type === "C" ? "call" : "put",
    strike: Number(strikeThousandths) / 1000,
  }
}

/** Human-readable contract label, e.g. "AAPL Aug 7, 2026 325 Call". */
export function formatOptionName({
  underlying,
  expiry,
  optionType,
  strike,
}: OptionContractDetails): string {
  const date = new Date(`${expiry}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
  return `${underlying.toUpperCase()} ${date} ${strike} ${
    optionType === "call" ? "Call" : "Put"
  }`
}

/** yyyy-mm-dd for a Yahoo expiration timestamp (unix seconds, UTC-dated). */
export function expiryDateValue(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}
