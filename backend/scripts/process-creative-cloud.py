#!/usr/bin/env python3
"""
Creative Cloud Invoice Processor
================================

Special processor for Adobe Creative Cloud invoices that:
1. Only processes files without AI descriptions
2. Uses specialized parsing for Creative Cloud format
3. Can target a specific folder
"""

import os
import sys
import json
import time
import requests
import boto3
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# Configuration
API_BASE_URL = "http://localhost:3000/api"
USER_ID = "default-user"
CREATIVE_CLOUD_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified\creativecloud"

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
s3_client = boto3.client('s3', **aws_config)
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

# Color codes
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
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

def check_has_ai_description(doc_id: str) -> bool:
    """Check if a document has AI-generated descriptions"""
    expense_response = expenses_table.scan(
        FilterExpression='documentId = :did',
        ExpressionAttributeValues={':did': doc_id}
    )
    
    expenses = expense_response.get('Items', [])
    
    if len(expenses) == 0:
        return False
    
    # Check if any expense has a detailed AI description
    for expense in expenses:
        desc = expense.get('description', '')
        # AI descriptions are typically longer and contain " - "
        if len(desc) > 50 or ' - ' in desc:
            return True
    
    return False

def get_existing_creative_cloud_docs() -> Dict[str, Dict]:
    """Get all existing Creative Cloud documents from database"""
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': USER_ID}
    )
    
    creative_cloud_docs = {}
    
    for item in response.get('Items', []):
        filename = item.get('fileName') or item.get('filename') or ''
        
        # Check if it's a Creative Cloud invoice
        if 'invoice' in filename.lower() and any(x in filename for x in ['(', ')']):
            doc_id = item.get('documentId')
            has_ai_desc = check_has_ai_description(doc_id)
            
            creative_cloud_docs[filename] = {
                'documentId': doc_id,
                'has_ai_description': has_ai_desc,
                's3Key': item.get('s3Key'),
                'status': item.get('status', 'unknown')
            }
    
    return creative_cloud_docs

def delete_document_and_expenses(doc_id: str, s3_key: str = None) -> bool:
    """Delete a document and its associated expenses"""
    try:
        # Delete from S3 if key provided
        if s3_key:
            try:
                s3_client.delete_object(Bucket='patchy-inbox-v2', Key=s3_key)
                textract_key = s3_key.replace('.pdf', '_textract.json')
                s3_client.delete_object(Bucket='patchy-inbox-v2', Key=textract_key)
            except:
                pass
        
        # Delete document
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
        
        # Delete expenses
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

