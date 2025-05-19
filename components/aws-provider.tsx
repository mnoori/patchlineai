"use client"

import { ReactNode, useEffect } from "react"
import { Amplify } from "aws-amplify"
import awsConfig from "@/aws-exports"

// This provider simply ensures Amplify is configured once on the client.
export function AwsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only configure if the required fields are present to avoid runtime errors during dev
    if (awsConfig?.aws_project_region) {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: awsConfig.aws_user_pools_id,
            userPoolClientId: awsConfig.aws_user_pools_web_client_id,
          },
        },
      })
    }
  }, [])

  return <>{children}</>
} 