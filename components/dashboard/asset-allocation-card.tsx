"use client"

import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

import { assetAllocation, portfolioTotalValue } from "@/lib/mock-data"
import { formatCompactCurrency } from "@/lib/format"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AssetAllocationCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="size-4 text-primary" />
          Asset Allocation Summary
        </CardTitle>
        <Badge variant="secondary">{assetAllocation.length} Asset Classes</Badge>
      </CardHeader>
      <CardContent className="flex grow flex-col items-center gap-6 sm:flex-row">
        <div className="relative size-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assetAllocation}
                dataKey="pct"
                nameKey="label"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {assetAllocation.map((slice) => (
                  <Cell key={slice.label} fill={slice.colorVar} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold tabular-nums">
              {formatCompactCurrency(portfolioTotalValue)}
            </span>
            <span className="text-xs text-muted-foreground">Total Value</span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2.5">
          {assetAllocation.map((slice) => (
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
              <span className="font-medium tabular-nums">{slice.pct}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Last updated 5 mins ago</span>
      </CardFooter>
    </Card>
  )
}
