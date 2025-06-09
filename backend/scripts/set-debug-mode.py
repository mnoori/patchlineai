#!/usr/bin/env python3
"""
Script to easily switch debug modes for Patchline Lambda functions
"""

import boto3
import argparse
import sys
from typing import List

def update_lambda_debug_mode(function_names: List[str], debug_mode: str):
    """Update DEBUG_MODE environment variable for Lambda functions"""
    lambda_client = boto3.client('lambda')
    
    # Validate debug mode
    valid_modes = ['dev', 'extreme', 'prod', 'off']
    if debug_mode not in valid_modes:
        print(f"❌ Invalid debug mode: {debug_mode}")
        print(f"Valid modes: {', '.join(valid_modes)}")
        return False
    
    success_count = 0
    
    for function_name in function_names:
        try:
            print(f"📝 Updating {function_name} to DEBUG_MODE={debug_mode}...")
            
            # Get current environment variables
            response = lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            
            env_vars = response.get('Environment', {}).get('Variables', {})
            
            # Update DEBUG_MODE
            env_vars['DEBUG_MODE'] = debug_mode
            
            # Update the function
            lambda_client.update_function_configuration(
                FunctionName=function_name,
                Environment={'Variables': env_vars}
            )
            
            print(f"✅ {function_name} updated successfully")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Failed to update {function_name}: {str(e)}")
    
    print(f"\n🎯 Updated {success_count}/{len(function_names)} functions")
    
    # Show mode explanation
    mode_explanations = {
        'dev': 'Full S3 + console logging (for debugging)',
        'extreme': 'Maximum verbose logging (for deep debugging)', 
        'prod': 'Only critical errors (for production)',
        'off': 'No logging at all (zero overhead)'
    }
    
    print(f"\n🔧 Debug mode '{debug_mode}': {mode_explanations[debug_mode]}")
    
    return success_count == len(function_names)

def main():
    parser = argparse.ArgumentParser(description='Set debug mode for Patchline Lambda functions')
    parser.add_argument('--mode', choices=['dev', 'extreme', 'prod', 'off'], 
                       required=True, help='Debug mode to set')
    parser.add_argument('--functions', nargs='+', 
                       default=['gmail-action-handler', 'scout-action-handler', 
                               'blockchain-action-handler', 'legal-action-handler'],
                       help='Lambda function names to update')
    
    args = parser.parse_args()
    
    print(f"🚀 Setting debug mode to '{args.mode}' for functions:")
    for func in args.functions:
        print(f"  - {func}")
    print()
    
    success = update_lambda_debug_mode(args.functions, args.mode)
    
    if success:
        print("\n✨ All functions updated successfully!")
        print("\n📋 Usage examples:")
        print("  python set-debug-mode.py --mode dev     # Turn on full debugging")
        print("  python set-debug-mode.py --mode prod    # Production mode (errors only)")
        print("  python set-debug-mode.py --mode off     # Turn off all logging")
        sys.exit(0)
    else:
        print("\n💥 Some functions failed to update")
        sys.exit(1)

if __name__ == "__main__":
    main() 