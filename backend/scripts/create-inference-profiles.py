#!/usr/bin/env python3
"""
Create inference profiles for Bedrock models
"""

import boto3
import json
import os
import time
from pathlib import Path
from typing import Dict, List

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

def create_inference_profile(bedrock_client, model_id: str, profile_name: str, description: str) -> Dict:
    """Create an inference profile for a model"""
    try:
        print(f"\n🔄 Creating inference profile: {profile_name}")
        print(f"   Model: {model_id}")
        
        response = bedrock_client.create_inference_profile(
            inferenceProfileName=profile_name,
            modelSource={
                'copyFrom': model_id
            },
            description=description
        )
        
        profile_arn = response['inferenceProfileArn']
        print(f"✅ Created: {profile_arn}")
        
        return {
            'name': profile_name,
            'arn': profile_arn,
            'model_id': model_id,
            'status': 'created'
        }
        
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg:
            print(f"⚠️  Profile already exists: {profile_name}")
            # Try to get existing profile
            try:
                profiles = bedrock_client.list_inference_profiles()
                for profile in profiles.get('inferenceProfileSummaries', []):
                    if profile.get('inferenceProfileName') == profile_name:
                        return {
                            'name': profile_name,
                            'arn': profile.get('inferenceProfileArn', ''),
                            'model_id': model_id,
                            'status': 'existing'
                        }
            except:
                pass
        else:
            print(f"❌ Failed to create profile: {error_msg}")
        
        return {
            'name': profile_name,
            'arn': None,
            'model_id': model_id,
            'status': 'failed',
            'error': error_msg
        }

def main():
    """Create inference profiles for models"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize Bedrock client
    bedrock = boto3.client('bedrock', region_name=region)
    
    print("🚀 Creating Bedrock Inference Profiles")
    print("="*50)
    print(f"📍 Region: {region}")
    
    # Define models that need inference profiles
    models_to_profile = [
        {
            'model_id': 'amazon.nova-premier-v1:0',
            'profile_name': 'patchline-nova-premier',
            'description': 'Patchline Nova Premier inference profile'
        },
        {
            'model_id': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'profile_name': 'patchline-claude-3-5-sonnet-v2',
            'description': 'Patchline Claude 3.5 Sonnet v2 inference profile'
        },
        {
            'model_id': 'anthropic.claude-3-5-haiku-20241022-v1:0',
            'profile_name': 'patchline-claude-3-5-haiku',
            'description': 'Patchline Claude 3.5 Haiku inference profile'
        },
        {
            'model_id': 'anthropic.claude-3-opus-20240229-v1:0',
            'profile_name': 'patchline-claude-3-opus',
            'description': 'Patchline Claude 3 Opus inference profile'
        },
        {
            'model_id': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
            'profile_name': 'patchline-claude-3-7-sonnet',
            'description': 'Patchline Claude 3.7 Sonnet inference profile'
        },
        {
            'model_id': 'anthropic.claude-sonnet-4-20250514-v1:0',
            'profile_name': 'patchline-claude-4-sonnet',
            'description': 'Patchline Claude 4 Sonnet inference profile'
        },
        {
            'model_id': 'anthropic.claude-opus-4-20250514-v1:0',
            'profile_name': 'patchline-claude-4-opus',
            'description': 'Patchline Claude 4 Opus inference profile'
        }
    ]
    
    created_profiles = []
    
    for model_config in models_to_profile:
        profile = create_inference_profile(
            bedrock,
            model_config['model_id'],
            model_config['profile_name'],
            model_config['description']
        )
        created_profiles.append(profile)
        time.sleep(1)  # Avoid rate limiting
    
    # Save results
    output_file = Path(__file__).parent / 'created-inference-profiles.json'
    with open(output_file, 'w') as f:
        json.dump({
            'region': region,
            'profiles': created_profiles,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Print summary
    print("\n" + "="*50)
    print("📊 SUMMARY")
    print("="*50)
    
    successful = [p for p in created_profiles if p['arn']]
    failed = [p for p in created_profiles if not p['arn']]
    
    if successful:
        print(f"\n✅ Successfully created/found {len(successful)} profiles:")
        for profile in successful:
            print(f"   • {profile['name']}")
            print(f"     ARN: {profile['arn']}")
    
    if failed:
        print(f"\n❌ Failed to create {len(failed)} profiles:")
        for profile in failed:
            print(f"   • {profile['name']} - {profile.get('error', 'Unknown error')}")
    
    # Update config.py with inference profile ARNs
    if successful:
        print("\n📝 Next steps:")
        print("1. Update your config.py to use these inference profile ARNs")
        print("2. Use the ARNs instead of model IDs in your code")
        print("\nExample usage:")
        print(f"   bedrock_runtime.invoke_model(")
        print(f"       modelId='{successful[0]['arn']}',  # Use ARN instead of model ID")
        print(f"       ...")
        print(f"   )")

if __name__ == "__main__":
    main() 