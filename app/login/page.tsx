"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from "@/components/logo"
import { toast } from "sonner"
import { signIn, signUp, confirmSignUp, getCurrentUser } from "aws-amplify/auth"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // For Sign In tab
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // For the Sign Up tab
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")

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

  // Handle user sign-up (placeholder for now)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info("Sign up functionality coming soon!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-cosmic-teal/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Welcome to Patchline</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
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
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Use your AWS Cognito credentials to sign in
              </p>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center space-x-4">
          <Link href="#" className="text-sm text-muted-foreground hover:text-cosmic-teal">
            Terms of Service
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-cosmic-teal">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
