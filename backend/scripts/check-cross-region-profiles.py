#!/usr/bin/env python3
"""
Check for cross-region inference profiles
"""

import boto3
import json
import os
from pathlib import Path

def load_env_file():
    """Load environment variables from .env.local file"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        print(f"📁 Loading environment variables from {env_file}...")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

def test_cross_region_profile(bedrock_runtime, profile_arn: str, profile_name: str):
    """Test if a cross-region profile works"""
    print(f"\n🧪 Testing {profile_name}...")
    print(f"   ARN: {profile_arn}")
    
    try:
        # Test with appropriate request format
        if 'claude' in profile_arn.lower():
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 50,
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": "Say hello in 5 words or less."}]
                    }
                ]
            }
        else:  # Nova
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": "Say hello in 5 words or less."}]
                    }
                ],
                "inferenceConfig": {
                    "max_new_tokens": 50
                }
            }
        
        response = bedrock_runtime.invoke_model(
            modelId=profile_arn,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(body)
        )
        
        response_body = json.loads(response['body'].read())
        
        # Extract text based on response format
        if 'completion' in response_body:
            text = response_body['completion']
        elif 'content' in response_body:
            text = response_body['content'][0]['text']
        elif 'output' in response_body:
            text = response_body['output']['message']['content'][0]['text']
        else:
            text = str(response_body)
        
        print(f"✅ Success! Response: {text.strip()}")
        return True, profile_arn
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Failed: {error_msg}")
        return False, None

def main():
    """Check cross-region inference profiles"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize Bedrock runtime client
    bedrock_runtime = boto3.client('bedrock-runtime', region_name=region)
    
    print("🚀 Checking Cross-Region Inference Profiles")
    print("="*50)
    print(f"📍 Region: {region}")
    
    # Common cross-region profile patterns based on the documentation
    # These are the system-defined cross-region profiles
    cross_region_profiles = [
        # Nova Premier
        {
            'name': 'US Nova Premier',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-premier-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.amazon.nova-premier-v1:0',
                'us.amazon.nova-premier-v1:0'
            ]
        },
        # Claude Sonnet 4
        {
            'name': 'US Claude Sonnet 4',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0',
                'us.anthropic.claude-sonnet-4-20250514-v1:0'
            ]
        },
        # Claude Opus 4
        {
            'name': 'US Claude Opus 4',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-opus-4-20250514-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-opus-4-20250514-v1:0',
                'us.anthropic.claude-opus-4-20250514-v1:0'
            ]
        },
        # Claude 3.7 Sonnet
        {
            'name': 'US Claude 3.7 Sonnet',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0',
                'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
            ]
        },
        # Claude 3.5 Sonnet v2
        {
            'name': 'US Claude 3.5 Sonnet v2',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
            ]
        },
        # Claude 3.5 Haiku
        {
            'name': 'US Claude 3.5 Haiku',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-5-haiku-20241022-v1:0',
                'us.anthropic.claude-3-5-haiku-20241022-v1:0'
            ]
        },
        # Claude 3 Opus
        {
            'name': 'US Claude 3 Opus',
            'arns': [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-opus-20240229-v1:0:inference-profile',
                'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-3-opus-20240229-v1:0',
                'us.anthropic.claude-3-opus-20240229-v1:0'
            ]
        }
    ]
    
    working_profiles = []
    
    print("\n🔍 Testing cross-region inference profiles...")
    
    for profile_info in cross_region_profiles:
        print(f"\n📋 {profile_info['name']}:")
        for arn in profile_info['arns']:
            success, working_arn = test_cross_region_profile(bedrock_runtime, arn, profile_info['name'])
            if success:
                working_profiles.append({
                    'name': profile_info['name'],
                    'arn': working_arn,
                    'model_base': profile_info['name'].replace('US ', '').replace(' ', '-').lower()
                })
                break  # Found working ARN, no need to test others
    
    # Save results
    output_file = Path(__file__).parent / 'cross-region-profiles.json'
    with open(output_file, 'w') as f:
        json.dump({
            'region': region,
            'working_profiles': working_profiles
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Print summary
    print("\n" + "="*50)
    print("📊 SUMMARY")
    print("="*50)
    
    if working_profiles:
        print(f"\n✅ Found {len(working_profiles)} working cross-region profiles:")
        for profile in working_profiles:
            print(f"\n   • {profile['name']}")
            print(f"     ARN: {profile['arn']}")
        
        print("\n📝 You can use these ARNs directly without creating custom profiles!")
        print("\nExample usage:")
        print(f"   bedrock_runtime.invoke_model(")
        print(f"       modelId='{working_profiles[0]['arn']}',")
        print(f"       ...")
        print(f"   )")
    else:
        print("\n❌ No working cross-region profiles found.")
        print("You may need to create custom application inference profiles.")

if __name__ == "__main__":
    main() 