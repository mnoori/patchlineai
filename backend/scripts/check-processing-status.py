#!/usr/bin/env python3
"""
Check processing status of tax documents
========================================

This script checks which receipts were processed successfully and which failed.
It can help identify receipts that need reprocessing.
"""

import os
import boto3
from datetime import datetime
from dotenv import load_dotenv
from collections import defaultdict
import json

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)

# AWS configuration
aws_access_key = os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID')
aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')

aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': aws_access_key,
    'aws_secret_access_key': aws_secret_key
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
s3_client = boto3.client('s3', **aws_config)

# Tables - using correct table names
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

def check_processing_status(user_id='default-user'):
    """Check processing status of all documents"""
    
    print(f"\n{'='*60}")
    print("DOCUMENT PROCESSING STATUS CHECK")
    print(f"{'='*60}\n")
    
    # Get all documents for user - Documents table doesn't have userId as key, need to scan
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    documents = response.get('Items', [])
    print(f"Total documents found: {len(documents)}")
    
    # Categorize documents
    status_counts = defaultdict(int)
    failed_docs = []
    successful_docs = []
    no_expenses_docs = []
    
    for doc in documents:
        doc_id = doc.get('documentId', '')
        doc_type = doc.get('documentType', '')
        filename = doc.get('fileName', 'Unknown')
        status = doc.get('status', 'unknown')
        
        status_counts[status] += 1
        
        # Check if expenses were extracted - scan since no documentId index
        expense_response = expenses_table.scan(
            FilterExpression='documentId = :did',
            ExpressionAttributeValues={':did': doc_id}
        )
        
        expense_count = len(expense_response.get('Items', []))
        
        if status == 'failed':
            failed_docs.append({
                'documentId': doc_id,
                'filename': filename,
                'type': doc_type,
                'error': doc.get('error', 'No error message')
            })
        elif status == 'completed' and expense_count == 0:
            no_expenses_docs.append({
                'documentId': doc_id,
                'filename': filename,
                'type': doc_type,
                's3Key': doc.get('s3Key', '')
            })
        elif status == 'completed':
            successful_docs.append({
                'documentId': doc_id,
                'filename': filename,
                'type': doc_type,
                'expense_count': expense_count
            })
    
    # Print summary
    print("\nSTATUS SUMMARY:")
    print("-" * 30)
    for status, count in status_counts.items():
        print(f"{status}: {count}")
    
    # Print failed documents
    if failed_docs:
        print(f"\n\nFAILED DOCUMENTS ({len(failed_docs)}):")
        print("=" * 60)
        for doc in failed_docs:
            print(f"\nFile: {doc['filename']}")
            print(f"Type: {doc['type']}")
            print(f"ID: {doc['documentId']}")
            print(f"Error: {doc['error']}")
    
    # Print documents with no expenses extracted
    if no_expenses_docs:
        print(f"\n\nCOMPLETED BUT NO EXPENSES EXTRACTED ({len(no_expenses_docs)}):")
        print("=" * 60)
        print("\nThese are likely the Adobe/Splice invoices that failed:")
        
        # Group by type
        by_type = defaultdict(list)
        for doc in no_expenses_docs:
            by_type[doc['type']].append(doc)
        
        for doc_type, docs in by_type.items():
            print(f"\n{doc_type} ({len(docs)} files):")
            for doc in docs[:10]:  # Show first 10
                print(f"  - {doc['filename']}")
            if len(docs) > 10:
                print(f"  ... and {len(docs) - 10} more")
    
    # Save report
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': dict(status_counts),
        'failed_documents': failed_docs,
        'no_expenses_documents': no_expenses_docs,
        'successful_documents': successful_docs
    }
    
    with open('processing-status-report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n\nReport saved to: processing-status-report.json")
    
    # Suggest actions
    if no_expenses_docs:
        print("\n\nSUGGESTED ACTIONS:")
        print("-" * 30)
        print("1. The documents with no expenses likely include:")
        print("   - Adobe Creative Cloud invoices")
        print("   - Splice invoices")
        print("   - Other structured invoices that need special parsing")
        print("\n2. To reprocess these documents:")
        print("   - Run the updated expense processor")
        print("   - Or manually trigger reprocessing for specific documents")
    
    return report

def identify_adobe_splice_docs(no_expenses_docs):
    """Identify likely Adobe and Splice documents"""
    adobe_docs = []
    splice_docs = []
    other_docs = []
    
    for doc in no_expenses_docs:
        filename = doc['filename'].lower()
        
        if 'invoice' in filename and any(x in filename for x in ['(', ')']):
            # Likely Adobe invoice like "invoice (8).pdf"
            adobe_docs.append(doc)
        elif 'splice' in filename:
            splice_docs.append(doc)
        else:
            other_docs.append(doc)
    
    return adobe_docs, splice_docs, other_docs

if __name__ == "__main__":
    # Check processing status
    report = check_processing_status()
    
    # Identify specific document types
    if report['no_expenses_documents']:
        adobe, splice, other = identify_adobe_splice_docs(report['no_expenses_documents'])
        
        if adobe:
            print(f"\n\nLIKELY ADOBE INVOICES ({len(adobe)}):")
            for doc in adobe[:5]:
                print(f"  - {doc['filename']}")
        
        if splice:
            print(f"\n\nLIKELY SPLICE INVOICES ({len(splice)}):")
            for doc in splice[:5]:
                print(f"  - {doc['filename']}") 