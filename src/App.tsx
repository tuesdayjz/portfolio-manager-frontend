import { useState, useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { SiteHeader } from '@/components/site-header'
import { AppSidebar, type Tab } from '@/components/app-sidebar'
import { DashboardTab } from '@/components/dashboard-tab'
import { PositionsTab } from '@/components/positions-tab'
import { PerformanceTab } from '@/components/performance-tab'
import { type Range } from '@/lib/mock-data'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [range, setRange] = useState<Range>('YTD')

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 flex-col w-full">
        <SiteHeader />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && (
              <DashboardTab range={range} onRangeChange={setRange} />
            )}
            {activeTab === 'positions' && <PositionsTab />}
            {activeTab === 'performance' && <PerformanceTab />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default App
