"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { History } from "lucide-react"

import { recentTransactions, totalTransactionsCount } from "@/lib/mock/dashboard"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { tradeBadgeClass } from "@/lib/trade-status"
import { formatCurrency } from "@/lib/format"
import { matchesQuery } from "@/lib/search"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RecentTransactionsCard() {
  const [query, setQuery] = useState("")
  const user = useSession()
  const isLoggedIn = !!user
  const { data, isLoading } = usePortfolioQuery(isLoggedIn, (api) => api.getTransactions({ perPage: 7 }))

  // Only use mock data for non-logged-in users
  const transactions = useMemo(() => {
    if (data) {
      return data.items.map((transaction) => ({
        date: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }).format(new Date(transaction.date)),
        type: transaction.transaction_type.toUpperCase() as "BUY" | "SELL",
        asset: transaction.symbol,
        qty: transaction.quantity,
        price: transaction.executed_unit_price,
        total: transaction.executed_price,
      }))
    }
    return isLoggedIn ? [] : recentTransactions
  }, [data, isLoggedIn])

  const totalCount = data?.pagination.total_items ?? (isLoggedIn ? 0 : totalTransactionsCount)

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((tx) =>
        matchesQuery(query, tx.asset, tx.type, tx.date)
      ),
    [transactions, query]
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          Recent Transactions
        </CardTitle>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="h-8 w-40 sm:w-48"
          disabled={isLoading}
        />
      </CardHeader>
      <CardContent className="flex grow px-0 h-60">
        {isLoggedIn && isLoading ? (
          <div className="flex w-full flex-col gap-3 px-(--card-spacing) pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="ml-auto h-3.5 w-12" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-(--card-spacing)">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="pr-(--card-spacing) text-right">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    {query
                      ? `No transactions match "${query}".`
                      : isLoggedIn
                        ? "No transactions yet."
                        : `No transactions match "${query}".`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx, i) => (
                  <TableRow key={`${tx.date}-${i}`}>
                    <TableCell className="pl-(--card-spacing) text-muted-foreground">
                      {tx.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={tradeBadgeClass}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.asset}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tx.qty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(tx.price)}
                    </TableCell>
                    <TableCell className="pr-(--card-spacing) text-right font-medium tabular-nums">
                      {formatCurrency(tx.total)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isLoggedIn
            ? `Showing ${filteredTransactions.length} of ${totalCount} transactions`
            : `Showing ${filteredTransactions.length} of last ${totalCount} transactions`}
        </span>
        <Link
          href="/transactions"
          className="font-medium text-primary hover:underline"
        >
          View All Transactions →
        </Link>
      </CardFooter>
    </Card>
  )
}
