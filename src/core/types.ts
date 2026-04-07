// optical-margin/src/core/types.ts — types and class constants
export interface OpticalMarginOptions {
	// hangStart (boolean, default true)
	// hangEnd (boolean, default true)
	// threshold (minimum hang in px before applying)
	// fontUrl (optional, for sub-pixel glyph bounds via opentype.js)
}

/** CSS class names injected by optical-margin — use these to target generated markup */
export const OPTICAL_MARGIN_CLASSES = {
	word: 'optical-margin-word',
	line: 'optical-margin-line',
	probe: 'optical-margin-probe',
} as const
