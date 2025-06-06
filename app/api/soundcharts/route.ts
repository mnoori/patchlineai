import { NextRequest, NextResponse } from 'next/server'

// API Configuration
const SOUNDCHARTS_APP_ID = process.env.SOUNDCHARTS_APP_ID || 'PATCHLINE_A2F4F819'
const SOUNDCHARTS_API_KEY = process.env.SOUNDCHARTS_API_KEY || 'd8e39c775adc8797'
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

    // Build the full URL with query parameters
    const url = new URL(`${SOUNDCHARTS_API_URL}${endpoint}`)
    
    // Forward all query parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value)
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-app-id': SOUNDCHARTS_APP_ID,
        'x-api-key': SOUNDCHARTS_API_KEY,
        'Content-Type': 'application/json',
      },
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
  } catch (error) {
    console.error('Soundcharts proxy error:', error)
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

    const body = await request.json()

    // Build the full URL with query parameters
    const url = new URL(`${SOUNDCHARTS_API_URL}${endpoint}`)
    
    // Forward all query parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value)
      }
    })

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'x-app-id': SOUNDCHARTS_APP_ID,
        'x-api-key': SOUNDCHARTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
  } catch (error) {
    console.error('Soundcharts proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Soundcharts API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    )
  }
} 