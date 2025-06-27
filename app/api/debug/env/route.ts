import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'

// GET /api/debug/env - Check environment variables (secure endpoint)
export async function GET(request: NextRequest) {
  // Simple security check - only allow in development or with a secret header
  const debugToken = request.headers.get('x-debug-token')
  const isAuthorized = process.env.NODE_ENV === 'development' || debugToken === 'patchline-debug-2025'
  
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envStatus = {
    node_env: process.env.NODE_ENV,
    aws: {
      region: CONFIG.AWS_REGION ? 'set' : 'missing',
      access_key: CONFIG.AWS_ACCESS_KEY_ID ? 'set' : 'missing',
      secret_key: CONFIG.AWS_SECRET_ACCESS_KEY ? 'set' : 'missing',
    },
    bedrock: {
      agent_id: CONFIG.BEDROCK_AGENT_ID ? 'set' : 'missing',
      agent_alias_id: CONFIG.BEDROCK_AGENT_ALIAS_ID ? 'set' : 'missing',
      model_id: CONFIG.BEDROCK_MODEL_ID ? 'set' : 'missing',
    },
    gmail: {
      client_id: CONFIG.GMAIL_CLIENT_ID ? 'set' : 'missing',
      client_secret: CONFIG.GMAIL_CLIENT_SECRET ? 'set' : 'missing',
    },
    tables: {
      users: CONFIG.USERS_TABLE,
      embeds: CONFIG.EMBEDS_TABLE,
      blog_posts: CONFIG.BLOG_POSTS_TABLE,
      content_drafts: CONFIG.CONTENT_DRAFTS_TABLE,
    },
    urls: {
      app_url: CONFIG.NEXT_PUBLIC_APP_URL,
    },
    // Show actual values for critical debugging (only first few chars)
    debug_values: {
      agent_id: CONFIG.BEDROCK_AGENT_ID ? `${CONFIG.BEDROCK_AGENT_ID.substring(0, 8)}...` : 'not set',
      agent_alias_id: CONFIG.BEDROCK_AGENT_ALIAS_ID ? `${CONFIG.BEDROCK_AGENT_ALIAS_ID.substring(0, 8)}...` : 'not set',
    }
  }

  return NextResponse.json(envStatus)
}

export const dynamic = 'force-dynamic'
