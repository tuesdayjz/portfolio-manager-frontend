import { chromium } from 'playwright'

const errors = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(String(err)))

await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' })
await page.waitForSelector('text=Dashboard', { timeout: 15000 })
await page.screenshot({ path: '_shot-dashboard.png' })

await page.click('text=Positions')
await page.waitForSelector('text=Top Holdings', { timeout: 10000 })
await page.screenshot({ path: '_shot-positions.png' })

await page.click('text=Performance')
await page.waitForSelector('text=Sector Performance', { timeout: 10000 })
await page.screenshot({ path: '_shot-performance.png' })

await browser.close()

console.log('ERRORS:', JSON.stringify(errors, null, 2))
