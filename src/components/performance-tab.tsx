import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { sectorPerformance } from '@/lib/mock-data'

export function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Today&apos;s Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+$4,250</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +0.17%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              YTD Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+$201,400</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +8.2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              1Y Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+$318,050</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +12.9%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Since Inception
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+$892,500</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +36.4%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sector Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sectorPerformance.map((sector) => (
              <div key={sector.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{sector.name}</span>
                  <span
                    className={`text-sm font-semibold ${
                      sector.isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-500'
                    }`}
                  >
                    {sector.change}
                  </span>
                </div>
                <Progress value={sector.width} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
