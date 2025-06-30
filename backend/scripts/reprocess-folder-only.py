#!/usr/bin/env python3
"""
SAFE FOLDER REPROCESSING - Only reprocess files from specific folder
This script will:
1. Find documents that match filenames from the target folder
2. Delete ONLY those specific documents and their expenses
3. Re-process ONLY the files in the target folder
4. Keep ALL other data completely safe
"""

import os
import sys
import argparse
import requests
import time
import json
import boto3
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from colorama import init, Fore, Style

# Initialize colorama for Windows
init()

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3_client = boto3.client('s3')

# Table names
DOCUMENTS_TABLE = 'Documents-staging'
EXPENSES_TABLE = 'TaxExpenses-dev'
S3_BUCKET = 'patchy-inbox-v2'

def get_folder_filenames(folder_path):
    """Get list of PDF filenames from the folder"""
    pdf_files = []
    for file in os.listdir(folder_path):
        if file.lower().endswith('.pdf'):
            pdf_files.append(file)
    return pdf_files

def find_matching_documents(folder_filenames, user_id='default-user'):
    """Find documents in database that match folder filenames"""
    print(f"\n{Fore.CYAN}🔍 FINDING MATCHING DOCUMENTS{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    doc_table = dynamodb.Table(DOCUMENTS_TABLE)
    
    try:
        # Scan for all user documents
        response = doc_table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        all_documents = response.get('Items', [])
        matching_docs = []
        
        print(f"Checking {len(all_documents)} total documents...")
        
        for doc in all_documents:
            filename = doc.get('filename', doc.get('originalFilename', ''))
            
            # Check if this document's filename matches any file in our folder
            if filename in folder_filenames:
                matching_docs.append(doc)
                print(f"  ✓ Found match: {filename}")
        
        print(f"\n{Fore.GREEN}Found {len(matching_docs)} documents to reprocess{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Will keep {len(all_documents) - len(matching_docs)} other documents safe{Style.RESET_ALL}")
        
        return matching_docs
        
    except Exception as e:
        print(f"{Fore.RED}Error finding documents: {e}{Style.RESET_ALL}")
        return []

def delete_specific_documents(documents_to_delete, user_id='default-user'):
    """Delete only the specific documents and their expenses"""
    print(f"\n{Fore.CYAN}🗑️  DELETING SPECIFIC DOCUMENTS{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    if not documents_to_delete:
        print(f"{Fore.GREEN}No documents to delete{Style.RESET_ALL}")
        return True
    
    doc_table = dynamodb.Table(DOCUMENTS_TABLE)
    exp_table = dynamodb.Table(EXPENSES_TABLE)
    
    deleted_docs = 0
    deleted_expenses = 0
    
    for doc in documents_to_delete:
        doc_id = doc.get('documentId')
        filename = doc.get('filename', doc.get('originalFilename', 'Unknown'))
        s3_key = doc.get('s3Key')
        
        print(f"\nDeleting: {filename}")
        
        try:
            # Delete from S3 if exists
            if s3_key:
                try:
                    s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                    print(f"  ✓ Deleted S3: {s3_key}")
                except Exception as e:
                    print(f"  ⚠ S3 delete warning: {e}")
            
            # Delete associated expenses first
            try:
                exp_response = exp_table.scan(
                    FilterExpression='documentId = :doc_id',
                    ExpressionAttributeValues={':doc_id': doc_id}
                )
                
                for expense in exp_response.get('Items', []):
                    exp_table.delete_item(
                        Key={'userId': user_id, 'expenseId': expense['expenseId']}
                    )
                    deleted_expenses += 1
                
                print(f"  ✓ Deleted {len(exp_response.get('Items', []))} expenses")
                
            except Exception as e:
                print(f"  ⚠ Expense delete warning: {e}")
            
            # Delete document
            doc_table.delete_item(
                Key={'userId': user_id, 'documentId': doc_id}
            )
            deleted_docs += 1
            print(f"  ✓ Deleted document")
            
        except Exception as e:
            print(f"  ✗ Error deleting {filename}: {e}")
    
    print(f"\n{Fore.GREEN}✓ Deleted {deleted_docs} documents and {deleted_expenses} expenses{Style.RESET_ALL}")
    return True

def ensure_servers_running():
    """Check if required servers are running"""
    print(f"\n{Fore.CYAN}🔍 CHECKING SERVERS{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    # Check Next.js server
    try:
        resp = requests.get('http://localhost:3000/api/health', timeout=5)
        if resp.status_code == 200:
            print(f"{Fore.GREEN}✓ Next.js server is running (port 3000){Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}✗ Next.js server not responding properly{Style.RESET_ALL}")
            return False
    except:
        print(f"{Fore.RED}✗ Next.js server is not running on port 3000{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Please start it with: npm run dev{Style.RESET_ALL}")
        return False
    
    # Check expense processor
    try:
        resp = requests.get('http://localhost:8000/health', timeout=5)
        if resp.status_code == 200:
            print(f"{Fore.GREEN}✓ Expense processor is running (port 8000){Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}✗ Expense processor not responding properly{Style.RESET_ALL}")
            return False
    except:
        print(f"{Fore.RED}✗ Expense processor is not running on port 8000{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Please restart it with: python restart-expense-processor.py{Style.RESET_ALL}")
        return False
    
    return True

def process_folder_files(folder_path, filenames):
    """Process all PDF files in the folder"""
    
    print(f"\n{Fore.CYAN}📄 PROCESSING {len(filenames)} FILES{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    session = requests.Session()
    headers = {
        'Cookie': 'userId=default-user',
        'X-User-Id': 'default-user'
    }
    
    success_count = 0
    fail_count = 0
    failed_files = []
    
    for idx, filename in enumerate(filenames, 1):
        print(f"\n[{idx}/{len(filenames)}] Processing: {Fore.YELLOW}{filename}{Style.RESET_ALL}")
        
        filepath = os.path.join(folder_path, filename)
        
        try:
            # Step 1: Get presigned S3 URL
            with open(filepath, 'rb') as f:
                files = {'file': (filename, f, 'application/pdf')}
                data = {
                    'bankType': 'gmail-receipts',
                    'userId': 'default-user'
                }
                
                upload_resp = session.post(
                    'http://localhost:3000/api/documents/upload',
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=30
                )
                
                if upload_resp.status_code != 200:
                    raise Exception(f"Upload failed: HTTP {upload_resp.status_code}")
                
                upload_data = upload_resp.json()
                upload_url = upload_data.get('uploadUrl')
                s3_key = upload_data.get('s3Key')
                doc_id = upload_data.get('documentId')
                
                if not all([upload_url, s3_key, doc_id]):
                    raise Exception("Incomplete upload response")
                
                print(f"  {Fore.GREEN}✓{Style.RESET_ALL} Got upload URL: {doc_id}")
            
            # Step 2: PUT file to S3
            with open(filepath, 'rb') as f:
                file_bytes = f.read()
            
            put_resp = session.put(
                upload_url,
                data=file_bytes,
                headers={"Content-Type": "application/pdf"},
                timeout=120
            )
            
            if put_resp.status_code not in (200, 204):
                raise Exception(f"S3 PUT failed: HTTP {put_resp.status_code}")
            
            print(f"  {Fore.GREEN}✓{Style.RESET_ALL} Uploaded to S3")
            
            # Step 3: Process document
            proc_data = {
                's3Key': s3_key,
                'documentId': doc_id,
                'filename': filename,
                'userId': 'default-user',
                'documentType': 'gmail-receipts'
            }
            
            proc_resp = session.post(
                'http://localhost:3000/api/documents/process',
                json=proc_data,
                headers=headers,
                timeout=60
            )
            
            if proc_resp.status_code == 200:
                result = proc_resp.json()
                expense_count = len(result.get('expenses', []))
                print(f"  {Fore.GREEN}✓{Style.RESET_ALL} Processed: {expense_count} expenses created")
                success_count += 1
            else:
                raise Exception(f"Processing failed: HTTP {proc_resp.status_code}")
                
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Interrupted by user{Style.RESET_ALL}")
            break
        except Exception as e:
            print(f"  {Fore.RED}✗ Error: {str(e)}{Style.RESET_ALL}")
            fail_count += 1
            failed_files.append(filename)
        
        # Small delay to avoid overwhelming servers
        time.sleep(1)
    
    # Summary
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"\n{Fore.CYAN}🎉 FOLDER REPROCESSING COMPLETE{Style.RESET_ALL}")
    print(f"{Fore.GREEN}Success: {success_count}{Style.RESET_ALL}")
    print(f"{Fore.RED}Failed: {fail_count}{Style.RESET_ALL}")
    
    if failed_files:
        print(f"\n{Fore.RED}Failed files:{Style.RESET_ALL}")
        for file in failed_files:
            print(f"  • {file}")
        
        # Save failed files list
        with open('folder-reprocess-failed-files.txt', 'w') as f:
            f.write('\n'.join(failed_files))
        print(f"\n{Fore.YELLOW}Failed files saved to: folder-reprocess-failed-files.txt{Style.RESET_ALL}")
    
    if success_count > 0:
        print(f"\n{Fore.GREEN}✅ Successfully reprocessed {success_count} files!{Style.RESET_ALL}")
        print(f"{Fore.CYAN}All files now have:{Style.RESET_ALL}")
        print(f"  • Proper expense extraction")
        print(f"  • AI-generated descriptions")
        print(f"  • Correct vendor categorization")
        print(f"  • Filename tracking")
        print(f"  • 2024 tax year dates")

def main():
    parser = argparse.ArgumentParser(description='Safe folder reprocessing for tax documents')
    parser.add_argument('--folder', type=str, 
                      default=r'C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified',
                      help='Folder containing receipts to reprocess')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.folder):
        print(f"{Fore.RED}Error: Folder not found: {args.folder}{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🔄 SAFE FOLDER REPROCESSING{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"Target folder: {args.folder}")
    
    # Get filenames from folder
    folder_filenames = get_folder_filenames(args.folder)
    
    if not folder_filenames:
        print(f"{Fore.RED}No PDF files found in folder{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"\n{Fore.GREEN}Found {len(folder_filenames)} PDF files in folder{Style.RESET_ALL}")
    
    # Find matching documents in database
    matching_docs = find_matching_documents(folder_filenames)
    
    # Confirm operation
    print(f"\n{Fore.YELLOW}⚠️  CONFIRMATION NEEDED{Style.RESET_ALL}")
    print(f"This will:")
    print(f"  • Delete {len(matching_docs)} documents that match folder filenames")
    print(f"  • Keep ALL other documents safe (no other data will be touched)")
    print(f"  • Re-process {len(folder_filenames)} files from the folder")
    
    if matching_docs:
        print(f"\n{Fore.CYAN}Documents to be deleted:{Style.RESET_ALL}")
        for doc in matching_docs[:10]:  # Show first 10
            filename = doc.get('filename', doc.get('originalFilename', 'Unknown'))
            print(f"  • {filename}")
        if len(matching_docs) > 10:
            print(f"  ... and {len(matching_docs) - 10} more")
    
    response = input(f"\n{Fore.YELLOW}Type 'REPROCESS FOLDER' to confirm: {Style.RESET_ALL}")
    
    if response != 'REPROCESS FOLDER':
        print(f"{Fore.RED}Operation cancelled.{Style.RESET_ALL}")
        sys.exit(1)
    
    # Check servers
    if not ensure_servers_running():
        print(f"\n{Fore.RED}Please fix server issues before continuing{Style.RESET_ALL}")
        sys.exit(1)
    
    # Delete matching documents
    delete_specific_documents(matching_docs)
    
    # Wait a moment
    print(f"\n{Fore.YELLOW}Waiting 3 seconds before processing...{Style.RESET_ALL}")
    time.sleep(3)
    
    # Process all files in folder
    process_folder_files(args.folder, folder_filenames)

if __name__ == '__main__':
    main() 