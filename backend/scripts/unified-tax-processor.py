#!/usr/bin/env python3
"""
Unified Tax Document Processor
==============================

This is the consolidated script for processing all tax documents (receipts and bank statements).
It combines functionality from multiple scripts and can:
- Process any folder (receipts or bank statements)
- Automatically detect document type based on folder structure
- Overwrite existing entries in DynamoDB if they exist
- Handle both single files and entire folders

Usage:
    python unified-tax-processor.py --folder "C:\path\to\folder"
    python unified-tax-processor.py --folder "C:\path\to\folder" --force  # Skip confirmation
    python unified-tax-processor.py --dry-run  # Preview what will be processed
"""

import os
import sys
import json
import time
import argparse
import requests
import boto3
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict
from collections import defaultdict

# Try to load from .env.local
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# Configuration
API_BASE_URL = "http://localhost:3000/api"
USER_ID = "default-user"

# Default paths (can be overridden by command line)
DEFAULT_TAX_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy"

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def detect_document_type(file_path: Path) -> str:
    """Detect document type based on folder structure"""
    path_str = str(file_path).lower()
    parent_dir = file_path.parent.name.lower()
    grandparent_dir = file_path.parent.parent.name.lower() if file_path.parent.parent else ""
    
    # Bank statement detection
    if 'bank statement' in path_str or 'bank' in grandparent_dir:
        if 'bilt' in path_str:
            return 'bilt'
        elif 'bofa' in path_str or 'bank of america' in path_str:
            return 'bofa'
        elif 'chase' in path_str:
            if 'sapphire' in path_str or 'saphire' in path_str:  # Handle misspelling
                return 'chase-sapphire'
            elif 'freedom' in path_str:
                return 'chase-freedom'
            else:
                return 'chase-checking'
    
    # Receipt detection
    elif 'receipt' in path_str or 'reciept' in path_str:  # Handle misspelling
        if 'amazon' in parent_dir:
            return 'amazon-receipts'
        else:
            return 'gmail-receipts'
    
    # Default to gmail-receipts for unknown types
    return 'gmail-receipts'

def check_existing_documents(user_id=USER_ID) -> Dict[str, Dict]:
    """Check what documents already exist in the database"""
    try:
        response = documents_table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        existing_docs = {}
        for item in response.get('Items', []):
            # Try different filename fields
            filename = item.get('fileName') or item.get('filename') or item.get('originalFilename', 'Unknown')
            existing_docs[filename] = {
                'documentId': item.get('documentId'),
                'status': item.get('status', 'unknown'),
                'createdAt': item.get('createdAt', 'unknown'),
                's3Key': item.get('s3Key'),
                'documentType': item.get('documentType', 'unknown')
            }
        
        return existing_docs
    except Exception as e:
        print_error(f"Error checking existing documents: {e}")
        return {}

def delete_document_and_expenses(doc_id: str, s3_key: str = None) -> bool:
    """Delete a document and its associated expenses"""
    try:
        # Delete from S3 if key provided
        if s3_key:
            try:
                s3_client = boto3.client('s3', **aws_config)
                s3_client.delete_object(Bucket='patchy-inbox-v2', Key=s3_key)
                # Also try to delete the Textract JSON
                textract_key = s3_key.replace('.pdf', '_textract.json')
                s3_client.delete_object(Bucket='patchy-inbox-v2', Key=textract_key)
            except:
                pass  # Ignore S3 errors
        
        # Delete document - need to find it first since we don't have userId+documentId composite key
        response = documents_table.scan(
            FilterExpression='documentId = :doc_id',
            ExpressionAttributeValues={':doc_id': doc_id}
        )
        
        for item in response.get('Items', []):
            documents_table.delete_item(
                Key={
                    'userId': item['userId'],
                    'documentId': item['documentId']
                }
            )
        
        # Delete associated expenses
        exp_response = expenses_table.scan(
            FilterExpression='documentId = :doc_id',
            ExpressionAttributeValues={':doc_id': doc_id}
        )
        
        for expense in exp_response.get('Items', []):
            expenses_table.delete_item(
                Key={
                    'userId': expense.get('userId', USER_ID),
                    'expenseId': expense['expenseId']
                }
            )
        
        return True
    except Exception as e:
        print_error(f"Error deleting document {doc_id}: {e}")
        return False

def upload_and_process_file(file_path: Path, doc_type: str, session: requests.Session, force_reprocess: bool = False) -> Tuple[bool, Dict]:
    """Upload and process a single file"""
    filename = file_path.name
    
    # Check if file already exists
    existing_docs = check_existing_documents()
    if filename in existing_docs and not force_reprocess:
        print_warning(f"File already exists: {filename} (ID: {existing_docs[filename]['documentId']})")
        return False, {"error": "Already exists", "existing": True}
    
    # Delete existing if force reprocess
    if filename in existing_docs and force_reprocess:
        doc_info = existing_docs[filename]
        print_info(f"Deleting existing document: {doc_info['documentId']}")
        delete_document_and_expenses(doc_info['documentId'], doc_info.get('s3Key'))
        time.sleep(0.5)  # Give DynamoDB time to process deletion
    
    try:
        # Step 1: Upload file
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': doc_type,
                'userId': USER_ID,
            }
            
            resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=data, timeout=60)
            
            if resp.status_code != 200:
                return False, {"error": f"Upload failed: HTTP {resp.status_code}"}
            
            upload_data = resp.json()
            upload_url = upload_data.get('uploadUrl')
            s3_key = upload_data.get('s3Key')
            document_id = upload_data.get('documentId')
            
            if not all([upload_url, s3_key, document_id]):
                return False, {"error": "Incomplete upload response"}
        
        # Step 2: Upload to S3
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
            
        put_resp = session.put(upload_url, data=file_bytes, 
                             headers={"Content-Type": "application/pdf"}, timeout=120)
        
        if put_resp.status_code not in (200, 204):
            return False, {"error": f"S3 upload failed: HTTP {put_resp.status_code}"}
        
        # Step 3: Process document
        process_payload = {
            "s3Key": s3_key,
            "documentId": document_id,
            "filename": filename,
            "userId": USER_ID,
            "documentType": doc_type,
        }
        
        proc_resp = session.post(f"{API_BASE_URL}/documents/process", 
                               json=process_payload, timeout=300)
        
        if proc_resp.status_code == 200:
            result = proc_resp.json()
            return True, result
        else:
            return False, {"error": f"Processing failed: HTTP {proc_resp.status_code}"}
            
    except Exception as e:
        return False, {"error": str(e)}

