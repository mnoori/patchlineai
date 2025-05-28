#!/usr/bin/env python3
"""
Test access to various Bedrock models
"""

import boto3
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

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

def test_model(bedrock_runtime, model_id: str, model_name: str) -> Tuple[bool, str]:
    """Test if a model is accessible"""
    print(f"\n🧪 Testing {model_name} ({model_id})...")
    
    try:
        # Prepare request body based on model provider
        if model_id.startswith('anthropic'):
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 50,
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": "Say 'Hello, I am working!' in 5 words or less."}]
                    }
                ]
            }
        elif model_id.startswith('amazon.nova'):
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": "Say 'Hello, I am working!' in 5 words or less."}]
                    }
                ],
                "inferenceConfig": {
                    "max_new_tokens": 50
                }
            }
        else:
            body = {
                "prompt": "\n\nHuman: Say 'Hello, I am working!' in 5 words or less.\n\nAssistant:",
                "max_tokens_to_sample": 50
            }
        
        response = bedrock_runtime.invoke_model(
            modelId=model_id,
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
        return True, "accessible"
        
    except Exception as e:
        error_msg = str(e)
        if "ThrottlingException" in error_msg:
            return False, "rate_limited"
        elif "AccessDeniedException" in error_msg:
            return False, "access_denied"
        elif "ValidationException" in error_msg:
            return False, f"validation_error: {error_msg}"
        elif "ResourceNotFoundException" in error_msg:
            return False, "model_not_found"
        else:
            return False, f"error: {error_msg}"

def main():
    """Test access to various models"""
    load_env_file()
    
    region = os.environ.get('AWS_REGION', 'us-east-1')
    
    # Initialize Bedrock runtime client
    bedrock_runtime = boto3.client('bedrock-runtime', region_name=region)
    
    # Models to test
    models_to_test = [
        # Nova models
        ("amazon.nova-micro-v1:0", "Amazon Nova Micro"),
        ("amazon.nova-premier-v1:0", "Amazon Nova Premier"),
        
        # Claude 3 models
        ("anthropic.claude-3-sonnet-20240229-v1:0", "Claude 3 Sonnet"),
        ("anthropic.claude-3-5-sonnet-20241022-v2:0", "Claude 3.5 Sonnet v2"),
        ("anthropic.claude-3-5-haiku-20241022-v1:0", "Claude 3.5 Haiku"),
        ("anthropic.claude-3-opus-20240229-v1:0", "Claude 3 Opus"),
        
        # Claude 3.7 and 4 models (newer)
        ("anthropic.claude-3-7-sonnet-20250219-v1:0", "Claude 3.7 Sonnet"),
        ("anthropic.claude-sonnet-4-20250514-v1:0", "Claude 4 Sonnet"),
        ("anthropic.claude-opus-4-20250514-v1:0", "Claude 4 Opus"),
    ]
    
    print("🚀 Testing Bedrock Model Access")
    print("="*50)
    print(f"📍 Region: {region}")
    
    results = []
    accessible_models = []
    
    for model_id, model_name in models_to_test:
        success, status = test_model(bedrock_runtime, model_id, model_name)
        results.append((model_id, model_name, success, status))
        if success:
            accessible_models.append((model_id, model_name))
    
    # Print summary
    print("\n" + "="*50)
    print("📊 SUMMARY")
    print("="*50)
    
    print("\n✅ Accessible Models:")
    for model_id, model_name in accessible_models:
        print(f"   • {model_name} ({model_id})")
    
    print("\n❌ Inaccessible Models:")
    for model_id, model_name, success, status in results:
        if not success:
            print(f"   • {model_name} ({model_id}) - {status}")
    
    # Check for agent-compatible models
    print("\n🤖 Models suitable for Bedrock Agents:")
    agent_compatible = []
    for model_id, model_name in accessible_models:
        # Nova Micro and Claude models are typically agent-compatible
        if model_id.startswith('amazon.nova-micro') or model_id.startswith('anthropic.claude'):
            agent_compatible.append((model_id, model_name))
            print(f"   • {model_name} ({model_id})")
    
    if not agent_compatible:
        print("   ⚠️  No agent-compatible models found!")
    
    # Save results to file
    results_file = Path(__file__).parent / 'model-access-results.json'
    with open(results_file, 'w') as f:
        json.dump({
            'region': region,
            'accessible_models': [{'id': m[0], 'name': m[1]} for m in accessible_models],
            'all_results': [{'id': r[0], 'name': r[1], 'success': r[2], 'status': r[3]} for r in results]
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {results_file}")

if __name__ == "__main__":
    main() 