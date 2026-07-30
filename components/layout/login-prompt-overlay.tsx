import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function LoginPromptOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 sm:items-center sm:pt-0">
      <Card className="mx-4 w-full max-w-sm text-center shadow-lg ring-1 ring-foreground/10">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Log in to view your data
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;re looking at sample data. Log in or create an account
              to see your real portfolio.
            </p>
          </div>
          <div className="flex w-full gap-2">
            <Button
              className="flex-1"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Log In
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              render={<Link href="/register" />}
              nativeButton={false}
            >
              Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
