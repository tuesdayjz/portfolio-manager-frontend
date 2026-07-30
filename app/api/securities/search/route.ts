import { NextRequest, NextResponse } from "next/server"

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}

export type SecuritySearchResult = {
  symbol: string
  name: string
  exchange: string
  type: string
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim()

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search")
  url.searchParams.set("q", query)
  url.searchParams.set("quotesCount", "8")
  url.searchParams.set("newsCount", "0")
  url.searchParams.set("listsCount", "0")

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: "no-store" })

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: "Search is temporarily unavailable." },
        { status: 502 }
      )
    }

    const data = await res.json()

    const results: SecuritySearchResult[] = (data.quotes ?? [])
      .filter((quote: Record<string, unknown>) => typeof quote.symbol === "string")
      .map((quote: Record<string, unknown>) => ({
        symbol: quote.symbol as string,
        name: (quote.shortname ?? quote.longname ?? quote.symbol) as string,
        exchange: (quote.exchange ?? "") as string,
        type: (quote.quoteType ?? "") as string,
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json(
      { results: [], error: "Search is temporarily unavailable." },
      { status: 502 }
    )
  }
}
