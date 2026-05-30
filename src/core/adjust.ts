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

/**
 * Default hang fractions by character — editorial practice varies how deeply
 * each punctuation mark is hung. Hyphens and dashes hang fully; commas and
 * colons hang partially because their ink occupies more of the advance width.
 */
const DEFAULT_HANG_FRACTIONS: Record<string, number> = {
	'-':       1.0,
	'\u2013':  1.0, // en dash
	'\u2014':  1.0, // em dash
	'"':       0.8,
	"'":       0.8,
	'\u201C':  0.8, // left double quotation mark
	'\u201D':  0.8, // right double quotation mark
	'\u2018':  0.8, // left single quotation mark
	'\u2019':  0.8, // right single quotation mark
	'\u00AB':  0.8, // left-pointing double angle quotation mark
	'\u00BB':  0.8, // right-pointing double angle quotation mark
	'.':       0.8,
	'!':       0.8,
	'?':       0.8,
	'\u2026':  0.8, // ellipsis (…)
	')':       0.8,
	']':       0.8,
	'(':       0.6, // opening parenthesis — bracket ink covers ~60% of advance
	'[':       0.6, // opening bracket — similar proportion to parenthesis
	',':       0.6,
	';':       0.6,
	':':       0.6,
}

// ─── Canvas helpers ────────────────────────────────────────────────────────────

/** Module-level canvas singleton — created once, reused across all applyOpticalMargin calls */
let _canvas: HTMLCanvasElement | null | undefined = undefined

/** Measurement memo: key = `${char}|${fontStyle}`, value = hang in px */
const _hangCache = new Map<string, number>()

/**
 * Resets the module-level canvas singleton and measurement cache.
 * Exposed for testing only — allows tests to swap the canvas mock between cases.
 * Do not call in production code.
 */
export function _resetCanvasForTesting(): void {
	_canvas = undefined
	_hangCache.clear()
}

/**
 * Pending scroll-restore RAF ID. Tracked at module level so that a new
 * applyOpticalMargin call (rapid resize) cancels any stale pending scroll-restore
 * before scheduling a fresh one — prevents multiple conflicting scrollTo calls.
 */
let _scrollRafId = 0

/**
 * Returns a module-level singleton offscreen canvas, or null in environments
 * without Canvas support (e.g. SSR, happy-dom without canvas plugin).
 * The instance is created once and reused to avoid repeated element allocation.
 */
function getCanvas(): HTMLCanvasElement | null {
	if (_canvas !== undefined) return _canvas
	if (typeof document === 'undefined') { _canvas = null; return null }
	try {
		const c = document.createElement('canvas')
		const ctx = c.getContext('2d')
		_canvas = ctx ? c : null
	} catch {
		_canvas = null
	}
	return _canvas
}

/**
 * Measures how many pixels a character can optically hang beyond the text block edge.
 *
 * Uses Canvas measureText: the difference between advance width and the actual
 * ink bounding box (actualBoundingBoxLeft + actualBoundingBoxRight) is the whitespace
 * built into the glyph's side-bearings — that whitespace is what we hang.
 *
 * Results are memoised by (char, fontStyle) to avoid redundant Canvas work on resize.
 *
 * Falls back to zero when Canvas is unavailable (SSR / environments without Canvas).
 *
 * @param char       - Single character to measure
 * @param fontStyle  - CSS font string, e.g. "italic 300 18px Merriweather"
 * @param ctx        - Reusable 2D context (or null to force fallback)
 * @param maxRatio   - Cap hang at this fraction of advance width (0–1), clamped to [0,1]
 */
