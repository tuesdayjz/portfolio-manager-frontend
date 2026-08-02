"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { THEME_COOKIE_NAME } from "@/lib/theme"

const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark")
  document.cookie = `${THEME_COOKIE_NAME}=${isDark ? "dark" : "light"}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  )
}
