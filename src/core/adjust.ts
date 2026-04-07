// optical-margin/src/core/adjust.ts — framework-agnostic algorithm
import type { OpticalMarginOptions } from './types'

/**
 * Strip any prior optical-margin markup from an element and return clean innerHTML.
 * Safe to call multiple times — idempotent.
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	clone.querySelectorAll('[data-optical-margin]').forEach((node) => {
		node.replaceWith(...node.childNodes)
	})
	return clone.innerHTML
}

/**
 * Apply optical-margin effect to an element.
 * @param element   - Target element
 * @param originalHTML - Clean HTML snapshot from getCleanHTML()
 * @param options   - OpticalMarginOptions
 */
export function applyOpticalMargin(
	element: HTMLElement,
	originalHTML: string,
	options: OpticalMarginOptions,
): void {
	if (typeof window === 'undefined') return

	// Save scroll position — iOS Safari does not support overflow-anchor: none
	const scrollY = window.scrollY

	// Pass 1: Reset to original HTML (idempotent)
	element.innerHTML = originalHTML

	// TODO: implement optical-margin algorithm
	// Follow the pattern from PROCESS.md:
	//   - Batch all DOM reads before writes
	//   - Use recursive childNodes walk (not createTreeWalker — happy-dom bug)
	//   - Give measurement probes a distinct CSS class

	// Restore scroll after DOM mutations
	requestAnimationFrame(() => {
		if (Math.abs(window.scrollY - scrollY) > 2) {
			window.scrollTo({ top: scrollY, behavior: 'instant' })
		}
	})
}

/**
 * Remove optical-margin markup and restore original HTML.
 */
export function removeOpticalMargin(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