function measureOpticalHang(
	char: string,
	fontStyle: string,
	ctx: CanvasRenderingContext2D | null,
	maxRatio: number,
): number {
	if (!ctx) return 0

	// Cache is keyed on (char, fontStyle) only — maxRatio is applied after the lookup
	// so the same raw measurement can be reused with different maxRatio values.
	const cacheKey = `${char}|${fontStyle}`
	let rawHang = _hangCache.get(cacheKey)

	if (rawHang === undefined) {
		ctx.font = fontStyle
		const m = ctx.measureText(char)
		const advanceWidth = m.width
		if (advanceWidth <= 0) return 0

		// Hang = total side-bearing space (advance minus actual bilateral ink extent).
		// This is a useful proxy for the optical overhang regardless of hang direction.
		const visualWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
		rawHang = Math.max(0, advanceWidth - visualWidth)
		_hangCache.set(cacheKey, rawHang)
	}

	// advanceWidth not available from cache, re-measure only width (cheap, no text metrics)
	// We re-use rawHang directly capped by maxRatio * rawHang as a conservative bound.
	const clampedRatio = Math.max(0, Math.min(1, maxRatio))
	return rawHang * clampedRatio
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
		`.${OPTICAL_MARGIN_CLASSES.word}, .${OPTICAL_MARGIN_CLASSES.line}`,
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

	const hangStart    = options.hangStart    ?? DEFAULTS.hangStart
	const hangEnd      = options.hangEnd      ?? DEFAULTS.hangEnd
	const threshold    = options.threshold    ?? DEFAULTS.threshold
	// Clamp maxHangRatio to [0,1] — values outside this range produce nonsensical hang
	const maxHangRatio = Math.max(0, Math.min(1, options.maxHangRatio ?? DEFAULTS.maxHangRatio))
	const hangFractions = options.hangFractions ?? DEFAULT_HANG_FRACTIONS

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

	// Group word spans into lines by their top coordinate.
	// Use a tolerance of 1px to absorb sub-pixel rounding across high-DPI displays:
	// two words with top values within 1px of each other are treated as the same line.
	const lineMap = new Map<number, HTMLElement[]>()
	for (const { span, rect } of wordRects) {
		const rawTop = rect.top
		// Find an existing line bucket whose key is within 1px of this span's top
		let lineKey: number | undefined
		for (const key of lineMap.keys()) {
			if (Math.abs(key - rawTop) <= 1) { lineKey = key; break }
		}
		if (lineKey === undefined) { lineKey = rawTop; lineMap.set(lineKey, []) }
		lineMap.get(lineKey)!.push(span)
	}

	// Sort lines top-to-bottom
	const lines = Array.from(lineMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, spans]) => spans)

	if (lines.length === 0) return

	// Acquire a 2D context once per applyOpticalMargin call (context retrieval is cheap;
	// reusing it across all measureOpticalHang calls avoids repeated getContext overhead).
	const canvasCtx = getCanvas()?.getContext('2d') ?? null

	// Read the computed font style from the element (used for Canvas measureText).
	// Include font-stretch so variable fonts with a wdth axis are measured correctly.
	const computed = typeof getComputedStyle !== 'undefined' ? getComputedStyle(element) : null
	const fontStyle = computed
		? `${computed.fontStretch} ${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`
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
		// Compute hang amounts, applying per-character fraction from hangFractions map.
		// Fractions are clamped to [0,1] to prevent inverted or oversized margins.
		let startHang = 0
		if (hangStart && firstChar && HANG_START_CHARS.has(firstChar)) {
			const raw = measureOpticalHang(firstChar, fontStyle, canvasCtx, maxHangRatio)
			const fraction = Math.max(0, Math.min(1, hangFractions[firstChar] ?? DEFAULT_HANG_FRACTIONS[firstChar] ?? 1.0))
			startHang = raw * fraction
		}
		let endHang = 0
		if (hangEnd && lastChar && HANG_END_CHARS.has(lastChar)) {
			const raw = measureOpticalHang(lastChar, fontStyle, canvasCtx, maxHangRatio)
			const fraction = Math.max(0, Math.min(1, hangFractions[lastChar] ?? DEFAULT_HANG_FRACTIONS[lastChar] ?? 1.0))
			endHang = raw * fraction
		}

		const lineSpan = document.createElement('span')
		lineSpan.className = OPTICAL_MARGIN_CLASSES.line
		lineSpan.style.display = 'inline-block'
		lineSpan.style.whiteSpace = 'nowrap'
		// Presentation role hides the injected span from AT — the text content is
		// already accessible via the element's natural text flow.
		lineSpan.setAttribute('role', 'presentation')

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
			// Reset measurement styles before serialising.
			// Also add role=presentation to word spans so AT skips the span boundary.
			wordSpan.style.display = ''
			wordSpan.style.whiteSpace = ''
			wordSpan.setAttribute('role', 'presentation')

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
			// Hide injected line-break from assistive technology
			br.setAttribute('aria-hidden', 'true')
			fragment.appendChild(br)
		}
	})

	element.innerHTML = ''
	element.appendChild(fragment)

	// Restore scroll position after DOM mutations.
	// Cancel any stale pending RAF from a previous rapid call before scheduling a new one.
	cancelAnimationFrame(_scrollRafId)
	_scrollRafId = requestAnimationFrame(() => {
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
