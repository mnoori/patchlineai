/**
 * Determines if the application should run in demo mode
 *
 * In demo mode, the application will use static data instead of making
 * API calls to Spotify. This is useful for:
 * 1. Production deployments where we want to ensure consistent dashboard data
 * 2. Development environments when Spotify API is unavailable
 * 3. Offline demos where internet connectivity isn't guaranteed
 *
 * Set NEXT_PUBLIC_DEMO_MODE=true in your environment to enable demo mode
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

/**
 * Contains additional demo configuration options
 */
export const DEMO_CONFIG = {
  // Shows a "Demo Mode" indicator in the UI
  SHOW_DEMO_BADGE: true,

  // Indicates if we should simulate API loading states in demo mode
  SIMULATE_LOADING: true,

  // Time in ms to simulate loading in demo mode (if SIMULATE_LOADING is true)
  LOADING_DURATION: 1000,
}

// Spotify API credentials
export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ""
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""
