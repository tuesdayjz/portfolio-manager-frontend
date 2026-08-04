import { NextRequest, NextResponse } from "next/server"

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type SecurityHistory = {
  symbol: string
  currency: string
  candles: Candle[]
}

const PERIOD_CONFIG: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1d" },
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim()
  const period = request.nextUrl.searchParams.get("period")?.trim() ?? "1M"
  const date = request.nextUrl.searchParams.get("date")?.trim()

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 })
  }

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  )

  if (date) {
    // A specific-date lookup (e.g. prefilling the EOD price for a backdated
    // trade): request a window ending the day after `date` so Yahoo's range
    // is inclusive, and starting a week earlier so the last daily candle in
    // the response is `date`'s close, or the prior trading day's close if
    // `date` fell on a weekend/holiday.
    const target = new Date(`${date}T00:00:00Z`)
    if (Number.isNaN(target.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 })
    }
    const period1 = new Date(target)
    period1.setUTCDate(period1.getUTCDate() - 7)
    const period2 = new Date(target)
    period2.setUTCDate(period2.getUTCDate() + 1)

    url.searchParams.set("period1", String(Math.floor(period1.getTime() / 1000)))
    url.searchParams.set("period2", String(Math.floor(period2.getTime() / 1000)))
    url.searchParams.set("interval", "1d")
  } else {
    const config = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["1M"]
    url.searchParams.set("range", config.range)
    url.searchParams.set("interval", config.interval)
  }

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: "no-store" })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Historical prices are temporarily unavailable." },
        { status: 502 }
      )
    }

    const data = await res.json()
    const result = data.chart?.result?.[0]
    const timestamps: number[] = result?.timestamp ?? []
    const ohlc = result?.indicators?.quote?.[0]

    if (!result || timestamps.length === 0 || !ohlc) {
      return NextResponse.json(
        { error: `No historical data found for "${symbol}".` },
        { status: 404 }
      )
    }

    const candles: Candle[] = timestamps
      .map((time, i) => ({
        time,
        open: ohlc.open?.[i],
        high: ohlc.high?.[i],
        low: ohlc.low?.[i],
        close: ohlc.close?.[i],
        volume: ohlc.volume?.[i] ?? 0,
      }))
      .filter(
        (c: Partial<Candle>): c is Candle =>
          typeof c.open === "number" &&
          typeof c.high === "number" &&
          typeof c.low === "number" &&
          typeof c.close === "number"
      )

    if (candles.length === 0) {
      return NextResponse.json(
        { error: `No historical data found for "${symbol}".` },
        { status: 404 }
      )
    }

    const payload: SecurityHistory = {
      symbol: result.meta?.symbol ?? symbol.toUpperCase(),
      currency: result.meta?.currency ?? "USD",
      candles,
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json(
      { error: "Historical prices are temporarily unavailable." },
      { status: 502 }
    )
  }
}
