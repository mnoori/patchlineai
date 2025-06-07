import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb'
import { CONFIG } from '../lib/config'

const dynamoDB = new DynamoDBClient({
  region: CONFIG.AWS_REGION,
  credentials: {
    accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
  },
})

async function createSupervisorTable() {
  const tableName = CONFIG.ENV === 'production' ? 'SupervisorInteractions-prod' : 'SupervisorInteractions-staging'
  
  console.log(`Creating DynamoDB table: ${tableName}...`)
  
  try {
    await dynamoDB.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'sessionId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'sessionId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true
      }
    }))
    
    console.log(`✅ Table ${tableName} created successfully!`)
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️ Table ${tableName} already exists`)
    } else {
      console.error('❌ Error creating table:', error)
      throw error
    }
  }
}

createSupervisorTable().catch(console.error) 