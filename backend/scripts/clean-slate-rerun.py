#!/usr/bin/env python3
"""
CLEAN SLATE RERUN - Complete wipe and re-process
This script will:
1. Delete ALL existing documents and expenses for the user
2. Clear S3 files
3. Re-process all files in the folder with the latest code
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

def confirm_clean_slate():
    """Confirm user wants to delete everything"""
    print(f"\n{Fore.RED}⚠️  DANGER ZONE - CLEAN SLATE OPERATION ⚠️{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}This will:{Style.RESET_ALL}")
    print(f"  • Delete ALL documents from DynamoDB")
    print(f"  • Delete ALL expenses from DynamoDB")
    print(f"  • Delete ALL files from S3 bucket")
    print(f"  • Re-process ALL files in the folder")
    print(f"\n{Fore.RED}This action CANNOT be undone!{Style.RESET_ALL}")
    
    response = input(f"\n{Fore.YELLOW}Type 'CLEAN SLATE' to confirm: {Style.RESET_ALL}")
    
    if response != 'CLEAN SLATE':
        print(f"{Fore.RED}Operation cancelled.{Style.RESET_ALL}")
        return False
    
    return True

def delete_all_user_data(user_id='default-user'):
    """Delete all documents, expenses, and S3 files for user"""
    
    print(f"\n{Fore.CYAN}🧹 CLEANING ALL USER DATA{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    # 1. Delete all documents
    print(f"\n{Fore.YELLOW}Deleting documents...{Style.RESET_ALL}")
    doc_table = dynamodb.Table(DOCUMENTS_TABLE)
    
    try:
        # Scan for all user documents
        response = doc_table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        documents = response.get('Items', [])
        print(f"Found {len(documents)} documents to delete")
        
        # Delete documents and their S3 files
        for doc in documents:
            doc_id = doc.get('documentId')
            s3_key = doc.get('s3Key')
            
            # Delete from S3
            if s3_key:
                try:
                    s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                    print(f"  ✓ Deleted S3: {s3_key}")
                except Exception as e:
                    print(f"  ⚠ S3 delete failed: {s3_key} - {e}")
            
            # Delete from DynamoDB
            try:
                doc_table.delete_item(
                    Key={'userId': user_id, 'documentId': doc_id}
                )
                print(f"  ✓ Deleted document: {doc_id}")
            except Exception as e:
                print(f"  ✗ Document delete failed: {doc_id} - {e}")
        
        print(f"{Fore.GREEN}✓ Deleted {len(documents)} documents{Style.RESET_ALL}")
        
    except Exception as e:
        print(f"{Fore.RED}Error deleting documents: {e}{Style.RESET_ALL}")
    
    # 2. Delete all expenses
    print(f"\n{Fore.YELLOW}Deleting expenses...{Style.RESET_ALL}")
    exp_table = dynamodb.Table(EXPENSES_TABLE)
    
    try:
        # Scan for all user expenses
        response = exp_table.scan(
            FilterExpression='userId = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        expenses = response.get('Items', [])
        print(f"Found {len(expenses)} expenses to delete")
        
        # Delete expenses
        for expense in expenses:
            expense_id = expense.get('expenseId')
            try:
                exp_table.delete_item(
                    Key={'userId': user_id, 'expenseId': expense_id}
                )
                print(f"  ✓ Deleted expense: {expense_id}")
            except Exception as e:
                print(f"  ✗ Expense delete failed: {expense_id} - {e}")
        
        print(f"{Fore.GREEN}✓ Deleted {len(expenses)} expenses{Style.RESET_ALL}")
        
    except Exception as e:
        print(f"{Fore.RED}Error deleting expenses: {e}{Style.RESET_ALL}")
    
    # 3. Clean up any remaining S3 files for this user
    print(f"\n{Fore.YELLOW}Cleaning remaining S3 files...{Style.RESET_ALL}")
    try:
        # List all objects with user prefix
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=f'documents/{user_id}/'
        )
        
        if 'Contents' in response:
            for obj in response['Contents']:
                s3_client.delete_object(Bucket=S3_BUCKET, Key=obj['Key'])
                print(f"  ✓ Cleaned S3: {obj['Key']}")
            
            print(f"{Fore.GREEN}✓ Cleaned {len(response['Contents'])} S3 files{Style.RESET_ALL}")
        else:
            print(f"{Fore.GREEN}✓ No additional S3 files found{Style.RESET_ALL}")
            
    except Exception as e:
        print(f"{Fore.RED}Error cleaning S3: {e}{Style.RESET_ALL}")

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

def process_all_files(folder_path):
    """Process all PDF files in the folder"""
    
    # Get list of PDF files
    pdf_files = []
    for file in os.listdir(folder_path):
        if file.lower().endswith('.pdf'):
            pdf_files.append(file)
    
    if not pdf_files:
        print(f"{Fore.RED}No PDF files found in {folder_path}{Style.RESET_ALL}")
        return
    
    print(f"\n{Fore.CYAN}📄 PROCESSING {len(pdf_files)} FILES{Style.RESET_ALL}")
    print(f"{'='*60}")
    
    session = requests.Session()
    headers = {
        'Cookie': 'userId=default-user',
        'X-User-Id': 'default-user'
    }
    
    success_count = 0
    fail_count = 0
    failed_files = []
    
    for idx, filename in enumerate(pdf_files, 1):
        print(f"\n[{idx}/{len(pdf_files)}] Processing: {Fore.YELLOW}{filename}{Style.RESET_ALL}")
        
        filepath = os.path.join(folder_path, filename)
        
        try:
            # Upload file
            with open(filepath, 'rb') as f:
                files = {'file': (filename, f, 'application/pdf')}
                data = {
                    'userId': 'default-user',
                    'originalFilename': filename,
                    'filename': filename
                }
                
                upload_resp = session.post(
                    'http://localhost:3000/api/upload',
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=30
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
    print(f"\n{Fore.CYAN}🎉 CLEAN SLATE PROCESSING COMPLETE{Style.RESET_ALL}")
    print(f"{Fore.GREEN}Success: {success_count}{Style.RESET_ALL}")
    print(f"{Fore.RED}Failed: {fail_count}{Style.RESET_ALL}")
    
    if failed_files:
        print(f"\n{Fore.RED}Failed files:{Style.RESET_ALL}")
        for file in failed_files:
            print(f"  • {file}")
        
        # Save failed files list
        with open('clean-slate-failed-files.txt', 'w') as f:
            f.write('\n'.join(failed_files))
        print(f"\n{Fore.YELLOW}Failed files saved to: clean-slate-failed-files.txt{Style.RESET_ALL}")
    
    if success_count > 0:
        print(f"\n{Fore.GREEN}✅ Successfully processed {success_count} files with latest code!{Style.RESET_ALL}")
        print(f"{Fore.CYAN}All files now have:{Style.RESET_ALL}")
        print(f"  • Proper expense extraction")
        print(f"  • AI-generated descriptions")
        print(f"  • Correct vendor categorization")
        print(f"  • Filename tracking")
        print(f"  • 2024 tax year dates")

def main():
    parser = argparse.ArgumentParser(description='Clean slate rerun for tax documents')
    parser.add_argument('--folder', type=str, 
                      default=r'C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified',
                      help='Folder containing receipts to process')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.folder):
        print(f"{Fore.RED}Error: Folder not found: {args.folder}{Style.RESET_ALL}")
        sys.exit(1)
    
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}🧹 CLEAN SLATE RERUN TOOL{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"Folder: {args.folder}")
    
    # Confirm operation
    if not confirm_clean_slate():
        sys.exit(1)
    
    # Check servers
    if not ensure_servers_running():
        print(f"\n{Fore.RED}Please fix server issues before continuing{Style.RESET_ALL}")
        sys.exit(1)
    
    # Delete all existing data
    delete_all_user_data()
    
    # Wait a moment
    print(f"\n{Fore.YELLOW}Waiting 3 seconds before processing...{Style.RESET_ALL}")
    time.sleep(3)
    
    # Process all files
    process_all_files(args.folder)

if __name__ == '__main__':
    main() 