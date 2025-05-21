import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1"

export const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
) 