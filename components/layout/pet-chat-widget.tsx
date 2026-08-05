"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  History,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  SendHorizonal,
  Trash2,
  MessageSquare,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth"
import { usePortfolioSummary } from "@/lib/portfolio"
import { usePortfolioQuery } from "@/hooks/use-portfolio-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PetSprite, petMoodFromReturn, type PetMood } from "@/components/layout/pet-sprite"
import { useShowDaoDun } from "@/lib/hooks/use-show-daodun"
import { MarkdownRenderer } from "@/components/layout/markdown-renderer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ChatRole = "user" | "assistant"
type ChatMessage = { id: string; role: ChatRole; content: string }

type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

const GREETING =
  "Sword up, shield ready! I'm DaoDun \u2014 ask me about your portfolio or investing basics."

const CONVERSATIONS_STORAGE_KEY = "felix_daodun_conversations_v2"
const ACTIVE_CONV_STORAGE_KEY = "felix_daodun_active_id_v2"

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultConversation(): Conversation {
  const now = Date.now()
  return {
    id: createId(),
    title: "New Chat",
    createdAt: now,
    updatedAt: now,
    messages: [{ id: createId(), role: "assistant", content: GREETING }],
  }
}

function generateTitleFromPrompt(prompt: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, " ")
  if (cleaned.length <= 28) return cleaned
  return cleaned.slice(0, 25) + "..."
}

