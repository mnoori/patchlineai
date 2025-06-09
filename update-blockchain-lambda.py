#!/usr/bin/env python3
"""
Update the blockchain-action-handler Lambda function with the fixed version
"""

import boto3
import os
import json
import zipfile
import tempfile
import shutil
import time

# Lambda function name
FUNCTION_NAME = "blockchain-action-handler"
REGION = "us-east-1"

# Environment variables to set
ENV_VARS = {
    "WEB3_WALLETS_TABLE": "Web3Wallets-staging",
    "WEB3_TRANSACTIONS_TABLE": "Web3Transactions-staging",
    "DEBUG_MODE": "dev",  # Enable debug logging for now
    "RPC_URL": "https://mainnet.helius-rpc.com"
}

def create_lambda_zip():
    """Create a ZIP file with the Lambda function code"""
    print(f"Creating ZIP file for Lambda function...")
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, f"{FUNCTION_NAME}.zip")
    
    try:
        # Create the ZIP file
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add the fixed Lambda handler
            fixed_handler_path = os.path.join("backend", "lambda", f"{FUNCTION_NAME}-fix.py")
            zipf.write(fixed_handler_path, "blockchain-action-handler.py")
            
            # Add debug_logger.py module
            debug_logger_path = os.path.join("backend", "lambda", "debug_logger.py")
            if os.path.exists(debug_logger_path):
                zipf.write(debug_logger_path, "debug_logger.py")
            else:
                print("⚠️ Warning: debug_logger.py not found - creating empty one")
                with open(os.path.join(temp_dir, "debug_logger.py"), "w") as f:
                    f.write("""
def get_logger(agent_name):
    class NoOpLogger:
        def log(self, data):
            pass
    return NoOpLogger()
                    """)
                zipf.write(os.path.join(temp_dir, "debug_logger.py"), "debug_logger.py")
            
            # Add any additional files needed
            for filename in ["requirements.txt"]:
                file_path = os.path.join("backend", "lambda", filename)
                if os.path.exists(file_path):
                    zipf.write(file_path, filename)
        
        print(f"✅ ZIP file created at: {zip_path}")
        return zip_path
    
    except Exception as e:
        print(f"❌ Error creating ZIP file: {str(e)}")
        shutil.rmtree(temp_dir)
        return None

def update_lambda_function(zip_path):
    """Update the Lambda function code and configuration"""
    if not zip_path or not os.path.exists(zip_path):
        print("❌ ZIP file not found")
        return False
    
    try:
        # Create Lambda client
        lambda_client = boto3.client('lambda', region_name=REGION)
        
        # Check if function exists
        try:
            lambda_client.get_function(FunctionName=FUNCTION_NAME)
            function_exists = True
        except lambda_client.exceptions.ResourceNotFoundException:
            function_exists = False
        
        # Read the ZIP file
        with open(zip_path, 'rb') as zip_file:
            zip_bytes = zip_file.read()
        
        if function_exists:
            # Update function code
            print(f"Updating Lambda function code: {FUNCTION_NAME}...")
            response = lambda_client.update_function_code(
                FunctionName=FUNCTION_NAME,
                ZipFile=zip_bytes,
                Publish=True
            )
            
            # Update environment variables
            print(f"Updating Lambda function environment variables...")
            lambda_client.update_function_configuration(
                FunctionName=FUNCTION_NAME,
                Environment={
                    'Variables': ENV_VARS
                }
            )
            
            print(f"✅ Lambda function updated successfully!")
            return True
            
        else:
            print(f"❌ Lambda function {FUNCTION_NAME} does not exist")
            print(f"Please create the function first with appropriate IAM role")
            return False
            
    except Exception as e:
        print(f"❌ Error updating Lambda function: {str(e)}")
        return False
    finally:
        # Clean up temporary directory
        if zip_path:
            temp_dir = os.path.dirname(zip_path)
            shutil.rmtree(temp_dir)

def main():
    """Main function to update Lambda function"""
    print("\n🔧 UPDATING BLOCKCHAIN LAMBDA FUNCTION")
    print("=" * 50)
    
    # Create ZIP file
    zip_path = create_lambda_zip()
    if not zip_path:
        print("❌ Failed to create ZIP file")
        return
    
    # Update Lambda function
    success = update_lambda_function(zip_path)
    
    if success:
        print("\n✅ BLOCKCHAIN LAMBDA FUNCTION UPDATED")
        print("=" * 50)
        print("\nFixes implemented:")
        print("1. Using correct DynamoDB table names:")
        print(f"   - WEB3_WALLETS_TABLE: {ENV_VARS['WEB3_WALLETS_TABLE']}")
        print(f"   - WEB3_TRANSACTIONS_TABLE: {ENV_VARS['WEB3_TRANSACTIONS_TABLE']}")
        print("2. Added get_user_wallet() function to look up wallet by user ID")
        print("3. Fixed request body parsing to handle both formats")
        print("4. Added enhanced debug logging for troubleshooting")
        print("5. Fixed session attributes extraction logic")
        print("\nYou can now test the blockchain agent with the following queries:")
        print("- 'What's my SOL balance?'")
        print("- 'Show my recent transactions'")
        print("- 'Send 0.001 SOL to my coinbase address'")
    else:
        print("\n❌ FAILED TO UPDATE LAMBDA FUNCTION")
        print("=" * 50)

if __name__ == "__main__":
    main() 