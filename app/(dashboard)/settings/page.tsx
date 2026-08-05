"use client"

import { useSession } from "@/lib/auth"
import { useShowDaoDun } from "@/lib/hooks/use-show-daodun"
import { LoginPromptOverlay } from "@/components/layout/login-prompt-overlay"
import { PetSprite } from "@/components/layout/pet-sprite"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const user = useSession()
  const isLoggedIn = !!user
  const [showDaoDun, setShowDaoDun] = useShowDaoDun()

  return (
    <div className="relative space-y-6">
      <div
        className={
          isLoggedIn
            ? "flex flex-col gap-6"
            : "flex flex-col gap-6 blur-sm pointer-events-none select-none"
        }
        aria-hidden={!isLoggedIn}
        inert={!isLoggedIn}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your application preferences and widget settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Configure widget visibility and companion settings across your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <PetSprite mood="happy" size={32} />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="show-daodun" className="text-base font-medium">
                    Show DaoDun
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Display your pixel art portfolio companion widget on the screen.
                  </p>
                </div>
              </div>
              <Switch
                id="show-daodun"
                checked={showDaoDun}
                onCheckedChange={setShowDaoDun}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLoggedIn && <LoginPromptOverlay />}
    </div>
  )
}
