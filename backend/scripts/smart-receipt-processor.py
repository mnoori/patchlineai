#!/usr/bin/env python3
"""
Smart Receipt Processor
=======================

This processor only handles files that:
1. Have 0 expenses extracted (failed processing)
2. Don't have AI-generated descriptions
3. Are in specified folders that need special handling

It's the recommended way to handle failed or incomplete processing.
"""

import os
import sys
import json
import time
import requests
import boto3
from pathlib import Path
from typing import List, Dict, Tuple
from collections import defaultdict

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

def check_needs_processing(doc_id: str) -> Tuple[bool, str]:
    """Check if a document needs processing"""
    # Get expenses for this document
    expense_response = expenses_table.scan(
        FilterExpression='documentId = :did',
        ExpressionAttributeValues={':did': doc_id}
    )
    
    expenses = expense_response.get('Items', [])
    
    if len(expenses) == 0:
        return True, "no_expenses"
    
    # Check if any expense has a good AI description
    has_ai_desc = False
    for expense in expenses:
        desc = expense.get('description', '')
        # AI descriptions are typically longer and contain " - "
        if len(desc) > 50 or ' - ' in desc:
            has_ai_desc = True
            break
    
    if not has_ai_desc:
        return True, "no_ai_description"
    
    return False, "already_processed"

def get_documents_by_status() -> Dict[str, List[Dict]]:
    """Get all documents categorized by processing status"""
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': USER_ID}
    )
    
    documents = response.get('Items', [])
    
    categorized = {
        'no_expenses': [],
        'no_ai_description': [],
        'already_processed': [],
        'creative_cloud': []
    }
    
    for doc in documents:
        doc_id = doc.get('documentId', '')
        filename = doc.get('fileName') or doc.get('filename') or ''
        doc_type = doc.get('documentType', '')
        
        needs_processing, reason = check_needs_processing(doc_id)
        
        # Check if it's Creative Cloud
        is_creative_cloud = 'invoice' in filename.lower() and any(x in filename for x in ['(', ')'])
        
        doc_info = {
            'documentId': doc_id,
            'filename': filename,
            'documentType': doc_type,
            's3Key': doc.get('s3Key'),
            'needs_processing': needs_processing,
            'reason': reason
        }
        
        if is_creative_cloud:
            categorized['creative_cloud'].append(doc_info)
            
        if needs_processing:
            categorized[reason].append(doc_info)
        else:
            categorized['already_processed'].append(doc_info)
    
    return categorized

def reprocess_document(doc_info: Dict, doc_type_override: str = None) -> Tuple[bool, str]:
    """Reprocess a single document"""
    doc_id = doc_info['documentId']
    filename = doc_info['filename']
    doc_type = doc_type_override or doc_info['documentType']
    
    print_info(f"Reprocessing: {filename}")
    
    # Delete existing expenses first
    expense_response = expenses_table.scan(
        FilterExpression='documentId = :did',
        ExpressionAttributeValues={':did': doc_id}
    )
    
    for expense in expense_response.get('Items', []):
        expenses_table.delete_item(
            Key={
                'userId': expense.get('userId', USER_ID),
                'expenseId': expense['expenseId']
            }
        )
    
    # Call process endpoint to reprocess
    try:
        process_data = {
            'userId': USER_ID,
            'documentId': doc_id,
            'documentType': doc_type,
            'forceReprocess': True
        }
        
        resp = requests.post(
            f"{API_BASE_URL}/documents/process",
            json=process_data,
            timeout=300
        )
        
        if resp.status_code == 200:
            result = resp.json()
            expense_count = result.get('extractedData', {}).get('amount', 0)
            return True, f"{expense_count} expenses extracted"
        else:
            return False, f"HTTP {resp.status_code}"
            
    except Exception as e:
        return False, str(e)

