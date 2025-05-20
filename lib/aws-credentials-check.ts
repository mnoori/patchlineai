/**
 * AWS Credentials Check Utility
 * 
 * A utility to check AWS credentials availability and provide debugging information
 * when running in AWS Amplify or other environments.
 */

import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AWS_REGION } from "./aws-config";

export interface CredentialCheckResult {
  available: boolean;
  message: string;
  details?: any;
  error?: Error;
}

/**
 * Checks if AWS credentials are available and provides detailed information
 * about the current AWS environment
 */
export async function checkAwsCredentials(): Promise<CredentialCheckResult> {
  try {
    // Check environment variables
    const hasAwsEnvVars = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    
    // Get available environment information
    const environmentInfo = {
      region: AWS_REGION,
      nodeEnv: process.env.NODE_ENV,
      awsRegion: process.env.AWS_REGION,
      hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
      isAmplifyEnv: !!process.env.AWS_EXECUTION_ENV?.includes('AWS_Lambda'),
      amplifyAppId: process.env.AWS_APP_ID,
      amplifyBranchName: process.env.AWS_BRANCH,
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('AWS_'))
    };
    
    // Try getting credentials from provider chain
    const credentialsProvider = fromNodeProviderChain({
      timeout: 1000 // Short timeout for quick feedback
    });
    
    const credentials = await credentialsProvider();
    
    if (credentials && credentials.accessKeyId) {
      return {
        available: true,
        message: "AWS credentials are available",
        details: {
          ...environmentInfo,
          credentialSource: hasAwsEnvVars ? "Environment Variables" : "AWS Provider Chain",
          hasValidCredentials: true
        }
      };
    } else {
      return {
        available: false,
        message: "No valid AWS credentials found",
        details: {
          ...environmentInfo,
          hasValidCredentials: false
        }
      };
    }
  } catch (error: any) {
    console.error("[AWS Credentials Check] Error checking credentials:", error);
    
    return {
      available: false,
      message: `Failed to get AWS credentials: ${error.message}`,
      details: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      },
      error
    };
  }
}

/**
 * Logs detailed information about the current AWS environment
 */
export async function logAwsEnvironmentInfo(): Promise<void> {
  try {
    const result = await checkAwsCredentials();
    
    console.log("===== AWS ENVIRONMENT INFO =====");
    console.log(`Credentials Available: ${result.available}`);
    console.log(`Message: ${result.message}`);
    console.log("Details:", JSON.stringify(result.details, null, 2));
    console.log("================================");
    
    return;
  } catch (error) {
    console.error("[AWS Environment Info] Failed to log AWS environment info:", error);
  }
} 