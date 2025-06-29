import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Check for both AWS_ prefixed and non-prefixed versions
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
const region = process.env.AWS_REGION || process.env.REGION_AWS || 'us-east-1'

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Missing AWS credentials!')
  process.exit(1)
}

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

async function checkDemoRequests() {
  const tableName = process.env.DEMO_REQUESTS_TABLE || 'DemoRequests-production'
  
  try {
    console.log(`📊 Checking demo requests in table: ${tableName}\n`)
    
    const response = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    )
    
    if (!response.Items || response.Items.length === 0) {
      console.log('No demo requests found yet.')
      return
    }
    
    console.log(`Found ${response.Items.length} demo request(s):\n`)
    
    response.Items.forEach((item, index) => {
      console.log(`Demo Request #${index + 1}:`)
      console.log('================')
      console.log(`ID: ${item.id}`)
      console.log(`Name: ${item.name}`)
      console.log(`Email: ${item.email}`)
      console.log(`Company: ${item.company}`)
      console.log(`Role: ${item.role}`)
      console.log(`Message: ${item.message}`)
      console.log(`Newsletter: ${item.newsletter ? 'Yes' : 'No'}`)
      console.log(`Created: ${new Date(item.createdAt).toLocaleString()}`)
      console.log(`Status: ${item.status}`)
      console.log('\n')
    })
    
  } catch (error: any) {
    console.error('❌ Error checking demo requests:', error.message)
  }
}

// Run the script
checkDemoRequests() 