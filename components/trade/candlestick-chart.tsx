"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from "recharts"
import { Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SegmentedToggle } from "@/components/trade/segmented-toggle"
import { cn } from "@/lib/utils"
import {
  CHART_PERIODS,
  formatCurrency,
  getHistory,
  type Candle,
  type ChartPeriod,
} from "@/lib/securities"

const chartConfig: ChartConfig = {
  price: { label: "Price", color: "var(--chart-3)" },
}

type ChartCandle = Candle & { range: [number, number] }

// Every period except "1D" is just a zoom window into the same 5-year daily
// series, so zooming out from any of them can go all the way to the 5Y view.
// "1D" needs intraday granularity Yahoo can't provide over a 5-year range, so
// it stays backed by its own separate intraday fetch.
type SymbolRequest = { symbol: string }
type SymbolHistoryState =
  | { request: SymbolRequest; candles: ChartCandle[] }
  | { request: SymbolRequest; error: string }
  | null

const PERIOD_WINDOW: Partial<Record<ChartPeriod, number>> = {
  "1W": 5,
  "1M": 21,
  "3M": 63,
  "6M": 126,
  "1Y": 252,
}

function toChartCandles(candles: Candle[]): ChartCandle[] {
  return candles.map((c) => ({ ...c, range: [c.low, c.high] as [number, number] }))
}

// Recharts re-renders a custom SVG shape per data point, which gets sluggish
// well before a full 5Y daily series (~1260 candles) is on screen. Zoomed out
// that far, individual daily candles are indistinguishable anyway, so bucket
// them into coarser OHLC candles instead of rendering every one.
const MAX_RENDERED_CANDLES = 180

function downsampleCandles(candles: ChartCandle[], maxPoints: number): ChartCandle[] {
  if (candles.length <= maxPoints) return candles
  const bucketSize = Math.ceil(candles.length / maxPoints)
  const result: ChartCandle[] = []
  for (let i = 0; i < candles.length; i += bucketSize) {
    const bucket = candles.slice(i, i + bucketSize)
    const high = Math.max(...bucket.map((c) => c.high))
    const low = Math.min(...bucket.map((c) => c.low))
    result.push({
      time: bucket[0].time,
      open: bucket[0].open,
      close: bucket[bucket.length - 1].close,
      high,
      low,
      volume: bucket.reduce((sum, c) => sum + c.volume, 0),
      range: [low, high],
    })
  }
  return result
}

function defaultZoomFor(period: ChartPeriod, total: number): [number, number] | null {
  const windowSize = PERIOD_WINDOW[period]
  if (!windowSize || total === 0) return null
  const start = Math.max(0, total - windowSize)
  return start <= 0 ? null : [start, total]
}

// Zoom is decoupled from the period preset (any period can be zoomed out to
// the full 5Y span), so axis formatting is chosen from the actual visible
// time span rather than the nominal period.
type AxisGranularity = "intraday" | "short" | "long"

function formatAxisTime(unixSeconds: number, granularity: AxisGranularity) {
  const date = new Date(unixSeconds * 1000)
  if (granularity === "intraday") {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date)
  }
  if (granularity === "long") {
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date)
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
}

function formatTooltipTime(unixSeconds: number, granularity: AxisGranularity) {
  const date = new Date(unixSeconds * 1000)
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
  if (granularity === "intraday") {
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
    return `${dateLabel}, ${timeLabel}`
  }
  return dateLabel
}

function CandleShape(props: {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: ChartCandle
}) {
  const { x, y, width, height, payload } = props
  if (x == null || y == null || width == null || height == null || !payload) return null

  const { open, close, high, low } = payload
  const isUp = close >= open
  const color = isUp ? "var(--color-up)" : "var(--color-down)"

  const scaleY = (value: number) => {
    if (high === low) return y + height / 2
    return y + height * ((high - value) / (high - low))
  }

  const openY = scaleY(open)
  const closeY = scaleY(close)
  const bodyY = Math.min(openY, closeY)
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1)

  const wickX = x + width / 2
  const bodyWidth = Math.max(width * 0.6, 2)
  const bodyX = x + (width - bodyWidth) / 2

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyY} width={bodyWidth} height={bodyHeight} fill={color} />
    </g>
  )
}

function CandleTooltip({
  active,
  payload,
  granularity,
  currency,
}: {
  active?: boolean
  payload?: { payload: ChartCandle }[]
  granularity: AxisGranularity
  currency: string
}) {
  if (!active || !payload?.length) return null
  const candle = payload[0].payload
  const isUp = candle.close >= candle.open

  return (
    <div className="grid min-w-40 gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{formatTooltipTime(candle.time, granularity)}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums text-muted-foreground">
        <span>Open</span>
        <span className="text-right text-foreground">{formatCurrency(candle.open, currency)}</span>
        <span>High</span>
        <span className="text-right text-foreground">{formatCurrency(candle.high, currency)}</span>
        <span>Low</span>
        <span className="text-right text-foreground">{formatCurrency(candle.low, currency)}</span>
        <span>Close</span>
        <span
          className={cn(
            "text-right font-medium",
            isUp ? "text-chart-3" : "text-destructive"
          )}
        >
          {formatCurrency(candle.close, currency)}
        </span>
      </div>
    </div>
  )
}

