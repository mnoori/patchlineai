#!/usr/bin/env python3
"""
Debug Documents in Database
===========================

Shows all documents with their timestamp fields to debug the issue.
"""

import os
import boto3
from datetime import datetime
from pathlib import Path
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
documents_table = dynamodb.Table('Documents-staging')

def debug_documents():
    """Show all documents with their timestamp fields"""
    
    # Get all documents
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': 'default-user'}
    )
    
    documents = response.get('Items', [])
    
    print(f"\nTotal documents found: {len(documents)}\n")
    
    if not documents:
        print("No documents found!")
        return
    
    # Check first few documents to see what fields they have
    print("SAMPLE DOCUMENT STRUCTURE (first document):")
    print("="*60)
    if documents:
        first_doc = documents[0]
        for key, value in first_doc.items():
            if isinstance(value, str) and len(value) > 100:
                print(f"{key}: {value[:100]}...")
            else:
                print(f"{key}: {value}")
    
    print("\n" + "="*60)
    print("\nTIMESTAMP FIELDS FOUND:")
    print("="*60)
    
    # Check what timestamp fields exist
    timestamp_fields = set()
    for doc in documents:
        for key in doc.keys():
            if any(word in key.lower() for word in ['date', 'time', 'created', 'updated', 'processed']):
                timestamp_fields.add(key)
    
    print("Fields that might contain timestamps:", list(timestamp_fields))
    
    # Show recent documents based on different timestamp fields
    print("\n" + "="*60)
    print("RECENT DOCUMENTS BY DIFFERENT TIMESTAMP FIELDS:")
    print("="*60)
    
    # Group by timestamp field
    for field in timestamp_fields:
        print(f"\n\nUsing field: {field}")
        print("-"*40)
        
        docs_with_field = []
        for doc in documents:
            if field in doc and doc[field]:
                docs_with_field.append({
                    'filename': doc.get('fileName') or doc.get('filename', 'Unknown'),
                    'timestamp': doc[field],
                    'documentId': doc.get('documentId'),
                    'documentType': doc.get('documentType', 'unknown')
                })
        
        # Sort by timestamp (try to parse if possible)
        try:
            docs_with_field.sort(key=lambda x: x['timestamp'], reverse=True)
        except:
            pass
        
        # Show top 5
        for i, doc in enumerate(docs_with_field[:5]):
            print(f"{i+1}. {doc['filename']:<40} {doc['timestamp']}")
        
        if len(docs_with_field) > 5:
            print(f"   ... and {len(docs_with_field) - 5} more")
    
    # Show Creative Cloud files specifically
    print("\n\n" + "="*60)
    print("CREATIVE CLOUD FILES:")
    print("="*60)
    
    cc_files = []
    for doc in documents:
        filename = doc.get('fileName') or doc.get('filename', '')
        if 'invoice' in filename.lower() and any(x in filename for x in ['(', ')']):
            cc_files.append({
                'filename': filename,
                'documentId': doc.get('documentId'),
                'createdAt': doc.get('createdAt', 'N/A'),
                'updatedAt': doc.get('updatedAt', 'N/A'),
                'processedAt': doc.get('processedAt', 'N/A'),
                'uploadedAt': doc.get('uploadedAt', 'N/A'),
                'status': doc.get('status', 'unknown')
            })
    
    print(f"\nFound {len(cc_files)} Creative Cloud files:")
    for doc in cc_files[:10]:
        print(f"\n{doc['filename']}")
        print(f"  Status: {doc['status']}")
        print(f"  Created: {doc['createdAt']}")
        print(f"  Updated: {doc['updatedAt']}")
    
    if len(cc_files) > 10:
        print(f"\n... and {len(cc_files) - 10} more")
    
    # Save all documents to JSON for analysis
    output_file = 'debug-documents.json'
    with open(output_file, 'w') as f:
        # Convert any Decimal types to float for JSON serialization
        def decimal_default(obj):
            if hasattr(obj, '__float__'):
                return float(obj)
            raise TypeError
        
        json.dump(documents[:10], f, indent=2, default=decimal_default)
    
    print(f"\n\nFirst 10 documents saved to: {output_file}")

if __name__ == "__main__":
    debug_documents() 