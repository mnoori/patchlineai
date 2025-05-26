import { Amplify } from 'aws-amplify'

// Production-safe Amplify configuration
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    }
  }
}

// Only configure if we have the required environment variables
if (process.env.NEXT_PUBLIC_USER_POOL_ID && process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID) {
  Amplify.configure(amplifyConfig)
} else {
  console.warn('Amplify configuration missing. Please set NEXT_PUBLIC_USER_POOL_ID and NEXT_PUBLIC_USER_POOL_CLIENT_ID environment variables.')
}

export { Amplify }
export default amplifyConfig 