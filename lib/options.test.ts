import assert from "node:assert/strict"
import test from "node:test"

import {
  buildOccSymbol,
  formatOptionName,
  expiryDateValue,
  parseOccSymbol,
  OPTION_CONTRACT_SIZE,
} from "./options.ts"

test("builds an OCC symbol matching Yahoo's contract symbol format", () => {
  assert.equal(
    buildOccSymbol({
      underlying: "AAPL",
      expiry: "2026-08-07",
      optionType: "call",
      strike: 325,
    }),
    "AAPL260807C00325000"
  )
})

test("builds an OCC symbol for a fractional strike put", () => {
  assert.equal(
    buildOccSymbol({
      underlying: "spy",
      expiry: "2026-12-18",
      optionType: "put",
      strike: 512.5,
    }),
    "SPY261218P00512500"
  )
})

test("parses an OCC symbol back into contract details", () => {
  assert.deepEqual(parseOccSymbol("AAPL260807C00325000"), {
    underlying: "AAPL",
    expiry: "2026-08-07",
    optionType: "call",
    strike: 325,
  })
})

test("round-trips every build through parse", () => {
  for (const details of [
    { underlying: "AAPL", expiry: "2026-08-07", optionType: "call" as const, strike: 325 },
    { underlying: "SPY", expiry: "2026-12-18", optionType: "put" as const, strike: 512.5 },
    { underlying: "T", expiry: "2027-01-15", optionType: "call" as const, strike: 7.25 },
  ]) {
    assert.deepEqual(parseOccSymbol(buildOccSymbol(details)), details)
  }
})

test("rejects tickers that are not option contracts", () => {
  for (const ticker of ["AAPL", "CASH-USD", "ZT=F", "7203.T", "BRK.B"]) {
    assert.equal(parseOccSymbol(ticker), null, `expected ${ticker} to not parse`)
  }
})

test("rejects an OCC-shaped symbol with an impossible month", () => {
  assert.equal(parseOccSymbol("AAPL261307C00325000"), null)
})

test("formats a human-readable contract name", () => {
  assert.equal(
    formatOptionName({
      underlying: "AAPL",
      expiry: "2026-08-07",
      optionType: "call",
      strike: 325,
    }),
    "AAPL Aug 7, 2026 325 Call"
  )
})

test("converts a Yahoo expiration timestamp to a date value", () => {
  // Yahoo dates expirations at UTC midnight.
  assert.equal(expiryDateValue(Date.UTC(2026, 7, 7) / 1000), "2026-08-07")
})

test("a contract covers 100 shares", () => {
  assert.equal(OPTION_CONTRACT_SIZE, 100)
})
