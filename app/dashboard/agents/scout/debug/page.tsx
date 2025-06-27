"use client"

import { useState, useEffect } from "react"
import { Card as BrandCard } from '@/components/brand'
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingStore } from "@/lib/onboarding-store"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react"

export default function ScoutDebugPage() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({})
  const { hasCompletedOnboarding, preferences, resetOnboarding } = useOnboardingStore()

  const loadLocalStorage = () => {
    const data: Record<string, any> = {}
    const keys = [
      'patchline-onboarding',
      'scout-onboarding',
      'scout-watchlist',
      'user-interactions'
    ]
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          data[key] = JSON.parse(value)
        } else {
          data[key] = null
        }
      } catch (e) {
        data[key] = 'Error parsing'
      }
    })
    
    setLocalStorageData(data)
  }

  useEffect(() => {
    loadLocalStorage()
  }, [])

  const clearAll = () => {
    localStorage.removeItem('patchline-onboarding')
    localStorage.removeItem('scout-onboarding')
    localStorage.removeItem('scout-watchlist')
    localStorage.removeItem('user-interactions')
    resetOnboarding()
    loadLocalStorage()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent">Scout Agent Debug</h1>
        <Link href="/dashboard/agents/scout">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scout
          </Button>
        </Link>
      </div>

      <BrandCard variant="gradient" hover="glow">
        <CardHeader>
          <CardTitle>Onboarding State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span>Completed:</span>
            <Badge variant={hasCompletedOnboarding ? "default" : "secondary"}>
              {hasCompletedOnboarding ? 'Yes' : 'No'}
            </Badge>
          </div>
          {preferences && (
            <div className="space-y-2">
              <div>Genres: {preferences.genres.join(', ') || 'None'}</div>
              <div>Markets: {preferences.markets.join(', ') || 'None'}</div>
              <div>Career Stages: {preferences.careerStage.join(', ') || 'None'}</div>
            </div>
          )}
        </CardContent>
      </BrandCard>

      <BrandCard variant="gradient" hover="glow">
        <CardHeader>
          <CardTitle>LocalStorage Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-black/10 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </CardContent>
      </BrandCard>

      <div className="flex gap-4">
        <Button onClick={loadLocalStorage} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
        <Button onClick={clearAll} variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All & Reset
        </Button>
        <Link href="/dashboard/agents/scout?reset=true">
          <Button variant="secondary">
            Go to Scout with Reset
          </Button>
        </Link>
      </div>
    </div>
  )
} 