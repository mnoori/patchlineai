#!/usr/bin/env python3
"""
Get Actual Processed Files
==========================

Map document IDs from TaxExpenses table back to filenames using Documents table.
"""

import os
import boto3
from pathlib import Path
import json
from collections import defaultdict

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
expenses_table = dynamodb.Table('TaxExpenses-dev')
documents_table = dynamodb.Table('Documents-staging')

def get_processed_files():
    """Get all processed files by mapping document IDs"""
    
    print("\n" + "="*60)
    print("MAPPING DOCUMENT IDS TO FILENAMES")
    print("="*60 + "\n")
    
    # Get all expenses
    print("Getting all expenses...")
    response = expenses_table.scan()
    expenses = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = expenses_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        expenses.extend(response.get('Items', []))
    
    print(f"Found {len(expenses)} expenses")
    
    # Get unique document IDs
    doc_ids = set()
    for expense in expenses:
        doc_id = expense.get('documentId')
        if doc_id:
            doc_ids.add(doc_id)
    
    print(f"Unique document IDs: {len(doc_ids)}")
    
    # Get all documents
    print("Getting all documents...")
    doc_response = documents_table.scan()
    documents = doc_response.get('Items', [])
    
    print(f"Found {len(documents)} documents in Documents table")
    
    # Create mapping from document ID to filename
    id_to_filename = {}
    for doc in documents:
        doc_id = doc.get('documentId')
        filename = doc.get('fileName') or doc.get('filename', '')
        if doc_id and filename:
            id_to_filename[doc_id] = filename
    
    print(f"Documents with filenames: {len(id_to_filename)}")
    
    # Map processed document IDs to filenames
    processed_files = []
    unmapped_docs = []
    
    for doc_id in doc_ids:
        if doc_id in id_to_filename:
            processed_files.append(id_to_filename[doc_id])
        else:
            unmapped_docs.append(doc_id)
    
    print(f"\nMapped to filenames: {len(processed_files)}")
    print(f"Unmapped document IDs: {len(unmapped_docs)}")
    
    # Remove duplicates and sort
    unique_files = sorted(list(set(processed_files)))
    
    print(f"Unique processed files: {len(unique_files)}")
    
    # Show some examples
    print(f"\nSample processed files:")
    for i, filename in enumerate(unique_files[:10]):
        print(f"  {i+1}. {filename}")
    
    if len(unique_files) > 10:
        print(f"  ... and {len(unique_files) - 10} more")
    
    # Save the complete list
    with open('all-actually-processed-files.txt', 'w') as f:
        for filename in unique_files:
            f.write(filename + '\n')
    
    # Also save unmapped document IDs for investigation
    with open('unmapped-document-ids.txt', 'w') as f:
        for doc_id in unmapped_docs:
            f.write(doc_id + '\n')
    
    # Create a summary
    summary = {
        'total_expenses': len(expenses),
        'unique_document_ids': len(doc_ids),
        'documents_in_table': len(documents),
        'mapped_files': len(unique_files),
        'unmapped_documents': len(unmapped_docs),
        'processed_files': unique_files,
        'sample_unmapped_ids': unmapped_docs[:10]
    }
    
    with open('processing-summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total expenses in database: {len(expenses)}")
    print(f"Unique documents processed: {len(doc_ids)}")
    print(f"Files we can identify: {len(unique_files)}")
    print(f"Files saved to: all-actually-processed-files.txt")
    print(f"Unmapped IDs saved to: unmapped-document-ids.txt")
    print(f"Summary saved to: processing-summary.json")
    
    # Show some recent unmapped document IDs with their expense info
    if unmapped_docs:
        print(f"\nSample unmapped documents (recent):")
        recent_unmapped = unmapped_docs[:5]
        
        for doc_id in recent_unmapped:
            # Find an expense for this document
            for expense in expenses:
                if expense.get('documentId') == doc_id:
                    print(f"\n  Document ID: {doc_id}")
                    print(f"  Description: {expense.get('description', 'N/A')}")
                    print(f"  Vendor: {expense.get('vendor', 'N/A')}")
                    print(f"  Amount: ${expense.get('amount', 'N/A')}")
                    print(f"  Created: {expense.get('createdAt', 'N/A')}")
                    break
    
    return unique_files

if __name__ == "__main__":
    processed_files = get_processed_files() 