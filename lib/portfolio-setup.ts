// Creates the current user's portfolio with their chosen starting cash
// balance. Called right after signup when a session already exists (email
// confirmation disabled) — see `registerUser` in `lib/auth.ts`. When
// confirmation is required, the equivalent call happens server-side in
// `app/auth/confirm/route.ts` instead, since no session exists yet here.
export async function createInitialPortfolio(startingBalance: number): Promise<void> {
  const res = await fetch("/api/portfolios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cash_balance: startingBalance }),
  })

  // 409 means the portfolio already exists — treat as a no-op so a retry or
  // a race with the confirm-route call doesn't surface an error to the user.
  if (!res.ok && res.status !== 409) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message ?? data.error ?? "Unable to set up your portfolio.")
  }
}
