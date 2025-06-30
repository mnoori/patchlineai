#!/usr/bin/env python3
"""
Get Recently Processed Files
============================

This script shows files that were processed recently (in the last X hours)
so you can identify which ones to move.
"""

import os
import boto3
from datetime import datetime, timedelta, timezone
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
expenses_table = dynamodb.Table('TaxExpenses-dev')

def get_recent_documents(hours_ago=24, user_id='default-user'):
    """Get documents processed in the last X hours"""
    
    # Calculate cutoff time
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    
    # Get all documents
    response = documents_table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    documents = response.get('Items', [])
    recent_docs = []
    
    for doc in documents:
        # Check createdAt timestamp
        created_at_str = doc.get('createdAt', '')
        if created_at_str:
            try:
                # Parse ISO format timestamp
                if 'T' in created_at_str:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                else:
                    # Handle other formats if needed
                    continue
                
                # Check if recent
                if created_at > cutoff_time:
                    recent_docs.append({
                        'filename': doc.get('fileName') or doc.get('filename', 'Unknown'),
                        'documentId': doc.get('documentId'),
                        'createdAt': created_at_str,
                        'documentType': doc.get('documentType', 'unknown'),
                        's3Key': doc.get('s3Key', '')
                    })
            except Exception as e:
                print(f"Error parsing date for {doc.get('documentId')}: {e}")
    
    # Sort by creation time (newest first)
    recent_docs.sort(key=lambda x: x['createdAt'], reverse=True)
    
    return recent_docs

def get_creative_cloud_files(hours_ago=24):
    """Get Creative Cloud files processed recently"""
    recent_docs = get_recent_documents(hours_ago)
    
    creative_cloud = []
    for doc in recent_docs:
        filename = doc['filename'].lower()
        if 'invoice' in filename and any(x in filename for x in ['(', ')']):
            creative_cloud.append(doc)
    
    return creative_cloud

def main():
    print("\n" + "="*60)
    print("RECENTLY PROCESSED FILES")
    print("="*60 + "\n")
    
    # Ask for time range
    print("How far back should I look?")
    print("1. Last hour")
    print("2. Last 6 hours")
    print("3. Last 24 hours")
    print("4. Last 48 hours")
    print("5. Last week")
    
    choice = input("\nEnter choice (1-5) [default: 3]: ").strip() or '3'
    
    hours_map = {
        '1': 1,
        '2': 6,
        '3': 24,
        '4': 48,
        '5': 168
    }
    
    hours_ago = hours_map.get(choice, 24)
    
    # Get recent documents
    print(f"\nGetting files from the last {hours_ago} hours...")
    recent_docs = get_recent_documents(hours_ago)
    
    if not recent_docs:
        print("No files processed in this time range.")
        return
    
    print(f"\nFound {len(recent_docs)} recently processed files\n")
    
    # Group by document type
    by_type = {}
    for doc in recent_docs:
        doc_type = doc['documentType']
        if doc_type not in by_type:
            by_type[doc_type] = []
        by_type[doc_type].append(doc)
    
    # Show files by type
    for doc_type, docs in by_type.items():
        print(f"\n{doc_type.upper()} ({len(docs)} files):")
        print("-" * 50)
        
        for doc in docs:
            # Parse and format the timestamp
            created_at_str = doc['createdAt']
            try:
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                time_str = created_at.strftime('%Y-%m-%d %H:%M:%S')
            except:
                time_str = created_at_str
            
            print(f"{doc['filename']:<50} {time_str}")
    
    # Check for Creative Cloud files
    print("\n" + "="*60)
    cc_files = get_creative_cloud_files(hours_ago)
    if cc_files:
        print(f"\nCREATIVE CLOUD INVOICES ({len(cc_files)} files):")
        print("-" * 50)
        for doc in cc_files:
            print(doc['filename'])
    
    # Save to file
    output_file = f'recent-files-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'
    output_data = {
        'time_range': f'Last {hours_ago} hours',
        'generated_at': datetime.now().isoformat(),
        'total_files': len(recent_docs),
        'by_type': {
            doc_type: [d['filename'] for d in docs]
            for doc_type, docs in by_type.items()
        },
        'creative_cloud': [d['filename'] for d in cc_files],
        'all_files': [d['filename'] for d in recent_docs]
    }
    
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n\nFile list saved to: {output_file}")
    
    # Show just filenames for easy copying
    print("\n" + "="*60)
    print("ALL FILENAMES (for easy copying):")
    print("="*60)
    for doc in recent_docs:
        print(doc['filename'])
    
    print(f"\n\nTotal: {len(recent_docs)} files")

if __name__ == "__main__":
    main() 