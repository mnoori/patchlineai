#!/usr/bin/env python3
"""
Analyze folder vs database status for tax documents
"""

import os
import sys
import boto3
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
from collections import defaultdict

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Table names
DOCUMENTS_TABLE = 'Documents-staging'
EXPENSES_TABLE = 'TaxExpenses-dev'

def analyze_folder_status(folder_path):
    """Analyze what's in folder vs database"""
    
    # Get PDF files in folder
    pdf_files = set()
    for file in os.listdir(folder_path):
        if file.lower().endswith('.pdf'):
            pdf_files.add(file)
    
    print(f"\n📁 FOLDER ANALYSIS")
    print(f"{'='*60}")
    print(f"Folder: {folder_path}")
    print(f"PDF files found: {len(pdf_files)}")
    
    # Get documents from database
    table = dynamodb.Table(DOCUMENTS_TABLE)
    response = table.scan(
        FilterExpression='userId = :uid',
        ExpressionAttributeValues={':uid': 'default-user'}
    )
    
    db_docs = {}
    status_counts = defaultdict(int)
    
    for item in response.get('Items', []):
        filename = item.get('filename', item.get('originalFilename', 'Unknown'))
        db_docs[filename] = {
            'documentId': item.get('documentId'),
            'status': item.get('status', 'unknown'),
            'createdAt': item.get('createdAt', 'unknown'),
            's3Key': item.get('s3Key')
        }
        status_counts[item.get('status', 'unknown')] += 1
    
    print(f"\n💾 DATABASE ANALYSIS")
    print(f"{'='*60}")
    print(f"Total documents in database: {len(db_docs)}")
    print(f"\nStatus breakdown:")
    for status, count in sorted(status_counts.items()):
        print(f"  • {status}: {count}")
    
    # Compare folder vs database
    in_folder_only = pdf_files - set(db_docs.keys())
    in_db_only = set(db_docs.keys()) - pdf_files
    in_both = pdf_files & set(db_docs.keys())
    
    print(f"\n🔍 COMPARISON")
    print(f"{'='*60}")
    print(f"Files in folder only (not in DB): {len(in_folder_only)}")
    print(f"Files in DB only (not in folder): {len(in_db_only)}")
    print(f"Files in both: {len(in_both)}")
    
    # Check for documents from this folder specifically
    folder_docs = []
    for filename, info in db_docs.items():
        if filename in pdf_files:
            folder_docs.append((filename, info))
    
    print(f"\n📊 DOCUMENTS FROM THIS FOLDER")
    print(f"{'='*60}")
    print(f"Found {len(folder_docs)} documents from this folder in database")
    
    if folder_docs:
        # Group by status
        by_status = defaultdict(list)
        for filename, info in folder_docs:
            by_status[info['status']].append(filename)
        
        for status, files in sorted(by_status.items()):
            print(f"\n{status.upper()} ({len(files)} files):")
            for file in files[:5]:  # Show first 5
                print(f"  • {file}")
            if len(files) > 5:
                print(f"  ... and {len(files) - 5} more")
    
    # Check expenses
    exp_table = dynamodb.Table(EXPENSES_TABLE)
    
    # Count expenses for documents from this folder
    expense_counts = {}
    for filename, info in folder_docs:
        doc_id = info['documentId']
        try:
            exp_response = exp_table.query(
                IndexName='documentId-index',
                KeyConditionExpression='documentId = :doc_id',
                ExpressionAttributeValues={':doc_id': doc_id}
            )
            expense_counts[filename] = len(exp_response.get('Items', []))
        except:
            expense_counts[filename] = 0
    
    print(f"\n💰 EXPENSE CREATION STATUS")
    print(f"{'='*60}")
    
    with_expenses = sum(1 for count in expense_counts.values() if count > 0)
    without_expenses = sum(1 for count in expense_counts.values() if count == 0)
    
    print(f"Documents with expenses: {with_expenses}")
    print(f"Documents without expenses: {without_expenses}")
    
    if without_expenses > 0:
        print(f"\n⚠️  {without_expenses} documents have no expenses created!")
        print("This likely means the expense processor needs fixing.")
    
    # Summary recommendations
    print(f"\n💡 RECOMMENDATIONS")
    print(f"{'='*60}")
    
    if len(in_folder_only) > 0:
        print(f"• {len(in_folder_only)} new files need to be processed")
    
    if without_expenses > 0:
        print(f"• {without_expenses} documents need expense re-processing")
        print("  (The expense processor may need to be restarted with fixes)")
    
    if status_counts.get('processing', 0) > 0:
        print(f"• {status_counts['processing']} documents stuck in 'processing' status")
        print("  (These may need to be re-processed)")
    
    print(f"\n✅ To process all files, run:")
    print(f"   python complete-folder-rerun.py")
    print(f"\n✅ To force re-process everything:")
    print(f"   python complete-folder-rerun.py --force")

if __name__ == '__main__':
    folder = r'C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified'
    
    if len(sys.argv) > 1:
        folder = sys.argv[1]
    
    if not os.path.exists(folder):
        print(f"Error: Folder not found: {folder}")
        sys.exit(1)
    
    analyze_folder_status(folder) 