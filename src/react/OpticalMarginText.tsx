// optical-margin/src/react/OpticalMarginText.tsx — React component wrapper
import React, { forwardRef, useCallback } from 'react'
import { useOpticalMargin } from './useOpticalMargin'
import type { OpticalMarginOptions } from '../core/types'

interface OpticalMarginTextProps extends OpticalMarginOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: React.ElementType
}

/**
 * Drop-in component that applies the optical-margin effect to its children.
 * Forwards the ref to the root DOM element while also wiring the internal hook ref.
 */
export const OpticalMarginText = forwardRef<HTMLElement, OpticalMarginTextProps>(
	function OpticalMarginText({ children, className, style, as: Tag = 'p', ...options }, forwardedRef) {
		const innerRef = useOpticalMargin(options)

		/** Callback ref that satisfies both the hook's MutableRefObject and the forwarded ref */
		const setRef = useCallback((node: HTMLElement | null) => {
			;(innerRef as React.MutableRefObject<HTMLElement | null>).current = node
			if (typeof forwardedRef === 'function') {
				forwardedRef(node)
			} else if (forwardedRef) {
				forwardedRef.current = node
			}
		}, [innerRef, forwardedRef])

		return (
			<Tag ref={setRef} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

OpticalMarginText.displayName = 'OpticalMarginText'