export function PetChatWidget() {
  const user = useSession()
  const isLoggedIn = !!user
  const { summary } = usePortfolioSummary()
  const [showDaoDun] = useShowDaoDun()

  const { data: holdingsData } = usePortfolioQuery(
    isLoggedIn,
    (api) => api.getHoldings({ perPage: 20 })
  )
  const { data: allocationData } = usePortfolioQuery(
    isLoggedIn,
    (api) => api.getAllocation()
  )

  const [open, setOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const mood: PetMood = petMoodFromReturn(summary?.totalReturnPercent ?? 0)

  // Load conversations from local storage on mount
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
      const savedActiveId = localStorage.getItem(ACTIVE_CONV_STORAGE_KEY)

      if (savedConvs) {
        const parsed = JSON.parse(savedConvs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize messages: remove incomplete empty assistant messages from history
          const sanitized = parsed.map((c: Conversation) => ({
            ...c,
            messages: c.messages.filter(
              (m) => m.role === "user" || (m.role === "assistant" && m.content.trim().length > 0)
            ),
          }))
          setConversations(sanitized)
          const validActive = sanitized.find((c: Conversation) => c.id === savedActiveId)
          setActiveConversationId(validActive ? validActive.id : sanitized[0].id)
          setIsLoaded(true)
          return
        }
      }
    } catch (e) {
      console.error("Failed to load DaoDun conversations from cache:", e)
    }

    // Default fallback
    const initial = createDefaultConversation()
    setConversations([initial])
    setActiveConversationId(initial.id)
    setIsLoaded(true)
  }, [])

  // Sync to local storage
  useEffect(() => {
    if (!isLoaded || conversations.length === 0) return
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
      if (activeConversationId) {
        localStorage.setItem(ACTIVE_CONV_STORAGE_KEY, activeConversationId)
      }
    } catch (e) {
      console.error("Failed to save conversations to cache:", e)
    }
  }, [conversations, activeConversationId, isLoaded])

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [activeConversation?.messages, isSending])

  if (!user || !showDaoDun) return null

  function handleOpen() {
    setOpen(true)
  }

  function handleNewConversation() {
    const newConv = createDefaultConversation()
    setConversations((prev) => [newConv, ...prev])
    setActiveConversationId(newConv.id)
    setShowHistoryPanel(false)
    setError(null)
  }

  function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id)
      if (filtered.length === 0) {
        const fallback = createDefaultConversation()
        setActiveConversationId(fallback.id)
        return [fallback]
      }
      if (id === activeConversationId) {
        setActiveConversationId(filtered[0].id)
      }
      return filtered
    })
  }

  function handleClearAllConversations() {
    const fresh = createDefaultConversation()
    setConversations([fresh])
    setActiveConversationId(fresh.id)
    setShowHistoryPanel(false)
    try {
      localStorage.removeItem(CONVERSATIONS_STORAGE_KEY)
      localStorage.removeItem(ACTIVE_CONV_STORAGE_KEY)
    } catch (e) {
      console.error("Failed to clear local cache", e)
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const content = input.trim()
    if (!content || isSending || !activeConversation) return

    setError(null)
    setInput("")

    const userMessage: ChatMessage = { id: createId(), role: "user", content }
    const assistantId = createId()
    setActiveAssistantId(assistantId)

    const updatedMessages = [...activeConversation.messages, userMessage]
    const newTitle =
      activeConversation.title === "New Chat"
        ? generateTitleFromPrompt(content)
        : activeConversation.title

    // Update conversation in state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: [...updatedMessages, { id: assistantId, role: "assistant", content: "" }],
            }
          : c
      )
    )

    setIsSending(true)

    const positions = holdingsData?.items?.map((item) => ({
      ticker: item.ticker,
      name: item.name,
      assetType: item.asset_type,
      quantity: item.quantity,
      marketValue: item.total_market_value,
      totalReturnPercent: item.total_return_percent,
    }))

    const allocation = allocationData?.items?.map((item) => ({
      category: item.category,
      weight: item.weight <= 1 ? item.weight * 100 : item.weight,
      value: item.value,
    }))

    const portfolioPayload = summary
      ? {
          ...summary,
          positions: positions && positions.length > 0 ? positions : undefined,
          allocation: allocation && allocation.length > 0 ? allocation : undefined,
        }
      : null

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          portfolio: portfolioPayload,
          mood,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

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

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  ),
                }
              : c
          )
        )
      }

      if (!accumulated.trim()) {
        throw new Error("DaoDun is speechless right now. Please try again.")
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError"
      const errMsg = isAbort
        ? "Response timed out. Please try again."
        : err instanceof Error
        ? err.message
        : "DaoDun couldn't respond. Please try again."

      setError(errMsg)
      // Remove empty assistant message on failure
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, messages: c.messages.filter((m) => m.id !== assistantId) }
            : c
        )
      )
    } finally {
      clearTimeout(timeoutId)
      setIsSending(false)
      setActiveAssistantId(null)
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
        <SheetContent
          side="right"
          style={{
            width: "100%",
            maxWidth: isExpanded ? "min(960px, 94vw)" : "min(480px, 94vw)",
            transition: "max-width 300ms ease-in-out",
          }}
          className={cn("flex flex-col p-0 data-[side=right]:sm:max-w-none")}
        >
          <SheetHeader className="flex-row items-center justify-between border-b pr-12">
            <div className="flex items-center gap-3">
              <PetSprite mood={mood} size={40} />
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <span>DaoDun</span>
                  {activeConversation && activeConversation.title !== "New Chat" && (
                    <span className="max-w-[140px] truncate text-xs font-normal text-muted-foreground">
                      ({activeConversation.title})
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription>Your portfolio companion</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={showHistoryPanel ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowHistoryPanel((prev) => !prev)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Conversation history"
                aria-label="Toggle conversation history list"
              >
                <History className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleNewConversation}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="New Chat"
                aria-label="Start a new chat conversation"
              >
                <Plus className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title={isExpanded ? "Collapse panel width" : "Expand panel width"}
                aria-label={isExpanded ? "Collapse panel width" : "Expand panel width"}
              >
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </div>
          </SheetHeader>

          {/* Top Notice Banner */}
          <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="size-3.5 shrink-0 text-primary" />
              <p className="truncate">
                <span className="font-medium text-foreground">Local Cache: </span>
                Chat history is saved in your browser cache. Clearing cache will erase history.
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Conversation History Sidebar/Drawer */}
            {showHistoryPanel && (
              <div className="flex w-60 flex-col border-r bg-muted/20">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-semibold text-foreground">Conversations</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNewConversation}
                    className="h-7 text-xs"
                  >
                    <Plus className="mr-1 size-3" /> New
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {conversations
                    .slice()
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map((conv) => {
                      const isActive = conv.id === activeConversation?.id
                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveConversationId(conv.id)
                            setShowHistoryPanel(false)
                          }}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate pr-1">
                            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{conv.title}</span>
                          </div>
                          {conversations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                              title="Delete conversation"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                </div>

                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllConversations}
                    className="w-full justify-start h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="mr-2 size-3.5" /> Clear All History
                  </Button>
                </div>
              </div>
            )}

            {/* Main Chat Thread */}
            <div className="flex flex-1 flex-col">
              <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {activeConversation?.messages.map((message) => {
                  const isPending =
                    isSending && message.id === activeAssistantId && !message.content

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {message.role === "user" ? (
                          message.content
                        ) : message.content ? (
                          <MarkdownRenderer content={message.content} />
                        ) : isPending ? (
                          <div className="flex items-center gap-2 py-1 text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="text-xs font-medium">DaoDun is thinking...</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
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
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
