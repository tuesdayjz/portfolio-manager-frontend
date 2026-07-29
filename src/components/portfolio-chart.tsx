import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChartContainer } from '@/components/ui/chart'
import { generateSeriesData, type Range } from '@/lib/mock-data'

interface PortfolioChartProps {
  range: Range
  onRangeChange: (range: Range) => void
}

export function PortfolioChart({ range, onRangeChange }: PortfolioChartProps) {
  const data = generateSeriesData(range)
  const startVal = data[0].value
  const endVal = data[data.length - 1].value
  const delta = endVal - startVal
  const deltaPercent = ((delta / startVal) * 100).toFixed(2)

  // Calculate Y-axis domain with 10% padding
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range_ = maxValue - minValue
  const yAxisMin = minValue - range_ * 0.1
  const yAxisMax = maxValue + range_ * 0.1

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm text-muted-foreground">Portfolio Total</CardTitle>
            <div className="text-3xl font-bold">${endVal.toLocaleString()}</div>
          </div>
          <div className={`text-right text-sm font-semibold ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500'}`}>
            {delta >= 0 ? '+' : ''} ${Math.abs(delta).toLocaleString()} ({delta >= 0 ? '+' : ''}{deltaPercent}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--text-muted-foreground))"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis
                stroke="hsl(var(--text-muted-foreground))"
                style={{ fontSize: '0.875rem' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                domain={[yAxisMin, yAxisMax]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: `1px solid hsl(var(--border))`,
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 flex justify-center gap-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v: string) => v && onRangeChange(v as Range)}
          >
            <ToggleGroupItem value="7D" aria-label="7 Days" variant="outline">
              7D
            </ToggleGroupItem>
            <ToggleGroupItem value="MTD" aria-label="Month to Date" variant="outline">
              MTD
            </ToggleGroupItem>
            <ToggleGroupItem value="YTD" aria-label="Year to Date" variant="outline">
              YTD
            </ToggleGroupItem>
            <ToggleGroupItem value="1Y" aria-label="1 Year" variant="outline">
              1Y
            </ToggleGroupItem>
            <ToggleGroupItem value="ALL" aria-label="All Time" variant="outline">
              ALL
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  )
}
