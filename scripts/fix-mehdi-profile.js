#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

async function fixMehdiProfile() {
  console.log('🔧 Fixing ALGORYX Artist Profile for Mehdi')
  console.log('==========================================\n')

  const userId = '14287408-6011-70b3-5ac6-089f0cafdc10'
  console.log(`User ID: ${userId}`)

  // Initialize DynamoDB client
  const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.REGION_AWS || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
    },
  })
  const docClient = DynamoDBDocumentClient.from(dynamoClient)

  const PLATFORM_CONNECTIONS_TABLE = process.env.PLATFORM_CONNECTIONS_TABLE || 'PlatformConnections-staging'

  try {
    console.log('📝 Storing ALGORYX artist profile (overwriting any existing profile)...')
    
    // Store ALGORYX artist profile
    await docClient.send(
      new PutCommand({
        TableName: PLATFORM_CONNECTIONS_TABLE,
        Item: {
          userId: userId,
          provider: 'spotify-artist-profile',
          artistId: '7ibWrazAoXwtMpiwDlpZ9k',
          artistName: 'ALGORYX',
          spotifyUrl: 'https://open.spotify.com/artist/7ibWrazAoXwtMpiwDlpZ9k',
          storedAt: Date.now(),
          updatedAt: Date.now()
        }
      })
    )

    console.log('✅ ALGORYX artist profile restored successfully!')
    console.log('🎯 Artist ID: 7ibWrazAoXwtMpiwDlpZ9k')
    console.log('🎵 Artist Name: ALGORYX')
    console.log('🔗 Spotify URL: https://open.spotify.com/artist/7ibWrazAoXwtMpiwDlpZ9k')
    console.log('\n🎉 The wrong profile has been overwritten. Your ALGORYX tracks should now show up correctly!')
    console.log('\n⚠️  IMPORTANT: The automatic profile storage has been disabled, so this won\'t happen again.')

  } catch (error) {
    console.error('❌ Error storing artist profile:', error)
  }
}

// Run the fix
fixMehdiProfile() 