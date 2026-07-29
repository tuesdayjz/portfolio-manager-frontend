import { BarChart3, TrendingUp } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

export type Tab = 'dashboard' | 'positions' | 'performance'

interface AppSidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const items = [
  {
    title: 'Dashboard',
    icon: BarChart3,
    value: 'dashboard' as Tab,
  },
  {
    title: 'Positions',
    icon: TrendingUp,
    value: 'positions' as Tab,
  },
  {
    title: 'Performance',
    icon: BarChart3,
    value: 'performance' as Tab,
  },
]

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    className="cursor-pointer"
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
    </Sidebar>
  )
}
