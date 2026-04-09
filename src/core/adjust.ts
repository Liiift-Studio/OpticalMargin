// optical-margin/src/core/adjust.ts — framework-agnostic optical margin alignment algorithm
import { OPTICAL_MARGIN_CLASSES, type OpticalMarginOptions } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Resolved defaults applied when options are omitted */
const DEFAULTS = {
	hangStart: true,
	hangEnd: true,
	threshold: 0.5,
	maxHangRatio: 0.9,
} as const

/** Characters eligible for hanging at the START of a line (opening punctuation) */
const HANG_START_CHARS = new Set(['"', "'", '\u201C', '\u2018', '\u00AB', '(', '['])

/** Characters eligible for hanging at the END of a line (closing punctuation and sentence marks) */
const HANG_END_CHARS = new Set([
	'.', ',', ';', ':', '!', '?',
	'"', "'", '\u201D', '\u2019', '\u00BB',
	'-', '\u2013', '\u2014',
	'\u2026', // ellipsis (…)
	')', ']',
])

// ─── Canvas helpers ────────────────────────────────────────────────────────────

/**
 * Returns a reusable offscreen canvas, or null in environments without Canvas
 * support (e.g. SSR, happy-dom without canvas plugin).
 */
function getCanvas(): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null
	try {
		const c = document.createElement('canvas')
		const ctx = c.getContext('2d')
		if (!ctx) return null
		return c
	} catch {
		return null
	}
}

/**
 * Measures how many pixels a character can optically hang beyond the text block edge.
 *
 * Uses Canvas measureText: the difference between advance width and the actual
 * ink bounding box (actualBoundingBoxLeft + actualBoundingBoxRight) is the whitespace
 * built into the glyph's side-bearings — that whitespace is what we hang.
 *
 * Falls back to a lookup table ratio when Canvas is unavailable.
 *
 * @param char       - Single character to measure
 * @param fontStyle  - CSS font string, e.g. "italic 300 18px Merriweather"
 * @param canvas     - Reusable canvas element (or null to force fallback)
 * @param maxRatio   - Cap hang at this fraction of advance width (0–1)
 */
function measureOpticalHang(
	char: string,
	fontStyle: string,
	canvas: HTMLCanvasElement | null,
	maxRatio: number,
): number {
	if (canvas) {
		const ctx = canvas.getContext('2d')
		if (ctx) {
			ctx.font = fontStyle
			const m = ctx.measureText(char)
			const advanceWidth = m.width
			if (advanceWidth <= 0) return 0
			// Visual ink width (actual bounding box from left + right bearings)
			const visualWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
			// Hang = how much advance the glyph doesn't actually use as ink
			const hang = Math.max(0, advanceWidth - visualWidth)
			return Math.min(hang, advanceWidth * maxRatio)
		}
	}

	// No Canvas available (SSR / environments without Canvas support).
	// Return 0 rather than a guessed value — no margin is safer than a wrong one.
	return 0
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Strips all optical-margin injected spans from a clone of the element and
 * returns the clean innerHTML. Safe to call multiple times — idempotent.
 *
 * @param el - Element that may contain optical-margin markup
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	const injected = clone.querySelectorAll(
		`.${OPTICAL_MARGIN_CLASSES.word}, .${OPTICAL_MARGIN_CLASSES.line}, .${OPTICAL_MARGIN_CLASSES.probe}`,
	)
	injected.forEach((node) => {
		const parent = node.parentNode
		if (!parent) return
		while (node.firstChild) parent.insertBefore(node.firstChild, node)
		parent.removeChild(node)
	})
	// Also clean up injected <br> elements between line spans
	clone.querySelectorAll('br[data-om]').forEach((br) => br.parentNode?.removeChild(br))
	return clone.innerHTML
}

/**
 * Applies optical margin alignment (hanging punctuation) to an element.
 *
 * The algorithm runs four passes:
 *  1. Reset — restore the element to the originalHTML snapshot
 *  2. Word wrap — walk all text nodes and wrap each word in an om-word span
 *  3. Read — force word spans to inline-block, read getBoundingClientRect() to
 *     group words into visual lines by their top coordinate
 *  4. Write — for each line, detect the first/last character, measure hang via
 *     Canvas, and emit om-line spans with margin-inline-start/end adjustments
 *
 * @param element      - Live DOM element to adjust (must be rendered and visible)
 * @param originalHTML - HTML snapshot taken before the first run (from getCleanHTML)
 * @param options      - Optical margin options (merged with defaults)
 */
