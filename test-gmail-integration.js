/**
 * Test script for Gmail integration
 * 
 * This script tests the Gmail API endpoints to ensure they work correctly.
 * Run this after connecting your Gmail account through the UI.
 */

const BASE_URL = 'http://localhost:3000'

// Replace with your actual user ID
const TEST_USER_ID = '14287408-6011-70b3-5ac6-089f0cafdc10'

async function testGmailEndpoints() {
  console.log('🧪 Testing Gmail Integration Endpoints...\n')

  try {
    // Test 1: List recent emails
    console.log('📧 Testing: List recent emails')
    const emailsResponse = await fetch(`${BASE_URL}/api/gmail/list-emails?userId=${TEST_USER_ID}&limit=5`)
    
    if (emailsResponse.ok) {
      const emailsData = await emailsResponse.json()
      console.log('✅ List emails successful')
      console.log(`   Found ${emailsData.emails?.length || 0} emails`)
      console.log(`   Total emails: ${emailsData.total}`)
      
      if (emailsData.emails && emailsData.emails.length > 0) {
        console.log('   Sample email:')
        const sample = emailsData.emails[0]
        console.log(`     Subject: ${sample.subject}`)
        console.log(`     From: ${sample.from}`)
        console.log(`     Date: ${sample.date}`)
      }
    } else {
      const error = await emailsResponse.text()
      console.log('❌ List emails failed:', error)
    }

    console.log('')

    // Test 2: List drafts
    console.log('📝 Testing: List drafts')
    const draftsResponse = await fetch(`${BASE_URL}/api/gmail/list-drafts?userId=${TEST_USER_ID}&limit=5`)
    
    if (draftsResponse.ok) {
      const draftsData = await draftsResponse.json()
      console.log('✅ List drafts successful')
      console.log(`   Found ${draftsData.drafts?.length || 0} drafts`)
      
      if (draftsData.drafts && draftsData.drafts.length > 0) {
        console.log('   Sample draft:')
        const sample = draftsData.drafts[0]
        console.log(`     Subject: ${sample.subject}`)
        console.log(`     To: ${sample.to}`)
        console.log(`     Draft ID: ${sample.id}`)
      }
    } else {
      const error = await draftsResponse.text()
      console.log('❌ List drafts failed:', error)
    }

    console.log('')

    // Test 3: Create a draft email
    console.log('✉️ Testing: Create draft email')
    const draftPayload = {
      userId: TEST_USER_ID,
      to: 'test@example.com',
      subject: 'Test Draft from Patchline',
      body: '<h1>Hello from Patchline!</h1><p>This is a test draft created by the Gmail integration.</p>',
      isHtml: true
    }

    const createDraftResponse = await fetch(`${BASE_URL}/api/gmail/draft-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload)
    })

    if (createDraftResponse.ok) {
      const draftResult = await createDraftResponse.json()
      console.log('✅ Create draft successful')
      console.log(`   Draft ID: ${draftResult.draftId}`)
      console.log(`   Message ID: ${draftResult.messageId}`)
      
      // Store draft ID for potential cleanup
      global.testDraftId = draftResult.draftId
    } else {
      const error = await createDraftResponse.text()
      console.log('❌ Create draft failed:', error)
    }

    console.log('')
    console.log('🎉 Gmail integration test completed!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Check your Gmail drafts to see the test draft')
    console.log('2. Try connecting Gmail through the Settings page')
    console.log('3. Use the draft and send email endpoints in your application')
    console.log('')
    console.log('⚠️  Note: Replace TEST_USER_ID with your actual user ID')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Make sure your development server is running on port 3000')
    console.log('2. Ensure Gmail is connected for the test user')
    console.log('3. Check that GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in .env.local')
    console.log('4. Verify the user ID is correct')
  }
}

// Run the test
testGmailEndpoints() 