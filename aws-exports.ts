// Placeholder AWS Amplify configuration.
// Replace these values by running `amplify pull --appId YOUR_APP_ID --envName YOUR_ENV` once you finish setting up Auth in the Amplify Console/CLI.

const awsConfig = {
  aws_project_region: "us-east-1",
  aws_cognito_region: "us-east-1",
  aws_user_pools_id: "us-east-1_GR9FnEy6A",
  aws_user_pools_web_client_id: "3fvlab6j9ioag5ce7r90fkjm78",
  // OAuth is not required for basic email/password flows.
  oauth: undefined,
}

export default awsConfig
