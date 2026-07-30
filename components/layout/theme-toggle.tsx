"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const THEME_STORAGE_KEY = "pm_theme"

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark")
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light")
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
