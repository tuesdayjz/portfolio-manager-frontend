import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      if (type === "signup") {
        await createPortfolioFromSignupMetadata(supabase)
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation-failed", origin)
  )
}

// Reads the starting balance stashed in user metadata at signup (see
// `registerUser` in `lib/auth.ts`) and creates the portfolio now that a
// session exists. Best-effort: a failure here shouldn't block login, since
// the user can still use the app once the portfolio is created some other
// way (e.g. a retry).
async function createPortfolioFromSignupMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const startingBalance = session?.user.user_metadata?.starting_cash_balance
  if (!session || typeof startingBalance !== "number") {
    return
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/portfolios/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ cash_balance: startingBalance }),
      cache: "no-store",
    })
    // 409 (portfolio already exists) is expected on a repeat confirmation click.
    if (!res.ok && res.status !== 409) {
      console.error(`[auth/confirm] Portfolio creation failed with ${res.status}`)
    }
  } catch (err) {
    console.error("[auth/confirm] Unable to reach the portfolio service:", err)
  }
}
