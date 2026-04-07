import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Optical Margin — Font-metric hanging punctuation, cross-browser'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	const interLight = await readFile(join(process.cwd(), 'public/fonts/inter-300.woff'))
	return new ImageResponse(
		(
			<div style={{ background: '#0c0c0c', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', fontFamily: 'Inter, sans-serif' }}>
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>optical margin</span>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
						<div style={{ display: 'flex', alignItems: 'baseline' }}>
							<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginRight: 2 }}>&quot;</span>
							<div style={{ width: 480, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
						</div>
						<div style={{ width: 520, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
						<div style={{ width: 500, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
						<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: 520 }}>
							<div style={{ width: 490, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
							<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>,&quot;</span>
						</div>
					</div>
					<div style={{ fontSize: 76, color: '#ffffff', lineHeight: 1.06, fontWeight: 300 }}>Hang it right.</div>
					<div style={{ fontSize: 76, color: 'rgba(255,255,255,0.4)', lineHeight: 1.06, fontWeight: 300 }}>Every font.</div>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span><span style={{ opacity: 0.4 }}>·</span>
						<span>Canvas measurement</span><span style={{ opacity: 0.4 }}>·</span>
						<span>Cross-browser</span>
					</div>
					<div style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>opticalmargin.com</div>
				</div>
			</div>
		),
		{ ...size, fonts: [{ name: 'Inter', data: interLight, style: 'normal', weight: 300 }] },
	)
}
