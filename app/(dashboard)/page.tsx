<<<<<<< Updated upstream
=======
"use client"

import { Calendar } from "lucide-react"

import { useSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { AssetAllocationCard } from "@/components/dashboard/asset-allocation-card"
import { PerformanceSummaryCard } from "@/components/dashboard/performance-summary-card"
import { TopPositionsCard } from "@/components/dashboard/top-positions-card"
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"

>>>>>>> Stashed changes
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboard Overview
      </h1>
      <p className="text-muted-foreground text-sm">
        Real-time tracking, allocation optimization, and secure trade
        records.
      </p>

      <div className="text-muted-foreground mt-8 flex h-64 items-center justify-center rounded-lg border border-dashed text-sm">
        Widgets (asset allocation, performance, positions, transactions) go
        here.
      </div>
    </div>
  )
}
