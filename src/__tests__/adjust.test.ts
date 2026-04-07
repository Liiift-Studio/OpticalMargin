// optical-margin/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { applyOpticalMargin, removeOpticalMargin, getCleanHTML } from '../core/adjust'
import { OPTICAL_MARGIN_CLASSES } from '../core/types'

// ─── Canvas mock ──────────────────────────────────────────────────────────────
// Each character has advance width = 10px.
// actualBoundingBoxLeft = 1, actualBoundingBoxRight = advance - 3 - 1 = advance - 4.
// So visualWidth = 1 + (advance - 4) = advance - 3.
// hangAmount = advance - visualWidth = 3px (well above default threshold 0.5).
const mockCtx = {
	font: '',
	measureText: (text: string) => ({
		width: text.length * 10,
		actualBoundingBoxLeft: 1,
		actualBoundingBoxRight: text.length * 10 - 4,
	}),
}

const mockCanvas = {
	getContext: () => mockCtx,
} as unknown as HTMLCanvasElement

// ─── DOM measurement mock ─────────────────────────────────────────────────────
// Container = 600px wide; word spans report a consistent top=0 (all on one line)
// and a narrow width so they don't overflow the container.
const CONTAINER_WIDTH = 600

function makeElement(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	el.style.width = `${CONTAINER_WIDTH}px`
	document.body.appendChild(el)
	return el
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('optical-margin', () => {
	beforeEach(() => {
		document.body.innerHTML = ''

		// Mock canvas creation — must happen before any call that could create a canvas
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') return mockCanvas
			// Use the real createElement for all other tags, bypassing the spy to avoid recursion
			return document.createElement.wrappedFunction
				? (document.createElement as unknown as { wrappedFunction: (t: string) => HTMLElement }).wrappedFunction(tag)
				: HTMLDocument.prototype.createElement.call(document, tag)
		})

		// Mock getBoundingClientRect so word spans all appear on the same line (top=0)
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const el = this as HTMLElement
			const isWord = el.classList?.contains(OPTICAL_MARGIN_CLASSES.word)
			const w = isWord ? 40 : CONTAINER_WIDTH
			return {
				width: w, height: 20, top: 0, left: 0, right: w, bottom: 20, x: 0, y: 0,
				toJSON: () => ({}),
			} as DOMRect
		})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	// ── Test 1: getCleanHTML is idempotent ────────────────────────────────────
	it('getCleanHTML is idempotent', () => {
		const el = makeElement('<em>Hello</em> world')
		const html = getCleanHTML(el)
		const html2 = getCleanHTML(el)
		expect(html).toBe(html2)
	})

	// ── Test 2: empty element does not throw ─────────────────────────────────
	it('applyOpticalMargin does not throw on empty element', () => {
		const el = makeElement('')
		const original = getCleanHTML(el)
		expect(() => applyOpticalMargin(el, original, {})).not.toThrow()
	})

	// ── Test 3: removeOpticalMargin restores original HTML ───────────────────
	it('removeOpticalMargin restores original HTML', () => {
		const el = makeElement('<em>Hello</em> world')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, {})
		removeOpticalMargin(el, original)
		expect(el.innerHTML).toBe(original)
	})

	// ── Test 4: om-line spans are created after apply ─────────────────────────
	it('after apply, om-line spans exist', () => {
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, {})
		const lines = el.querySelectorAll(`.${OPTICAL_MARGIN_CLASSES.line}`)
		expect(lines.length).toBeGreaterThan(0)
	})

	// ── Test 5: hangStart — opening quote gets negative marginInlineStart ─────
	it('lines starting with a hanging char have negative marginInlineStart', () => {
		// Opening curly-quote is in HANG_START_CHARS
		const el = makeElement('\u201CHello world.')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, { hangStart: true, hangEnd: false, threshold: 0 })
		const firstLine = el.querySelector<HTMLElement>(`.${OPTICAL_MARGIN_CLASSES.line}`)
		expect(firstLine).toBeTruthy()
		const margin = firstLine!.style.marginInlineStart
		expect(margin).toMatch(/^-[\d.]+px$/)
	})

	// ── Test 6: hangEnd — period gets negative marginInlineEnd ────────────────
	it('lines ending with a hanging char have negative marginInlineEnd', () => {
		const el = makeElement('Hello world.')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, { hangStart: false, hangEnd: true, threshold: 0 })
		const lines = Array.from(el.querySelectorAll<HTMLElement>(`.${OPTICAL_MARGIN_CLASSES.line}`))
		const lastLine = lines[lines.length - 1]
		expect(lastLine).toBeTruthy()
		const margin = lastLine!.style.marginInlineEnd
		expect(margin).toMatch(/^-[\d.]+px$/)
	})

	// ── Test 7: lines without hanging chars have no margin ───────────────────
	it('lines without hanging chars have no margin adjustment', () => {
		// 'H' is not a hang-start char, 'd' is not a hang-end char
		const el = makeElement('Hello world')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, { hangStart: true, hangEnd: true, threshold: 0 })
		const lines = Array.from(el.querySelectorAll<HTMLElement>(`.${OPTICAL_MARGIN_CLASSES.line}`))
		expect(lines.length).toBeGreaterThan(0)
		for (const line of lines) {
			expect(line.style.marginInlineStart).toBe('')
			expect(line.style.marginInlineEnd).toBe('')
		}
	})

	// ── Test 8: hangStart:false skips start margin even when char is hangable ─
	it('hangStart: false skips start margin even when start char is hangable', () => {
		const el = makeElement('\u201CHello world.')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, { hangStart: false, hangEnd: false, threshold: 0 })
		const lines = Array.from(el.querySelectorAll<HTMLElement>(`.${OPTICAL_MARGIN_CLASSES.line}`))
		expect(lines.length).toBeGreaterThan(0)
		for (const line of lines) {
			expect(line.style.marginInlineStart).toBe('')
		}
	})

	// ── Test 9: hangEnd:false skips end margin ────────────────────────────────
	it('hangEnd: false skips end margin', () => {
		const el = makeElement('Hello world.')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, { hangStart: false, hangEnd: false, threshold: 0 })
		const lines = Array.from(el.querySelectorAll<HTMLElement>(`.${OPTICAL_MARGIN_CLASSES.line}`))
		expect(lines.length).toBeGreaterThan(0)
		for (const line of lines) {
			expect(line.style.marginInlineEnd).toBe('')
		}
	})

	// ── Test 10: inline elements are preserved ────────────────────────────────
	it('preserves inline elements after apply', () => {
		const el = makeElement('<em>italic</em> and <strong>bold</strong>')
		const original = getCleanHTML(el)
		applyOpticalMargin(el, original, {})
		expect(el.querySelector('em')).toBeTruthy()
		expect(el.querySelector('strong')).toBeTruthy()
	})
})
