"use client"

import { createContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { userFromSupabase, type SessionUser } from "@/lib/auth"

export type AuthContextValue = {
  user: SessionUser | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(userFromSupabase(data.user))
      })
      .finally(() => {
        setIsLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(userFromSupabase(session?.user ?? null))
        setIsLoading(false)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
