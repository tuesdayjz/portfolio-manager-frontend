import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { portfolioData } from '@/lib/mock-data'

export function AllocationChart() {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {portfolioData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={hoveredSector === entry.name ? 1 : 0.8}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-6 space-y-2">
          {portfolioData.map((sector) => (
            <div
              key={sector.name}
              onMouseEnter={() => setHoveredSector(sector.name)}
              onMouseLeave={() => setHoveredSector(null)}
              className="flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded"
                  style={{ backgroundColor: sector.color }}
                />
                <span className="text-sm font-medium">{sector.name}</span>
              </div>
              <span className="text-sm font-semibold text-primary">{sector.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
