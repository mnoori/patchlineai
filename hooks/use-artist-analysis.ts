"use client"

import { useState, useCallback, useEffect } from "react"
import { DEMO_MODE, DEMO_CONFIG } from '@/shared/utils/config'
import demoArtists from "@/data/demo-artists.json"
// import { getMockArtistAnalysis, getMockArtists } from '@/lib/api/mock-data';

// Verified artist IDs pool
const ARTIST_IDS = [
  // User provided artists (prioritized)
  "7wU1naftD3lNq7rNsiDvOR", // First artist
  "2S9EJm8U2xlkwphPqUkDW4", // Second artist
  "6MzHMxgYcbj6ue5w9pbNp9", // Third artist
  "4xf4u86Lsh1D8rIJxeuV7b", // Fourth artist
  "4nuR5cGAyxV1jlRROlerJt", // Fifth artist
  "3kI19T2Y7mzINNIOGHTg5P", // Sixth artist
  "7o5gxy3lEGcP62TNIppa7w", //
]

export const useArtistAnalysis = () => {
  console.log("[Hook] process.env.NEXT_PUBLIC_DEMO_MODE:", process.env.NEXT_PUBLIC_DEMO_MODE)
  console.log("[Hook] DEMO_MODE from import evaluated as:", DEMO_MODE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [artists, setArtists] = useState<any[]>([])
  const [retryCount, setRetryCount] = useState(0)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [batchRefreshTime, setBatchRefreshTime] = useState("in 23 hours")

  // Function to handle demo mode data loading
  const loadDemoData = useCallback(async () => {
    setLoading(true)

    try {
      // Simulate loading delay if configured
      if (DEMO_CONFIG.SIMULATE_LOADING) {
        await new Promise((resolve) => setTimeout(resolve, DEMO_CONFIG.LOADING_DURATION))
      }

      // Use the static JSON data
      setArtists(demoArtists.artists)
      setError(null)
    } catch (err) {
      console.error("Error loading demo data:", err)
      setError("Failed to load demo data")
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }, [])

  // Fetch an individual artist with retry logic
  const fetchArtistWithRetry = useCallback(async (id: string, maxRetries = 2) => {
    let attempts = 0
    while (attempts <= maxRetries) {
      try {
        // Add cache-busting timestamp to ensure we're not getting cached responses
        const timestamp = new Date().getTime()
        const res = await fetch(`/api/spotify-artist?id=${id}&_t=${timestamp}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.warn(`Artist fetch failed (attempt ${attempts + 1}/${maxRetries + 1}):`, res.status, id, errorData)
          throw new Error(`Failed to fetch artist: ${res.status}`)
        }
        return res.json()
      } catch (err) {
        attempts++
        if (attempts > maxRetries) throw err
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)))
      }
    }
    throw new Error("Failed to fetch artist after retries")
  }, [])

  // Fetch real artist data for all hardcoded artists, skipping failed ones
  const fetchArtists = useCallback(async () => {
    // If in demo mode, use static data
    if (DEMO_MODE) {
      await loadDemoData()
      return
    }

    // Only fetch the artists in the ARTIST_IDS list (non-demo mode code)
    try {
      setLoading(true)
      setError(null)

      // Only use the first 6 artist IDs to match the demo data
      const idsToFetch = DEMO_MODE
        ? ARTIST_IDS.slice(0, 6) // Only the 6 demo artists when in demo mode
        : ARTIST_IDS // All artists when not in demo mode

      // Fetch artists with retry logic
      const results = await Promise.allSettled(idsToFetch.map((id) => fetchArtistWithRetry(id)))

      // Filter out failed requests and extract values from fulfilled promises
      const successfulArtists = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .map((r) => r.value)

      // Log any failures for debugging
      results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .forEach((r, i) => console.error(`Failed to fetch artist ${ARTIST_IDS[i]}:`, r.reason))

      setArtists(successfulArtists)

      if (successfulArtists.length === 0 && results.length > 0) {
        throw new Error("All artist fetches failed")
      }

      // Check if we have enough artists (minimum 5 for UI)
      if (successfulArtists.length < 5) {
        console.warn(`Only ${successfulArtists.length} artists were successfully fetched. Minimum 5 recommended.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch artists")
      console.error("Error fetching artists:", err)

      // Increment retry count
      setRetryCount((prev) => prev + 1)
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }, [fetchArtistWithRetry, loadDemoData])

  // Auto-retry once if all artists fail
  useEffect(() => {
    if (!DEMO_MODE && error && artists.length === 0 && retryCount === 1) {
      console.log("Retrying artist fetch after initial failure...")
      const timer = setTimeout(() => {
        fetchArtists()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [error, artists.length, retryCount, fetchArtists])

  // Keep analyzeArtist as mock for now
  const analyzeArtist = useCallback(async (artistId: string) => {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    setTimeout(() => {
      setAnalysis({ overall: { score: 80 }, streaming: { score: 85 }, social: { score: 78 } })
      setLoading(false)
    }, 1000)
  }, [])

  return {
    loading,
    error,
    analysis,
    artists,
    fetchArtists,
    analyzeArtist,
    initialLoadComplete,
    batchRefreshTime,
    isDemoMode: DEMO_MODE,
  }
}

