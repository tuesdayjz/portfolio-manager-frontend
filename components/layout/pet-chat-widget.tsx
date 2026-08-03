"use client"

import { useState } from "react"
import { SendHorizonal } from "lucide-react"

import { useSession } from "@/lib/auth"
import { getPerformanceSummary } from "@/lib/mock/performance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PetSprite, petMoodFromReturn } from "@/components/layout/pet-sprite"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function PetChatWidget() {
  const user = useSession()
  const [open, setOpen] = useState(false)
  const mood = petMoodFromReturn(getPerformanceSummary("all").totalReturnPercent)

  if (!user) return null

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open DaoDun chat"
        className="fixed right-6 bottom-6 z-40 size-16 rounded-full bg-background p-0 shadow-lg ring-1 ring-foreground/10 hover:scale-105 hover:bg-background"
      >
        <PetSprite mood={mood} size={48} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0">
          <SheetHeader className="flex-row items-center gap-3 border-b">
            <PetSprite mood={mood} size={40} />
            <div>
              <SheetTitle>DaoDun</SheetTitle>
              <SheetDescription>Your portfolio companion</SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Chat is coming soon. DaoDun is still sharpening his sword.
            </p>
          </div>

          <div className="flex items-center gap-2 border-t p-4">
            <Input placeholder="Message DaoDun..." disabled />
            <Button size="icon" disabled aria-label="Send message">
              <SendHorizonal />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
