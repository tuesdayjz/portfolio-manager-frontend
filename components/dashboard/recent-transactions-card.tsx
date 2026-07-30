import Link from "next/link"
import { History } from "lucide-react"

import { recentTransactions, totalTransactionsCount } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/format"
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          Recent Transactions
        </CardTitle>
        <Input
          type="search"
          placeholder="Search..."
          className="h-8 w-40 sm:w-48"
        />
      </CardHeader>
      <CardContent className="px-0">
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
            {recentTransactions.map((tx, i) => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {recentTransactions.length} of last {totalTransactionsCount}{" "}
          transactions
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
