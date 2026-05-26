import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import ToolDirectory from "@/components/ToolDirectory"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"
import SiteFooter from "../components/SiteFooter"
import { MagnetChar } from "@liiift-studio/magnettype"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">opticalmargin</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontVariationSettings: '"wght" 300, "opsz" 144', lineHeight: "1.05em" }}>
						<MagnetChar as="span" minWeight={300} maxWeight={800} spreadRadius={220} fixedAxes={{ opsz: 144 }}>Hang it right.</MagnetChar><br />
						<MagnetChar as="span" minWeight={300} maxWeight={800} spreadRadius={220} fixedAxes={{ opsz: 144 }} style={{ opacity: 0.5, fontStyle: "italic" }}>Every font.</MagnetChar>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/Liiift-Studio/OpticalMargin" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span><span>Canvas measurement</span><span>·</span><span>Cross-browser</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					CSS <code className="text-xs font-mono">hanging-punctuation</code> is Safari-only and has no weight control. Optical Margin measures each punctuation character&rsquo;s actual hang amount from Canvas font metrics and applies it as a margin. Works in every browser, with every font.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Live demo — toggle the hangs</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)", overflow: 'hidden' }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">Why not CSS?</p>
				<div className="prose-grid grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">hanging-punctuation is incomplete</p>
						<p>The CSS property is Safari-only. It doesn&rsquo;t let you control hang amount, threshold, or which characters hang. And it uses hard-coded character tables, not the actual font metrics — so a T in one font hangs the same amount as a T in another.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Font-metric measurement</p>
						<p>Canvas measureText returns both advance width and visual bounds. The difference is the optical hang amount — how far the character could move into the margin before it would look misaligned. This gives accurate results for every font without a lookup table.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Drop-in component</p>
						<CodeBlock code={`import { OpticalMarginText } from '@liiift-studio/opticalmargin'

<OpticalMarginText hangStart={true} hangEnd={true}>
  "Your paragraph text here..."
</OpticalMarginText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Hook</p>
						<CodeBlock code={`import { useOpticalMargin } from '@liiift-studio/opticalmargin'

const ref = useOpticalMargin({ hangStart: true, hangEnd: true })
<p ref={ref}>{children}</p>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS</p>
						<CodeBlock code={`import { applyOpticalMargin, removeOpticalMargin, getCleanHTML } from '@liiift-studio/opticalmargin'

const el = document.querySelector('p')
const original = getCleanHTML(el)
applyOpticalMargin(el, original, { hangStart: true, hangEnd: true })

// Later — restore original:
removeOpticalMargin(el, original)`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead><tr className="opacity-50 text-left"><th className="pb-2 pr-6 font-normal">Option</th><th className="pb-2 pr-6 font-normal">Default</th><th className="pb-2 font-normal">Description</th></tr></thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">hangStart</td><td className="py-2 pr-6">true</td><td className="py-2">Hang opening punctuation at line starts.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">hangEnd</td><td className="py-2 pr-6">true</td><td className="py-2">Hang closing punctuation and sentence-end marks at line ends.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">threshold</td><td className="py-2 pr-6">0.5</td><td className="py-2">Minimum hang amount in px before applying.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">maxHangRatio</td><td className="py-2 pr-6">0.9</td><td className="py-2">Max proportion of advance width to hang (0–1).</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">hangFractions</td><td className="py-2 pr-6">—</td><td className="py-2">Per-character hang fraction overrides. Keys are single characters; values are 0–1. Defaults: hyphens/dashes 1.0, quotes/brackets 0.8, commas/colons 0.6.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<SiteFooter current="opticalMargin" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
