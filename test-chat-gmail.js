/**
 * Test script for Chat API with Gmail integration
 * 
 * This script tests the chat API to ensure it can query Gmail and provide contextual responses.
 */

const BASE_URL = 'http://localhost:3000'
const TEST_USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10'

async function testChatWithGmail() {
  console.log('🤖 Testing Chat API with Gmail Integration...\n')

  const testQueries = [
    {
      name: 'General Chat Query',
      message: 'Hello, how can you help me with my music business?',
      expectsGmail: false
    },
    {
      name: 'Spotify Artist Profile Query',
      message: 'Tell me about what happened with my Spotify artist profile?',
      expectsGmail: true
    },
    {
      name: 'Email Summary Query',
      message: 'What important emails have I received recently?',
      expectsGmail: true
    },
    {
      name: 'Music Distribution Query',
      message: 'Any updates on my music distribution or artist profile setup?',
      expectsGmail: true
    }
  ]

  for (const query of testQueries) {
    console.log(`📝 Testing: ${query.name}`)
    console.log(`   Query: "${query.message}"`)
    
    try {
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query.message,
          userId: TEST_USER_ID,
          mode: 'chat'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Chat response received')
        console.log(`   Response length: ${data.response.length} characters`)
        console.log(`   Used Gmail context: ${data.hasEmailContext ? 'Yes' : 'No'}`)
        
        if (data.hasEmailContext) {
          console.log(`   Emails analyzed: ${data.emailCount}`)
        }
        
        if (query.expectsGmail && !data.hasEmailContext) {
          console.log('⚠️  Expected Gmail context but none was used')
        }
        
        // Show first 200 characters of response
        console.log(`   Preview: "${data.response.substring(0, 200)}${data.response.length > 200 ? '...' : ''}"`)
        
      } else {
        const error = await response.text()
        console.log('❌ Chat request failed:', error)
      }
    } catch (error) {
      console.log('❌ Error:', error.message)
    }
    
    console.log('')
  }

  console.log('🎉 Chat API test completed!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. Try the chat interface in the dashboard')
  console.log('2. Ask questions about your Spotify artist profile')
  console.log('3. Request email summaries and analysis')
  console.log('4. Test different types of music business queries')
  console.log('')
  console.log('💡 Example queries to try:')
  console.log('- "What happened with my Spotify artist profile?"')
  console.log('- "Summarize my recent emails about music distribution"')
  console.log('- "Any important updates I should know about?"')
  console.log('- "Help me understand my recent email communications"')
}

// Run the test
testChatWithGmail() 