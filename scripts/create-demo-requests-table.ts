import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error)
} else {
  console.log('✅ Loaded .env.local from:', envPath)
}

// Check for both AWS_ prefixed and non-prefixed versions
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
const region = process.env.AWS_REGION || process.env.REGION_AWS || 'us-east-1'

// Debug: Check if env vars are loaded
console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID)
console.log('ACCESS_KEY_ID exists:', !!process.env.ACCESS_KEY_ID)
console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY)
console.log('SECRET_ACCESS_KEY exists:', !!process.env.SECRET_ACCESS_KEY)
console.log('AWS_REGION:', region)

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Missing AWS credentials in environment variables!')
  console.error('Please ensure one of these sets is provided in .env.local:')
  console.error('  - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  console.error('  - ACCESS_KEY_ID and SECRET_ACCESS_KEY')
  process.exit(1)
}

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
})

async function createDemoRequestsTable() {
  const tableName = process.env.DEMO_REQUESTS_TABLE || 'DemoRequests-production'
  
  try {
    const command = new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }, // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'createdAt-index',
          KeySchema: [
            { AttributeName: 'createdAt', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'email-index',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      Tags: [
        { Key: 'Environment', Value: 'production' },
        { Key: 'Application', Value: 'patchline' },
      ],
    })

    const response = await client.send(command)
    console.log('✅ Demo Requests table created successfully:', tableName)
    console.log('Table ARN:', response.TableDescription?.TableArn)
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️ Table already exists:', tableName)
    } else {
      console.error('❌ Error creating table:', error)
      throw error
    }
  }
}

// Run the script
createDemoRequestsTable().catch(console.error) 