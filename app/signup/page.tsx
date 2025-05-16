"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would register the user with a backend
    // For now, just redirect to the login page
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="absolute inset-0 noise-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-eclipse via-eclipse/90 to-eclipse/80"></div>
        <div
          className="absolute inset-0"
          style={{
            background: `
            radial-gradient(circle at 20% 30%, rgba(0, 234, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 41, 117, 0.15) 0%, transparent 50%)
          `,
          }}
        ></div>
      </div>

      <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Join Patchline</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="bg-eclipse/50 border-light/10 focus:border-neon-cyan"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@example.com"
              required
              className="bg-eclipse/50 border-light/10 focus:border-neon-cyan"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-eclipse/50 border-light/10 focus:border-neon-cyan"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-eclipse/50 border-light/10 focus:border-neon-cyan"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-neon-cyan text-eclipse hover:bg-neon-cyan/80 font-medium"
          >
            Sign Up
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-light/70 mb-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-sm text-light/70">
            Already have an account?{" "}
            <Link href="/login" className="text-neon-cyan hover:text-neon-cyan/80">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 