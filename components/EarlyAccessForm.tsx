"use client"
import { useState } from "react"
import type React from "react"

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || "Something went wrong.")
    }
  }

  return submitted ? (
    <div className="text-neon-cyan font-semibold">Thank you! We'll be in touch soon.</div>
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="px-4 py-2 rounded-l bg-eclipse border border-neon-cyan/30 text-light focus:outline-none"
      />
      <button type="submit" className="px-4 py-2 rounded-r bg-neon-cyan text-eclipse font-bold">
        Get Early Access
      </button>
      {error && <div className="text-neon-red text-sm mt-2">{error}</div>}
    </form>
  )
}
