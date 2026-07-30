import { NextRequest, NextResponse } from "next/server"

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
}

export type OptionContract = {
  contractSymbol: string
  strike: number
  lastPrice: number
  bid: number
  ask: number
  expiry: number
}

export type OptionChain = {
  symbol: string
  underlyingPrice: number
  expirations: number[]
  calls: OptionContract[]
  puts: OptionContract[]
}

function mapContract(raw: Record<string, unknown>): OptionContract {
  return {
    contractSymbol: (raw.contractSymbol ?? "") as string,
    strike: (raw.strike ?? 0) as number,
    lastPrice: (raw.lastPrice ?? 0) as number,
    bid: (raw.bid ?? 0) as number,
    ask: (raw.ask ?? 0) as number,
    expiry: (raw.expiration ?? 0) as number,
  }
}

type YahooAuth = { cookie: string; crumb: string }

// Yahoo's v7 options endpoint requires a session cookie + crumb (unlike the
// v8 chart/quote endpoint). Cached across requests in this module and
// refreshed on demand when Yahoo rejects it.
let cachedAuth: YahooAuth | null = null

async function fetchYahooAuth(): Promise<YahooAuth> {
  const cookieRes = await fetch("https://fc.yahoo.com", {
    headers: YAHOO_HEADERS,
    cache: "no-store",
  })
  const setCookie =
    typeof cookieRes.headers.getSetCookie === "function"
      ? cookieRes.headers.getSetCookie()
      : [cookieRes.headers.get("set-cookie") ?? ""].filter(Boolean)
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ")

  if (!cookie) {
    throw new Error("Unable to establish a Yahoo Finance session.")
  }

  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { ...YAHOO_HEADERS, Cookie: cookie },
    cache: "no-store",
  })
  const crumb = (await crumbRes.text()).trim()

  if (!crumbRes.ok || !crumb) {
    throw new Error("Unable to fetch a Yahoo Finance crumb.")
  }

  return { cookie, crumb }
}

async function getYahooAuth(forceRefresh = false): Promise<YahooAuth> {
  if (!cachedAuth || forceRefresh) {
    cachedAuth = await fetchYahooAuth()
  }
  return cachedAuth
}

function buildOptionsUrl(symbol: string, date: string | undefined, crumb: string) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`
  )
  if (date) {
    url.searchParams.set("date", date)
  }
  url.searchParams.set("crumb", crumb)
  return url
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim()
  const date = request.nextUrl.searchParams.get("date")?.trim()

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 })
  }

  try {
    let auth = await getYahooAuth()
    let res = await fetch(buildOptionsUrl(symbol, date, auth.crumb), {
      headers: { ...YAHOO_HEADERS, Cookie: auth.cookie },
      cache: "no-store",
    })

    if (res.status === 401) {
      auth = await getYahooAuth(true)
      res = await fetch(buildOptionsUrl(symbol, date, auth.crumb), {
        headers: { ...YAHOO_HEADERS, Cookie: auth.cookie },
        cache: "no-store",
      })
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Option chain is unavailable for this symbol." },
        { status: 502 }
      )
    }

    const data = await res.json()
    const result = data.optionChain?.result?.[0]

    if (!result) {
      return NextResponse.json(
        { error: "Option chain is unavailable for this symbol." },
        { status: 404 }
      )
    }

    const chain = result.options?.[0]

    const payload: OptionChain = {
      symbol: result.underlyingSymbol ?? symbol.toUpperCase(),
      underlyingPrice: result.quote?.regularMarketPrice ?? 0,
      expirations: (result.expirationDates ?? []) as number[],
      calls: ((chain?.calls ?? []) as Record<string, unknown>[]).map(mapContract),
      puts: ((chain?.puts ?? []) as Record<string, unknown>[]).map(mapContract),
    }

    return NextResponse.json(payload)
  } catch {
    return NextResponse.json(
      { error: "Option chain is unavailable for this symbol." },
      { status: 502 }
    )
  }
}
