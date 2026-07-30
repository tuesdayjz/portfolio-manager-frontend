"use client"

import { cn } from "@/lib/utils"

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; activeClassName?: string }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex h-8 w-full items-center rounded-lg bg-muted p-0.5 text-muted-foreground",
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? cn("bg-background text-foreground shadow-sm ring-1 ring-foreground/10", option.activeClassName)
                : "hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
