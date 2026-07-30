"use client"

import { Calendar } from "lucide-react"

import { useSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { AssetAllocationCard } from "@/components/dashboard/asset-allocation-card"
import { PerformanceSummaryCard } from "@/components/dashboard/performance-summary-card"
import { TopPositionsCard } from "@/components/dashboard/top-positions-card"
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"

export default function DashboardPage() {
  const user = useSession()
  const isLoggedIn = !!user

  return (
    <div className="relative">
      <div
        className={
          isLoggedIn
            ? "flex flex-col gap-6"
            : "flex flex-col gap-6 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Real-time tracking, allocation optimization, and secure trade
              records.
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-fit">
            <Calendar />
            Last 30 Days: June 15, 2024
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AssetAllocationCard />
          <PerformanceSummaryCard />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TopPositionsCard />
          <RecentTransactionsCard />
        </div>
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
