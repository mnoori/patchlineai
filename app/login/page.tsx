"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { toast } from "sonner"
import { signIn, getCurrentUser } from "@aws-amplify/auth"
import { GradientOrbs } from "@/components/brand"
import { ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if user is already signed in with Cognito
        const user = await getCurrentUser()
        if (user) {
          router.push("/dashboard")
          return
        }
      } catch (error) {
        // Not authenticated, stay on login page
        console.log("User not authenticated:", error)
      }
    }
    checkAuthState()
  }, [router])

  // Handle user sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email.trim(),
        password: password
      })

      if (isSignedIn) {
        // Get user details
        const user = await getCurrentUser()
        
        // Store user info for the app
        localStorage.setItem("patchline-user", JSON.stringify({
          userId: user.userId,
          username: user.username,
          email: email.trim()
        }))

        toast.success("Login successful!")
        
        // Redirect to dashboard or the page they were trying to access
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get('redirect') || '/dashboard'
        router.push(redirect)
      } else {
        toast.error("Sign in failed. Please check your credentials.")
      }

    } catch (error: any) {
      const message = error.message || "Failed to sign in. Please check your credentials."
      toast.error(message)
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <GradientOrbs variant="vibrant" className="opacity-40" />
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Welcome to Patchline</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 backdrop-blur-sm">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                suppressHydrationWarning
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                suppressHydrationWarning
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Don't have an account yet?
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full border-brand-cyan/20 hover:bg-brand-cyan/10"
            >
              <Link href="/contact" className="inline-flex items-center justify-center">
                Request a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan">
            Terms of Service
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
