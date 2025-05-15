import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Patchline AI - The Invisible Agentic AI Layer for the Music Industry",
  description:
    "Patchline AI is building an agentic AI layer for the music industry. Our intelligent agents automate and orchestrate essential but fragmented workflows like artist scouting, contract review, metadata tagging, fan engagement, and school operations.",
  keywords: [
    "AI",
    "music industry",
    "artificial intelligence",
    "music technology",
    "A&R",
    "metadata",
    "music business",
  ],
  authors: [{ name: "Mehdi Noori" }],
  creator: "Mehdi Noori",
  publisher: "Patchline AI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://patchline.ai",
    title: "Patchline AI - The Invisible Agentic AI Layer for the Music Industry",
    description:
      "Patchline AI is building an agentic AI layer for the music industry. Our intelligent agents automate and orchestrate essential but fragmented workflows.",
    siteName: "Patchline AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patchline AI - The Invisible Agentic AI Layer for the Music Industry",
    description:
      "Patchline AI is building an agentic AI layer for the music industry. Our intelligent agents automate and orchestrate essential but fragmented workflows.",
    creator: "@mehdinoori",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
