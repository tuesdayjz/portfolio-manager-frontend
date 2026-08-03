import type { OptionType } from "@/lib/trade-orders"

// Approximate constant maturity risk-free rate used for Greeks. Good enough
// for delta/gamma/vega; only theta/rho are meaningfully sensitive to it.
const RISK_FREE_RATE = 0.045
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
const MIN_YEARS_TO_EXPIRY = 1 / SECONDS_PER_YEAR // clamp 0DTE to 1 second

export type OptionGreeks = {
  delta: number
  gamma: number
  theta: number // per calendar day
  vega: number // per 1 vol point (1%)
  rho: number // per 1 rate point (1%)
}

// Abramowitz & Stegun 7.1.26 rational approximation, |error| < 1.5e-7.
// Closed-form and branch-free, so this costs the same as a handful of
// multiplies — no iteration, no lookup tables.
function stdNormalCdf(x: number): number {
  const b1 = 0.319381530
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429
  const p = 0.2316419
  const c = 0.3989422804014327 // 1/sqrt(2*pi)

  const z = Math.abs(x)
  const t = 1 / (1 + p * z)
  const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))))
  const cdf = 1 - c * Math.exp(-z * z / 2) * poly
  return x >= 0 ? cdf : 1 - cdf
}

function stdNormalPdf(x: number): number {
  return 0.3989422804014327 * Math.exp(-x * x / 2)
}

/**
 * Closed-form Black-Scholes Greeks for a single contract. O(1): a fixed
 * number of exp/log/sqrt calls regardless of chain size, so it's cheap
 * enough to run per-keystroke on just the one contract the user has
 * selected rather than the whole option chain.
 */
export function computeOptionGreeks({
  optionType,
  underlyingPrice,
  strike,
  expiryUnixSeconds,
  impliedVolatility,
  now = Date.now(),
}: {
  optionType: OptionType
  underlyingPrice: number
  strike: number
  expiryUnixSeconds: number
  impliedVolatility: number
  now?: number
}): OptionGreeks | null {
  if (underlyingPrice <= 0 || strike <= 0 || impliedVolatility <= 0) return null

  const secondsToExpiry = expiryUnixSeconds * 1000 - now
  if (secondsToExpiry <= 0) return null

  const T = Math.max(secondsToExpiry / 1000 / SECONDS_PER_YEAR, MIN_YEARS_TO_EXPIRY)
  const sigma = impliedVolatility
  const r = RISK_FREE_RATE
  const sqrtT = Math.sqrt(T)

  const d1 =
    (Math.log(underlyingPrice / strike) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT

  const pdfD1 = stdNormalPdf(d1)
  const discountedStrike = strike * Math.exp(-r * T)

  const gamma = pdfD1 / (underlyingPrice * sigma * sqrtT)
  const vegaAnnual = underlyingPrice * pdfD1 * sqrtT

  if (optionType === "call") {
    const nD1 = stdNormalCdf(d1)
    const nD2 = stdNormalCdf(d2)
    const thetaAnnual = -(underlyingPrice * pdfD1 * sigma) / (2 * sqrtT) - r * discountedStrike * nD2
    return {
      delta: nD1,
      gamma,
      theta: thetaAnnual / 365,
      vega: vegaAnnual / 100,
      rho: (strike * T * Math.exp(-r * T) * nD2) / 100,
    }
  }

  const nNegD1 = stdNormalCdf(-d1)
  const nNegD2 = stdNormalCdf(-d2)
  const thetaAnnual = -(underlyingPrice * pdfD1 * sigma) / (2 * sqrtT) + r * discountedStrike * nNegD2
  return {
    delta: -nNegD1,
    gamma,
    theta: thetaAnnual / 365,
    vega: vegaAnnual / 100,
    rho: (-strike * T * Math.exp(-r * T) * nNegD2) / 100,
  }
}
