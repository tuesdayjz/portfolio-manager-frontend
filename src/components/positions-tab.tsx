import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AllocationChart } from '@/components/allocation-chart'
import { holdings } from '@/lib/mock-data'

export function PositionsTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Allocation</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => {
                  const isPositive = !holding.change.startsWith('-')
                  return (
                    <TableRow key={holding.symbol}>
                      <TableCell className="font-semibold text-primary">
                        {holding.symbol}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {holding.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {holding.price}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {holding.allocation}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-500'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {holding.change}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <AllocationChart />
      </div>
    </div>
  )
}
