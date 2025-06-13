'use client'

// Stub Web3Provider for when Web3 is disabled
// This avoids any module resolution issues
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
} 