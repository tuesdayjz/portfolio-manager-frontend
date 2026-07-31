"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogIn, LogOut, UserPlus } from "lucide-react"

import { footerNavItems, mainNavItems, tradeNavItem } from "@/lib/navigation"
import { clearSession, useSession } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useSession()

  async function handleLogout() {
    await clearSession()
    router.push("/login")
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md">
                <Image
                  src="/felix-icon.svg"
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-sm"
                  unoptimized
                />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  Felix
                </span>
                <span className="text-sidebar-foreground/60 truncate text-xs">
                  Portfolio Manager
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/*
          Trade is an action rather than a report, so it's set apart from the
          list above (its own group, below Transaction History) and styled as
          a filled, primary-colored call to action instead of a plain nav
          link, so it stands out at a glance.
        */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={tradeNavItem.url} />}
                  isActive={pathname === tradeNavItem.url}
                  tooltip={tradeNavItem.title}
                  className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"
                >
                  <tradeNavItem.icon />
                  <span className="font-semibold">{tradeNavItem.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {footerNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton size="lg">
                      <Avatar className="size-7 rounded-full">
                        <AvatarFallback>
                          {initials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col text-left leading-tight">
                        <span className="truncate text-sm font-medium">
                          {user.fullName}
                        </span>
                        <span className="text-sidebar-foreground/60 truncate text-xs">
                          {user.email}
                        </span>
                      </span>
                      <LogOut className="ml-auto size-4" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  render={<Link href="/register" />}
                  tooltip="Register"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 data-active:bg-primary data-active:text-primary-foreground"
                >
                  <UserPlus />
                  <span>Register</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  render={<Link href="/login" />}
                  tooltip="Log In"
                >
                  <LogIn />
                  <span>Log In</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
