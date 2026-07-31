"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { History } from "lucide-react"

import { recentTransactions, totalTransactionsCount } from "@/lib/mock/dashboard"
import { useSession } from "@/lib/auth"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
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
  const { data } = usePortfolioQuery(!!user, (api) => api.getTransactions({ perPage: 7 }))
  const transactions = data
    ? data.items.map((transaction) => ({
        date: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }).format(new Date(transaction.date)),
        type: transaction.transaction_type.toUpperCase() as "BUY" | "SELL",
        asset: transaction.symbol,
        qty: transaction.quantity,
        price: transaction.price,
        total: transaction.total_amount,
      }))
    : recentTransactions
  const totalCount = data?.pagination.total_items ?? totalTransactionsCount

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
        />
      </CardHeader>
      <CardContent className="flex grow px-0 h-60">
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
                  No transactions match &quot;{query}&quot;.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx, i) => (
                <TableRow key={`${tx.date}-${i}`}>
                  <TableCell className="pl-(--card-spacing) text-muted-foreground">
                    {tx.date}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === "BUY" ? "secondary" : "outline"}
                      className={
                        tx.type === "BUY"
                          ? "text-primary"
                          : "text-destructive"
                      }
                    >
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
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredTransactions.length} of last{" "}
          {totalCount} transactions
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
