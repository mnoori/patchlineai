"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

const Newsletter = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Load the Beehiiv embed script
  useEffect(() => {
    // Create a hidden container for the Beehiiv iframe
    const hiddenContainer = document.createElement("div")
    hiddenContainer.style.height = "0"
    hiddenContainer.style.overflow = "hidden"
    hiddenContainer.style.position = "absolute"
    hiddenContainer.style.visibility = "hidden"
    hiddenContainer.id = "beehiiv-hidden-container"

    // Add the iframe to the hidden container
    hiddenContainer.innerHTML = `<iframe 
      src="https://embeds.beehiiv.com/490f7783-0f00-47f4-8682-46aecccfeae8?slim=true" 
      data-test-id="beehiiv-embed" 
      height="52" 
      frameborder="0" 
      scrolling="no" 
      style="margin: 0; border-radius: 0px !important; background-color: transparent;"
      id="beehiiv-embed-iframe"
    ></iframe>`

    document.body.appendChild(hiddenContainer)

    return () => {
      document.body.removeChild(hiddenContainer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get the Beehiiv iframe
      const beehiivIframe = document.getElementById("beehiiv-embed-iframe") as HTMLIFrameElement

      if (beehiivIframe && beehiivIframe.contentWindow) {
        // Find the input field in the iframe and set its value
        setTimeout(() => {
          // We need to wait a bit for the iframe to be fully loaded
          const iframeDocument = beehiivIframe.contentWindow?.document

          if (iframeDocument) {
            const emailInput = iframeDocument.querySelector('input[type="email"]') as HTMLInputElement
            const submitButton = iframeDocument.querySelector('button[type="submit"]') as HTMLButtonElement

            if (emailInput && submitButton) {
              // Set the email value
              emailInput.value = email

              // Submit the form
              submitButton.click()

              // Show success message after a short delay
              setTimeout(() => {
                setIsSubmitted(true)
                setIsSubmitting(false)
              }, 1000)
            } else {
              console.error("Could not find email input or submit button in Beehiiv iframe")
              setIsSubmitting(false)
            }
          }
        }, 1000)
      } else {
        console.error("Could not access Beehiiv iframe")
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error("Error submitting to Beehiiv:", err)
      setIsSubmitting(false)
    }
  }

  return (
    <section id="newsletter" className="py-24 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-4xl mx-auto glassmorphic rounded-lg p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4 glitch-text" data-text="Agent YX Newsletter">
                Agent YX Newsletter
              </h2>
              <p className="text-light/80 mb-6">
                Subscribe to our monthly dispatch from the frontiers of creative AI. Exclusive insights, early access to
                experiments, and invitations to private events.
              </p>

              {!isSubmitted ? (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-eclipse/50 border-light/20 focus:border-neon-cyan text-light"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-neon-magenta text-eclipse hover:bg-neon-magenta/80"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Joining..." : "Join the Network"}
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neon-green/10 border border-neon-green/30 rounded-md p-4 flex items-center"
                >
                  <CheckCircle className="h-5 w-5 text-neon-green mr-2" />
                  <span>Thank you! Check your inbox to confirm.</span>
                </motion.div>
              )}
            </div>

            <div className="hidden md:block">
              <div className="relative rounded-md overflow-hidden border border-light/10">
                <Image
                  src="/neon-pulse-dispatch.png"
                  alt="Newsletter Preview"
                  width={400}
                  height={300}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-eclipse/80 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
