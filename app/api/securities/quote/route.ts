import { NextRequest, NextResponse } from "next/server"

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}

export type SecurityQuote = {
  symbol: string
  name: string
  currency: string
  exchange: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  marketState: string
  asOf: number
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim()

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 })
  }

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  )
  url.searchParams.set("interval", "1d")
  url.searchParams.set("range", "1d")

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: "no-store" })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Live price is temporarily unavailable." },
        { status: 502 }
      )
    }

    const data = await res.json()
    const result = data.chart?.result?.[0]
    const meta = result?.meta

    if (!meta || typeof meta.regularMarketPrice !== "number") {
      return NextResponse.json({ error: `No quote found for "${symbol}".` }, { status: 404 })
    }

    const price = meta.regularMarketPrice as number
    const previousClose = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number
    const change = price - previousClose
    const changePercent = previousClose ? (change / previousClose) * 100 : 0

    const quote: SecurityQuote = {
      symbol: meta.symbol ?? symbol.toUpperCase(),
      name: meta.longName ?? meta.shortName ?? meta.symbol ?? symbol.toUpperCase(),
      currency: meta.currency ?? "USD",
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
      price,
      previousClose,
      change,
      changePercent,
      marketState: meta.marketState ?? "UNKNOWN",
      asOf: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
    }

    return NextResponse.json(quote)
  } catch {
    return NextResponse.json(
      { error: "Live price is temporarily unavailable." },
      { status: 502 }
    )
  }
}
