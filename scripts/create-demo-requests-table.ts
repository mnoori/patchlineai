import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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