def process_creative_cloud_file(file_path: Path, session: requests.Session) -> Tuple[bool, Dict]:
    """Process a single Creative Cloud invoice with special handling"""
    filename = file_path.name
    
    try:
        # Upload file with special document type
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': 'creative-cloud-receipts',  # Special type for Creative Cloud
                'userId': USER_ID,
            }
            
            resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=data, timeout=60)
            
            if resp.status_code != 200:
                return False, {"error": f"Upload failed: HTTP {resp.status_code}"}
            
            upload_data = resp.json()
            upload_url = upload_data.get('uploadUrl')
            s3_key = upload_data.get('s3Key')
            document_id = upload_data.get('documentId')
        
        # Upload to S3
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
            
        put_resp = session.put(upload_url, data=file_bytes, 
                             headers={"Content-Type": "application/pdf"}, timeout=120)
        
        if put_resp.status_code not in (200, 204):
            return False, {"error": f"S3 upload failed: HTTP {put_resp.status_code}"}
        
        # Process document with special handling
        process_payload = {
            "s3Key": s3_key,
            "documentId": document_id,
            "filename": filename,
            "userId": USER_ID,
            "documentType": "creative-cloud-receipts",
            "metadata": {
                "vendor": "Adobe Creative Cloud",
                "documentDate": datetime.now().strftime("%Y-%m-%d"),  # Will be overwritten by actual date
                "forceDescription": "Adobe Creative Cloud - Monthly Subscription"
            }
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

def main():
    print_header("Creative Cloud Invoice Processor")
    
    # Check servers
    try:
        requests.get("http://localhost:3000/api/health", timeout=2)
        print_success("Next.js server is running")
    except:
        print_error("Next.js server is not running")
        print_info("Please start it with: npm run dev")
        return
    
    try:
        requests.get("http://localhost:8000/health", timeout=2)
        print_success("Expense processor server is running")
    except:
        print_warning("Expense processor server is not running")
        print_info("This is REQUIRED for Creative Cloud processing")
        print_info("Start it with: cd backend/scripts && python expense-processor-server.py")
        return
    
    # Get Creative Cloud folder
    folder_path = Path(CREATIVE_CLOUD_FOLDER)
    if not folder_path.exists():
        print_error(f"Creative Cloud folder not found: {folder_path}")
        alt_folder = input("Enter Creative Cloud folder path (or press Enter to cancel): ").strip()
        if not alt_folder:
            return
        folder_path = Path(alt_folder)
        if not folder_path.exists():
            print_error("Folder not found")
            return
    
    # Get all PDF files
    pdf_files = list(folder_path.glob("*.pdf"))
    print_info(f"Found {len(pdf_files)} PDF files in Creative Cloud folder")
    
    # Check existing documents
    print_info("Checking existing Creative Cloud documents...")
    existing_docs = get_existing_creative_cloud_docs()
    
    # Categorize files
    needs_processing = []
    already_processed = []
    
    for pdf_file in pdf_files:
        if pdf_file.name in existing_docs:
            doc_info = existing_docs[pdf_file.name]
            if doc_info['has_ai_description']:
                already_processed.append(pdf_file.name)
            else:
                needs_processing.append((pdf_file, doc_info))
        else:
            needs_processing.append((pdf_file, None))
    
    # Show status
    print(f"\n{Colors.GREEN}Already processed (with AI descriptions): {len(already_processed)}{Colors.END}")
    if already_processed:
        for name in already_processed[:5]:
            print(f"  ✓ {name}")
        if len(already_processed) > 5:
            print(f"  ... and {len(already_processed) - 5} more")
    
    print(f"\n{Colors.YELLOW}Need processing: {len(needs_processing)}{Colors.END}")
    if needs_processing:
        for pdf_file, _ in needs_processing[:5]:
            print(f"  • {pdf_file.name}")
        if len(needs_processing) > 5:
            print(f"  ... and {len(needs_processing) - 5} more")
    
    if not needs_processing:
        print_success("All Creative Cloud invoices have been processed!")
        return
    
    # Confirm processing
    response = input(f"\nProcess {len(needs_processing)} Creative Cloud invoices? (y/N): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Process files
    session = requests.Session()
    success_count = 0
    fail_count = 0
    failed_files = []
    
    print_header("Processing Creative Cloud Invoices")
    
    for i, (pdf_file, existing_info) in enumerate(needs_processing, 1):
        print(f"\n[{i}/{len(needs_processing)}] {Colors.YELLOW}{pdf_file.name}{Colors.END}")
        
        # Delete existing if needed
        if existing_info:
            print_info(f"Deleting existing entry: {existing_info['documentId']}")
            delete_document_and_expenses(
                existing_info['documentId'], 
                existing_info.get('s3Key')
            )
            time.sleep(0.5)
        
        # Process file
        success, result = process_creative_cloud_file(pdf_file, session)
        
        if success:
            success_count += 1
            expense_count = result.get('extractedData', {}).get('amount', 0)
            print_success(f"Processed successfully: {expense_count} expenses extracted")
        else:
            fail_count += 1
            failed_files.append(str(pdf_file))
            print_error(f"Failed: {result.get('error', 'Unknown error')}")
        
        # Small delay
        if i < len(needs_processing):
            time.sleep(2)
    
    # Summary
    print_header("Processing Complete")
    print_success(f"Successful: {success_count}")
    if fail_count > 0:
        print_error(f"Failed: {fail_count}")
        
        # Save failed files
        with open('creative-cloud-failed.json', 'w') as f:
            json.dump(failed_files, f, indent=2)
        print_warning("Failed files saved to: creative-cloud-failed.json")
    
    print_info("\nView results at: http://localhost:3000/dashboard/god-mode")
    print_info("Navigate to 'Tax Preparation' tab to see expenses")

if __name__ == "__main__":
    main() 