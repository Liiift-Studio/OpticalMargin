// optical-margin/src/react/OpticalMarginText.tsx — React component wrapper
import { forwardRef } from 'react'
import { useOpticalMargin } from './useOpticalMargin'
import type { OpticalMarginOptions } from '../core/types'

interface OpticalMarginTextProps extends OpticalMarginOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: keyof JSX.IntrinsicElements
}

/**
 * Drop-in component that applies the optical-margin effect to its children.
 */
export const OpticalMarginText = forwardRef<HTMLElement, OpticalMarginTextProps>(
	function OpticalMarginText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useOpticalMargin(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLParagraphElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

OpticalMarginText.displayName = 'OpticalMarginText'
