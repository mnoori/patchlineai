/**
 * Hook to sync authentication state with permission system
 * Ensures user permissions are set after login
 */

import { useEffect, useRef } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { usePermissions, UserTier } from '@/lib/permissions'

export function useAuthSync() {
  const { setUser, user } = usePermissions()
  const initialSyncDone = useRef(false)

  useEffect(() => {
    // Only run once on mount
    if (initialSyncDone.current) return
    
    let mounted = true

    async function syncUserPermissions() {
      try {
        // If we already have a user, preserve their tier and purchased features
        if (user) {
          console.log('User already exists in store, preserving data:', user)
          initialSyncDone.current = true
          return
        }

        // Only do this for new users or no users at all
        const cognitoUser = await getCurrentUser()
        
        // Get user attributes
        const attributes = cognitoUser.signInDetails?.loginId || cognitoUser.username
        
        // For new users, start with CREATOR tier
        const defaultTier = UserTier.CREATOR
        
        // Check if we have persisted data in localStorage
        let persistedUser = null
        try {
          const persistedData = localStorage.getItem('patchline-permissions')
          if (persistedData) {
            const parsed = JSON.parse(persistedData)
            persistedUser = parsed?.state?.user || null
          }
        } catch (error) {
          console.error('Failed to read persisted user data:', error)
        }
        
        // If the component is still mounted and we didn't already have a user
        if (mounted && !initialSyncDone.current) {
          if (persistedUser) {
            // Use persisted user data if available
            console.log('Using persisted user data:', persistedUser)
            setUser(persistedUser)
          } else {
            // Create new user with default settings
            console.log('Creating new user with default tier:', defaultTier)
            setUser({
              id: cognitoUser.userId,
              email: attributes,
              tier: defaultTier,
              purchasedFeatures: [],
              godModeActivated: false
            })
          }
          
          initialSyncDone.current = true
        }
      } catch (error) {
        console.error('Failed to sync user permissions:', error);
        // We never clear the user on error - this preserves any upgrades
      }
    }

    syncUserPermissions()

    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - only run once on mount
} 