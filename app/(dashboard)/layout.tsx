"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Logged-out visitors still see the shell (sidebar + header) so the
  // dashboard pages can render a blurred sample preview with a login
  // prompt, instead of being redirected away. Each page decides how to
  // render itself for a logged-out `useSession()` value.
  return (
    <div className="flex min-h-full flex-1 flex-col [--header-height:calc(--spacing(16))]">
      <SidebarProvider className="flex flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
