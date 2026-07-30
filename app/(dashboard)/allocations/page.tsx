"use client"

import { useSession } from "@/lib/auth"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"

export default function AllocationsPage() {
  const user = useSession()
  const isLoggedIn = !!user

  return (
    <div className="relative">
      <div
        className={
          isLoggedIn
            ? "flex flex-col gap-1"
            : "flex flex-col gap-1 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Allocations</h1>
        <p className="text-muted-foreground text-sm">
          Breakdown of holdings by asset class.
        </p>
        <div className="text-muted-foreground mt-8 flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
          Coming soon
        </div>
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
