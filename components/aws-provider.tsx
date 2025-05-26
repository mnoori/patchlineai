"use client"

import { ReactNode, useEffect } from "react"
import { Amplify } from "aws-amplify"
import awsConfig from "@/aws-exports"

// This provider ensures Amplify is configured once on the client side.
export function AwsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only configure if the required fields are present to avoid runtime errors during dev
    if (awsConfig?.aws_project_region) {
      console.log("[AwsProvider] Configuring Amplify with region:", awsConfig.aws_project_region);
      
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: awsConfig.aws_user_pools_id,
            userPoolClientId: awsConfig.aws_user_pools_web_client_id,
          },
        },
      });
      
      console.log("[AwsProvider] Amplify configured successfully");
    } else {
      console.error("[AwsProvider] Missing required AWS configuration");
    }
  }, [])

  return <>{children}</>
}
