#!/usr/bin/env python3
"""
List available Bedrock inference profiles
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

def main():
    """List inference profiles"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize Bedrock client
    bedrock = boto3.client('bedrock', region_name=region)
    
    print("🚀 Listing Bedrock Inference Profiles")
    print("="*50)
    print(f"📍 Region: {region}")
    
    try:
        # List inference profiles
        response = bedrock.list_inference_profiles()
        profiles = response.get('inferenceProfileSummaries', [])
        
        if not profiles:
            print("\n❌ No inference profiles found!")
            print("\n💡 You may need to:")
            print("   1. Enable model access in AWS Bedrock console")
            print("   2. Create inference profiles for the models you want to use")
            return
        
        print(f"\n📋 Found {len(profiles)} inference profiles:\n")
        
        # Group by model
        profiles_by_model = {}
        
        for profile in profiles:
            profile_id = profile.get('inferenceProfileId', '')
            profile_name = profile.get('inferenceProfileName', '')
            model_id = profile.get('models', [{}])[0].get('modelId', '') if profile.get('models') else ''
            status = profile.get('status', '')
            profile_type = profile.get('type', '')
            
            print(f"🔹 Profile: {profile_name}")
            print(f"   ID: {profile_id}")
            print(f"   Model: {model_id}")
            print(f"   Type: {profile_type}")
            print(f"   Status: {status}")
            print()
            
            # Store for later use
            if model_id not in profiles_by_model:
                profiles_by_model[model_id] = []
            profiles_by_model[model_id].append({
                'id': profile_id,
                'name': profile_name,
                'type': profile_type,
                'status': status
            })
        
        # Save to file for reference
        output_file = Path(__file__).parent / 'inference-profiles.json'
        with open(output_file, 'w') as f:
            json.dump({
                'region': region,
                'profiles': profiles,
                'profiles_by_model': profiles_by_model
            }, f, indent=2)
        
        print(f"\n💾 Saved to: {output_file}")
        
        # Print usage examples
        print("\n📝 Usage Examples:")
        print("\nFor direct model invocation, use the profile ID instead of model ID:")
        
        for model_id, model_profiles in profiles_by_model.items():
            if model_profiles:
                profile = model_profiles[0]  # Use first available profile
                print(f"\n# Instead of: {model_id}")
                print(f"# Use: {profile['id']}")
        
    except Exception as e:
        print(f"\n❌ Error listing inference profiles: {str(e)}")
        print("\n💡 Make sure you have the necessary permissions:")
        print('   "bedrock:ListInferenceProfiles"')

if __name__ == "__main__":
    main() 