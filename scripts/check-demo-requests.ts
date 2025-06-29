import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

async function checkDemoRequests() {
  const tableName = process.env.DEMO_REQUESTS_TABLE || 'DemoRequests-production'
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'NEW',
      },
    })

    const response = await docClient.send(command)
    
    if (response.Items && response.Items.length > 0) {
      console.log(`\n📬 You have ${response.Items.length} new demo request(s):\n`)
      
      response.Items.forEach((item, index) => {
        console.log(`--- Request ${index + 1} ---`)
        console.log(`Name: ${item.name}`)
        console.log(`Email: ${item.email}`)
        console.log(`Company: ${item.company}`)
        console.log(`Role: ${item.role}`)
        console.log(`Message: ${item.message}`)
        console.log(`Newsletter: ${item.newsletter ? 'Yes' : 'No'}`)
        console.log(`Submitted: ${new Date(item.createdAt).toLocaleString()}`)
        console.log(`ID: ${item.id}`)
        console.log('')
      })
    } else {
      console.log('✅ No new demo requests at this time.')
    }
  } catch (error) {
    console.error('❌ Error checking demo requests:', error)
  }
}

// Run the script
checkDemoRequests().catch(console.error) 