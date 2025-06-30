#!/usr/bin/env python3
"""
Complete folder re-run script for tax documents.
Re-processes ALL files in a folder, whether they exist in the database or not.
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

def check_existing_documents(user_id='default-user'):
    """Check what documents already exist in the database"""
    table = dynamodb.Table(DOCUMENTS_TABLE)
    
    try:
        response = table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        existing_docs = {}
        for item in response.get('Items', []):
            filename = item.get('filename', item.get('originalFilename', 'Unknown'))
            existing_docs[filename] = {
                'documentId': item.get('documentId'),
                'status': item.get('status', 'unknown'),
                'createdAt': item.get('createdAt', 'unknown'),
                's3Key': item.get('s3Key')
            }
        
        return existing_docs
    except Exception as e:
        print(f"{Fore.RED}Error checking existing documents: {e}{Style.RESET_ALL}")
        return {}

def delete_document_and_expenses(doc_id, user_id='default-user'):
    """Delete a document and its associated expenses"""
    # Delete from Documents table
    doc_table = dynamodb.Table(DOCUMENTS_TABLE)
    exp_table = dynamodb.Table(EXPENSES_TABLE)
    
    try:
        # Get document details first
        doc_response = doc_table.get_item(
            Key={'userId': user_id, 'documentId': doc_id}
        )
        
        if 'Item' in doc_response:
            # Delete from S3 if exists
            s3_key = doc_response['Item'].get('s3Key')
            if s3_key:
                try:
                    s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                except:
                    pass  # Ignore S3 errors
            
            # Delete document
            doc_table.delete_item(
                Key={'userId': user_id, 'documentId': doc_id}
            )
        
        # Delete associated expenses
        exp_response = exp_table.query(
            IndexName='documentId-index',
            KeyConditionExpression='documentId = :doc_id',
            ExpressionAttributeValues={':doc_id': doc_id}
        )
        
        for expense in exp_response.get('Items', []):
            exp_table.delete_item(
                Key={
                    'userId': user_id,
                    'expenseId': expense['expenseId']
                }
            )
        
        return True
    except Exception as e:
        print(f"{Fore.RED}Error deleting document {doc_id}: {e}{Style.RESET_ALL}")
        return False

def ensure_server_running():
    """Check if Next.js server is running"""
    try:
        resp = requests.get('http://localhost:3000/api/health', timeout=5)
        if resp.status_code == 200:
            print(f"{Fore.GREEN}✓ Next.js server is running{Style.RESET_ALL}")
            return True
    except:
        pass
    
    print(f"{Fore.RED}✗ Next.js server is not running on port 3000{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Please start it with: npm run dev{Style.RESET_ALL}")
    return False

def process_folder_complete(folder_path, force_reprocess=False):
    """Process all files in folder with detailed status"""
    
    if not ensure_server_running():
        return
    
    # Get list of PDF files
    pdf_files = []
    for file in os.listdir(folder_path):
        if file.lower().endswith('.pdf'):
            pdf_files.append(file)
    
    if not pdf_files:
        print(f"{Fore.RED}No PDF files found in {folder_path}{Style.RESET_ALL}")
        return
    
    print(f"\n{Fore.CYAN}Found {len(pdf_files)} PDF files{Style.RESET_ALL}")
    
    # Check existing documents
    print(f"\n{Fore.YELLOW}Checking existing documents in database...{Style.RESET_ALL}")
    existing_docs = check_existing_documents()
    
    # Categorize files
    new_files = []
    existing_files = []
    
    for file in pdf_files:
        if file in existing_docs:
            existing_files.append(file)
        else:
            new_files.append(file)
    
    print(f"\n{Fore.GREEN}New files: {len(new_files)}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Existing files: {len(existing_files)}{Style.RESET_ALL}")
    
    # Show existing files status
    if existing_files:
        print(f"\n{Fore.CYAN}Existing files status:{Style.RESET_ALL}")
        for file in existing_files[:10]:  # Show first 10
            info = existing_docs[file]
            print(f"  • {file}: {info['status']} (created: {info['createdAt'][:10] if len(info['createdAt']) > 10 else info['createdAt']})")
        if len(existing_files) > 10:
            print(f"  ... and {len(existing_files) - 10} more")
    
    # Ask user what to do
    if existing_files and not force_reprocess:
        print(f"\n{Fore.YELLOW}What would you like to do?{Style.RESET_ALL}")
        print("1. Process only NEW files")
        print("2. Re-process ALL files (delete existing and re-upload)")
        print("3. Cancel")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == '3':
            print(f"{Fore.RED}Cancelled.{Style.RESET_ALL}")
            return
        elif choice == '2':
            force_reprocess = True
    
    # Prepare files to process
    files_to_process = []
    
    if force_reprocess:
        # Delete existing documents first
        if existing_files:
            print(f"\n{Fore.YELLOW}Deleting {len(existing_files)} existing documents...{Style.RESET_ALL}")
            deleted = 0
            for file in existing_files:
                doc_id = existing_docs[file]['documentId']
                if delete_document_and_expenses(doc_id):
                    deleted += 1
                    print(f"{Fore.GREEN}✓{Style.RESET_ALL} Deleted: {file}")
                else:
                    print(f"{Fore.RED}✗{Style.RESET_ALL} Failed to delete: {file}")
            print(f"{Fore.GREEN}Deleted {deleted} documents{Style.RESET_ALL}")
        
        files_to_process = pdf_files
    else:
        files_to_process = new_files
    
    if not files_to_process:
        print(f"\n{Fore.GREEN}No files to process!{Style.RESET_ALL}")
        return
    
    # Process files
    print(f"\n{Fore.CYAN}Processing {len(files_to_process)} files...{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    
    session = requests.Session()
    headers = {
        'Cookie': 'userId=default-user',
        'X-User-Id': 'default-user'
    }
    
    success_count = 0
    fail_count = 0
    failed_files = []
    
    for idx, filename in enumerate(files_to_process, 1):
        print(f"\n[{idx}/{len(files_to_process)}] Processing: {Fore.YELLOW}{filename}{Style.RESET_ALL}")
        
        filepath = os.path.join(folder_path, filename)
        
        try:
            # Upload file
            with open(filepath, 'rb') as f:
                files = {'file': (filename, f, 'application/pdf')}
                data = {
                    'userId': 'default-user',
                    'originalFilename': filename,
                    'filename': filename  # Add filename to form data
                }
                
                upload_resp = session.post(
                    'http://localhost:3000/api/upload',
                    files=files,
                    data=data,
                    headers=headers
                )
                
                if upload_resp.status_code != 200:
                    raise Exception(f"Upload failed: HTTP {upload_resp.status_code}")
                
                upload_data = upload_resp.json()
                doc_id = upload_data.get('documentId')
                
                if not doc_id:
                    raise Exception("No documentId in upload response")
                
                print(f"  {Fore.GREEN}✓{Style.RESET_ALL} Uploaded: {doc_id}")
            
            # Process document
            proc_data = {
                'userId': 'default-user',
                'documentId': doc_id,
                'documentType': 'receipt',
                'bankType': 'gmail-receipts'
            }
            
            proc_resp = session.post(
                'http://localhost:3000/api/documents/process',
                json=proc_data,
                headers=headers
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
        
        # Small delay to avoid overwhelming server
        time.sleep(1)
    
    # Summary
    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"\n{Fore.CYAN}PROCESSING COMPLETE{Style.RESET_ALL}")
    print(f"{Fore.GREEN}Success: {success_count}{Style.RESET_ALL}")
    print(f"{Fore.RED}Failed: {fail_count}{Style.RESET_ALL}")
    
    if failed_files:
        print(f"\n{Fore.RED}Failed files:{Style.RESET_ALL}")
        for file in failed_files:
            print(f"  • {file}")
        
        # Save failed files list
        with open('failed-files.txt', 'w') as f:
            f.write('\n'.join(failed_files))
        print(f"\n{Fore.YELLOW}Failed files saved to: failed-files.txt{Style.RESET_ALL}")

def main():
    parser = argparse.ArgumentParser(description='Complete folder re-run for tax documents')
    parser.add_argument('--folder', type=str, 
                      default=r'C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified',
                      help='Folder containing receipts to process')
    parser.add_argument('--force', action='store_true',
                      help='Force re-process all files without asking')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.folder):
        print(f"{Fore.RED}Error: Folder not found: {args.folder}{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"{Fore.CYAN}Complete Folder Re-Run Tool{Style.RESET_ALL}")
    print(f"Folder: {args.folder}")
    
    process_folder_complete(args.folder, args.force)

if __name__ == '__main__':
    main() 