// optical-margin/src/core/types.ts — types and class constants

/** Options controlling the optical-margin algorithm */
export interface OpticalMarginOptions {
	/** Hang opening punctuation at line starts (default: true) */
	hangStart?: boolean
	/** Hang closing punctuation and sentence-end marks at line ends (default: true) */
	hangEnd?: boolean
	/** Minimum hang amount in px before applying (default: 0.5) */
	threshold?: number
	/** Max proportion of character advance width to hang (default: 0.9) */
	maxHangRatio?: number
}

/** CSS class names injected by optical-margin — use these to target generated markup */
export const OPTICAL_MARGIN_CLASSES = {
	word: 'om-word',
	line: 'om-line',
	probe: 'om-probe',
} as const
