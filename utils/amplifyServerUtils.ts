import { createServerRunner } from '@aws-amplify/adapter-nextjs'
import { getCurrentUser } from 'aws-amplify/auth/server'
import { cookies } from 'next/headers'
import config from '@/aws-exports'

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
})

export async function getAuthenticatedUser() {
  try {
    return await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    })
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
} 