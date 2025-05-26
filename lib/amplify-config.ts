import { Amplify } from 'aws-amplify'
import awsConfig from '../aws-exports'

// Configure Amplify
Amplify.configure(awsConfig)

export { Amplify }
export default awsConfig 