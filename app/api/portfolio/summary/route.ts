import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let res: Response
  try {
    res = await fetch(`${process.env.BACKEND_URL}/api/v1/portfolios/summary`, {
      headers: {
        "Accept": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the portfolio service. Please try again later." },
      { status: 502 }
    )
  }

  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    console.error(`[/api/portfolio/summary] Backend returned non-JSON ${res.status}:`, text.slice(0, 200))
    return NextResponse.json(
      { message: `Portfolio service error (${res.status}). Please try again later.` },
      { status: res.status >= 500 ? 502 : res.status }
    )
  }

  return NextResponse.json(data, { status: res.status })
}
