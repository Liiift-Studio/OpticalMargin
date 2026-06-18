// Reproducible README visual capture for optical-margin.
// Serves the repo root over HTTP (so /dist/index.js and the font load with a
// real origin), opens scripts/capture.html in headless Chromium, waits for the
// effect to apply, and screenshots the #card element at 2x with transparent
// corners. Output: assets/hero-before-after.png
//
// Run:  node scripts/capture.mjs
// Requires Playwright Chromium:  npx playwright install chromium

import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const ROOT = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."))
const PORT = 4319

// Minimal MIME map for the asset types this page loads
const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".woff2": "font/woff2",
	".woff": "font/woff",
	".json": "application/json; charset=utf-8",
}

// Serve files from the repo root. Default route serves the capture page.
const server = createServer(async (req, res) => {
	try {
		let urlPath = decodeURIComponent((req.url || "/").split("?")[0])
		if (urlPath === "/") urlPath = "/scripts/capture.html"
		const filePath = normalize(join(ROOT, urlPath))
		if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return }
		const body = await readFile(filePath)
		res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" })
		res.end(body)
	} catch {
		res.writeHead(404).end("not found")
	}
})

await new Promise((r) => server.listen(PORT, r))

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
// transparent page background so the rounded card corners are not boxed in white
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" })
await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 10000 })
await page.waitForTimeout(150)

const card = page.locator("#card")
await card.screenshot({ path: join(ROOT, "assets/hero-before-after.png"), omitBackground: true })

await browser.close()
server.close()
console.log("Wrote assets/hero-before-after.png")
