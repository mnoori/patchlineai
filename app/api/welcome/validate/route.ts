import { NextRequest, NextResponse } from "next/server"

// Simple token validation - in production, you'd want to use a database
// For now, we'll use a simple algorithm to validate tokens
function isValidToken(token: string): boolean {
  // Token format: base64(timestamp-random)
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [timestamp] = decoded.split('-')
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    
    // Token is valid for 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    return (now - tokenTime) < sevenDaysInMs
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 })
  }
  
  const isValid = isValidToken(token)
  
  return NextResponse.json({ valid: isValid })
}

// Helper function to generate tokens (for your Calendly integration)
export function generateWelcomeToken(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const tokenString = `${timestamp}-${random}`
  return Buffer.from(tokenString).toString('base64')
} 