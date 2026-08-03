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

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/portfolios/summary`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the portfolio service." },
      { status: 502 }
    )
  }
}
