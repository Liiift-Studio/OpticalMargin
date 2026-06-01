// optical-margin/src/__tests__/react.test.tsx — @testing-library/react hook and component tests
import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useOpticalMargin } from '../react/useOpticalMargin'
import { OpticalMarginText } from '../react/OpticalMarginText'

// ─── Canvas mock ──────────────────────────────────────────────────────────────
// Mirrors the pattern from adjust.test.ts: each character 10px wide, small bounding box overhang.
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

// ─── DOM measurement mock ──────────────────────────────────────────────────────
const CONTAINER_WIDTH = 600

beforeEach(() => {
	document.body.innerHTML = ''

	// Canvas mock — must be installed before any call that creates a canvas
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'canvas') return mockCanvas
		return HTMLDocument.prototype.createElement.call(document, tag)
	})

	// All word spans on one line (top=0), container at full width
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		const el = this as HTMLElement
		const isWord = el.classList?.contains('om-word')
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

// ─── useOpticalMargin ─────────────────────────────────────────────────────────

describe('useOpticalMargin', () => {
	/** Helper: render a paragraph into the DOM and wire the hook ref to it */
	function renderHookWithElement(options = {}) {
		const el = document.createElement('p')
		el.textContent = '"Hello world.'
		document.body.appendChild(el)

		const result = renderHook(() => useOpticalMargin(options))
		// Write the element into the hook's ref
		act(() => {
			;(result.result.current as React.MutableRefObject<HTMLElement | null>).current = el
		})
		return { el, ...result }
	}

	it('mounts without throwing', () => {
		expect(() => renderHookWithElement()).not.toThrow()
	})

	it('returns a ref object', () => {
		const { result } = renderHookWithElement()
		expect(result.current).toBeDefined()
		expect(typeof result.current).toBe('object')
		expect('current' in result.current).toBe(true)
	})

	it('unmounts without throwing', () => {
		const { unmount } = renderHookWithElement()
		expect(() => unmount()).not.toThrow()
	})

	it('re-runs when hangStart option changes', () => {
		let hangStart = false
		const { rerender, result } = renderHook(() => useOpticalMargin({ hangStart }))

		const el = document.createElement('p')
		el.textContent = '"Hello world.'
		document.body.appendChild(el)
		act(() => {
			;(result.current as React.MutableRefObject<HTMLElement | null>).current = el
		})

		hangStart = true
		expect(() => rerender()).not.toThrow()
	})

	it('re-runs when hangEnd option changes', () => {
		let hangEnd = false
		const { rerender, result } = renderHook(() => useOpticalMargin({ hangEnd }))

		const el = document.createElement('p')
		el.textContent = 'Hello world.'
		document.body.appendChild(el)
		act(() => {
			;(result.current as React.MutableRefObject<HTMLElement | null>).current = el
		})

		hangEnd = true
		expect(() => rerender()).not.toThrow()
	})

	it('re-runs when threshold option changes', () => {
		let threshold = 0
		const { rerender, result } = renderHook(() => useOpticalMargin({ threshold }))

		const el = document.createElement('p')
		el.textContent = '"Hello world.'
		document.body.appendChild(el)
		act(() => {
			;(result.current as React.MutableRefObject<HTMLElement | null>).current = el
		})

		threshold = 100
		expect(() => rerender()).not.toThrow()
	})

	it('re-runs when hangFractions option changes', () => {
		let hangFractions: Record<string, number> | undefined = undefined
		const { rerender, result } = renderHook(() => useOpticalMargin({ hangFractions }))

		const el = document.createElement('p')
		el.textContent = '"Hello world.'
		document.body.appendChild(el)
		act(() => {
			;(result.current as React.MutableRefObject<HTMLElement | null>).current = el
		})

		hangFractions = { '"': 0.5 }
		expect(() => rerender()).not.toThrow()
	})

	it('does not throw when ref is not yet assigned (null element)', () => {
		expect(() => renderHook(() => useOpticalMargin({}))).not.toThrow()
	})
})

// ─── OpticalMarginText ────────────────────────────────────────────────────────

describe('OpticalMarginText', () => {
	it('renders without throwing', () => {
		expect(() => render(<OpticalMarginText>Hello world</OpticalMarginText>)).not.toThrow()
	})

	it('renders children text content', () => {
		const { container } = render(<OpticalMarginText>Hello optical</OpticalMarginText>)
		expect(container.textContent).toContain('Hello optical')
	})

	it('renders a p element by default', () => {
		const { container } = render(<OpticalMarginText>Test</OpticalMarginText>)
		expect(container.querySelector('p')).not.toBeNull()
	})

	it('renders a custom element when as prop is provided', () => {
		const { container } = render(<OpticalMarginText as="div">Test</OpticalMarginText>)
		expect(container.querySelector('div')).not.toBeNull()
		expect(container.querySelector('p')).toBeNull()
	})

	it('renders an h1 when as="h1"', () => {
		const { container } = render(<OpticalMarginText as="h1">Heading</OpticalMarginText>)
		expect(container.querySelector('h1')).not.toBeNull()
	})

	it('forwards className to the root element', () => {
		const { container } = render(
			<OpticalMarginText className="my-class">Test</OpticalMarginText>,
		)
		const el = container.querySelector('.my-class')
		expect(el).not.toBeNull()
	})

	it('forwards aria-label to the root element', () => {
		const { container } = render(
			<OpticalMarginText aria-label="Labelled text">Test</OpticalMarginText>,
		)
		const el = container.querySelector('[aria-label="Labelled text"]')
		expect(el).not.toBeNull()
	})

	it('forwards data attributes to the root element', () => {
		const { container } = render(
			<OpticalMarginText data-testid="om-text">Test</OpticalMarginText>,
		)
		const el = container.querySelector('[data-testid="om-text"]')
		expect(el).not.toBeNull()
	})

	it('forwards id to the root element', () => {
		const { container } = render(
			<OpticalMarginText id="my-id">Test</OpticalMarginText>,
		)
		expect(container.querySelector('#my-id')).not.toBeNull()
	})

	it('unmounts without throwing', () => {
		const { unmount } = render(<OpticalMarginText>Bye</OpticalMarginText>)
		expect(() => unmount()).not.toThrow()
	})

	it('accepts hangFractions without throwing', () => {
		expect(() =>
			render(
				<OpticalMarginText hangFractions={{ '-': 1.0, '.': 0.7 }}>
					Hello world.
				</OpticalMarginText>,
			),
		).not.toThrow()
	})

	it('accepts threshold without throwing', () => {
		expect(() =>
			render(<OpticalMarginText threshold={0.5}>Test</OpticalMarginText>),
		).not.toThrow()
	})

	it('accepts maxHangRatio without throwing', () => {
		expect(() =>
			render(<OpticalMarginText maxHangRatio={0.8}>Test</OpticalMarginText>),
		).not.toThrow()
	})

	it('forwards a ref to the root element', () => {
		const ref = React.createRef<HTMLElement>()
		render(<OpticalMarginText ref={ref}>Test</OpticalMarginText>)
		expect(ref.current).not.toBeNull()
		expect(ref.current?.tagName.toLowerCase()).toBe('p')
	})

	it('sets displayName correctly', () => {
		expect(OpticalMarginText.displayName).toBe('OpticalMarginText')
	})
})
