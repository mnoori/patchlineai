import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import Navigation from "@/components/navigation"
import { Space_Grotesk as SpaceGrotesk, Inter_Tight as InterTight } from "next/font/google"

const spaceGrotesk = SpaceGrotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const interTight = InterTight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
})

export const metadata: Metadata = {
  title: "Patchline | Orchestrate your Music Business with AI Agents",
  description:
    "A full-stack, AI-first platform with specialized agents that automate and optimize workflows across A&R, legal, catalog management, sync licensing, and fan engagement.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Patchline",
              url: "https://patchline.vercel.app",
              description:
                "A full-stack, AI-first platform with specialized agents that automate and optimize workflows across A&R, legal, catalog management, sync licensing, and fan engagement.",
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Mock ResizeObserver implementation to prevent errors
            (function() {
              // If ResizeObserver is already defined, save the original
              const OriginalResizeObserver = window.ResizeObserver;
              
              // Create a mock ResizeObserver that does nothing
              window.ResizeObserver = function MockResizeObserver(callback) {
                this.observe = function() {};
                this.unobserve = function() {};
                this.disconnect = function() {};
              };
              
              // Override console.error to suppress ResizeObserver errors
              const originalConsoleError = console.error;
              console.error = function(...args) {
                if (args.length > 0 && 
                    typeof args[0] === 'string' && 
                    (args[0].includes('ResizeObserver') || 
                     args[0].includes('loop completed with undelivered notifications'))) {
                  // Suppress the error
                  return;
                }
                return originalConsoleError.apply(this, args);
              };
              
              // Global error handler
              window.addEventListener('error', function(event) {
                if (event.message && 
                    (event.message.includes('ResizeObserver') || 
                     event.message.includes('loop completed with undelivered notifications'))) {
                  event.preventDefault();
                  return true;
                }
              }, true);
              
              // Unhandled promise rejection handler
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && 
                    event.reason.message && 
                    (event.reason.message.includes('ResizeObserver') || 
                     event.reason.message.includes('loop completed with undelivered notifications'))) {
                  event.preventDefault();
                  return true;
                }
              }, true);
            })();
          `,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${interTight.variable} font-sans bg-eclipse`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
