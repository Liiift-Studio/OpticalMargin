// optical-margin/src/react/OpticalMarginText.tsx — React component wrapper
import React, { forwardRef } from 'react'
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
 */
export const OpticalMarginText = forwardRef<HTMLElement, OpticalMarginTextProps>(
	function OpticalMarginText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useOpticalMargin(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

OpticalMarginText.displayName = 'OpticalMarginText'
