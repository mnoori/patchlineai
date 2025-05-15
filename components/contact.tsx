"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Youtube, Instagram, Github } from "lucide-react"

const Contact = () => {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    brief: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      })

      const data = await response.json()

      if (data.success) {
        setIsSubmitted(true)
      } else {
        setError(data.message || "Something went wrong. Please try again.")
      }
    } catch (err) {
      setError("Failed to submit. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 glitch-text" data-text="Contact">
            Contact
          </h2>
          <p className="text-light/80 max-w-2xl mx-auto">
            Ready to explore the frontiers of art and technology? Get in touch to discuss your project, collaboration,
            or just to say hello.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="glassmorphic rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Send a Message</h3>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="bg-eclipse/50 border-light/20 focus:border-neon-cyan text-light"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="bg-eclipse/50 border-light/20 focus:border-neon-cyan text-light"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="brief" className="block text-sm font-medium mb-2">
                      Project Brief
                    </label>
                    <Textarea
                      id="brief"
                      name="brief"
                      value={formState.brief}
                      onChange={handleChange}
                      rows={5}
                      required
                      className="bg-eclipse/50 border-light/20 focus:border-neon-cyan text-light resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-neon-cyan text-eclipse hover:bg-neon-cyan/80"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Inquiry"}
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neon-green/10 border border-neon-green/30 rounded-md p-6 flex flex-col items-center text-center"
                >
                  <CheckCircle className="h-12 w-12 text-neon-green mb-4" />
                  <h4 className="text-xl font-bold mb-2">Message Received!</h4>
                  <p className="text-light/80">Thank you for reaching out. We'll get back to you within 48 hours.</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-6">Connect With Us</h3>
                <p className="text-light/80 mb-8">
                  Follow our work across platforms or reach out directly. We're always open to new collaborations and
                  conversations.
                </p>

                <div className="space-y-4">
                  <p className="text-light/80">
                    Based in Brooklyn, NY
                    <br />
                    Available for remote and on-site projects worldwide
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <h4 className="text-lg font-bold mb-4">Follow Our Journey</h4>
                <div className="flex gap-4">
                  <a
                    href="https://youtube.com/@algoryxmusic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-eclipse/50 border border-light/20 hover:border-neon-cyan p-3 rounded-full transition-all duration-300"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com/algoryxmusic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-eclipse/50 border border-light/20 hover:border-neon-magenta p-3 rounded-full transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="https://github.com/algoryxlab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-eclipse/50 border border-light/20 hover:border-neon-green p-3 rounded-full transition-all duration-300"
                    aria-label="GitHub"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-24 text-center text-light/60 text-sm">
          <p>© {new Date().getFullYear()} Algoryx Art & Technology Lab. All rights reserved.</p>
        </div>
      </div>
    </section>
  )
}

export default Contact
