/**
 * Pre-warm expensive routes on startup to improve perceived performance
 */
export async function prewarmRoutes(userId?: string) {
  if (!userId || typeof window === 'undefined') return
  
  console.log('[PREWARM] Starting route pre-warming for user:', userId)
  
  // Pre-warm critical API routes in parallel
  const routes = [
    `/api/user?userId=${userId}`,
    `/api/platforms?userId=${userId}`,
    `/api/embeds?userId=${userId}`,
    `/api/embed?userId=${userId}`,
  ]
  
  try {
    await Promise.all(
      routes.map(route => 
        fetch(route)
          .then(() => console.log(`[PREWARM] Successfully warmed: ${route}`))
          .catch(err => console.error(`[PREWARM] Failed to warm ${route}:`, err))
      )
    )
    
    console.log('[PREWARM] Completed route pre-warming')
  } catch (error) {
    console.error('[PREWARM] Error during pre-warming:', error)
  }
} 