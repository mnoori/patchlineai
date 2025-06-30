import os
import boto3
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)

print(f"Loading environment from: {env_path}")
print(f"AWS_ACCESS_KEY_ID: {os.getenv('AWS_ACCESS_KEY_ID')[:10] if os.getenv('AWS_ACCESS_KEY_ID') else 'NOT FOUND'}...")
print(f"AWS_SECRET_ACCESS_KEY: {'***' if os.getenv('AWS_SECRET_ACCESS_KEY') else 'NOT FOUND'}")
print(f"AWS_REGION: {os.getenv('AWS_REGION', 'us-east-1')}")

# Test S3 connection
try:
    aws_config = {
        'region_name': os.getenv('AWS_REGION', 'us-east-1'),
        'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID'),
        'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY')
    }
    
    s3_client = boto3.client('s3', **aws_config)
    response = s3_client.list_buckets()
    print(f"\n✓ AWS connection successful! Found {len(response['Buckets'])} buckets")
    
    # Check for the tax documents bucket
    bucket_names = [b['Name'] for b in response['Buckets']]
    if 'patchline-documents-dev' in bucket_names:
        print("✓ Found patchline-documents-dev bucket")
    else:
        print("! Warning: patchline-documents-dev bucket not found")
        print(f"  Available buckets: {', '.join(bucket_names[:3])}...")
        
except Exception as e:
    print(f"\n✗ AWS connection failed: {str(e)}")
    print("\nPlease check:")
    print("1. Your .env.local file has AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    print("2. The credentials have the necessary permissions")
    print("3. The AWS region is correct") 