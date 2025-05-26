#!/usr/bin/env node

/**
 * AWS Credentials Checker
 * 
 * This script helps diagnose AWS credential issues by:
 * 1. Checking for AWS credentials in the environment
 * 2. Attempting to list DynamoDB tables to validate the credentials
 * 
 * Run this script with: node check-aws-credentials.mjs
 */

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local if it exists
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: join(__dirname, '.env.local') });
  console.log('✅ Loaded environment from .env.local');
} catch (error) {
  console.log('❌ Could not load .env.local file:', error.message);
}

// Check for AWS credentials
console.log('\n--- AWS Credentials Check ---');
console.log('AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'EXISTS' : 'MISSING');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'EXISTS' : 'MISSING');
console.log('AWS_SESSION_TOKEN:', process.env.AWS_SESSION_TOKEN ? 'EXISTS' : 'NOT NEEDED UNLESS USING TEMPORARY CREDENTIALS');

// Attempt to connect to AWS
console.log('\n--- Testing AWS Connectivity ---');
const region = process.env.AWS_REGION || 'us-east-1';
console.log(`Using region: ${region}`);

try {
  const ddbClient = new DynamoDBClient({ region });
  console.log('✅ DynamoDB client initialized');
  
  console.log('Attempting to list DynamoDB tables...');
  const command = new ListTablesCommand({});
  const response = await ddbClient.send(command);
  
  console.log('✅ Successfully connected to AWS DynamoDB!');
  console.log(`Found ${response.TableNames.length} tables:`);
  response.TableNames.forEach(table => console.log(` - ${table}`));
  
  // Check for specific tables
  const requiredTables = [
    process.env.USERS_TABLE || 'Users-staging',
    process.env.EMBEDS_TABLE || 'Embeds-staging',
    process.env.BLOG_POSTS_TABLE || 'BlogPosts-staging',
    process.env.CONTENT_DRAFTS_TABLE || 'ContentDrafts-staging'
  ];
  
  console.log('\nChecking for required tables:');
  requiredTables.forEach(table => {
    if (response.TableNames.includes(table)) {
      console.log(`✅ Found table: ${table}`);
    } else {
      console.log(`❌ Missing table: ${table}`);
    }
  });
  
} catch (error) {
  console.log('❌ AWS Connection Error:', error.message);
  console.log('\nPossible issues:');
  console.log('1. Invalid or expired AWS credentials');
  console.log('2. AWS IAM user lacks permissions for DynamoDB');
  console.log('3. AWS Region mismatch');
  console.log('4. Network connectivity issues');
}

console.log('\n--- Next Steps ---');
console.log('1. Create a .env.local file in your project root with your AWS credentials');
console.log('2. Make sure the credentials have appropriate permissions for DynamoDB');
console.log('3. Restart your Next.js development server with: pnpm dev');
