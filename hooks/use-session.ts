"use client"

import { useContext } from "react"
import { AuthContext, type AuthContextValue } from "@/components/providers/auth-provider"
import type { SessionUser } from "@/lib/auth"

export function useSessionState(): AuthContextValue {
  return useContext(AuthContext)
}

export function useSession(): SessionUser | null {
  const { user } = useSessionState()
  return user
}
