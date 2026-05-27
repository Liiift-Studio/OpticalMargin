import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
	title: "Optical Margin — Font-metric hanging punctuation, cross-browser",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Font-metric hanging punctuation for every browser. Measures actual glyph bounds via Canvas and applies hanging margins — not a lookup table. Works with any font.",
	keywords: ["optical margin", "hanging punctuation", "typography", "TypeScript", "npm", "canvas", "cross browser"],
	openGraph: {
		title: "Optical Margin — Font-metric hanging punctuation, cross-browser",
		description: "Hanging punctuation that actually works — measured from font data, not guessed from lookup tables.",
		url: "https://opticalmargin.com",
		siteName: "Optical Margin",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Optical Margin — Font-metric hanging punctuation, cross-browser",
		description: "Hanging punctuation that actually works — measured from font data, not guessed from lookup tables.",
	},
	metadataBase: new URL("https://opticalmargin.com"),
	alternates: { canonical: "https://opticalmargin.com" },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`h-full antialiased ${inter.variable}`}>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
