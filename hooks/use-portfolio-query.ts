"use client"

import { useEffect, useState } from "react"

import { createPortfolioApi } from "@/lib/portfolio-api"
import { createClient } from "@/lib/supabase/client"

type PortfolioApi = ReturnType<typeof createPortfolioApi>

/** Fetches private portfolio data only after Supabase has identified a user. */
export function usePortfolioQuery<T>(
  enabled: boolean,
  load: (api: PortfolioApi) => Promise<T>,
  dependencies: readonly unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    async function run() {
      try {
        const { data: sessionData } = await createClient().auth.getSession()
        if (!sessionData.session?.access_token) throw new Error("No active session")
        const result = await load(createPortfolioApi(sessionData.session.access_token))
        if (!cancelled) setData(result)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error("Unable to retrieve portfolio data"))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // Callers provide primitive dependencies so a fresh request is made only when inputs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies])

  // Do not expose a previous private response after a user signs out.
  return { data: enabled ? data : null, error: enabled ? error : null }
}
