"use client"

import { motion } from "framer-motion"
import { Youtube, Instagram, Github } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Contact() {
  return (
    <section id="contact" className="py-20 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-light/80 max-w-2xl mx-auto">
              Ready to transform your music business with AI? Contact us to learn more about our platform and how it can
              help you scale your operations.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="glassmorphic rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
              <p className="text-light/80 mb-6">
                Have questions about our platform? Want to schedule a demo? We're here to help.
              </p>
              <Button
                className="w-full bg-neon-cyan text-eclipse hover:bg-neon-cyan/80"
                onClick={() => window.location.href = "mailto:hello@patchline.ai"}
              >
                hello@patchline.ai
              </Button>
            </div>

            <div className="glassmorphic rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-4">Join the Waitlist</h3>
              <p className="text-light/80 mb-6">
                Be among the first to experience the future of music business with AI.
              </p>
              <Button
                className="w-full bg-neon-magenta text-eclipse hover:bg-neon-magenta/80"
                onClick={() => window.location.href = "https://patchline.ai/waitlist"}
              >
                Join Waitlist
              </Button>
            </div>
          </motion.div>

          <div className="mt-12">
            <h4 className="text-lg font-bold mb-4">Follow Our Journey</h4>
            <div className="flex gap-4">
              <a
                href="https://youtube.com/@patchlineai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-eclipse/50 border border-light/20 hover:border-neon-cyan p-3 rounded-full transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/patchlineai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-eclipse/50 border border-light/20 hover:border-neon-magenta p-3 rounded-full transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/patchlineai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-eclipse/50 border border-light/20 hover:border-neon-green p-3 rounded-full transition-all duration-300"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </motion.div>

        <div className="mt-24 text-center text-light/60 text-sm">
          <p>© {new Date().getFullYear()} Patchline AI. All rights reserved.</p>
        </div>
      </div>
    </section>
  )
}
