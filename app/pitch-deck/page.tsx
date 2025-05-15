"use client"

import Link from "next/link"
import { ArrowLeft, Download, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import PitchDeckViewer from "@/components/pitch-deck/pitch-deck-viewer"
import KeyboardHint from "@/components/pitch-deck/keyboard-hint"
import { useState } from "react"

export default function PitchDeckPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)

    // Open the Google Drive link in a new tab
    window.open("https://drive.google.com/file/d/1Pln-ty-q5EE3qeoplEaZoaQ54HMQQTcj/view?usp=drive_link", "_blank")

    // Reset the downloading state after a short delay
    setTimeout(() => {
      setIsDownloading(false)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-eclipse text-light overflow-hidden pt-16 md:pt-24 pb-12 md:pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-4 md:mb-8">
          <Link
            href="/patchline"
            className="inline-flex items-center text-light/70 hover:text-neon-cyan transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patchline
          </Link>
        </div>

        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center gap-3 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-eclipse text-xs md:text-sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                "Opening PDF..."
              ) : (
                <>
                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Link href="/patchline#cta">
              <Button size="sm" className="bg-neon-magenta text-eclipse hover:bg-neon-magenta/80 text-xs md:text-sm">
                Join the Pilot <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <PitchDeckViewer />

        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/patchline"
            className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-neon-cyan text-eclipse rounded-md font-medium hover:bg-neon-cyan/80 transition-colors text-sm md:text-base"
          >
            Explore Patchline Platform
          </Link>
        </div>
      </div>

      <KeyboardHint />
    </main>
  )
}
