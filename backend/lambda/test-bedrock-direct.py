#!/usr/bin/env python3
"""
Direct test of Bedrock invocation for Gmail receipt processing
"""

import os
import sys
import json

# Setup path for imports
scripts_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts')
sys.path.append(scripts_path)

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env.local')
if os.path.exists(env_path):
    print(f"Loading environment from: {env_path}")
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                value = value.strip().strip('"').strip("'")
                os.environ[key.strip()] = value

# Now import the expense processor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location("expense_processor", "expense-processor.py")
expense_processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expense_processor)

# Import necessary functions
generate_receipt_description = expense_processor.generate_receipt_description
bedrock_runtime = expense_processor.bedrock_runtime

def test_meta_receipt_description():
    """Test description generation for a Meta ads receipt"""
    
    print("🧪 Testing Bedrock AI description generation for Meta ads receipt")
    print("=" * 60)
    
    # Sample Meta ads receipt text (from the logs)
    receipt_text = """
Meta for Business <advertise-noreply@support.facebook.com>
Wed, Dec 25, 2024 at 9:44 AM

Your Meta ads receipt
Account ID: 434492877229135

Date: December 25, 2024
Campaign: Holiday Music Launch 2024
Ad Set: DJ Equipment Targeting
Objective: Traffic
Amount: $10.05
Billing Period: December 2024

This receipt is for advertising on Meta platforms including Facebook and Instagram.

Thank you for advertising with Meta.
    """
    
    vendor = "Meta Platforms Inc., formerly Facebook, Inc."
    amount = 10.05
    
    print(f"📄 Receipt Text Preview:")
    print(f"   Vendor: {vendor}")
    print(f"   Amount: ${amount}")
    print(f"   Text length: {len(receipt_text)} chars")
    print()
    
    print("🤖 Available Bedrock client:", "YES" if bedrock_runtime else "NO")
    if bedrock_runtime:
        print(f"🔧 Primary model configured: {expense_processor.MODEL_ID_TO_USE}")
        print(f"📋 Candidate models: {len(expense_processor.MODEL_CANDIDATES)} available")
        print()
    
    try:
        print("🚀 Calling generate_receipt_description()...")
        description = generate_receipt_description(receipt_text, vendor, amount)
        
        print("\n✅ SUCCESS! Generated description:")
        print(f"   '{description}'")
        
        # Check if it's using AI or fallback
        if "Holiday Music Launch 2024" in description:
            print("\n🎉 AI successfully extracted campaign details!")
        elif "Account ID" in description or "Acct:" in description:
            print("\n⚠️  Using smart fallback (AI might have failed)")
        else:
            print("\n❌ Generic fallback used (AI failed)")
            
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

def test_bedrock_direct():
    """Test Bedrock client directly"""
    
    print("\n\n🔍 Testing Bedrock client directly")
    print("=" * 60)
    
    if not bedrock_runtime:
        print("❌ Bedrock client not initialized!")
        return
        
    print("✅ Bedrock client available")
    
    # Test with a simple prompt
    prompt = "Say 'Hello from Bedrock!' in a friendly way."
    
    try:
        print(f"\n📝 Test prompt: {prompt}")
        
        # Get the primary model
        model_id = expense_processor.MODEL_ID_TO_USE
        print(f"🎯 Using model: {model_id}")
        
        # Build request
        body, content_type = expense_processor._build_bedrock_request(model_id, prompt)
        print(f"📦 Request body type: {content_type}")
        
        # Invoke model
        print("🚀 Invoking Bedrock...")
        response = bedrock_runtime.invoke_model(
            modelId=model_id,
            body=json.dumps(body),
            contentType=content_type,
            accept='application/json'
        )
        
        # Parse response
        raw_body = response["body"].read()
        response_json = json.loads(raw_body)
        
        # Extract text based on model type
        if "anthropic" in model_id:
            text = response_json.get('content', [{}])[0].get('text', '').strip()
        else:
            text = response_json.get('results', [{}])[0].get('outputText', '').strip()
            
        print(f"\n✅ Response: {text}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        
        # If it's a validation error about inference profiles, show the fix
        if "inference profile" in str(e).lower():
            print("\n💡 Fix: The model needs an inference profile ARN.")
            print("   Check backend/scripts/config.py for the correct inference_profile")

if __name__ == "__main__":
    # Run both tests
    test_meta_receipt_description()
    test_bedrock_direct() 