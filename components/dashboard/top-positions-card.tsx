"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Briefcase } from "lucide-react"

import { topPositions, totalPositionsCount } from "@/lib/mock-data"
import { formatCurrency, formatPercent } from "@/lib/format"
import { matchesQuery } from "@/lib/search"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TopPositionsCard() {
  const [query, setQuery] = useState("")

  const filteredPositions = useMemo(
    () =>
      topPositions.filter((position) =>
        matchesQuery(query, position.symbol, position.name)
      ),
    [query]
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="size-4 text-primary" />
          Top Positions
        </CardTitle>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="h-8 w-40 sm:w-48"
        />
      </CardHeader>
      <CardContent className="flex grow px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-(--card-spacing)">Asset</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Mkt Value</TableHead>
              <TableHead className="pr-(--card-spacing) text-right">
                Change
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No positions match &quot;{query}&quot;.
                </TableCell>
              </TableRow>
            ) : (
              filteredPositions.map((position) => (
                <TableRow key={position.symbol}>
                  <TableCell className="pl-(--card-spacing)">
                    <div className="flex flex-col">
                      <span className="font-medium">{position.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {position.symbol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {position.qty}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(position.price)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(position.marketValue)}
                  </TableCell>
                  <TableCell className="pr-(--card-spacing) text-right">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                        position.changePct >= 0
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {formatPercent(position.changePct)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredPositions.length} of {totalPositionsCount} positions
        </span>
        <Link
          href="/positions"
          className="font-medium text-primary hover:underline"
        >
          View All Positions →
        </Link>
      </CardFooter>
    </Card>
  )
}
