/**
 * AWS Amplify Configuration Utilities
 * 
 * This file exports functions to help configure AWS services
 * for both local development and Amplify deployment environments.
 */

// Configure DynamoDB credentials and region explicitly for Amplify environments
const getAwsConfig = () => {
  // Check if we're in an Amplify environment
  const isAmplify = process.env.AWS_EXECUTION_ENV && process.env.AWS_EXECUTION_ENV.includes('AWS_Lambda');
  
  // Log environment details
  console.log(`[Amplify Config] Running in environment: ${isAmplify ? 'AWS Amplify' : 'Local Development'}`);
  console.log(`[Amplify Config] AWS_REGION: ${process.env.AWS_REGION || 'not set'}`);
  
  const config = {
    region: process.env.AWS_REGION || 'us-east-1',
  };
  
  // For local development, we might need to provide credentials explicitly
  if (!isAmplify && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log('[Amplify Config] Using local credentials from environment variables');
  } else if (isAmplify) {
    // In Amplify environment, the credentials are automatically provided
    console.log('[Amplify Config] Using AWS Amplify environment credentials');
  } else {
    console.log('[Amplify Config] Warning: No explicit credentials found. Using default credential provider chain');
  }
  
  return config;
};

module.exports = {
  getAwsConfig,
}; 