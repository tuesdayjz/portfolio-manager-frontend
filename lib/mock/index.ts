/**
 * One coherent anonymous portfolio used throughout the app.
 *
 * - positions: current holdings and option positions
 * - transactions: the portfolio's trade history
 * - performance: derived performance series
 * - dashboard: dashboard-ready projections derived from the three datasets
 */
export * from "@/lib/mock/positions"
export * from "@/lib/mock/transactions"
export {
  PERFORMANCE_TABS,
  TIME_RANGES,
  getPerformanceSlice,
  getPerformanceSummary,
  type PerformanceSeriesKey,
  type PerformanceSlice,
  type PerformanceSummary,
  type TimeRangeKey,
} from "@/lib/mock/performance"
export {
  assetAllocation,
  performanceBenchmarkLabel,
  performanceHistory,
  portfolioTotalValue,
  recentTransactions,
  topPositions,
  totalPositionsCount,
  totalTransactionsCount,
  type AllocationSlice,
  type Position,
  type Transaction,
} from "@/lib/mock/dashboard"