const MIN_VISIBLE_CANDLES = 5
const WHEEL_ZOOM_SENSITIVITY = 0.0015

type ZoomRange = [number, number] | null
type DragState = { startX: number; startRange: [number, number]; total: number }

export function CandlestickChart({
  symbol,
  currency = "USD",
}: {
  symbol: string
  currency?: string
}) {
  const [period, setPeriod] = useState<ChartPeriod>("1M")
  const [dailyState, setDailyState] = useState<SymbolHistoryState>(null)
  const [intradayState, setIntradayState] = useState<SymbolHistoryState>(null)
  const [zoomRange, setZoomRange] = useState<ZoomRange>(null)
  const [enlarged, setEnlarged] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const dailyCandles =
    dailyState && dailyState.request.symbol === symbol && "candles" in dailyState
      ? dailyState.candles
      : null
  const dailyError =
    dailyState && dailyState.request.symbol === symbol && "error" in dailyState
      ? dailyState.error
      : null
  const intradayCandles =
    intradayState && intradayState.request.symbol === symbol && "candles" in intradayState
      ? intradayState.candles
      : null
  const intradayError =
    intradayState && intradayState.request.symbol === symbol && "error" in intradayState
      ? intradayState.error
      : null

  const candles = period === "1D" ? intradayCandles : dailyCandles
  const error = period === "1D" ? intradayError : dailyError
  const loading =
    period === "1D"
      ? intradayState === null || intradayState.request.symbol !== symbol
      : dailyState === null || dailyState.request.symbol !== symbol

  // The 5-year daily series backs every period except "1D" (see PERIOD_WINDOW),
  // so it only needs to be fetched once per symbol.
  useEffect(() => {
    let cancelled = false
    getHistory(symbol, "5Y")
      .then((result) => {
        if (cancelled) return
        setDailyState({ request: { symbol }, candles: toChartCandles(result.candles) })
      })
      .catch((err) => {
        if (cancelled) return
        setDailyState({
          request: { symbol },
          error: err instanceof Error ? err.message : "Unable to load historical prices.",
        })
      })
    return () => {
      cancelled = true
    }
  }, [symbol])

  // Intraday data is only needed for "1D", so fetch it lazily the first time
  // that tab is visited (and again if the symbol changes while on it).
  useEffect(() => {
    if (period !== "1D") return
    let cancelled = false
    getHistory(symbol, "1D")
      .then((result) => {
        if (cancelled) return
        setIntradayState({ request: { symbol }, candles: toChartCandles(result.candles) })
      })
      .catch((err) => {
        if (cancelled) return
        setIntradayState({
          request: { symbol },
          error: err instanceof Error ? err.message : "Unable to load historical prices.",
        })
      })
    return () => {
      cancelled = true
    }
  }, [symbol, period])

  // Reset the zoom window to the selected period's default whenever its
  // backing dataset (re)loads, e.g. after a symbol switch.
  const prevDailyLengthRef = useRef<number | null>(null)
  useEffect(() => {
    if (period === "1D") return
    const len = dailyCandles?.length ?? 0
    if (prevDailyLengthRef.current !== len) {
      prevDailyLengthRef.current = len
      setZoomRange(defaultZoomFor(period, len))
    }
  }, [period, dailyCandles])

  const prevIntradayLengthRef = useRef<number | null>(null)
  useEffect(() => {
    if (period !== "1D") return
    const len = intradayCandles?.length ?? 0
    if (prevIntradayLengthRef.current !== len) {
      prevIntradayLengthRef.current = len
      setZoomRange(defaultZoomFor(period, len))
    }
  }, [period, intradayCandles])

  function handlePeriodChange(next: ChartPeriod) {
    setPeriod(next)
    const nextCandles = next === "1D" ? intradayCandles : dailyCandles
    setZoomRange(defaultZoomFor(next, nextCandles?.length ?? 0))
  }

  const total = candles?.length ?? 0
  const [zoomStart, zoomEnd] = zoomRange ?? [0, total]
  const visibleCandles = candles ? candles.slice(zoomStart, zoomEnd) : null

  function applyZoomFactor(factor: number) {
    setZoomRange((prev) => {
      const total = candles?.length ?? 0
      if (total === 0) return prev
      const [s, e] = prev ?? [0, total]
      const size = e - s
      const newSize = Math.min(total, Math.max(MIN_VISIBLE_CANDLES, Math.round(size * factor)))
      if (newSize === size) return prev
      const mid = (s + e) / 2
      let start = Math.round(mid - newSize / 2)
      let end = start + newSize
      if (start < 0) {
        start = 0
        end = newSize
      }
      if (end > total) {
        end = total
        start = total - newSize
      }
      if (start <= 0 && end >= total) return null
      return [start, end]
    })
  }

  const handleDragMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current
    const el = containerRef.current
    if (!drag || !el) return
    const width = el.getBoundingClientRect().width || 1
    const [s, en] = drag.startRange
    const size = en - s
    const indexDelta = Math.round((-(e.clientX - drag.startX) / width) * size)
    let start = s + indexDelta
    let end = en + indexDelta
    if (start < 0) {
      start = 0
      end = size
    }
    if (end > drag.total) {
      end = drag.total
      start = drag.total - size
    }
    setZoomRange(start <= 0 && end >= drag.total ? null : [start, end])
  }, [])

  const handleDragEnd = useCallback(() => {
    dragRef.current = null
    window.removeEventListener("mousemove", handleDragMove)
  }, [handleDragMove])

  useEffect(() => {
    const onMouseUp = () => handleDragEnd()
    window.addEventListener("mouseup", onMouseUp)
    return () => window.removeEventListener("mouseup", onMouseUp)
  }, [handleDragEnd])

  function handleDragStart(e: React.MouseEvent) {
    if (e.button !== 0 || !candles || candles.length === 0) return
    const total = candles.length
    const [s, en] = zoomRange ?? [0, total]
    if (en - s >= total) return
    dragRef.current = { startX: e.clientX, startRange: [s, en], total }
    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragMove)
      window.removeEventListener("mouseup", handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !candles || candles.length === 0) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      applyZoomFactor(Math.exp(e.deltaY * WHEEL_ZOOM_SENSITIVITY))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
    // Re-run when `enlarged` changes too: the chart (and containerRef's node)
    // moves between the inline card and the dialog, so the listener needs to
    // be rebound to whichever element is mounted now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, enlarged])

  const renderedCandles = visibleCandles ? downsampleCandles(visibleCandles, MAX_RENDERED_CANDLES) : null

  const lows = renderedCandles?.map((c) => c.low) ?? []
  const highs = renderedCandles?.map((c) => c.high) ?? []
  const min = lows.length ? Math.min(...lows) : 0
  const max = highs.length ? Math.max(...highs) : 0
  const pad = (max - min) * 0.08 || max * 0.02 || 1

  const spanDays =
    visibleCandles && visibleCandles.length > 1
      ? (visibleCandles[visibleCandles.length - 1].time - visibleCandles[0].time) / 86400
      : 0
  const axisGranularity: AxisGranularity =
    period === "1D" ? "intraday" : spanDays > 370 ? "long" : "short"

  const chartHeightClass = enlarged ? "h-[70vh]" : "h-80"

  const chartSection = (
    <>
      <div className="flex items-center justify-between gap-2">
        <SegmentedToggle
          value={period}
          onChange={handlePeriodChange}
          options={CHART_PERIODS.map((p) => ({ value: p, label: p }))}
          className="w-auto"
        />
        <div className="flex items-center gap-1">
          {!enlarged && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Enlarge chart"
              disabled={!candles || candles.length === 0}
              onClick={() => setEnlarged(true)}
            >
              <Maximize2 />
            </Button>
          )}
        </div>
      </div>

      {visibleCandles && visibleCandles.length > 0 ? (
        <div
          ref={containerRef}
          onMouseDown={handleDragStart}
          className="cursor-grab touch-none select-none active:cursor-grabbing"
        >
          <ChartContainer
            config={chartConfig}
            className={cn(
              "aspect-auto w-full [--color-down:var(--destructive)] [--color-up:var(--chart-3)]",
              chartHeightClass
            )}
          >
            <ComposedChart data={renderedCandles ?? []} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tickFormatter={(value) => formatAxisTime(value, axisGranularity)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                domain={[min - pad, max + pad]}
                tickFormatter={(value) => formatCurrency(value, currency)}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
                content={<CandleTooltip granularity={axisGranularity} currency={currency} />}
              />
              <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false} />
            </ComposedChart>
          </ChartContainer>
        </div>
      ) : (
        <div
          className={cn(
            "flex w-full items-center justify-center rounded-lg border text-sm text-muted-foreground",
            chartHeightClass
          )}
        >
          {loading ? "Loading chart…" : (error ?? "No chart data available.")}
        </div>
      )}
    </>
  )

  if (enlarged) {
    return (
      <Dialog open={enlarged} onOpenChange={setEnlarged}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{symbol} Price Chart</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">{chartSection}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="flex flex-col gap-3">{chartSection}</div>
}