export function applyOpticalMargin(
	element: HTMLElement,
	originalHTML: string,
	options: OpticalMarginOptions = {},
): void {
	if (typeof window === 'undefined') return

	const hangStart   = options.hangStart   ?? DEFAULTS.hangStart
	const hangEnd     = options.hangEnd     ?? DEFAULTS.hangEnd
	const threshold   = options.threshold   ?? DEFAULTS.threshold
	const maxHangRatio = options.maxHangRatio ?? DEFAULTS.maxHangRatio

	// Save scroll position — iOS Safari does not support overflow-anchor: none
	const scrollY = window.scrollY

	// --- Pass 1: Reset ---
	element.innerHTML = originalHTML

	if (!originalHTML.trim()) {
		// Nothing to do on an empty element
		return
	}

	// Guard: element must be laid out before BCR measurements are meaningful.
	// offsetWidth is preferred; fall back to getBoundingClientRect for environments
	// (e.g. happy-dom in tests) where offsetWidth is always 0.
	if (!element.offsetWidth && !element.getBoundingClientRect().width) return

	// --- Pass 2: Word wrap ---
	// Walk all text nodes recursively (TreeWalker unreliable in happy-dom) and
	// wrap each whitespace-delimited word in an om-word span. Inline elements
	// (em, strong, a, …) are preserved because we insert spans into the correct
	// parent rather than re-serialising from scratch.
	const wordSpans: HTMLElement[] = []

	const textNodes: Text[] = []
	;(function collectTextNodes(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			textNodes.push(node as Text)
		} else {
			node.childNodes.forEach(collectTextNodes)
		}
	})(element)

	for (const textNode of textNodes) {
		const text = textNode.textContent ?? ''
		if (!text.trim()) continue

		// Split into alternating [whitespace, word, whitespace, word, …] tokens
		const tokens = text.split(/(\S+)/)
		const fragment = document.createDocumentFragment()

		for (let i = 0; i < tokens.length; i += 2) {
			const space = tokens[i]      // whitespace before this word
			const word  = tokens[i + 1]  // the word itself (may be undefined)
			if (!word) continue

			// Include trailing whitespace in last word to avoid orphan text nodes at
			// inline-element boundaries (same technique as RagTooth).
			const isLastWord = tokens[i + 3] === undefined
			const trailingSpace = isLastWord ? (tokens[i + 2] ?? '') : ''

			const span = document.createElement('span')
			span.className = OPTICAL_MARGIN_CLASSES.word
			span.textContent = space + word + trailingSpace
			fragment.appendChild(span)
			wordSpans.push(span)
		}

		textNode.parentNode!.replaceChild(fragment, textNode)
	}

	if (wordSpans.length === 0) return

	// --- Pass 3: Read — detect line boundaries ---
	// Force each word span to inline-block with nowrap so getBoundingClientRect()
	// gives us the span's visual top, which groups words into lines.
	wordSpans.forEach((w) => {
		w.style.display = 'inline-block'
		w.style.whiteSpace = 'nowrap'
	})

	// Batch all reads before any writes.
	const wordRects = wordSpans.map((w) => ({
		span: w,
		rect: w.getBoundingClientRect(),
	}))

	// Group word spans into lines by their rounded top coordinate.
	const lineMap = new Map<number, HTMLElement[]>()
	for (const { span, rect } of wordRects) {
		const top = Math.round(rect.top)
		if (!lineMap.has(top)) lineMap.set(top, [])
		lineMap.get(top)!.push(span)
	}

	// Sort lines top-to-bottom
	const lines = Array.from(lineMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, spans]) => spans)

	if (lines.length === 0) return

	// Acquire a canvas for font metric measurement
	const canvas = getCanvas()

	// Read the computed font style from the element (used for Canvas measureText)
	const computed = typeof getComputedStyle !== 'undefined' ? getComputedStyle(element) : null
	const fontStyle = computed
		? `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
		: ''

	// --- Pass 4: Write — build line spans with optical margin adjustments ---
	// We reassemble the element's content as a sequence of om-line spans separated
	// by <br> elements. Each line span wraps all word spans for that line.

	// Helper: get text content of a span without leading/trailing whitespace
	const getWordText = (span: HTMLElement) => span.textContent ?? ''

	// For each line, find the first non-whitespace character and the last.
	const lineData = lines.map((lineSpans) => {
		// First non-whitespace char of first word in line
		let firstChar = ''
		const firstText = getWordText(lineSpans[0]).trimStart()
		if (firstText.length > 0) firstChar = firstText[0]

		// Last non-whitespace char of last word in line
		let lastChar = ''
		const lastText = getWordText(lineSpans[lineSpans.length - 1]).trimEnd()
		if (lastText.length > 0) lastChar = lastText[lastText.length - 1]

		return { lineSpans, firstChar, lastChar }
	})

	// Rebuild the element: replace its contents with om-line spans + <br> elements.
	// We move actual word span nodes into line spans so we don't need to re-create
	// the inline element nesting — the spans are already in the live DOM with their
	// parent inline elements (em, strong, etc.) intact.
	//
	// Strategy: detach all word spans from the DOM (they're already there), then
	// rebuild using a document fragment.

	// Build a flat in-order list of all nodes currently in the element so we can
	// replace the contents atomically. We will collect each line's word spans,
	// wrap them in an om-line span, and insert <br> between lines.

	const fragment = document.createDocumentFragment()

	lineData.forEach(({ lineSpans, firstChar, lastChar }, lineIndex) => {
		// Compute hang amounts
		let startHang = 0
		if (hangStart && firstChar && HANG_START_CHARS.has(firstChar)) {
			startHang = measureOpticalHang(firstChar, fontStyle, canvas, maxHangRatio)
		}
		let endHang = 0
		if (hangEnd && lastChar && HANG_END_CHARS.has(lastChar)) {
			endHang = measureOpticalHang(lastChar, fontStyle, canvas, maxHangRatio)
		}

		const lineSpan = document.createElement('span')
		lineSpan.className = OPTICAL_MARGIN_CLASSES.line
		lineSpan.style.display = 'inline-block'
		lineSpan.style.whiteSpace = 'nowrap'

		if (startHang > threshold) {
			lineSpan.style.marginInlineStart = `-${startHang}px`
		}
		if (endHang > threshold) {
			lineSpan.style.marginInlineEnd = `-${endHang}px`
		}

		// Build the inner HTML for this line by serialising each word span with its
		// ancestor inline element wrappers (em, strong, a, …) up to the block element.
		// This preserves italic, bold, and link contexts — the same technique as RagTooth.
		// Each word is self-contained so a line break inside an <em> simply produces
		// two adjacent <em> elements — semantically split but visually identical.
		let lineHTML = ''
		for (const wordSpan of lineSpans) {
			// Reset measurement styles before serialising
			wordSpan.style.display = ''
			wordSpan.style.whiteSpace = ''

			let html = wordSpan.outerHTML
			let ancestor: Element | null = wordSpan.parentElement
			while (ancestor && ancestor !== element) {
				const shallow = ancestor.cloneNode(false) as Element
				const shallowHTML = shallow.outerHTML
				const split = shallowHTML.lastIndexOf('</')
				html = shallowHTML.slice(0, split) + html + shallowHTML.slice(split)
				ancestor = ancestor.parentElement
			}
			lineHTML += html
		}
		lineSpan.innerHTML = lineHTML

		fragment.appendChild(lineSpan)

		if (lineIndex < lineData.length - 1) {
			const br = document.createElement('br')
			br.dataset.om = '1'
			fragment.appendChild(br)
		}
	})

	element.innerHTML = ''
	element.appendChild(fragment)

	// Restore scroll position after DOM mutations
	requestAnimationFrame(() => {
		if (Math.abs(window.scrollY - scrollY) > 2) {
			window.scrollTo({ top: scrollY, behavior: 'instant' })
		}
	})
}

/**
 * Strips all optical-margin markup and restores the element to the originalHTML snapshot.
 *
 * @param element      - Element previously adjusted by applyOpticalMargin
 * @param originalHTML - The snapshot passed to the original applyOpticalMargin call
 */
export function removeOpticalMargin(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
