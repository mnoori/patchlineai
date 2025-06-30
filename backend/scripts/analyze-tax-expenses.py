#!/usr/bin/env python3
"""
Analyze Tax Expenses Table
==========================

Work backwards from the TaxExpenses table to see what's actually been processed.
"""

import os
import boto3
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import json

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

def analyze_expenses():
    """Analyze all expenses in the TaxExpenses table"""
    
    print("\n" + "="*60)
    print("ANALYZING TAX EXPENSES TABLE")
    print("="*60 + "\n")
    
    # Scan the expenses table
    response = expenses_table.scan()
    expenses = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = expenses_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        expenses.extend(response.get('Items', []))
    
    print(f"Total expenses found: {len(expenses)}")
    
    if not expenses:
        print("No expenses found!")
        return
    
    # Group by documentId
    by_document = defaultdict(list)
    for expense in expenses:
        doc_id = expense.get('documentId', 'NO_DOCUMENT_ID')
        by_document[doc_id].append(expense)
    
    print(f"Unique documents: {len(by_document)}")
    
    # Extract unique filenames
    unique_filenames = set()
    filenames_by_docid = {}
    
    for doc_id, doc_expenses in by_document.items():
        # Try to get filename from expense record
        for expense in doc_expenses:
            filename = expense.get('filename', '')
            if filename:
                unique_filenames.add(filename)
                filenames_by_docid[doc_id] = filename
                break
    
    print(f"Unique filenames found in expenses: {len(unique_filenames)}")
    
    # Show recent expenses
    print("\n" + "="*60)
    print("RECENT EXPENSES (Last 10)")
    print("="*60)
    
    # Sort by createdAt
    sorted_expenses = sorted(expenses, 
                           key=lambda x: x.get('createdAt', ''), 
                           reverse=True)
    
    for i, expense in enumerate(sorted_expenses[:10]):
        print(f"\n{i+1}. Created: {expense.get('createdAt', 'N/A')}")
        print(f"   Description: {expense.get('description', 'N/A')}")
        print(f"   Amount: ${expense.get('amount', 'N/A')}")
        print(f"   Vendor: {expense.get('vendor', 'N/A')}")
        print(f"   Document ID: {expense.get('documentId', 'N/A')}")
        print(f"   Filename: {expense.get('filename', 'N/A')}")
    
    # Analyze document patterns
    print("\n" + "="*60)
    print("DOCUMENT PATTERNS")
    print("="*60)
    
    # Count expenses per document
    doc_counts = [(doc_id, len(expenses)) for doc_id, expenses in by_document.items()]
    doc_counts.sort(key=lambda x: x[1], reverse=True)
    
    print("\nDocuments with most expenses:")
    for doc_id, count in doc_counts[:10]:
        filename = filenames_by_docid.get(doc_id, 'Unknown')
        print(f"  {filename}: {count} expenses")
    
    # Check for Creative Cloud patterns
    print("\n" + "="*60)
    print("LOOKING FOR CREATIVE CLOUD")
    print("="*60)
    
    cc_docs = []
    for doc_id, doc_expenses in by_document.items():
        for expense in doc_expenses:
            desc = expense.get('description', '').lower()
            vendor = expense.get('vendor', '').lower()
            filename = expense.get('filename', '').lower()
            
            if any(term in desc or term in vendor or term in filename 
                   for term in ['adobe', 'creative cloud', 'invoice']):
                cc_docs.append({
                    'documentId': doc_id,
                    'filename': expense.get('filename', 'Unknown'),
                    'description': expense.get('description', ''),
                    'vendor': expense.get('vendor', ''),
                    'amount': expense.get('amount', '')
                })
                break
    
    print(f"Found {len(cc_docs)} documents that might be Creative Cloud:")
    for doc in cc_docs[:10]:
        print(f"\n  File: {doc['filename']}")
        print(f"  Vendor: {doc['vendor']}")
        print(f"  Description: {doc['description']}")
        print(f"  Amount: ${doc['amount']}")
    
    # Cross-check with Documents table
    print("\n" + "="*60)
    print("CROSS-CHECK WITH DOCUMENTS TABLE")
    print("="*60)
    
    # Get all documents
    doc_response = documents_table.scan()
    documents = doc_response.get('Items', [])
    
    doc_ids_in_documents = {doc['documentId'] for doc in documents}
    expense_doc_ids = set(by_document.keys())
    
    # Find mismatches
    in_expenses_not_documents = expense_doc_ids - doc_ids_in_documents
    in_documents_not_expenses = doc_ids_in_documents - expense_doc_ids
    
    print(f"\nDocument IDs in Expenses but NOT in Documents table: {len(in_expenses_not_documents)}")
    print(f"Document IDs in Documents but NOT in Expenses table: {len(in_documents_not_expenses)}")
    
    if in_expenses_not_documents:
        print("\nSample document IDs only in Expenses:")
        for doc_id in list(in_expenses_not_documents)[:5]:
            filename = filenames_by_docid.get(doc_id, 'Unknown')
            print(f"  {doc_id}: {filename}")
    
    # Save full analysis
    output = {
        'total_expenses': len(expenses),
        'unique_documents': len(by_document),
        'unique_filenames': list(unique_filenames),
        'documents_in_expenses_only': list(in_expenses_not_documents),
        'sample_expenses': [
            {
                'documentId': e.get('documentId'),
                'filename': e.get('filename'),
                'description': e.get('description'),
                'amount': str(e.get('amount', '')),
                'createdAt': e.get('createdAt')
            }
            for e in sorted_expenses[:20]
        ]
    }
    
    with open('tax-expenses-analysis.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n\nFull analysis saved to: tax-expenses-analysis.json")
    
    # Save just the unique filenames
    with open('processed-files-from-expenses.txt', 'w') as f:
        for filename in sorted(unique_filenames):
            f.write(filename + '\n')
    
    print(f"Unique filenames saved to: processed-files-from-expenses.txt")
    print(f"\nTotal unique files processed: {len(unique_filenames)}")

if __name__ == "__main__":
    analyze_expenses() 