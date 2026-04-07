import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Optical Margin — Font-metric hanging punctuation, cross-browser",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Optical Margin measures the actual hang amount of each punctuation character using Canvas, then applies it as a margin so quotes, commas and hyphens hang into the margin. Cross-browser, font-agnostic.",
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
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
