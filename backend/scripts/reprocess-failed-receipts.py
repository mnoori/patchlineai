#!/usr/bin/env python3
"""
Reprocess failed receipts (Adobe, Splice, etc.)
===============================================

This script reprocesses documents that were marked as 'completed' but have
no expenses extracted, which typically means the parser didn't handle them correctly.
"""

import os
import boto3
import requests
import time
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
textract_client = boto3.client('textract', **aws_config)

# Tables - using correct table names
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

# Constants
BUCKET_NAME = 'patchy-inbox-v2'  # Correct bucket name
EXPENSE_PROCESSOR_URL = 'http://localhost:8000/process'

def get_failed_documents(user_id='default-user'):
    """Get documents that have no expenses extracted"""
    
    # Get all completed documents
    response = documents_table.query(
        KeyConditionExpression='userId = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    documents = response.get('Items', [])
    failed_docs = []
    
    for doc in documents:
        if doc.get('status') == 'completed':
            doc_id = doc.get('documentId', '')
            
            # Check if expenses exist - use scan since no documentId index
            expense_response = expenses_table.scan(
                FilterExpression='documentId = :did',
                ExpressionAttributeValues={':did': doc_id}
            )
            
            if len(expense_response.get('Items', [])) == 0:
                failed_docs.append(doc)
    
    return failed_docs

def reprocess_document(doc):
    """Reprocess a single document through the expense processor"""
    
    doc_id = doc['documentId']
    s3_key = doc.get('s3Key', '')
    doc_type = doc.get('documentType', 'gmail-receipts')
    filename = doc.get('fileName', 'Unknown')
    
    print(f"\nReprocessing: {filename}")
    print(f"  Document ID: {doc_id}")
    print(f"  Type: {doc_type}")
    
    try:
        # Get Textract data from S3
        textract_key = s3_key.replace('.pdf', '_textract.json')
        
        try:
            response = s3_client.get_object(Bucket=BUCKET_NAME, Key=textract_key)
            textract_data = json.loads(response['Body'].read())
        except:
            print(f"  ❌ No Textract data found. Skipping...")
            return False
        
        # Get the raw text from Textract
        text_content = []
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    text_content.append(text)
        
        full_text = '\n'.join(text_content)
        
        # Call expense processor
        payload = {
            'userId': doc['userId'],
            'documentId': doc_id,
            'bankType': doc_type,
            'textractData': textract_data,
            'fileName': filename
        }
        
        response = requests.post(EXPENSE_PROCESSOR_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            expense_count = len(result.get('expenses', []))
            
            if expense_count > 0:
                print(f"  ✅ Success! Extracted {expense_count} expense(s)")
                
                # Update document status to show it was reprocessed
                documents_table.update_item(
                    Key={'userId': doc['userId'], 'documentId': doc_id},
                    UpdateExpression='SET reprocessedAt = :timestamp',
                    ExpressionAttributeValues={
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                return True
            else:
                print(f"  ⚠️  No expenses extracted after reprocessing")
                return False
        else:
            print(f"  ❌ Error: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False

def main():
    """Main reprocessing function"""
    
    print("="*60)
    print("REPROCESSING FAILED RECEIPTS")
    print("="*60)
    
    # Check if expense processor is running
    try:
        response = requests.get('http://localhost:8000/health', timeout=2)
        print("✓ Expense processor is running")
    except:
        print("❌ Expense processor is not running!")
        print("Please run: python expense-processor-server.py")
        return
    
    # Get failed documents
    print("\nFetching documents with no expenses...")
    failed_docs = get_failed_documents()
    
    if not failed_docs:
        print("No failed documents found!")
        return
    
    # Group by type for analysis
    by_type = defaultdict(list)
    for doc in failed_docs:
        by_type[doc.get('documentType', 'unknown')].append(doc)
    
    print(f"\nFound {len(failed_docs)} documents to reprocess:")
    for doc_type, docs in by_type.items():
        print(f"  - {doc_type}: {len(docs)} documents")
    
    # Identify likely Adobe and Splice documents
    adobe_docs = []
    splice_docs = []
    other_docs = []
    
    for doc in failed_docs:
        filename = doc.get('fileName', '').lower()
        
        if 'invoice' in filename and ('(' in filename or ')' in filename):
            adobe_docs.append(doc)
        elif 'splice' in filename:
            splice_docs.append(doc)
        else:
            other_docs.append(doc)
    
    # Show what we'll reprocess
    if adobe_docs:
        print(f"\nIdentified {len(adobe_docs)} likely Adobe invoices")
    if splice_docs:
        print(f"Identified {len(splice_docs)} likely Splice invoices")
    if other_docs:
        print(f"Identified {len(other_docs)} other documents")
    
    # Ask for confirmation
    response = input("\nProceed with reprocessing? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled.")
        return
    
    # Reprocess documents
    print("\nStarting reprocessing...")
    successful = 0
    failed = 0
    
    for i, doc in enumerate(failed_docs, 1):
        print(f"\n[{i}/{len(failed_docs)}]", end="")
        
        if reprocess_document(doc):
            successful += 1
        else:
            failed += 1
        
        # Rate limiting
        time.sleep(1)
    
    # Summary
    print("\n" + "="*60)
    print("REPROCESSING COMPLETE")
    print("="*60)
    print(f"Total processed: {len(failed_docs)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    if successful > 0:
        print("\n✅ Refresh your browser to see the newly extracted expenses!")

if __name__ == "__main__":
    main() 