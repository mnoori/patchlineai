#!/usr/bin/env python3
"""
Process new tax receipts through Patchline AI pipeline
======================================================

This script processes new receipts that need to be added to your existing
tax documentation. It uses the same API endpoints as the batch processor
that successfully processed your 300 documents.

All receipts are processed as "gmail-receipts" type with enhanced categorization
for vendors like Trackstack, Vocalfy, Rebtel, Sweetwater, Canva, Splice, and Soho House.

USAGE:
    python process-new-receipts.py                      # Process default folder
    python process-new-receipts.py --folder "C:\\path"  # Process specific folder
"""

import os
import sys
import time
from pathlib import Path
import logging
import requests
import argparse

# Load environment variables the same way expense-processor-server.py does
def load_env_file():
    """Load environment variables from .env.local file"""
    possible_paths = [
        Path(__file__).parent.parent.parent / '.env.local',  # Project root
        Path(__file__).parent.parent / '.env.local',         # Backend folder
        Path.cwd() / '.env.local'                            # Current directory
    ]
    
    for env_path in possible_paths:
        if env_path.exists():
            logging.info(f"Loading environment variables from: {env_path}")
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        value = value.strip().strip('"').strip("'")
                        os.environ[key.strip()] = value
            return
    
    logging.warning("Warning: No .env.local file found")

# Load environment variables before anything else
load_env_file()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler('process-new-receipts.log'),
        logging.StreamHandler()
    ]
)

# Constants
USER_ID = 'default-user'

# NEW RECEIPTS FOLDER - Update this path
NEW_RECEIPTS_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified"

def process_new_receipts(folder_path=None):
    """Main function to process new receipts"""
    target_folder = folder_path or NEW_RECEIPTS_FOLDER
    logging.info(f"Starting to process receipts from: {target_folder}")
    
    # Check if folder exists
    if not os.path.exists(target_folder):
        logging.error(f"Folder not found: {target_folder}")
        return
    
    # Find all PDF files in the folder
    pdf_files = list(Path(target_folder).glob("*.pdf"))
    logging.info(f"Found {len(pdf_files)} PDF files to process")
    
    if not pdf_files:
        logging.warning("No PDF files found in the specified folder")
        return
    
    # Process each file - use the same approach as batch-process-tax-docs.py
    successful = 0
    failed = 0
    start_time = time.time()
    
    # Use the API endpoint approach (simpler and more reliable)
    session = requests.Session()
    
    for i, pdf_path in enumerate(pdf_files, 1):
        file_name = pdf_path.name
        print(f"\n[{i}/{len(pdf_files)}] Processing: {file_name}")
        
        try:
            # Upload via API endpoint (like batch-process-tax-docs.py does)
            with open(pdf_path, 'rb') as f:
                files = {'file': (file_name, f, 'application/pdf')}
                data = {
                    'bankType': 'gmail-receipts',  # All new receipts are gmail receipts
                    'userId': USER_ID
                }
                
                # Step 1: Get presigned S3 URL
                resp = session.post(f"http://localhost:3000/api/documents/upload", 
                                  files=files, data=data, timeout=60)
                
                if resp.status_code != 200:
                    logging.error(f"Upload failed: HTTP {resp.status_code}")
                    failed += 1
                    continue
                
                upload_data = resp.json()
                upload_url = upload_data.get('uploadUrl')
                s3_key = upload_data.get('s3Key')
                document_id = upload_data.get('documentId')
                
                if not all([upload_url, s3_key, document_id]):
                    logging.error("Incomplete upload response")
                    failed += 1
                    continue
                
                # Step 2: PUT the file to S3 (THIS WAS MISSING!)
                with open(pdf_path, 'rb') as f:
                    file_bytes = f.read()
                
                put_resp = session.put(upload_url, data=file_bytes, 
                                     headers={"Content-Type": "application/pdf"}, 
                                     timeout=120)
                
                if put_resp.status_code not in (200, 204):
                    logging.error(f"S3 PUT failed: HTTP {put_resp.status_code}")
                    failed += 1
                    continue
                
                # Step 3: Process the document
                process_payload = {
                    's3Key': s3_key,
                    'documentId': document_id,
                    'filename': file_name,
                    'userId': USER_ID,
                    'documentType': 'gmail-receipts'
                }
                
                proc_resp = session.post(f"http://localhost:3000/api/documents/process",
                                       json=process_payload, timeout=300)
                
                if proc_resp.status_code == 200:
                    successful += 1
                    result = proc_resp.json()
                    expense_count = result.get('extractedData', {}).get('amount', 0)
                    logging.info(f"✓ Successfully processed: {expense_count} expenses extracted")
                else:
                    failed += 1
                    logging.error(f"✗ Processing failed: HTTP {proc_resp.status_code}")
                    
        except Exception as e:
            logging.error(f"✗ Error processing {file_name}: {str(e)}")
            failed += 1
        
        # Small delay between files
        if i < len(pdf_files):
            time.sleep(2)
    
    # Summary
    elapsed = time.time() - start_time
    print("\n" + "="*50)
    print(f"PROCESSING COMPLETE")
    print(f"Total files: {len(pdf_files)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Time elapsed: {elapsed:.1f} seconds")
    print(f"\nCheck the Tax Audit section in the UI to review the new expenses")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process new tax receipts")
    parser.add_argument("--folder", type=str, help="Folder path containing PDFs (default: NEW-UnIdentified folder)")
    args = parser.parse_args()
    
    # Check if Next.js server is running (required for API endpoints)
    try:
        resp = requests.get('http://localhost:3000/api/health', timeout=2)
        print("✓ Next.js server is running")
    except:
        print("✗ Next.js server is not running at http://localhost:3000")
        print("Please start the Next.js development server: npm run dev")
        sys.exit(1)
    
    # Process new receipts
    folder = args.folder if args.folder else NEW_RECEIPTS_FOLDER
    process_new_receipts(folder) 