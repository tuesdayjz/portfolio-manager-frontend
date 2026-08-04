import assert from "node:assert/strict"
import test from "node:test"

import { createPortfolioApi, PortfolioApiError } from "./portfolio-api.ts"

test("retrieves holdings with the authenticated API contract and query parameters", async () => {
  process.env.NEXT_PUBLIC_PORTFOLIO_API_URL = "https://api.example.test/"
  let request: Request | undefined
  const fetcher: typeof fetch = async (input, init) => {
    request = new Request(input, init)
    return Response.json({
      items: [],
      pagination: { page: 1, per_page: 50, total_items: 0, total_pages: 0 },
    })
  }

  const response = await createPortfolioApi("access-token", fetcher).getHoldings({
    search: "AAPL",
    assetType: "stock",
    perPage: 50,
  })

  assert.equal(request?.url, "https://api.example.test/api/v1/portfolios/holdings?page=1&per_page=50&search=AAPL&asset_type=stock")
  assert.equal(request?.headers.get("authorization"), "Bearer access-token")
  assert.equal(response.pagination.total_items, 0)
})

test("uses the documented allocation and performance endpoints", async () => {
  process.env.NEXT_PUBLIC_PORTFOLIO_API_URL = "https://api.example.test"
  const urls: string[] = []
  const fetcher: typeof fetch = async (input) => {
    urls.push(String(input))
    return Response.json({ items: [], points: [], metrics: {} })
  }
  const api = createPortfolioApi("token", fetcher)

  await api.getAllocation()
  await api.getPerformance("3m")
  await api.getPerformance("YTD", "crypto")

  assert.deepEqual(urls, [
    "https://api.example.test/api/v1/portfolios/allocation?group_by=asset_type",
    "https://api.example.test/api/v1/portfolios/performance?range=3m&interval=1d&asset_type=all",
    "https://api.example.test/api/v1/portfolios/performance?range=YTD&interval=1d&asset_type=crypto",
  ])
})

test("surfaces an API error message for failed retrievals", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ message: "Portfolio was not found" }, { status: 404 })

  await assert.rejects(
    createPortfolioApi("token", fetcher).getTransactions(),
    (error: unknown) =>
      error instanceof PortfolioApiError &&
      error.status === 404 &&
      error.message === "Portfolio was not found"
  )
})
