"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login and store token
    setTimeout(() => {
      localStorage.setItem("patchline-auth-token", "demo-token")
      setIsLoading(false)
      window.location.href = "/dashboard"
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 neural-network">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-8">
            <Logo className="h-10 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold mb-2 font-heading">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </div>
        <div className="glass-effect rounded-xl p-8">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sso">SSO</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-cosmic-teal hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" required />
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
            <TabsContent value="sso">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sso-email">Work Email</Label>
                  <Input id="sso-email" type="email" placeholder="name@company.com" required />
                </div>
                <Button className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">Continue with SSO</Button>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="#" className="text-cosmic-teal hover:underline">
                Sign up
              </Link>
            </p>
          </div>
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
