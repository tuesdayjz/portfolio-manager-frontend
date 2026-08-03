"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

import { assetAllocation, portfolioTotalValue } from "@/lib/mock/dashboard"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { formatCompactCurrency } from "@/lib/format"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function AssetAllocationCard() {
  const user = useSession()
  const isLoggedIn = !!user
  const { data, isLoading } = usePortfolioQuery(isLoggedIn, (api) => api.getAllocation())

  // Only use mock data for non-logged-in users
  const allocation = data
    ? data.items.map((item, index) => ({
        label: item.category,
        pct: item.weight * 100,
        colorVar: `var(--chart-${(index % 5) + 1})`,
      }))
    : isLoggedIn ? [] : assetAllocation
  const totalValue = data?.total_value ?? (isLoggedIn ? 0 : portfolioTotalValue)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="size-4 text-primary" />
          Asset Allocation Summary
        </CardTitle>
        <Badge variant="secondary">
          {isLoggedIn && isLoading ? "—" : `${allocation.length} Asset Classes`}
        </Badge>
      </CardHeader>
      <CardContent className="flex grow flex-col items-center gap-6 sm:flex-row">
        {isLoggedIn && isLoading ? (
          <>
            <Skeleton className="size-40 shrink-0 rounded-full" />
            <ul className="w-full flex-1 space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-10" />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="relative size-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation.length > 0 ? allocation : [{ label: "empty", pct: 100, colorVar: "var(--muted)" }]}
                    dataKey="pct"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={allocation.length > 1 ? 2 : 0}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {(allocation.length > 0 ? allocation : [{ label: "empty", colorVar: "var(--muted)" }]).map((slice) => (
                      <Cell key={slice.label} fill={slice.colorVar} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums">
                  {formatCompactCurrency(totalValue)}
                </span>
                <span className="text-xs text-muted-foreground">Total Value</span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-2.5">
              {allocation.length === 0 ? (
                <li className="text-sm text-muted-foreground">No holdings yet.</li>
              ) : (
                allocation.map((slice) => (
                  <li
                    key={slice.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-foreground">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.colorVar }}
                      />
                      {slice.label}
                    </span>
                    <span className="font-medium tabular-nums">{slice.pct.toFixed(1)}%</span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{data ? `Last updated ${new Date(data.as_of).toLocaleString()}` : "Last updated 5 mins ago"}</span>
      </CardFooter>
    </Card>
  )
}
