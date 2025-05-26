import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const TABLE_NAME = 'PlatformConnections-staging'

async function createTable() {
  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }))
      console.log(`✅ Table ${TABLE_NAME} already exists`)
      return
    } catch (error) {
      // Table doesn't exist, continue to create it
    }

    // Create table
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }, // Partition key
        { AttributeName: 'provider', KeyType: 'RANGE' }, // Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'provider', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      Tags: [
        { Key: 'Environment', Value: 'staging' },
        { Key: 'Application', Value: 'PatchlineAI' },
      ],
    })

    const response = await client.send(command)
    console.log('✅ Table created successfully:', TABLE_NAME)
    console.log('Table ARN:', response.TableDescription.TableArn)
  } catch (error) {
    console.error('❌ Error creating table:', error)
  }
}

// Run the script
createTable() 