def process_folder(folder_path: Path, force_reprocess: bool = False, dry_run: bool = False):
    """Process all PDF files in a folder"""
    
    # Check if servers are running
    if not dry_run:
        try:
            requests.get("http://localhost:3000/api/health", timeout=2)
            print_success("Next.js server is running")
        except:
            print_error("Next.js server is not running on port 3000")
            print_info("Please start it with: npm run dev")
            return
        
        try:
            requests.get("http://localhost:8000/health", timeout=2)
            print_success("Expense processor server is running")
        except:
            print_warning("Expense processor server is not running")
            print_info("For better results, start it with: cd backend/scripts && python expense-processor-server.py")
    
    # Find all PDF files recursively
    pdf_files = list(folder_path.rglob("*.pdf"))
    
    if not pdf_files:
        print_error(f"No PDF files found in {folder_path}")
        return
    
    print_info(f"Found {len(pdf_files)} PDF files")
    
    # Check existing documents
    if not dry_run:
        existing_docs = check_existing_documents()
        existing_count = sum(1 for f in pdf_files if f.name in existing_docs)
        
        if existing_count > 0:
            print_warning(f"{existing_count} files already exist in database")
            if not force_reprocess:
                response = input(f"\nReprocess existing files? (y/N): ")
                if response.lower() != 'y':
                    print_info("Skipping existing files")
                else:
                    force_reprocess = True
    
    # Group files by document type
    files_by_type = defaultdict(list)
    for pdf_file in pdf_files:
        doc_type = detect_document_type(pdf_file)
        files_by_type[doc_type].append(pdf_file)
    
    # Show what will be processed
    print_header("Files to Process")
    for doc_type, files in files_by_type.items():
        print(f"{Colors.CYAN}{doc_type}:{Colors.END} {len(files)} files")
        for f in files[:3]:  # Show first 3
            print(f"  • {f.name}")
        if len(files) > 3:
            print(f"  ... and {len(files) - 3} more")
    
    if dry_run:
        print_info("DRY RUN - No files will be processed")
        return
    
    # Process files
    session = requests.Session()
    total_success = 0
    total_failed = 0
    failed_files = []
    
    start_time = time.time()
    
    for doc_type, files in files_by_type.items():
        print_header(f"Processing {doc_type}")
        
        for i, pdf_file in enumerate(files, 1):
            print(f"\n[{i}/{len(files)}] {Colors.YELLOW}{pdf_file.name}{Colors.END}")
            
            success, result = upload_and_process_file(pdf_file, doc_type, session, force_reprocess)
            
            if success:
                total_success += 1
                extracted = result.get('extractedData', {})
                expense_count = extracted.get('amount', 0)
                print_success(f"Processed successfully: {expense_count} expenses extracted")
            elif result.get('existing'):
                print_info("Skipped (already exists)")
            else:
                total_failed += 1
                failed_files.append(str(pdf_file))
                print_error(f"Failed: {result.get('error', 'Unknown error')}")
            
            # Small delay between files
            if i < len(files):
                time.sleep(2)
    
    # Summary
    elapsed = time.time() - start_time
    print_header("Processing Complete")
    print(f"Total files processed: {total_success + total_failed}")
    print_success(f"Successful: {total_success}")
    if total_failed > 0:
        print_error(f"Failed: {total_failed}")
    print_info(f"Time elapsed: {elapsed:.1f} seconds")
    
    if failed_files:
        # Save failed files list
        with open('failed-files.json', 'w') as f:
            json.dump(failed_files, f, indent=2)
        print_warning("Failed files saved to: failed-files.json")
    
    print_info("\nView results at: http://localhost:3000/dashboard/god-mode")
    print_info("Navigate to 'Tax Preparation' tab to see expenses")

def main():
    parser = argparse.ArgumentParser(description='Unified tax document processor')
    parser.add_argument('--folder', type=str, default=DEFAULT_TAX_FOLDER,
                      help='Folder containing documents to process')
    parser.add_argument('--force', action='store_true',
                      help='Force reprocess all files (overwrites existing)')
    parser.add_argument('--dry-run', action='store_true',
                      help='Preview what will be processed without actually processing')
    
    args = parser.parse_args()
    
    folder_path = Path(args.folder)
    if not folder_path.exists():
        print_error(f"Folder not found: {folder_path}")
        sys.exit(1)
    
    print_header("Unified Tax Document Processor")
    print(f"Processing folder: {folder_path}")
    
    process_folder(folder_path, args.force, args.dry_run)

if __name__ == "__main__":
    main() 