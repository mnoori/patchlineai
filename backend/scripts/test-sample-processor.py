#!/usr/bin/env python3
"""
Comprehensive Tax Document Processor
====================================

Process tax documents with smart detection and vendor mapping.
Can process:
- All files in a folder
- Specific folders only
- Individual files for reprocessing
- Test samples from each folder

Features:
1. Smart document type detection based on folder structure
2. Improved vendor detection and mapping
3. Complete metadata storage (filenames, original paths)
4. Skip checking accounts (BofA and Chase Checking)
5. Ability to reprocess specific files/folders

Usage:
    # Process all files
    python test-sample-processor.py --all
    
    # Process test samples only (default)
    python test-sample-processor.py
    
    # Process specific folders
    python test-sample-processor.py --folders "Reciepts\\Platforms\\creativecloud,Reciepts\\Amazon"
    
    # Reprocess specific files
    python test-sample-processor.py --files "invoice (1).pdf,Gmail - Your bill.pdf"
"""

import os
import sys
import json
import time
import boto3
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from botocore.exceptions import ClientError

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / 'lambda'))

# Import with hyphenated filename
import importlib.util
spec = importlib.util.spec_from_file_location("expense_processor", 
                                             str(Path(__file__).parent.parent / 'lambda' / 'expense-processor.py'))
expense_processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expense_processor)
get_parser = expense_processor.get_parser

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
TAX_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy"

# Vendor mappings based on description patterns
VENDOR_MAPPINGS = {
    'soundcloud': ['soundcloud go+', 'stream algoryx'],
    'verizon': ['verizon wireless', 'verizon'],
    'soho house': ['dumbo house', 'soho house', 'soho works'],
    'apple': ['apple services', 'apple cloud', 'icloud', 'app store'],
    'google cloud': ['google cloud platform', 'google play', 'gcp'],
    'google': ['youtube promotion', 'google ads', 'adwords'],
    'meta': ['facebook ads', 'instagram ads', 'meta ads'],
    'adobe': ['creative cloud', 'adobe'],
    'spotify': ['spotify', 'spotify for artists'],
    'amazon': ['amazon.com', 'amazon web services', 'aws'],
}

# Document types to skip
SKIP_DOCUMENT_TYPES = ['bofa', 'chase-checking']

# AWS Configuration (only for DynamoDB to check results)
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients (only DynamoDB for checking results)
dynamodb = boto3.resource('dynamodb', **aws_config)

# DynamoDB tables
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

# Color codes
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
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text.center(80)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")



def process_sample_file(sample_path: str, doc_type: str, folder: str) -> Dict:
    """Process a single sample file using existing API endpoints"""
    file_path = Path(sample_path)
    filename = file_path.name
    
    print(f"\n{Colors.YELLOW}Processing: {filename}{Colors.END}")
    print(f"  Folder: {folder}")
    print(f"  Type: {doc_type}")
    
    try:
        # Create session for API calls
        session = requests.Session()
        
        # Step 1: Upload file through API
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': doc_type,
                'userId': USER_ID,
            }
            
            resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=data, timeout=60)
            
            if resp.status_code != 200:
                return {
                    'fileName': filename,
                    'folder': folder,
                    'documentType': doc_type,
                    'status': 'failed',
                    'error': f"Upload failed: HTTP {resp.status_code}"
                }
            
            upload_data = resp.json()
            upload_url = upload_data.get('uploadUrl')
            s3_key = upload_data.get('s3Key')
            document_id = upload_data.get('documentId')
            
            print_success(f"Upload initiated. Document ID: {document_id}")
        
        # Step 2: Upload to S3 using presigned URL
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
            
        put_resp = session.put(upload_url, data=file_bytes, 
                             headers={"Content-Type": "application/pdf"}, timeout=120)
        
        if put_resp.status_code not in (200, 204):
            return {
                'fileName': filename,
                'folder': folder,
                'documentType': doc_type,
                'status': 'failed',
                'error': f"S3 upload failed: HTTP {put_resp.status_code}"
            }
        
        print_success("Uploaded to S3")
        
        # Step 3: Process document through API
        process_payload = {
            "s3Key": s3_key,
            "documentId": document_id,
            "filename": filename,
            "userId": USER_ID,
            "documentType": doc_type,
            "folder": folder,  # Add folder info
            "originalPath": str(file_path)  # Add original path
        }
        
        proc_resp = session.post(f"{API_BASE_URL}/documents/process", 
                               json=process_payload, timeout=300)
        
        if proc_resp.status_code == 200:
            result = proc_resp.json()
            extracted_data = result.get('extractedData', {})
            expense_count = extracted_data.get('amount', 0)
            page_count = extracted_data.get('pageCount', 1)
            
            print_success(f"Processed successfully")
            print_info(f"Expenses extracted: {expense_count}")
            print_info(f"Pages: {page_count}")
            
            # Show sample expense if available
            expenses = extracted_data.get('expenses', [])
            if expenses and len(expenses) > 0:
                sample_expense = expenses[0]
                print(f"\n  {Colors.CYAN}Sample expense:{Colors.END}")
                print(f"    Date: {sample_expense.get('date', 'N/A')}")
                print(f"    Amount: ${sample_expense.get('amount', 'N/A')}")
                print(f"    Description: {sample_expense.get('description', 'N/A')[:80]}...")
                print(f"    Category: {sample_expense.get('category', 'N/A')}")
            
            # Check if we can get the document from database to see metadata
            try:
                doc_response = documents_table.scan(
                    FilterExpression='documentId = :doc_id',
                    ExpressionAttributeValues={':doc_id': document_id}
                )
                
                if doc_response.get('Items'):
                    doc_item = doc_response['Items'][0]
                    if doc_item.get('status') == 'completed':
                        print_success("Document stored in database")
            except:
                pass
            
            return {
                'documentId': document_id,
                'fileName': filename,
                'folder': folder,
                'documentType': doc_type,
                'expenseCount': expense_count,
                'totalAmount': sum(float(e.get('amount', 0)) for e in expenses),
                'pages': page_count,
                's3Key': s3_key,
                'status': 'success'
            }
        else:
            return {
                'fileName': filename,
                'folder': folder,
                'documentType': doc_type,
                'status': 'failed',
                'error': f"Processing failed: HTTP {proc_resp.status_code}"
            }
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return {
            'fileName': filename,
            'folder': folder,
            'documentType': doc_type,
            'status': 'failed',
            'error': str(e)
        }

