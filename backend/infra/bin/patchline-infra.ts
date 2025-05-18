import "source-map-support/register"
import { App } from "aws-cdk-lib"
import { PatchlineCoreStack } from "../lib/patchline-stack.js"

const app = new App()

// Environment params can be overridden by CDK context or env vars
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
}

new PatchlineCoreStack(app, "PatchlineCoreStack", { env }) 