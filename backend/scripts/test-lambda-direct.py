import boto3
import json

# Initialize Lambda client
lambda_client = boto3.client('lambda', region_name='us-east-1')

# Test event that mimics what Bedrock Agent sends
test_event = {
    "actionGroup": "GmailActions",
    "apiPath": "/search-emails",
    "httpMethod": "POST",
    "parameters": {},
    "requestBody": {
        "content": {
            "application/json": {
                "query": "from:mehdi",
                "maxResults": 10
            }
        }
    },
    "sessionAttributes": {
        "userId": "14287408-6011-70b3-5ac6-089f0cafdc10"
    }
}

print("Testing Lambda function with event:")
print(json.dumps(test_event, indent=2))

try:
    # Invoke the Lambda function
    response = lambda_client.invoke(
        FunctionName='gmail-action-handler',
        InvocationType='RequestResponse',
        Payload=json.dumps(test_event)
    )
    
    # Parse the response
    response_payload = json.loads(response['Payload'].read())
    print("\nLambda Response:")
    print(json.dumps(response_payload, indent=2))
    
    # Check if there were any logs
    if 'LogResult' in response:
        import base64
        log_data = base64.b64decode(response['LogResult']).decode('utf-8')
        print("\nLambda Logs:")
        print(log_data)
        
except Exception as e:
    print(f"\nError invoking Lambda: {str(e)}")
    print(f"Error type: {type(e).__name__}") 