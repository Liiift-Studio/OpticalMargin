"use client"

// Interactive demo for optical-margin — toggles hang at start/end and threshold
import { useState, useDeferredValue } from "react"
import { OpticalMarginText } from "@liiift-studio/opticalmargin"

const SAMPLE = `"Typography is the craft of endowing human language with a durable visual form," wrote Robert Bringhurst, — and that form begins at the margin. When a line opens with a quotation mark, the mark should hang in the margin so the first letter of the word aligns with the lines above and below it. When a line ends with a comma, the comma should similarly hang so the last letter — not the punctuation — forms the right edge. CSS hanging-punctuation does this in Safari only. Optical Margin does it everywhere, for every font, by measuring the actual hang amount from Canvas font data rather than guessing from a lookup table.`

/** Demo component with live toggle controls for hangStart, hangEnd, and threshold */
export default function Demo() {
	const [hangStart, setHangStart] = useState(true)
	const [hangEnd, setHangEnd] = useState(true)
	const [threshold, setThreshold] = useState(0.5)

	const dStart = useDeferredValue(hangStart)
	const dEnd = useDeferredValue(hangEnd)
	const dThreshold = useDeferredValue(threshold)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	return (
		<div className="w-full">
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Hang</span>
				<button
					onClick={() => setHangStart(v => !v)}
					className="text-xs px-3 py-1 rounded-full border transition-opacity"
					style={{ borderColor: 'currentColor', opacity: hangStart ? 1 : 0.5, background: hangStart ? 'var(--btn-bg)' : 'transparent' }}
				>
					Start (opening quotes)
				</button>
				<button
					onClick={() => setHangEnd(v => !v)}
					className="text-xs px-3 py-1 rounded-full border transition-opacity"
					style={{ borderColor: 'currentColor', opacity: hangEnd ? 1 : 0.5, background: hangEnd ? 'var(--btn-bg)' : 'transparent' }}
				>
					End (closing quotes, commas)
				</button>
				<div className="flex flex-col gap-1 ml-4 min-w-32">
					<span className="text-xs uppercase tracking-widest opacity-50">Threshold (px)</span>
					<input type="range" min={0} max={3} step={0.25} value={threshold} aria-label="Threshold" onChange={e => setThreshold(Number(e.target.value))} onTouchStart={e => e.stopPropagation()} style={{ touchAction: 'none' }} />
					<span className="tabular-nums text-xs opacity-50 text-right">{threshold}</span>
				</div>
			</div>
			<OpticalMarginText hangStart={dStart} hangEnd={dEnd} threshold={dThreshold} style={sampleStyle}>
				{SAMPLE}
			</OpticalMarginText>
			<p className="text-xs opacity-50 italic mt-6">
				{hangStart && hangEnd ? 'Punctuation hangs at both margins.' : hangStart ? 'Punctuation hangs at the start margin only.' : hangEnd ? 'Punctuation hangs at the end margin only.' : 'Optical margin disabled — punctuation is flush.'}
			</p>
		</div>
	)
}
