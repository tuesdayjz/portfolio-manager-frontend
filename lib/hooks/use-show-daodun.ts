"use client"

import { useEffect, useState } from "react"

const SETTINGS_KEY = "felix_settings_show_daodun"

export function useShowDaoDun(): [boolean, (show: boolean) => void] {
  const [showDaoDun, setShowDaoDun] = useState<boolean>(true)

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored !== null) {
      setShowDaoDun(stored === "true")
    }

    function handleStorageChange(e: StorageEvent) {
      if (e.key === SETTINGS_KEY && e.newValue !== null) {
        setShowDaoDun(e.newValue === "true")
      }
    }

    function handleCustomEvent(e: CustomEvent<boolean>) {
      setShowDaoDun(e.detail)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(
      "felix_settings_daodun_change" as any,
      handleCustomEvent as EventListener
    )

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(
        "felix_settings_daodun_change" as any,
        handleCustomEvent as EventListener
      )
    }
  }, [])

  const setDaoDun = (show: boolean) => {
    setShowDaoDun(show)
    localStorage.setItem(SETTINGS_KEY, String(show))
    window.dispatchEvent(
      new CustomEvent("felix_settings_daodun_change", { detail: show })
    )
  }

  return [showDaoDun, setDaoDun]
}
