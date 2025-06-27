'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { UserTier, usePermissionStore } from '@/lib/permissions'

// Create a context for permissions
const PermissionsContext = createContext(null)

export function PermissionsProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const permissionsStore = usePermissionStore()
  
  // Set a default user on mount if none exists
  useEffect(() => {
    if (!permissionsStore.user) {
      permissionsStore.setUser({
        id: 'default-user',
        email: 'user@example.com',
        tier: UserTier.HOBBY,
        purchasedFeatures: []
      })
    }
  }, [permissionsStore])

  return (
    <PermissionsContext.Provider value={permissionsStore}>
      {children}
    </PermissionsContext.Provider>
  )
}

// Export a hook to use the permissions context
export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider')
  }
  return context
} 