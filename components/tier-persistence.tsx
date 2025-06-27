"use client"

import { useEffect } from 'react'
import { usePermissions, User, UserTier } from '@/lib/permissions'

/**
 * TierPersistence - Component to ensure user tier persistence
 * 
 * This component solves the tier reset issue by:
 * 1. Checking localStorage directly on mount
 * 2. Restoring any tier upgrade that might have been lost
 * 3. Ensuring consistent tier across page refreshes
 */
export function TierPersistence() {
  const { user, setUser } = usePermissions()
  
  useEffect(() => {
    // Immediate check on mount
    validateTierPersistence()
    
    // Set up an interval to continuously check
    const interval = setInterval(validateTierPersistence, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  const validateTierPersistence = () => {
    try {
      // Only proceed if we have a user in state
      if (!user) return
      
      // Get the persisted user from localStorage
      const persistedData = localStorage.getItem('patchline-permissions')
      if (!persistedData) return
      
      const parsedData = JSON.parse(persistedData)
      const persistedUser = parsedData?.state?.user
      
      // If we don't have a persisted user, write the current one
      if (!persistedUser) {
        console.log('No persisted user found, writing current user to localStorage')
        const currentStore = { state: { user } }
        localStorage.setItem('patchline-permissions', JSON.stringify(currentStore))
        return
      }
      
      // Check if there's a tier mismatch (memory vs localStorage)
      if (user.tier !== persistedUser.tier) {
        console.log('Tier mismatch detected!')
        console.log('Current tier in memory:', user.tier)
        console.log('Persisted tier in localStorage:', persistedUser.tier)
        
        // Determine which tier to use (prefer higher tier)
        const tierPriority: Record<UserTier, number> = {
          [UserTier.HOBBY]: 1,
          [UserTier.PRO]: 2,
          [UserTier.ULTRA]: 3,
          [UserTier.GOD_MODE]: 4
        }
        
        if (tierPriority[persistedUser.tier as UserTier] > tierPriority[user.tier]) {
          // localStorage has higher tier, restore it
          console.log('Restoring higher tier from localStorage:', persistedUser.tier)
          setUser(persistedUser)
        } else {
          // Memory has higher tier, save it to localStorage
          console.log('Saving higher tier to localStorage:', user.tier)
          const currentStore = { state: { user } }
          localStorage.setItem('patchline-permissions', JSON.stringify(currentStore))
        }
      }
    } catch (error) {
      console.error('Error in TierPersistence:', error)
    }
  }
  
  // This component doesn't render anything
  return null
} 