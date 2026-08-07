import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import { createInitialPortfolio } from "@/lib/portfolio-setup"

export type SessionUser = {
  id?: string
  email: string
  fullName: string
  dob: string
}

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}

export function isAdult(dob: string): boolean {
  return calculateAge(dob) >= 18
}

export function userFromSupabase(user: User | null): SessionUser | null {
  if (!user || !user.email) return null
  const meta = user.user_metadata as Record<string, string>
  return {
    id: user.id,
    email: user.email,
    fullName: meta.full_name ?? "",
    dob: meta.dob ?? "",
  }
}

export type RegisterInput = {
  email: string
  password: string
  fullName: string
  dob: string
  startingBalance: number
}

export async function registerUser({
  email,
  password,
  fullName,
  dob,
  startingBalance,
}: RegisterInput): Promise<{ needsEmailConfirmation: boolean }> {
  if (!isAdult(dob)) {
    throw new Error("You must be at least 18 years old to register.")
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // `starting_cash_balance` rides along in user metadata so it's still
      // available in `app/auth/confirm/route.ts` after the email-confirmation
      // redirect, when this function's own session (if any) is long gone.
      data: { full_name: fullName, dob, starting_cash_balance: startingBalance },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // Confirmation disabled (or already confirmed): a session exists right
  // away, so set up the portfolio now instead of waiting for the confirm
  // route, which will never run in this flow.
  if (data.session) {
    await createInitialPortfolio(startingBalance)
  }

  return { needsEmailConfirmation: !data.session }
}

export async function loginUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return userFromSupabase(data.user)
}

export async function clearSession() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

// Re-export AuthProvider & session hooks for convenient imports
export { AuthProvider } from "@/components/providers/auth-provider"
export { useSession, useSessionState } from "@/hooks/use-session"
