"use client"

import { useSession } from "@/lib/auth"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const SUMMARY_CARDS = [
  { label: "Total value", value: "$128,450.32" },
  { label: "Today's change", value: "+$1,204.18" },
  { label: "Holdings", value: "12" },
  { label: "Cash balance", value: "$4,320.00" },
]

export default function DashboardPage() {
  const user = useSession()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{user ? `, ${user.fullName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your portfolio.
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
