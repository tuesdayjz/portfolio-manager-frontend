"use client"

import { useMemo, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { Tabs, TabsIndicator, TabsList, TabsTab } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"
import {
  PERFORMANCE_TABS,
  TIME_RANGES,
  getPerformanceSlice,
  getPerformanceSummary,
  type PerformanceSeriesKey,
  type TimeRangeKey,
} from "@/lib/performance-data"

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatSigned(value: number, formatter: (v: number) => string) {
  return `${value >= 0 ? "+" : ""}${formatter(value)}`
}

function formatAxisDate(dateStr: string, rangeDays: number) {
  const date = new Date(`${dateStr}T00:00:00Z`)
  // Always include two distinguishing fields so ticks never repeat
  // identically (e.g. a bare "Jul" for every point in a multi-month range).
  return rangeDays <= 180
    ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(
        date
      )
    : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", year: "numeric" }).format(
        date
      )
}

function formatAxisCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatTooltipDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00Z`)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function Delta({
  dollar,
  percent,
  size = "sm",
}: {
  dollar: number
  percent: number
  size?: "sm" | "lg"
}) {
  const positive = dollar >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        size === "lg" ? "text-xl" : "text-sm",
        positive ? "text-chart-3" : "text-destructive"
      )}
    >
      <Icon className={cn("shrink-0", size === "lg" ? "size-4" : "size-3.5")} />
      {formatSigned(dollar, formatCurrency)} ({formatSigned(percent, (v) => `${v.toFixed(2)}%`)})
    </span>
  )
}

function StatTile({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta?: { dollar: number; percent: number }
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        {delta ? (
          <CardTitle>
            <Delta dollar={delta.dollar} percent={delta.percent} size="lg" />
          </CardTitle>
        ) : (
            <CardTitle className="text-xl">
              <span className="text-xl font-medium">
                {value}
              </span>
            </CardTitle>
        )}
      </CardHeader>
    </Card>
  )
}

const chartConfig: ChartConfig = {
  value: { label: "Portfolio Value", color: "var(--chart-1)" },
}

function PerformanceChart({
  seriesKey,
  range,
  onRangeChange,
}: {
  seriesKey: PerformanceSeriesKey
  range: TimeRangeKey
  onRangeChange: (range: TimeRangeKey) => void
}) {
  const rangeConfig = TIME_RANGES.find((r) => r.value === range) ?? TIME_RANGES[0]

  const slice = useMemo(
    () => getPerformanceSlice(seriesKey, rangeConfig.days),
    [seriesKey, rangeConfig.days]
  )

  return (
    <Card>
      <CardHeader className="@container/card-header">
        <CardTitle>Portfolio Value</CardTitle>
        <CardDescription>Market value of holdings over time.</CardDescription>
        <CardAction>
          <SegmentedToggle
            value={range}
            onChange={onRangeChange}
            options={TIME_RANGES.map((r) => ({ value: r.value, label: r.label }))}
            className="w-auto"
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <AreaChart data={slice.points} margin={{ left: 4, right: 4 }}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={48}
              tickFormatter={(value) => formatAxisDate(value, rangeConfig.days)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              domain={[(min: number) => min * 0.9, (max: number) => max * 1.1]}
              tickFormatter={formatAxisCurrency}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload ? formatTooltipDate(payload[0].payload.date) : ""
                  }
                  formatter={(value) => (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Area
              dataKey="value"
              type="natural"
              fill="url(#fillValue)"
              stroke="var(--color-value)"
              strokeWidth={2}
              isAnimationActive
              animationDuration={400}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function PerformancePanel({ seriesKey }: { seriesKey: PerformanceSeriesKey }) {
  const [range, setRange] = useState<TimeRangeKey>("3M")

  const summary = useMemo(() => getPerformanceSummary(seriesKey), [seriesKey])
  const rangeConfig = TIME_RANGES.find((r) => r.value === range) ?? TIME_RANGES[0]
  const slice = useMemo(
    () => getPerformanceSlice(seriesKey, rangeConfig.days),
    [seriesKey, rangeConfig.days]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Portfolio Value" value={formatCurrency(summary.marketValue)} />
        <StatTile
          label="Today"
          value={formatSigned(summary.todayChangeDollar, formatCurrency)}
          delta={{ dollar: summary.todayChangeDollar, percent: summary.todayChangePercent }}
        />
        <StatTile
          label={`Return (${rangeConfig.label})`}
          value={formatSigned(slice.periodReturnDollar, formatCurrency)}
          delta={{ dollar: slice.periodReturnDollar, percent: slice.periodReturnPercent }}
        />
        <StatTile
          label="Total Return"
          value={formatSigned(summary.totalReturnDollar, formatCurrency)}
          delta={{ dollar: summary.totalReturnDollar, percent: summary.totalReturnPercent }}
        />
      </div>
      <PerformanceChart seriesKey={seriesKey} range={range} onRangeChange={setRange} />
    </div>
  )
}

export default function AnalyticsPage() {
  const [seriesKey, setSeriesKey] = useState<PerformanceSeriesKey>("all")
  const user = useSession()
  const isLoggedIn = !!user

  return (
    <div className="relative">
      <div
        className={
          isLoggedIn
            ? "mx-auto flex w-full max-w-6xl flex-col gap-6"
            : "mx-auto flex w-full max-w-6xl flex-col gap-6 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <Tabs
          value={seriesKey}
          onValueChange={(value) => setSeriesKey(value as PerformanceSeriesKey)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground text-sm">
                Overall holding performance by asset class and time period.
              </p>
            </div>
            <TabsList>
              <TabsIndicator />
              {PERFORMANCE_TABS.map((option) => (
                <TabsTab key={option.value} value={option.value}>
                  {option.label}
                </TabsTab>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <PerformancePanel seriesKey={seriesKey} />
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
