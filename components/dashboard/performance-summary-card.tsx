"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { LineChart as LineChartIcon } from "lucide-react"

import {
  performanceBenchmarkLabel,
  performanceHistory,
} from "@/lib/mock/dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { formatCompactCurrency, formatCurrency } from "@/lib/format"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums text-popover-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

export function PerformanceSummaryCard() {
  const user = useSession()
  const isLoggedIn = !!user
  const { data, isLoading } = usePortfolioQuery(isLoggedIn, (api) => api.getPerformance("3m"))

  // Only use mock data for non-logged-in users
  const history = data
    ? data.points.map((point) => ({
        month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
          new Date(`${point.date}T00:00:00Z`)
        ),
        value: point.total_market_value,
      }))
    : isLoggedIn ? [] : performanceHistory

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="size-4 text-primary" />
          Performance Summary (3M)
        </CardTitle>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" />
          Portfolio Growth
        </span>
      </CardHeader>
      <CardContent className="flex grow h-60">
        {isLoggedIn && isLoading ? (
          <Skeleton className="h-full w-full rounded-md" />
        ) : history.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No performance data yet.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<PerformanceTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#performanceFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Benchmark: {performanceBenchmarkLabel}</span>
        <Link
          href="/analytics"
          className="font-medium text-primary hover:underline"
        >
          See Details →
        </Link>
      </CardFooter>
    </Card>
  )
}
