export type Range = '7D' | 'MTD' | 'YTD' | '1Y' | 'ALL'

function mulberry32(a: number) {
  return function() {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateSeriesData(range: Range): { date: string; value: number }[] {
  const seeds: Record<Range, number> = {
    '7D': 1001, 'MTD': 1002, 'YTD': 1003, '1Y': 1004, 'ALL': 1005
  }
  const rng = mulberry32(seeds[range])
  const pointCounts: Record<Range, number> = {
    '7D': 7, 'MTD': 20, 'YTD': 250, '1Y': 52, 'ALL': 365
  }
  const count = pointCounts[range]
  const baseValue = 2450000
  const data = []
  let value = baseValue

  for (let i = 0; i < count; i++) {
    const daysAgo = count - i - 1
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - daysAgo)
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const drift = (rng() - 0.45) * (baseValue * 0.003)
    value = Math.max(baseValue * 0.95, value + drift)
    data.push({ date: dateStr, value: Math.round(value) })
  }

  return data
}

export const portfolioData = [
  { name: 'Technology', value: 42, color: '#2a78d6' },
  { name: 'Healthcare', value: 18, color: '#eb6834' },
  { name: 'Financials', value: 15, color: '#1baf7a' },
  { name: 'Consumer', value: 12, color: '#eda100' },
  { name: 'Energy', value: 8, color: '#e87ba4' },
  { name: 'Other', value: 5, color: '#4a3aa7' },
]

export const holdings = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '$195.45', allocation: '12.5%', change: '+2.3%' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '$418.20', allocation: '11.8%', change: '+1.8%' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '$875.50', allocation: '10.2%', change: '+3.1%' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '$242.80', allocation: '8.6%', change: '-1.2%' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$182.95', allocation: '7.9%', change: '+0.9%' },
]

export const sectorPerformance = [
  { name: 'Technology', width: 85, change: '+14.2%', isPositive: true },
  { name: 'Healthcare', width: 55, change: '+6.8%', isPositive: true },
  { name: 'Financials', width: 35, change: '-3.5%', isPositive: false },
  { name: 'Consumer', width: 45, change: '+5.1%', isPositive: true },
  { name: 'Energy', width: 25, change: '-2.3%', isPositive: false },
  { name: 'Other', width: 60, change: '+7.2%', isPositive: true },
]
