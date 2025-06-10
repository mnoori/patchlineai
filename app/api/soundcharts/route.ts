import { NextRequest, NextResponse } from 'next/server'

// API Configuration
const SOUNDCHARTS_APP_ID = process.env.SOUNDCHARTS_ID
const SOUNDCHARTS_API_KEY = process.env.SOUNDCHARTS_TOKEN
const SOUNDCHARTS_API_URL = process.env.SOUNDCHARTS_API_URL || 'https://customer.api.soundcharts.com'

// CORS headers for client-side requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!SOUNDCHARTS_APP_ID || !SOUNDCHARTS_API_KEY) {
      const errorMessage = 'Soundcharts API credentials are not configured on the server.'
      console.error(errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Build the full URL with query parameters
    const url = new URL(`${SOUNDCHARTS_API_URL}${endpoint}`)
    
    // Forward all query parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value)
      }
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15-second timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-app-id': SOUNDCHARTS_APP_ID,
          'x-api-key': SOUNDCHARTS_API_KEY,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Soundcharts API error:', response.status, errorText)
        return NextResponse.json(
          { error: `Soundcharts API error: ${response.status}`, details: errorText },
          { status: response.status, headers: corsHeaders }
        )
      }

      const data = await response.json()
      
      // Get remaining quota from response headers
      const quotaRemaining = response.headers.get('x-quota-remaining')
      
      return NextResponse.json(data, { 
        headers: {
          ...corsHeaders,
          'X-Quota-Remaining': quotaRemaining || 'unknown'
        }
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('Soundcharts proxy error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request to Soundcharts API timed out' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch from Soundcharts API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!SOUNDCHARTS_APP_ID || !SOUNDCHARTS_API_KEY) {
      const errorMessage = 'Soundcharts API credentials are not configured on the server.'
      console.error(errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    const body = await request.json()

    // Build the full URL with query parameters
    const url = new URL(`${SOUNDCHARTS_API_URL}${endpoint}`)
    
    // Forward all query parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value)
      }
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15-second timeout

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'x-app-id': SOUNDCHARTS_APP_ID,
          'x-api-key': SOUNDCHARTS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Soundcharts API error:', response.status, errorText)
        return NextResponse.json(
          { error: `Soundcharts API error: ${response.status}`, details: errorText },
          { status: response.status, headers: corsHeaders }
        )
      }

      const data = await response.json()
      
      // Get remaining quota from response headers
      const quotaRemaining = response.headers.get('x-quota-remaining')
      
      return NextResponse.json(data, { 
        headers: {
          ...corsHeaders,
          'X-Quota-Remaining': quotaRemaining || 'unknown'
        }
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('Soundcharts proxy error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request to Soundcharts API timed out' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch from Soundcharts API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
} 