def detect_document_type_enhanced(file_path: Path) -> str:
    """Enhanced document type detection with checking account skip logic"""
    path_str = str(file_path).lower()
    parent_dir = file_path.parent.name.lower()
    grandparent_dir = file_path.parent.parent.name.lower() if file_path.parent.parent else ""
    
    # Check for checking accounts (to skip)
    if 'checking' in path_str and ('bofa' in path_str or 'bank of america' in path_str):
        return 'bofa'
    elif 'checking' in path_str and 'chase' in path_str:
        return 'chase-checking'
    
    # Bank statements
    if 'bank statement' in path_str or 'bank' in grandparent_dir:
        if 'bilt' in path_str:
            return 'bilt'
        elif 'chase' in path_str:
            if 'sapphire' in path_str or 'saphire' in path_str:
                return 'chase-sapphire'
            elif 'freedom' in path_str:
                return 'chase-freedom'
    
    # Receipt types based on folder
    elif 'receipt' in path_str or 'reciept' in path_str:
        if 'amazon' in parent_dir:
            return 'amazon-receipts'
        elif 'creativecloud' in parent_dir or 'creative cloud' in parent_dir:
            return 'creative-cloud-receipts'
        else:
            return 'gmail-receipts'
    
    # Other
    elif 'rent' in parent_dir:
        return 'rent-documents'
    
    return 'general'

