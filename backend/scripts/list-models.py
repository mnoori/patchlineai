#!/usr/bin/env python3
"""
Utility script to list available Bedrock models and show how to switch between them
"""

import sys
from config import BEDROCK_MODELS, DEFAULT_FOUNDATION_MODEL, get_model_by_name, list_available_models

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Show specific model info
        model_name = sys.argv[1]
        try:
            model = get_model_by_name(model_name)
            print(f"\n🤖 Model: {model_name}")
            print(f"   ID: {model['id']}")
            print(f"   Name: {model['name']}")
            print(f"   Description: {model['description']}")
            print(f"   Cost: {model['cost']}")
            print(f"   Speed: {model['speed']}")
            print(f"\n💡 To use this model, set environment variable:")
            print(f"   export BEDROCK_MODEL_NAME={model_name}")
            print(f"   # or add to .env.local:")
            print(f"   BEDROCK_MODEL_NAME={model_name}")
        except ValueError as e:
            print(f"❌ {e}")
            sys.exit(1)
    else:
        # List all models
        print("🤖 Available Bedrock Models:")
        print("=" * 50)
        
        models = list_available_models()
        for model in models:
            is_default = model['id'] == DEFAULT_FOUNDATION_MODEL
            marker = "⭐ (default)" if is_default else "  "
            
            print(f"{marker} {model['name']}")
            print(f"     Key: {model['name']}")
            print(f"     ID: {model['id']}")
            print(f"     Cost: {model['cost']}, Speed: {model['speed']}")
            print(f"     {model['description']}")
            print()
        
        print("💡 Usage:")
        print("   python list-models.py <model-key>  # Show specific model info")
        print("   python list-models.py nova-micro   # Example")
        print()
        print("🔄 To switch models:")
        print("   export BEDROCK_MODEL_NAME=nova-micro")
        print("   # or add to .env.local:")
        print("   BEDROCK_MODEL_NAME=nova-micro")
        print()
        print(f"📋 Current default: {DEFAULT_FOUNDATION_MODEL}")

if __name__ == '__main__':
    main() 