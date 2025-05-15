"use client"

import type React from "react"

import { useState } from "react"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function EmailSignup() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="max-w-md mx-auto">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-grow px-4 py-3 rounded-md bg-eclipse border border-light/20 focus:outline-none focus:ring-2 focus:ring-neon-cyan text-light"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-neon-cyan hover:bg-neon-cyan/80 text-eclipse px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                Get Early Access <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="glassmorphic p-6 rounded-lg text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-neon-green" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
          <p className="text-light/80">
            We've received your request for early access. We'll be in touch soon with next steps.
          </p>
        </div>
      )}
    </div>
  )
}
