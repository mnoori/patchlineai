#!/usr/bin/env python3
"""
Master deployment script for complete Patchline Bedrock Agent setup
"""

import subprocess
import sys
import os
from pathlib import Path

# Load environment variables from .env.local file
def load_env_file():
    """Load environment variables from .env.local file in project root"""
    # Go up two directories to reach project root from backend/scripts
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
        print("✅ Environment variables loaded from .env.local")
    else:
        print(f"⚠️  No .env.local file found at {env_file}")
        print("   Please create .env.local in your project root with required variables")

def run_script(script_name: str, description: str):
    """Run a deployment script"""
    print(f"\n🚀 {description}")
    print("=" * 60)
    
    script_path = Path(__file__).parent / script_name
    
    try:
        result = subprocess.run([
            sys.executable, str(script_path)
        ], check=True, capture_output=False)
        
        print(f"✅ {description} completed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False

def check_environment():
    """Check required environment variables"""
    # Map the variables to what might be in your .env.local
    required_vars = {
        'AWS_REGION': ['AWS_REGION', 'REGION_AWS'],
        'AWS_ACCESS_KEY_ID': ['AWS_ACCESS_KEY_ID', 'ACCESS_KEY_ID'],
        'AWS_SECRET_ACCESS_KEY': ['AWS_SECRET_ACCESS_KEY', 'SECRET_ACCESS_KEY'],
        'GMAIL_CLIENT_ID': ['GMAIL_CLIENT_ID', 'GOOGLE_CLIENT_ID'],
        'GMAIL_CLIENT_SECRET': ['GMAIL_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'],
        'GMAIL_REDIRECT_URI': ['GMAIL_REDIRECT_URI', 'GOOGLE_REDIRECT_URI']
    }
    
    missing_vars = []
    found_vars = {}
    
    for standard_name, possible_names in required_vars.items():
        value = None
        for name in possible_names:
            value = os.environ.get(name)
            if value:
                # Set the standard name if it's not already set
                if not os.environ.get(standard_name):
                    os.environ[standard_name] = value
                found_vars[standard_name] = value
                break
        
        if not value:
            missing_vars.append(f"{standard_name} (or {', '.join(possible_names)})")
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease add these variables to your .env.local file and try again.")
        return False
    
    print("✅ All required environment variables are set:")
    for var, value in found_vars.items():
        # Mask sensitive values
        if 'SECRET' in var or 'KEY' in var:
            masked_value = value[:8] + '...' if len(value) > 8 else '***'
            print(f"   ✓ {var}={masked_value}")
        else:
            print(f"   ✓ {var}={value}")
    
    return True

def main():
    """Main deployment orchestrator"""
    print("🎵 Patchline Bedrock Agent - Complete Deployment")
    print("=" * 60)
    print("This script will deploy everything needed for the Gmail Agent:")
    print("1. Lambda functions (gmail-auth-handler, gmail-action-handler)")
    print("2. Supporting AWS resources (DynamoDB, S3, Secrets)")
    print("3. Bedrock Agent with action groups and knowledge base")
    print("4. Environment configuration")
    
    # Load environment variables from .env.local
    load_env_file()
    
    # Check environment
    print("\n📋 Checking environment...")
    if not check_environment():
        sys.exit(1)
    
    # Confirm deployment
    response = input("\n🤔 Ready to deploy? This will create AWS resources. (y/N): ")
    if response.lower() != 'y':
        print("Deployment cancelled.")
        sys.exit(0)
    
    # Step 1: Deploy Lambda functions
    if not run_script('deploy-lambda-functions.py', 'Deploying Lambda Functions'):
        print("❌ Lambda deployment failed. Stopping.")
        sys.exit(1)
    
    # Step 2: Create Bedrock Agent
    if not run_script('create-bedrock-agent.py', 'Creating Bedrock Agent'):
        print("❌ Bedrock Agent creation failed. Stopping.")
        sys.exit(1)
    
    # Success!
    print("\n" + "🎉" * 20)
    print("🎵 PATCHLINE BEDROCK AGENT DEPLOYED SUCCESSFULLY! 🎵")
    print("🎉" * 20)
    print("\n📋 What's been created:")
    print("✅ Gmail Lambda functions")
    print("✅ DynamoDB table for OAuth tokens")
    print("✅ S3 bucket for knowledge base")
    print("✅ Secrets Manager for Gmail credentials")
    print("✅ Bedrock Agent with Gmail actions")
    print("✅ Knowledge base for email context")
    print("\n📋 Next steps:")
    print("1. Copy the BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID to your .env.local")
    print("2. Test the Gmail OAuth flow in your app")
    print("3. Try asking the agent about your emails!")
    print("\n🎸 Rock on! Your AI assistant is ready to help manage your music career!")

if __name__ == '__main__':
    main()