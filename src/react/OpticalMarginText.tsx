// optical-margin/src/react/OpticalMarginText.tsx — React component wrapper
import React, { forwardRef, useCallback } from 'react'
import { useOpticalMargin } from './useOpticalMargin'
import type { OpticalMarginOptions } from '../core/types'

interface OpticalMarginTextProps extends OpticalMarginOptions, React.HTMLAttributes<HTMLElement> {
	children: React.ReactNode
	as?: React.ElementType
}

/**
 * Drop-in component that applies the optical-margin effect to its children.
 * Forwards the ref to the root DOM element while also wiring the internal hook ref.
 * Accepts all standard HTML attributes (aria-label, id, role, etc.) via spread.
 */
export const OpticalMarginText = forwardRef<HTMLElement, OpticalMarginTextProps>(
	function OpticalMarginText(
		{ children, as: Tag = 'p', hangStart, hangEnd, threshold, maxHangRatio, hangFractions, ...htmlProps },
		forwardedRef,
	) {
		const options: OpticalMarginOptions = { hangStart, hangEnd, threshold, maxHangRatio, hangFractions }
		const innerRef = useOpticalMargin(options)

		/** Callback ref that writes to both the hook's internal ref and the forwarded ref */
		const setRef = useCallback((node: HTMLElement | null) => {
			// useOpticalMargin returns a RefObject; we write .current directly here
			// because the ref is created by this hook and is not shared externally.
			;(innerRef as React.MutableRefObject<HTMLElement | null>).current = node
			if (typeof forwardedRef === 'function') {
				forwardedRef(node)
			} else if (forwardedRef) {
				;(forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
			}
		}, [innerRef, forwardedRef])

		return (
			<Tag ref={setRef} {...htmlProps}>
				{children}
			</Tag>
		)
	},
)

OpticalMarginText.displayName = 'OpticalMarginText'