def scan_all_files(base_path: Path) -> List[Dict]:
    """Scan for all PDF files in the tax folder"""
    all_files = []
    skip_count = 0
    
    for pdf_file in base_path.rglob("*.pdf"):
        doc_type = detect_document_type_enhanced(pdf_file)
        
        if doc_type in SKIP_DOCUMENT_TYPES:
            skip_count += 1
            continue
            
        all_files.append({
            'file_path': str(pdf_file),
            'document_type': doc_type,
            'folder': str(pdf_file.parent.relative_to(base_path))
        })
    
    if skip_count > 0:
        print_warning(f"Skipping {skip_count} checking account files")
    
    return all_files

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Comprehensive tax document processor')
    parser.add_argument('--all', action='store_true', help='Process all files in the tax folder')
    parser.add_argument('--folders', type=str, help='Comma-separated list of specific folders to process')
    parser.add_argument('--files', type=str, help='Comma-separated list of specific files to reprocess')
    parser.add_argument('--dry-run', action='store_true', help='Preview what will be processed')
    
    args = parser.parse_args()
    
    print_header("COMPREHENSIVE TAX DOCUMENT PROCESSOR")
    
    # Check if servers are running
    if not args.dry_run:
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
    
    # Determine what to process
    files_to_process = []
    
    if args.all:
        # Process all files
        print_info("Scanning all files in tax folder...")
        files_to_process = scan_all_files(Path(TAX_FOLDER))
        print(f"Found {len(files_to_process)} files to process")
        
    elif args.folders:
        # Process specific folders
        print_info(f"Processing specific folders: {args.folders}")
        base_path = Path(TAX_FOLDER)
        for folder in args.folders.split(','):
            folder_path = base_path / folder.strip()
            if folder_path.exists():
                for pdf_file in folder_path.rglob("*.pdf"):
                    doc_type = detect_document_type_enhanced(pdf_file)
                    if doc_type not in SKIP_DOCUMENT_TYPES:
                        files_to_process.append({
                            'file_path': str(pdf_file),
                            'document_type': doc_type,
                            'folder': str(pdf_file.parent.relative_to(base_path))
                        })
            else:
                print_warning(f"Folder not found: {folder_path}")
                
    elif args.files:
        # Process specific files
        print_info(f"Processing specific files: {args.files}")
        base_path = Path(TAX_FOLDER)
        for file_name in args.files.split(','):
            # Search for the file
            found = False
            for pdf_file in base_path.rglob(file_name.strip()):
                doc_type = detect_document_type_enhanced(pdf_file)
                if doc_type not in SKIP_DOCUMENT_TYPES:
                    files_to_process.append({
                        'file_path': str(pdf_file),
                        'document_type': doc_type,
                        'folder': str(pdf_file.parent.relative_to(base_path))
                    })
                    found = True
                    break
            if not found:
                print_warning(f"File not found: {file_name}")
                
    else:
        # Default: process test samples
        if not Path('organized-samples.json').exists():
            print_error("No organized-samples.json found. Run analyze-organized-folders.py first.")
            return
        
        with open('organized-samples.json', 'r') as f:
            data = json.load(f)
        
        files_to_process = [
            {
                'file_path': sample['sample_file'],
                'document_type': sample['document_type'],
                'folder': sample['folder']
            }
            for sample in data['samples']
        ]
        print(f"Found {len(files_to_process)} test samples to process")
    
    if args.dry_run:
        print_info("\nDRY RUN - No files will be processed")
        print_info(f"Would process {len(files_to_process)} files")
        return
    
    # Show summary and confirm
    if args.all:
        print(f"\n{Colors.YELLOW}Ready to process {len(files_to_process)} files.{Colors.END}")
        print(f"{Colors.YELLOW}This will:{Colors.END}")
        print("  1. Upload each file to S3")
        print("  2. Process with Textract for OCR")
        print("  3. Extract expenses with AI")
        print("  4. Store complete metadata")
        print("  5. Skip all checking account files")
        print(f"\n{Colors.GREEN}After clearing data in UI, run:{Colors.END}")
        print(f"{Colors.BOLD}python test-sample-processor.py --all{Colors.END}")
        
        response = input(f"\n{Colors.YELLOW}Proceed? (y/N): {Colors.END}")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    # Process files
    results = []
    success_count = 0
    fail_count = 0
    
    for i, file_info in enumerate(files_to_process, 1):
        if args.all:
            print(f"\n[{i}/{len(files_to_process)}] Processing...")
        else:
            print_header(f"FILE {i}/{len(files_to_process)}")
        
        result = process_sample_file(
            file_info['file_path'],
            file_info['document_type'],
            file_info['folder']
        )
        
        if result:
            results.append(result)
            if result['status'] == 'success':
                success_count += 1
            else:
                fail_count += 1
        
        # Small delay between files
        if i < len(files_to_process):
            time.sleep(1 if args.all else 2)
    
    # Generate report
    print_header("PROCESSING COMPLETE")
    
    report = {
        'processedAt': datetime.utcnow().isoformat(),
        'totalFiles': len(files_to_process),
        'successful': success_count,
        'failed': fail_count,
        'mode': 'all' if args.all else 'samples',
        'results': results,
        'summary': {
            'totalExpenses': sum(r.get('expenseCount', 0) for r in results if r.get('status') == 'success'),
            'totalAmount': sum(r.get('totalAmount', 0) for r in results if r.get('status') == 'success'),
            'totalPages': sum(r.get('pages', 0) for r in results if r.get('status') == 'success')
        }
    }
    
    # Save report
    report_name = 'full-processing-report.json' if args.all else 'test-processing-report.json'
    with open(report_name, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"{Colors.GREEN}Successful: {success_count}{Colors.END}")
    print(f"{Colors.RED}Failed: {fail_count}{Colors.END}")
    print(f"\nTotal expenses extracted: {report['summary']['totalExpenses']}")
    print(f"Total pages processed: {report['summary']['totalPages']}")
    
    # Show any failures
    if fail_count > 0:
        print(f"\n{Colors.RED}Failed files:{Colors.END}")
        for result in results:
            if result.get('status') == 'failed':
                print(f"  - {result['fileName']}: {result.get('error', 'Unknown error')}")
    
    print(f"\n{Colors.GREEN}Report saved to: {report_name}{Colors.END}")
    
    # Next steps
    print(f"\n{Colors.CYAN}Next steps:{Colors.END}")
    print("1. Check the Tax Preparation tab in God Mode")
    print("2. Review the Test Samples tab for processed files")
    print("3. Verify vendor names are correctly detected")
    
    if not args.all:
        print("4. Run with --all flag to process all remaining files")
    else:
        print("4. Any files with issues can be reprocessed with --files flag")

if __name__ == "__main__":
    main() 