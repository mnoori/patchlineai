import { NextRequest, NextResponse } from "next/server"
import { generateWelcomeToken } from "../validate/route"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, message } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    // Generate a unique token
    const token = generateWelcomeToken()
    
    // Build the welcome URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      name: encodeURIComponent(name),
      message: encodeURIComponent(message || ''),
      token
    })
    
    const welcomeUrl = `${baseUrl}/welcome?${params.toString()}`
    
    return NextResponse.json({ 
      url: welcomeUrl,
      token,
      expiresIn: '7 days'
    })
  } catch (error) {
    console.error('Error generating welcome link:', error)
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
  }
} 