def main():
    print_header("Smart Receipt Processor")
    
    # Check servers
    try:
        requests.get("http://localhost:3000/api/health", timeout=2)
        print_success("Next.js server is running")
    except:
        print_error("Next.js server is not running")
        return
    
    try:
        requests.get("http://localhost:8000/health", timeout=2)
        print_success("Expense processor server is running")
    except:
        print_warning("Expense processor not running - AI descriptions won't be generated")
    
    # Get document status
    print_info("Analyzing document processing status...")
    categorized = get_documents_by_status()
    
    # Show summary
    print_header("Processing Status Summary")
    print(f"✓ Fully processed: {len(categorized['already_processed'])}")
    print(f"✗ No expenses extracted: {len(categorized['no_expenses'])}")
    print(f"⚠ No AI descriptions: {len(categorized['no_ai_description'])}")
    print(f"📄 Creative Cloud invoices: {len(categorized['creative_cloud'])}")
    
    # Show Creative Cloud that need processing
    cc_need_processing = [d for d in categorized['creative_cloud'] if d['needs_processing']]
    if cc_need_processing:
        print(f"\n{Colors.YELLOW}Creative Cloud invoices needing processing: {len(cc_need_processing)}{Colors.END}")
        for doc in cc_need_processing[:5]:
            print(f"  • {doc['filename']}")
        if len(cc_need_processing) > 5:
            print(f"  ... and {len(cc_need_processing) - 5} more")
    
    # Show other failed documents
    if categorized['no_expenses']:
        print(f"\n{Colors.RED}Documents with 0 expenses:{Colors.END}")
        by_type = defaultdict(list)
        for doc in categorized['no_expenses']:
            # Skip Creative Cloud as they're handled separately
            if doc not in categorized['creative_cloud']:
                by_type[doc['documentType']].append(doc)
        
        for doc_type, docs in by_type.items():
            if docs:
                print(f"\n  {doc_type} ({len(docs)} files):")
                for doc in docs[:3]:
                    print(f"    • {doc['filename']}")
                if len(docs) > 3:
                    print(f"    ... and {len(docs) - 3} more")
    
    # Ask what to process
    print("\n" + "="*60)
    print("What would you like to process?")
    print("1. Creative Cloud invoices only")
    print("2. All failed documents (0 expenses)")
    print("3. Documents without AI descriptions")
    print("4. Everything that needs processing")
    print("5. Cancel")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == '5':
        print("Cancelled.")
        return
    
    # Determine what to process
    to_process = []
    
    if choice == '1':
        to_process = [(d, 'creative-cloud-receipts') for d in cc_need_processing]
    elif choice == '2':
        to_process = [(d, None) for d in categorized['no_expenses']]
    elif choice == '3':
        to_process = [(d, None) for d in categorized['no_ai_description']]
    elif choice == '4':
        all_need_processing = []
        for d in categorized['no_expenses']:
            if d not in all_need_processing:
                all_need_processing.append(d)
        for d in categorized['no_ai_description']:
            if d not in all_need_processing:
                all_need_processing.append(d)
        
        # Add Creative Cloud with special type
        for d in cc_need_processing:
            to_process.append((d, 'creative-cloud-receipts'))
        
        # Add others with their original type
        for d in all_need_processing:
            if d not in categorized['creative_cloud']:
                to_process.append((d, None))
    else:
        print("Invalid choice.")
        return
    
    if not to_process:
        print_success("Nothing to process!")
        return
    
    print(f"\n{Colors.CYAN}Processing {len(to_process)} documents...{Colors.END}")
    
    # Process documents
    success_count = 0
    fail_count = 0
    
    for i, (doc_info, type_override) in enumerate(to_process, 1):
        print(f"\n[{i}/{len(to_process)}] {doc_info['filename']}")
        
        success, message = reprocess_document(doc_info, type_override)
        
        if success:
            success_count += 1
            print_success(f"Processed: {message}")
        else:
            fail_count += 1
            print_error(f"Failed: {message}")
        
        # Small delay
        if i < len(to_process):
            time.sleep(1)
    
    # Summary
    print_header("Processing Complete")
    print_success(f"Successful: {success_count}")
    if fail_count > 0:
        print_error(f"Failed: {fail_count}")
    
    print_info("\nView results at: http://localhost:3000/dashboard/god-mode")

if __name__ == "__main__":
    main() 