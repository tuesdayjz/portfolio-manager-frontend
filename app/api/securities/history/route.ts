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

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 })
  }

  const config = PERIOD_CONFIG[period] ?? PERIOD_CONFIG["1M"]

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  )
  url.searchParams.set("range", config.range)
  url.searchParams.set("interval", config.interval)

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
