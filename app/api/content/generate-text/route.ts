import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topic, 
      platform, 
      tone, 
      targetAudience, 
      includeHashtags, 
      includeEmojis,
      contentType 
    } = body

    // Create platform-specific prompt
    const platformSpecs = {
      instagram: {
        maxLength: 2200,
        style: 'visual-first with engaging captions',
        features: 'stories, reels, posts'
      },
      twitter: {
        maxLength: 280,
        style: 'concise and impactful',
        features: 'threads, real-time updates'
      },
      tiktok: {
        maxLength: 150,
        style: 'trendy and engaging',
        features: 'short-form video descriptions'
      }
    }

    const spec = platformSpecs[platform as keyof typeof platformSpecs] || platformSpecs.instagram

    const prompt = `Create an engaging social media caption for ${platform} about: ${topic}

Platform: ${platform} (${spec.style})
Tone: ${tone}
Target Audience: ${targetAudience}
Max Length: ${spec.maxLength} characters
Include Hashtags: ${includeHashtags ? 'Yes' : 'No'}
Include Emojis: ${includeEmojis ? 'Yes' : 'No'}

Requirements:
- Write in ${tone} tone
- Optimize for ${platform} engagement
- Target ${targetAudience}
- Keep under ${spec.maxLength} characters
${includeHashtags ? '- Include 3-5 relevant hashtags' : ''}
${includeEmojis ? '- Use appropriate emojis to enhance engagement' : ''}

Create a compelling caption that will drive engagement and resonate with the target audience.`

    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-micro-v1:0',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      }),
      contentType: 'application/json',
      accept: 'application/json'
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    const caption = responseBody.content?.[0]?.text || `${topic}${includeEmojis ? ' 🎵✨' : ''}${includeHashtags ? '\n\n#music #newrelease #artist' : ''}`

    return NextResponse.json({ 
      caption: caption.trim(),
      platform,
      success: true 
    })

  } catch (error) {
    console.error('Text generation error:', error)
    
    // Fallback response
    const { topic, includeEmojis, includeHashtags } = await request.json()
    const fallbackCaption = `${topic}${includeEmojis ? ' 🎵✨' : ''}${includeHashtags ? '\n\n#music #newrelease #artist' : ''}`
    
    return NextResponse.json({ 
      caption: fallbackCaption,
      success: false,
      error: 'Using fallback caption'
    })
  }
} 