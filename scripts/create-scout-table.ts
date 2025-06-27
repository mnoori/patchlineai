import { DynamoDBClient, CreateTableCommand, ScalarAttributeType, KeyType } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

async function createScoutWatchlistTable() {
  const tableName = 'ScoutWatchlist';
  
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'user_id', KeyType: KeyType.HASH },
      { AttributeName: 'artist_id', KeyType: KeyType.RANGE }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'artist_id', AttributeType: ScalarAttributeType.S }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    Tags: [
      { Key: 'Application', Value: 'Patchline' },
      { Key: 'Environment', Value: 'Production' }
    ]
  };

  try {
    console.log(`Creating ${tableName} table...`);
    const command = new CreateTableCommand(params);
    const response = await dynamoClient.send(command);
    console.log(`✅ Table ${tableName} created successfully!`);
    console.log('Table ARN:', response.TableDescription?.TableArn);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️ Table ${tableName} already exists`);
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

// Run the script
createScoutWatchlistTable().catch(console.error); 