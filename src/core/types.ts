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
	/**
	 * Per-character hang fraction overrides. Keys are single characters; values are
	 * fractions of the measured hang to apply (0 = no hang, 1 = full hang).
	 *
	 * Editorial practice hangs characters at different depths: a hyphen at 100%,
	 * a period at ~80%, a comma at ~60%. These defaults apply when no override is given.
	 *
	 * Default fractions (applied when hangFractions is not set):
	 * - `-` `–` `—` → 1.0 (full hang)
	 * - `"` `'` `"` `'` `«` `»` → 0.8
	 * - `.` `!` `?` `…` `)` `]` → 0.8
	 * - `,` `;` `:` → 0.6
	 *
	 * @example
	 * // Hang hyphens fully, periods at 70%, commas at 50%
	 * hangFractions: { '-': 1.0, '.': 0.7, ',': 0.5 }
	 */
	hangFractions?: Record<string, number>
}

/** CSS class names injected by optical-margin — use these to target generated markup */
export const OPTICAL_MARGIN_CLASSES = {
	word: 'om-word',
	line: 'om-line',
	probe: 'om-probe',
} as const
