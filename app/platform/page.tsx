"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PlatformPage() {
  const router = useRouter()
  
  const handleLogout = () => {
    // In a real app, we would clear authentication tokens here
    router.push("/login")
  }
  
  return (
    <div className="min-h-screen">
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

      {/* Platform Navigation */}
      <header className="border-b border-light/10 bg-eclipse/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-neon-cyan font-heading text-2xl font-bold">
              Patchline
            </Link>
            
            <nav className="flex items-center space-x-6">
              <Link href="/platform" className="text-neon-cyan text-sm font-medium">
                Overview
              </Link>
              <Link href="/platform/analytics" className="text-light/80 hover:text-neon-cyan text-sm font-medium">
                Analytics
              </Link>
              <Link href="/platform/releases" className="text-light/80 hover:text-neon-cyan text-sm font-medium">
                Releases
              </Link>
              <Link href="/platform/insights" className="text-light/80 hover:text-neon-cyan text-sm font-medium">
                AI Insights
              </Link>
            </nav>
            
            <Button 
              variant="ghost" 
              className="text-light/80 hover:text-neon-cyan text-sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Overview</h1>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glassmorphic rounded-lg p-4 border border-light/10">
            <h3 className="text-sm font-medium text-light/60 mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold">$45,231.89</p>
            <p className="text-neon-cyan text-sm">+20.1% from last month</p>
          </div>
          
          <div className="glassmorphic rounded-lg p-4 border border-light/10">
            <h3 className="text-sm font-medium text-light/60 mb-1">Monthly Listeners</h3>
            <p className="text-2xl font-bold">+2,350</p>
            <p className="text-neon-cyan text-sm">+180.1% from last month</p>
          </div>
          
          <div className="glassmorphic rounded-lg p-4 border border-light/10">
            <h3 className="text-sm font-medium text-light/60 mb-1">Upcoming Releases</h3>
            <p className="text-2xl font-bold">3</p>
            <p className="text-light/60 text-sm">Next release in 12 days</p>
          </div>
          
          <div className="glassmorphic rounded-lg p-4 border border-light/10">
            <h3 className="text-sm font-medium text-light/60 mb-1">Active Campaigns</h3>
            <p className="text-2xl font-bold">4</p>
            <p className="text-neon-magenta text-sm">2 need attention</p>
          </div>
        </div>
        
        {/* Analytics Overview */}
        <div className="glassmorphic rounded-lg p-6 border border-light/10 mb-8">
          <h2 className="text-lg font-bold mb-4">Analytics Overview</h2>
          <p className="text-light/60">Streaming, social, and revenue metrics</p>
          
          <div className="h-40 mt-4 bg-eclipse/40 rounded-md border border-light/10 flex items-center justify-center">
            <p className="text-light/40">Analytics visualization will appear here</p>
          </div>
        </div>
        
        {/* Upcoming Releases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glassmorphic rounded-lg p-6 border border-light/10">
            <h2 className="text-lg font-bold mb-2">Upcoming Releases</h2>
            <p className="text-light/60 text-sm mb-4">Your scheduled releases and their status</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-eclipse/40 rounded-md border border-light/10">
                <div>
                  <h4 className="font-medium">Summer EP</h4>
                  <p className="text-sm text-light/60">June 15, 2023</p>
                </div>
                <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full">
                  In Progress
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-eclipse/40 rounded-md border border-light/10">
                <div>
                  <h4 className="font-medium">Remix Package</h4>
                  <p className="text-sm text-light/60">July 22, 2023</p>
                </div>
                <span className="px-2 py-1 bg-light/10 text-light/60 text-xs rounded-full">
                  Scheduled
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-eclipse/40 rounded-md border border-light/10">
                <div>
                  <h4 className="font-medium">Acoustic Sessions</h4>
                  <p className="text-sm text-light/60">August 10, 2023</p>
                </div>
                <span className="px-2 py-1 bg-light/10 text-light/60 text-xs rounded-full">
                  Scheduled
                </span>
              </div>
            </div>
          </div>
          
          {/* AI Insights */}
          <div className="glassmorphic rounded-lg p-6 border border-light/10">
            <h2 className="text-lg font-bold mb-2">AI Insights</h2>
            <p className="text-light/60 text-sm mb-4">Recent insights from our AI agents based on your catalog and market trends</p>
            
            <div className="space-y-4">
              <div className="p-3 bg-eclipse/40 rounded-md border border-light/10">
                <h4 className="font-medium text-neon-cyan">Trending Sound</h4>
                <p className="text-sm mt-1">
                  Lo-fi elements are gaining traction in your genre. Consider incorporating these elements in upcoming releases.
                </p>
              </div>
              
              <div className="p-3 bg-eclipse/40 rounded-md border border-light/10">
                <h4 className="font-medium text-neon-cyan">Playlist Opportunity</h4>
                <p className="text-sm mt-1">
                  Your track "Midnight Dreams" matches the profile for Spotify's "Late Night Vibes" playlist. We've prepared a pitch.
                </p>
              </div>
              
              <div className="p-3 bg-eclipse/40 rounded-md border border-light/10">
                <h4 className="font-medium text-neon-magenta">Contract Alert</h4>
                <p className="text-sm mt-1">
                  Distribution agreement for "Summer Haze EP" expires in 45 days. Review our renewal recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add Widget Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" className="border-neon-cyan text-neon-cyan">
            + Add Widget
          </Button>
        </div>
      </main>
    </div>
  )
} 