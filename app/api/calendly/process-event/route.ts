import { NextRequest, NextResponse } from "next/server"

// Process Calendly event and trigger agentic workflows
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, inviteeName, inviteeEmail, eventType, timestamp, answers } = body
    
    console.log('Processing Calendly event:', {
      eventId,
      inviteeName,
      inviteeEmail,
      eventType,
      timestamp
    })
    
    // Here you would:
    // 1. Store the event in your database
    // 2. Trigger ARIA to prepare personalized insights
    // 3. Send a welcome email with additional resources
    // 4. Add to CRM
    // 5. Schedule follow-up tasks
    
    // Example: Trigger ARIA to analyze the prospect
    const ariaAnalysis = await analyzeProspect(inviteeName, inviteeEmail, answers)
    
    // Example: Send to your CRM or notification system
    await notifyTeam({
      type: 'new_meeting_scheduled',
      prospect: {
        name: inviteeName,
        email: inviteeEmail,
        eventType,
        analysis: ariaAnalysis
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Event processed successfully',
      analysis: ariaAnalysis
    })
  } catch (error) {
    console.error('Error processing Calendly event:', error)
    return NextResponse.json(
      { error: 'Failed to process event' }, 
      { status: 500 }
    )
  }
}

// Analyze prospect using AI
async function analyzeProspect(name: string, email: string, answers: any) {
  // This would call your AI service to analyze the prospect
  // For now, return mock analysis
  return {
    role: detectRole(answers),
    interests: ['automation', 'AI agents', 'music tech'],
    recommendedFeatures: ['Scout Agent', 'Legal Agent', 'Metadata Agent'],
    talkingPoints: [
      'Show demo of playlist pitching automation',
      'Discuss ROI metrics from similar clients',
      'Highlight time savings for their specific role'
    ]
  }
}

// Detect role from answers
function detectRole(answers: any): string {
  if (!answers) return 'music professional'
  
  const answersStr = JSON.stringify(answers).toLowerCase()
  if (answersStr.includes('engineer') || answersStr.includes('developer')) return 'engineer'
  if (answersStr.includes('artist') || answersStr.includes('musician')) return 'artist'
  if (answersStr.includes('label') || answersStr.includes('a&r')) return 'label executive'
  if (answersStr.includes('manager')) return 'artist manager'
  if (answersStr.includes('investor')) return 'investor'
  
  return 'music professional'
}

// Notify team about new meeting
async function notifyTeam(data: any) {
  // This would send to Slack, email, or your notification system
  console.log('Notifying team:', data)
  
  // You could also trigger webhooks here
  // await fetch('https://hooks.slack.com/...', { ... })
  
  return true
} 