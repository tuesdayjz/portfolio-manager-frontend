import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const body = await request.json()

  let res: Response
  try {
    res = await fetch(`${process.env.BACKEND_URL}/api/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    // fetch() itself threw — the backend is truly unreachable (ECONNREFUSED, DNS, etc.)
    return NextResponse.json(
      { message: "Unable to reach the trading service. Please try again later." },
      { status: 502 }
    )
  }

  // Read the body as text first so a non-JSON error page doesn't crash the route.
  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    // Backend returned a non-JSON response (e.g. Werkzeug HTML error page).
    console.error(`[/api/transactions] Backend returned non-JSON ${res.status}:`, text.slice(0, 200))
    return NextResponse.json(
      { message: `Trading service error (${res.status}). Please try again later.` },
      { status: res.status >= 500 ? 502 : res.status }
    )
  }

  return NextResponse.json(data, { status: res.status })
}
