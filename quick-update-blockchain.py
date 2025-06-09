#!/usr/bin/env python3
"""Quick update for blockchain Lambda - just the code, no dependencies"""

import boto3
import zipfile
import tempfile
import os

def quick_update():
    """Quick update of blockchain Lambda code only"""
    print("🚀 Quick updating blockchain-action-handler...")
    
    # Create a minimal zip with just the handler and debug_logger
    with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_file:
        zip_path = tmp_file.name
        
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Add the handler as index.py
            handler_path = os.path.join('backend', 'lambda', 'blockchain-action-handler.py')
            zf.write(handler_path, 'index.py')
            
            # Add debug_logger.py
            debug_logger_path = os.path.join('backend', 'lambda', 'debug_logger.py')
            if os.path.exists(debug_logger_path):
                zf.write(debug_logger_path, 'debug_logger.py')
        
        # Read the zip file
        with open(zip_path, 'rb') as f:
            zip_bytes = f.read()
        
        # Update Lambda
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        
        print("📦 Updating Lambda code...")
        response = lambda_client.update_function_code(
            FunctionName='blockchain-action-handler',
            ZipFile=zip_bytes,
            Publish=True
        )
        
        print(f"✅ Updated! Code size: {response['CodeSize']} bytes")
        print(f"✅ Last modified: {response['LastModified']}")
        
    finally:
        # Clean up
        if os.path.exists(zip_path):
            os.remove(zip_path)

if __name__ == "__main__":
    quick_update() 