#!/usr/bin/env python3
"""
Check which documents have AI-generated descriptions
====================================================

This script checks all processed documents and identifies:
1. Documents with AI descriptions (successfully processed)
2. Documents without AI descriptions (need reprocessing)
3. Documents with 0 expenses (likely parsing failures)
"""

import os
import boto3
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

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
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')

def check_document_processing_status(user_id='default-user'):
    """Check processing status of all documents"""
    
    print("\n" + "="*80)
    print("DOCUMENT PROCESSING STATUS - AI DESCRIPTION CHECK")
    print("="*80 + "\n")
    
    # Get all documents
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    documents = response.get('Items', [])
    print(f"Total documents found: {len(documents)}\n")
    
    # Categorize documents
    with_ai_desc = []
    without_ai_desc = []
    zero_expenses = []
    creative_cloud_docs = []
    
    for doc in documents:
        doc_id = doc.get('documentId', '')
        filename = doc.get('fileName') or doc.get('filename') or doc.get('originalFilename', 'Unknown')
        doc_type = doc.get('documentType', '')
        
        # Check if it's a Creative Cloud document
        is_creative_cloud = 'invoice' in filename.lower() and any(x in filename for x in ['(', ')'])
        
        # Get expenses for this document
        expense_response = expenses_table.scan(
            FilterExpression='documentId = :did',
            ExpressionAttributeValues={':did': doc_id}
        )
        
        expenses = expense_response.get('Items', [])
        expense_count = len(expenses)
        
        # Check if any expense has AI description
        has_ai_description = False
        for expense in expenses:
            desc = expense.get('description', '')
            # AI descriptions typically have more detailed text
            if len(desc) > 50 or ' - ' in desc:
                has_ai_description = True
                break
        
        doc_info = {
            'documentId': doc_id,
            'filename': filename,
            'type': doc_type,
            'expense_count': expense_count,
            'has_ai_desc': has_ai_description,
            'is_creative_cloud': is_creative_cloud
        }
        
        if is_creative_cloud:
            creative_cloud_docs.append(doc_info)
        
        if expense_count == 0:
            zero_expenses.append(doc_info)
        elif has_ai_description:
            with_ai_desc.append(doc_info)
        else:
            without_ai_desc.append(doc_info)
    
    # Print summary
    print("SUMMARY:")
    print("-" * 40)
    print(f"✓ With AI descriptions: {len(with_ai_desc)}")
    print(f"✗ Without AI descriptions: {len(without_ai_desc)}")
    print(f"⚠ Zero expenses extracted: {len(zero_expenses)}")
    print(f"📄 Creative Cloud invoices: {len(creative_cloud_docs)}")
    
    # Show Creative Cloud documents status
    if creative_cloud_docs:
        print(f"\n\nCREATIVE CLOUD DOCUMENTS ({len(creative_cloud_docs)}):")
        print("="*80)
        for doc in creative_cloud_docs:
            status = "✓" if doc['has_ai_desc'] else "✗"
            print(f"{status} {doc['filename']} - {doc['expense_count']} expenses")
    
    # Show documents without AI descriptions
    if without_ai_desc:
        print(f"\n\nDOCUMENTS WITHOUT AI DESCRIPTIONS ({len(without_ai_desc)}):")
        print("="*80)
        for doc in without_ai_desc[:20]:  # Show first 20
            print(f"  • {doc['filename']} ({doc['expense_count']} expenses)")
        if len(without_ai_desc) > 20:
            print(f"  ... and {len(without_ai_desc) - 20} more")
    
    # Show zero expense documents
    if zero_expenses:
        print(f"\n\nDOCUMENTS WITH ZERO EXPENSES ({len(zero_expenses)}):")
        print("="*80)
        
        # Group by type
        by_type = defaultdict(list)
        for doc in zero_expenses:
            if doc['is_creative_cloud']:
                by_type['Creative Cloud'].append(doc)
            else:
                by_type[doc['type']].append(doc)
        
        for doc_type, docs in by_type.items():
            print(f"\n{doc_type} ({len(docs)} files):")
            for doc in docs[:10]:
                print(f"  • {doc['filename']}")
            if len(docs) > 10:
                print(f"  ... and {len(docs) - 10} more")
    
    # Save lists for further processing
    output = {
        'with_ai_descriptions': [d['filename'] for d in with_ai_desc],
        'without_ai_descriptions': [d['filename'] for d in without_ai_desc],
        'zero_expenses': [d['filename'] for d in zero_expenses],
        'creative_cloud': [d['filename'] for d in creative_cloud_docs],
        'summary': {
            'total': len(documents),
            'with_ai_desc': len(with_ai_desc),
            'without_ai_desc': len(without_ai_desc),
            'zero_expenses': len(zero_expenses),
            'creative_cloud': len(creative_cloud_docs)
        }
    }
    
    with open('processing-status-detailed.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n\nDetailed status saved to: processing-status-detailed.json")
    
    return output

def get_documents_needing_reprocessing():
    """Get list of document IDs that need reprocessing"""
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': 'default-user'}
    )
    
    needs_reprocessing = []
    
    for doc in response.get('Items', []):
        doc_id = doc.get('documentId', '')
        filename = doc.get('fileName') or doc.get('filename') or ''
        
        # Check expenses
        expense_response = expenses_table.scan(
            FilterExpression='documentId = :did',
            ExpressionAttributeValues={':did': doc_id}
        )
        
        expenses = expense_response.get('Items', [])
        
        # Check if needs reprocessing
        if len(expenses) == 0:
            needs_reprocessing.append({
                'documentId': doc_id,
                'filename': filename,
                'reason': 'no_expenses'
            })
        else:
            # Check for AI descriptions
            has_good_desc = any(len(e.get('description', '')) > 50 for e in expenses)
            if not has_good_desc:
                needs_reprocessing.append({
                    'documentId': doc_id,
                    'filename': filename,
                    'reason': 'no_ai_description'
                })
    
    return needs_reprocessing

if __name__ == "__main__":
    status = check_document_processing_status()
    
    print("\n\nRECOMMENDATIONS:")
    print("="*80)
    
    if status['summary']['creative_cloud'] > 0:
        print(f"\n1. Creative Cloud Invoices:")
        print(f"   - Found {status['summary']['creative_cloud']} Creative Cloud invoices")
        print(f"   - These need special parsing logic")
        print(f"   - Run: python process-creative-cloud.py")
    
    if status['summary']['zero_expenses'] > 0:
        print(f"\n2. Failed Extractions:")
        print(f"   - {status['summary']['zero_expenses']} documents extracted 0 expenses")
        print(f"   - These need reprocessing with better parsers")
    
    if status['summary']['without_ai_desc'] > 0:
        print(f"\n3. Missing AI Descriptions:")
        print(f"   - {status['summary']['without_ai_desc']} documents lack AI descriptions")
        print(f"   - May need to ensure expense processor is running") 