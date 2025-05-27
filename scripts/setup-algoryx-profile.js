#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb')
const readline = require('readline')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🎵 ALGORYX Artist Profile Setup')
  console.log('==============================\n')

  // Check if user ID is provided as command line argument
  const userIdArg = process.argv[2]
  
  let userId
  if (userIdArg) {
    userId = userIdArg
    console.log(`Using provided user ID: ${userId}`)
  } else {
    // Use development user ID by default
    const defaultUserId = 'dev-user-123'
    console.log(`Using development user ID: ${defaultUserId}`)
    console.log('(This is the default user ID for development mode)\n')
    
    const useDefault = await question(`Use default user ID "${defaultUserId}"? (Y/n): `)
    
    userId = defaultUserId
    if (useDefault.toLowerCase() === 'n') {
      userId = await question('Enter your custom user ID: ')
      if (!userId) {
        console.log('❌ User ID is required')
        rl.close()
        return
      }
    }
  }

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
    console.log('📝 Storing ALGORYX artist profile...')
    
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

    console.log('✅ ALGORYX artist profile stored successfully!')
    console.log('🎯 Artist ID: 7ibWrazAoXwtMpiwDlpZ9k')
    console.log('🎵 Artist Name: ALGORYX')
    console.log('🔗 Spotify URL: https://open.spotify.com/artist/7ibWrazAoXwtMpiwDlpZ9k')
    console.log('\nNow when you connect to Spotify, your tracks will show up correctly! 🎉')

  } catch (error) {
    console.error('❌ Error storing artist profile:', error)
  }

  rl.close()
}

main().catch(console.error) 