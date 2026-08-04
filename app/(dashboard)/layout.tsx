"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { PetChatWidget } from "@/components/layout/pet-chat-widget"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PortfolioSummaryProvider } from "@/lib/portfolio"

// TODO: re-enable the /login redirect guard here before shipping.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortfolioSummaryProvider>
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
        <PetChatWidget />
      </div>
    </PortfolioSummaryProvider>
  )
}
