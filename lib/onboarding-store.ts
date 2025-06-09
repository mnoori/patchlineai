import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserPreferences {
  genres: string[]
  markets: string[]
  careerStage: string[]
  monthlyListeners: string
}

interface OnboardingState {
  hasCompletedOnboarding: boolean
  preferences: UserPreferences | null
  prePopulatedArtists: any[]
  
  // Actions
  setPreferences: (preferences: UserPreferences) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  setPrePopulatedArtists: (artists: any[]) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      preferences: null,
      prePopulatedArtists: [],
      
      setPreferences: (preferences) => set({ preferences }),
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      resetOnboarding: () => set({ 
        hasCompletedOnboarding: false, 
        preferences: null,
        prePopulatedArtists: []
      }),
      
      setPrePopulatedArtists: (artists) => set({ prePopulatedArtists: artists })
    }),
    {
      name: 'patchline-onboarding'
    }
  )
) 