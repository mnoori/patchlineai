import boto3
import json
from pprint import pprint

# Initialize AWS clients
lambda_client = boto3.client('lambda', region_name='us-east-1')
iam_client = boto3.client('iam')

print("🔐 Lambda Permissions Checker")
print("=" * 60)

function_name = 'gmail-action-handler'

print(f"\n1️⃣ Checking Lambda function configuration...")
try:
    # Get function configuration
    func_config = lambda_client.get_function_configuration(FunctionName=function_name)
    
    print(f"   Function ARN: {func_config['FunctionArn']}")
    print(f"   Role: {func_config['Role']}")
    
    role_name = func_config['Role'].split('/')[-1]
    print(f"   Role Name: {role_name}")
    
except Exception as e:
    print(f"   ❌ Error getting function config: {str(e)}")
    exit(1)

print(f"\n2️⃣ Checking IAM role policies...")
try:
    # Get role details
    role = iam_client.get_role(RoleName=role_name)
    print(f"   Role ARN: {role['Role']['Arn']}")
    
    # List attached policies
    attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
    print("\n   Attached Managed Policies:")
    for policy in attached_policies['AttachedPolicies']:
        print(f"   - {policy['PolicyName']}")
        
    # List inline policies
    inline_policies = iam_client.list_role_policies(RoleName=role_name)
    print("\n   Inline Policies:")
    for policy_name in inline_policies['PolicyNames']:
        print(f"   - {policy_name}")
        
        # Get the inline policy document
        policy_doc = iam_client.get_role_policy(
            RoleName=role_name,
            PolicyName=policy_name
        )
        
        print(f"\n   Policy Document for {policy_name}:")
        print(json.dumps(policy_doc['PolicyDocument'], indent=2))
        
except Exception as e:
    print(f"   ❌ Error checking role: {str(e)}")

print(f"\n3️⃣ Checking if Lambda has Secrets Manager permissions...")

# Check for specific Secrets Manager permissions
required_actions = [
    'secretsmanager:GetSecretValue',
    'secretsmanager:DescribeSecret'
]

print("\n   Required Actions:")
for action in required_actions:
    print(f"   - {action}")

print("\n4️⃣ Testing Secrets Manager access from Lambda environment...")

# Create a test event that will make the Lambda check its permissions
test_event = {
    "test": "permissions_check"
}

print("\n   Note: To fully test permissions, run the diagnose-gmail-auth.py script.")
print("   It will attempt to access the secret and show any permission errors.")

print("\n" + "=" * 60)
print("📊 RECOMMENDATIONS")
print("=" * 60)

print("\nIf the Lambda doesn't have Secrets Manager permissions, add this policy:")
print("""
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:366218382497:secret:patchline/gmail-oauth-*"
        }
    ]
}
""") 