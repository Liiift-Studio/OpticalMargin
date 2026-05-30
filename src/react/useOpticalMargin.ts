// optical-margin/src/react/useOpticalMargin.ts — React hook
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { applyOpticalMargin, getCleanHTML } from '../core/adjust'
import type { OpticalMarginOptions } from '../core/types'

/**
 * React hook that applies the optical-margin effect to a ref'd element.
 * Automatically re-runs on resize (width changes only) and after fonts load.
 *
 * @param options - Optical margin options. All properties are optional (defaults apply).
 */
export function useOpticalMargin(options: OpticalMarginOptions = {}) {
	const ref = useRef<HTMLElement>(null)
	const originalHTMLRef = useRef<string | null>(null)
	const optionsRef = useRef(options)
	optionsRef.current = options

	const { hangStart, hangEnd, threshold, maxHangRatio, hangFractions } = options

	const run = useCallback(() => {
		const el = ref.current
		if (!el) return
		if (originalHTMLRef.current === null) {
			originalHTMLRef.current = getCleanHTML(el)
		}
		applyOpticalMargin(el, originalHTMLRef.current, optionsRef.current)
	// hangFractions is intentionally included: changes to the fractions object
	// should trigger a fresh run even if other options are unchanged.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hangStart, hangEnd, threshold, maxHangRatio, hangFractions])

	useLayoutEffect(() => {
		run()

		const el = ref.current
		if (!el) return

		// Guard: skip ResizeObserver in environments that don't support it (old WebViews)
		if (typeof ResizeObserver === 'undefined') return

		let lastWidth = 0
		let rafId = 0
		const ro = new ResizeObserver((entries) => {
			// Guard against polyfills that may emit empty entry arrays
			if (!entries.length) return
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(run)
		})
		ro.observe(el)
		return () => {
			ro.disconnect()
			cancelAnimationFrame(rafId)
		}
	}, [run])

	// Rerun after all fonts finish loading — measurements taken before font-swap
	// produce wrong results (Canvas glyph metrics use the fallback font).
	// An unmounted flag prevents calling run() on a detached element.
	useEffect(() => {
		let unmounted = false
		document.fonts?.ready?.then(() => {
			if (!unmounted) run()
		}).catch(() => {})
		return () => { unmounted = true }
	}, [run])

	return ref
}
