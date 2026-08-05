"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Loader2, SendHorizonal } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth"
import { usePortfolioSummary } from "@/lib/portfolio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PetSprite, petMoodFromReturn, type PetMood } from "@/components/layout/pet-sprite"
import { useShowDaoDun } from "@/lib/hooks/use-show-daodun"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ChatRole = "user" | "assistant"
type ChatMessage = { id: string; role: ChatRole; content: string }

const GREETING =
  "Sword up, shield ready! I'm DaoDun \u2014 ask me about your portfolio or investing basics."

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function PetChatWidget() {
  const user = useSession()
  const { summary } = usePortfolioSummary()
  const [showDaoDun] = useShowDaoDun()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const mood: PetMood = petMoodFromReturn(summary?.totalReturnPercent ?? 0)

  // Seed the greeting client-side (no API call) the first time the sheet
  // opens, rather than burning a Gemini request just to say hello. Done in
  // the click handler (not an effect) so it's a direct response to the
  // user's action instead of a render-triggered side effect.
  function handleOpen() {
    setOpen(true)
    setMessages((current) =>
      current.length > 0
        ? current
        : [{ id: createId(), role: "assistant", content: GREETING }]
    )
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  if (!user || !showDaoDun) return null

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const content = input.trim()
    if (!content || isSending) return

    setError(null)
    setInput("")

    const userMessage: ChatMessage = { id: createId(), role: "user", content }
    const assistantId = createId()
    const history = [...messages, userMessage]

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }])
    setIsSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          portfolio: summary,
          mood,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "DaoDun couldn't respond. Please try again.")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((current) =>
          current.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
        )
      }

      if (!accumulated.trim()) {
        throw new Error("DaoDun is speechless right now. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "DaoDun couldn't respond. Please try again.")
      setMessages((current) => current.filter((m) => m.id !== assistantId))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        aria-label="Open DaoDun chat"
        className="fixed right-6 bottom-6 z-40 size-16 rounded-full bg-background p-0 shadow-lg ring-1 ring-foreground/10 hover:scale-105 hover:bg-background"
      >
        <PetSprite mood={mood} size={48} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader className="flex-row items-center gap-3 border-b">
            <PetSprite mood={mood} size={40} />
            <div>
              <SheetTitle>DaoDun</SheetTitle>
              <SheetDescription>Your portfolio companion</SheetDescription>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.content || (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="px-4 pb-2 text-xs text-destructive">{error}</p>}

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t p-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message DaoDun..."
              disabled={isSending}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
            >
              {isSending ? <Loader2 className="animate-spin" /> : <SendHorizonal />}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
