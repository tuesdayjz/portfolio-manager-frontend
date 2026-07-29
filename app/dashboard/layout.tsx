"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { clearSession, useSession } from "@/lib/auth"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useSession()

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    }
  }, [user, router])

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="flex items-center gap-2 font-heading text-base font-semibold">
          <Image
            src="/money_kabu_boutou.png"
            alt=""
            width={28}
            height={28}
            className="rounded-sm"
          />
          Portfolio Manager
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full">
            <Avatar>
              <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
