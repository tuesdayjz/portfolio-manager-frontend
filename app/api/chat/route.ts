import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

// Gemini API free-tier docs: https://ai.google.dev/gemini-api/docs/rate-limits
// `gemini-2.5-flash-lite` currently has the most generous free-tier request
// quota of the stable models, which fits a chatty little mascot widget well.
// Override with GEMINI_MODEL if a different free/paid model is preferred.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

type ChatRole = "user" | "assistant"

type ChatMessage = {
  role: ChatRole
  content: string
}

type PortfolioContext = {
  currency?: string
  currencySymbol?: string
  cashBalance?: number
  totalMarketValue?: number
  totalReturnPercent?: number
}

// Keep the free-tier TPM (tokens-per-minute) budget in check: cap both how
// much history we forward and how long any single message can be.
const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  )
}

function buildSystemInstruction(
  userName: string | undefined,
  portfolio: PortfolioContext | null | undefined,
  mood: string
) {
  const lines = [
    "You are DaoDun (刀盾, literally \"sword and shield\"), a pixel-art Shiba Inu warrior mascot who guards the user's investment portfolio inside the Felix portfolio manager web app.",
    "Personality: loyal, upbeat, a little dramatic about \"protecting\" the portfolio, but genuinely helpful. Use short, friendly sentences. Occasional light \"knight/guardian\" flavor is welcome (e.g. \"On my watch!\"), but do not overdo it.",
    "You help with understanding the user's portfolio, general investing concepts, and how to use the Felix app.",
    "You are NOT a licensed financial advisor. Never give specific buy/sell/timing recommendations or promise returns. For real financial decisions, remind the user to do their own research or consult a professional.",
    "Keep replies concise — usually under 120 words — unless the user explicitly asks for more detail. Reply in the same language the user writes in.",
  ]

  if (userName) {
    lines.push(`The user's name is ${userName}.`)
  }

  if (portfolio) {
    const parts: string[] = []
    const symbol = portfolio.currencySymbol ?? ""
    if (typeof portfolio.totalMarketValue === "number") {
      parts.push(`total market value ${symbol}${portfolio.totalMarketValue.toLocaleString()}`)
    }
    if (typeof portfolio.cashBalance === "number") {
      parts.push(`cash balance ${symbol}${portfolio.cashBalance.toLocaleString()}`)
    }
    if (typeof portfolio.totalReturnPercent === "number") {
      parts.push(`total return ${portfolio.totalReturnPercent.toFixed(2)}%`)
    }
    if (parts.length > 0) {
      lines.push(
        `Current portfolio snapshot (${portfolio.currency ?? "unknown currency"}): ${parts.join(", ")}. You may reference this naturally, but only when relevant.`
      )
    }
  }

  lines.push(
    `Your current mood is "${mood}" (based on today's portfolio performance) — let it color your tone subtly, but don't explicitly say the word "mood".`
  )

  return lines.join(" ")
}

function emitSseLine(
  line: string,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const trimmedLine = line.trim()
  if (!trimmedLine.startsWith("data:")) return

  const payload = trimmedLine.slice("data:".length).trim()
  if (!payload || payload === "[DONE]") return

  try {
    const parsed = JSON.parse(payload)
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text === "string" && text.length > 0) {
      controller.enqueue(encoder.encode(text))
    }
  } catch {
    // Gemini's SSE stream sends one complete JSON object per "data:" line,
    // so a parse failure here means a genuinely malformed fragment — skip it
    // rather than surfacing broken text to the user.
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "DaoDun's chat isn't configured yet. Set GEMINI_API_KEY on the server." },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let body: {
    messages?: unknown
    portfolio?: PortfolioContext | null
    mood?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : []
  const messages = rawMessages
    .filter(isChatMessage)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
    .filter((m) => m.content.trim().length > 0)

  if (messages.length === 0) {
    return NextResponse.json({ error: "Missing messages." }, { status: 400 })
  }

  const userName = (session.user.user_metadata as Record<string, string> | undefined)?.full_name
  const systemInstruction = buildSystemInstruction(userName, body.portfolio, body.mood ?? "idle")

  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const upstreamUrl = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Header-based auth (rather than a `?key=` query param) keeps the
        // key out of any request logs that capture full URLs.
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 512,
        },
      }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "Unable to reach DaoDun's chat service." }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "")
    console.error(`[/api/chat] Gemini error ${upstream.status}:`, errText.slice(0, 300))

    if (upstream.status === 429) {
      return NextResponse.json(
        { error: "DaoDun is catching his breath (rate limited). Try again in a moment." },
        { status: 429 }
      )
    }

    return NextResponse.json({ error: "Chat is temporarily unavailable." }, { status: 502 })
  }

  // Re-stream Gemini's server-sent events as plain text deltas, so the
  // client only has to read a text stream instead of parsing SSE/JSON.
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = upstream.body.getReader()
  let buffer = ""

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer.trim().length > 0) {
          emitSseLine(buffer, encoder, controller)
        }
        controller.close()
        return
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      // The last element may be a partial line split across chunk
      // boundaries — keep it buffered until the next pull completes it.
      buffer = lines.pop() ?? ""
      for (const line of lines) {
        emitSseLine(line, encoder, controller)
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
