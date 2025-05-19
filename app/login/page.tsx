"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, signUp, confirmSignUp, getCurrentUser } from "aws-amplify/auth"
import { Amplify } from "aws-amplify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from "@/components/logo"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // For Sign In tab & confirmation email (this email is used for confirmation flow)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [confirmationCode, setConfirmationCode] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  // For the Sign Up tab
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        await getCurrentUser()
        router.push("/dashboard")
      } catch (error) {
        // Not authenticated or error fetching session, stay on login page
        console.log("User not authenticated or error fetching session:", error)
      }
    }
    checkAuthState()
  }, [router])


  // Handle user sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { isSignedIn } = await signIn({ username: email.trim().toLowerCase(), password })
      if (isSignedIn) {
        router.push("/dashboard")
      }
    } catch (error) {
      const err: any = error
      let message = err?.message || "Failed to sign in. Please check your credentials."

      if (err?.name === "UserNotConfirmedException") {
        message = "Account not confirmed. Please check your email for the confirmation code."
        // setEmail is already set from the input field, so it will be used for confirmation
        setShowConfirmation(true)
      } else if (err?.name === "NotAuthorizedException") {
        message = "Incorrect email or password."
      } else if (err?.name === "UserAlreadyAuthenticatedException") {
        // This case might be handled by useEffect, but good to have defensive coding
        router.push("/dashboard");
        return;
      }


      toast.error(message)
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle user sign-up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signUpEmail?.trim()) {
      toast.error("Please enter an email address to sign up.")
      return
    }
    if (!signUpPassword) {
      toast.error("Please enter a password to sign up.")
      return
    }

    const pwd = signUpPassword
    const policyOk =
      pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /\d/.test(pwd)
    if (!policyOk) {
      toast.error(
        "Password must be ≥8 characters and include uppercase, lowercase and a number."
      )
      return
    }

    setIsLoading(true)
    try {
      await signUp({
        username: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
        options: {
          userAttributes: {
            email: signUpEmail.trim().toLowerCase(),
          },
        },
      })
      // Set the main email state to the one used for sign up for confirmation
      setEmail(signUpEmail.trim().toLowerCase())
      setShowConfirmation(true)
      toast.success("Please check your email for the confirmation code.")
    } catch (error) {
      const err: any = error
      let message = err?.message || "Failed to sign up. Please try again."

      if (err?.name === "InvalidPasswordException") {
        message = err?.message ||
          "Password doesn't meet the required complexity: use uppercase, lowercase, number, 8+ chars."
      } else if (err?.name === "UsernameExistsException") {
        message = "An account with this email already exists. Please sign in instead."
      }

      toast.error(message)
      console.error("Sign up error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle confirmation of sign-up (uses `email` state, which is set by sign-in or sign-up)
  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode })
      toast.success("Account confirmed successfully! Please sign in.")
      setShowConfirmation(false)
      setConfirmationCode("") // Clear confirmation code
      // Optionally switch to sign-in tab, clear sign-up fields
      setSignUpEmail("")
      setSignUpPassword("")
    } catch (error) {
      toast.error("Failed to confirm account. Please try again.")
      console.error("Confirmation error:", error)
    } finally {
      setIsLoading(false)
    }
  }


  if (showConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 neural-network">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="mb-8">
              <Logo className="h-10 w-auto" />
            </Link>
            <h1 className="text-3xl font-bold mb-2 font-heading">Confirm Your Account</h1>
            <p className="text-muted-foreground">
              Enter the confirmation code sent to {email}.
            </p>
          </div>
          <div className="glass-effect rounded-xl p-8">
            <form onSubmit={handleConfirmSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="confirmationCode">Confirmation Code</Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="Enter code from email"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                disabled={isLoading}
              >
                {isLoading ? "Confirming..." : "Confirm Account"}
              </Button>
              <Button
                type="button" // Important: type="button" to prevent form submission
                variant="link"
                className="w-full text-cosmic-teal"
                onClick={() => {
                  setShowConfirmation(false)
                  setConfirmationCode("") // Clear code if going back
                }}
              >
                Back to Sign In/Sign Up
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 neural-network">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-8">
            <Logo className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold mb-2 font-heading">Welcome</h1>
          <p className="text-muted-foreground">
            Access your Patchline account
          </p>
        </div>
        <div className="glass-effect rounded-xl p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-cosmic-teal hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground pt-1">
                    Must be ≥8 characters, include uppercase, lowercase, and a number.
                  </p>
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
        </div>
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
