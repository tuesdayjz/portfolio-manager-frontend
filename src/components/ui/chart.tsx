import * as React from 'react'
import { cn } from '@/lib/utils'

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, { label?: string; color?: string }>
  }
>(({ className, children, config: _config, ...props }, ref) => (
  <div ref={ref} className={cn('flex h-full w-full flex-col', className)} {...props}>
    {children}
  </div>
))
ChartContainer.displayName = 'ChartContainer'

export { ChartContainer }
