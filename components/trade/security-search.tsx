"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { searchSecurities, type SecuritySearchResult } from "@/lib/securities"

export function SecuritySearch({
  onSelect,
  placeholder = "Search by symbol or company name",
  className,
}: {
  onSelect: (result: SecuritySearchResult) => void
  placeholder?: string
  className?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SecuritySearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (trimmed.length < 1) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const id = ++requestId.current
      try {
        const found = await searchSecurities(trimmed)
        if (id === requestId.current) {
          setResults(found)
        }
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 300)
  }

  function handleSelect(result: SecuritySearchResult) {
    onSelect(result)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-8"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {results.length === 0 && !loading && (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">
              No matches found.
            </p>
          )}
          {results.map((result) => (
            <button
              key={result.symbol}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(result)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{result.symbol}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {result.name}
                </span>
              </span>
              {result.exchange && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {result.exchange}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
