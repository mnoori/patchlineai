"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Check for dummy credentials
    if ((email === "mehdi@patchline.ai" && password === "1234") || 
        (email && password)) { // For demo purposes, allow any credentials
      // Successful login
      router.push("/platform")
    } else {
      // Show error for empty fields
      setError("Please enter both email and password")
    }
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
          <h1 className="text-2xl md:text-3xl font-bold">Welcome Back</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mehdi@patchline.ai"
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
              placeholder="••••"
              required
              className="bg-eclipse/50 border-light/10 focus:border-neon-cyan"
            />
          </div>
          
          {error && (
            <div className="text-neon-magenta text-sm">{error}</div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-light/30 data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan"
              />
              <label htmlFor="remember" className="text-sm">
                Remember me
              </label>
            </div>
            
            <Link href="#" className="text-sm text-neon-cyan hover:text-neon-cyan/80">
              Forgot password?
            </Link>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-neon-cyan text-eclipse hover:bg-neon-cyan/80 font-medium"
          >
            Login
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-light/70">
            Don't have an account?{" "}
            <Link href="/signup" className="text-neon-cyan hover:text-neon-cyan/80">
              Sign up
            </Link>
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-eclipse/50 rounded-md border border-light/10">
          <p className="text-xs text-light/60 text-center">
            <span className="text-neon-cyan font-medium">Demo credentials:</span><br />
            Email: mehdi@patchline.ai<br />
            Password: 1234
          </p>
        </div>
      </div>
    </div>
  )
} 