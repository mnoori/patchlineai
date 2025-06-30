#!/usr/bin/env python3
"""
Process New Files Only
======================

Process only files that are newer than a specific date to avoid reprocessing.
"""

import os
import sys
import time
import requests
from pathlib import Path
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:3000/api"
USER_ID = "default-user"

# Color codes
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def detect_document_type(file_path: Path) -> str:
    """Detect document type based on folder structure"""
    path_str = str(file_path).lower()
    parent_dir = file_path.parent.name.lower()
    
    # Bank statement detection
    if 'bank statement' in path_str or 'bank' in parent_dir:
        if 'bilt' in path_str:
            return 'bilt'
        elif 'bofa' in path_str or 'bank of america' in path_str:
            return 'bofa'
        elif 'chase' in path_str:
            if 'sapphire' in path_str or 'saphire' in path_str:
                return 'chase-sapphire'
            elif 'freedom' in path_str:
                return 'chase-freedom'
            else:
                return 'chase-checking'
    
    # Receipt detection
    elif 'receipt' in path_str or 'reciept' in path_str:
        if 'amazon' in parent_dir:
            return 'amazon-receipts'
        else:
            return 'gmail-receipts'
    
    # Default to gmail-receipts for unknown types
    return 'gmail-receipts'

def get_new_files(folder_path: Path, cutoff_date: datetime):
    """Get files newer than cutoff date"""
    new_files = []
    all_files = []
    
    for pdf_file in folder_path.rglob("*.pdf"):
        all_files.append(pdf_file)
        
        # Get file modification time
        mod_time = datetime.fromtimestamp(pdf_file.stat().st_mtime)
        
        if mod_time > cutoff_date:
            new_files.append(pdf_file)
    
    return new_files, all_files

def upload_and_process_file(file_path: Path, doc_type: str, session: requests.Session):
    """Upload and process a single file"""
    filename = file_path.name
    
    try:
        # Upload file
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': doc_type,
                'userId': USER_ID,
            }
            
            resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=data, timeout=60)
            
            if resp.status_code != 200:
                return False, f"Upload failed: HTTP {resp.status_code}"
            
            upload_data = resp.json()
            upload_url = upload_data.get('uploadUrl')
            s3_key = upload_data.get('s3Key')
            document_id = upload_data.get('documentId')
        
        # Upload to S3
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
            
        put_resp = session.put(upload_url, data=file_bytes, 
                             headers={"Content-Type": "application/pdf"}, timeout=120)
        
        if put_resp.status_code not in (200, 204):
            return False, f"S3 upload failed: HTTP {put_resp.status_code}"
        
        # Process document
        process_payload = {
            "s3Key": s3_key,
            "documentId": document_id,
            "filename": filename,
            "userId": USER_ID,
            "documentType": doc_type,
        }
        
        proc_resp = session.post(f"{API_BASE_URL}/documents/process", 
                               json=process_payload, timeout=300)
        
        if proc_resp.status_code == 200:
            result = proc_resp.json()
            extracted = result.get('extractedData', {})
            expense_count = extracted.get('amount', 0)
            return True, f"{expense_count} expenses extracted"
        else:
            return False, f"Processing failed: HTTP {proc_resp.status_code}"
            
    except Exception as e:
        return False, str(e)

def main():
    print_header("Process New Files Only")
    
    # Check servers
    try:
        requests.get("http://localhost:3000/api/health", timeout=2)
        print_success("Next.js server is running")
    except:
        print_error("Next.js server is not running")
        print_info("Please start it with: npm run dev")
        return
    
    # Get folder to process
    default_folder = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified"
    folder_input = input(f"Enter folder path (or press Enter for default):\n{default_folder}\n> ").strip()
    
    folder_path = Path(folder_input) if folder_input else Path(default_folder)
    
    if not folder_path.exists():
        print_error(f"Folder not found: {folder_path}")
        return
    
    # Get cutoff date
    print("\nHow far back should we look for 'new' files?")
    print("1. Files from last 24 hours")
    print("2. Files from last 3 days") 
    print("3. Files from last week")
    print("4. Files from last month")
    print("5. Custom date")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == '1':
        cutoff_date = datetime.now() - timedelta(hours=24)
    elif choice == '2':
        cutoff_date = datetime.now() - timedelta(days=3)
    elif choice == '3':
        cutoff_date = datetime.now() - timedelta(weeks=1)
    elif choice == '4':
        cutoff_date = datetime.now() - timedelta(days=30)
    elif choice == '5':
        date_str = input("Enter cutoff date (YYYY-MM-DD): ").strip()
        try:
            cutoff_date = datetime.strptime(date_str, '%Y-%m-%d')
        except:
            print_error("Invalid date format")
            return
    else:
        print_error("Invalid choice")
        return
    
    print(f"\nLooking for files newer than: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Find new files
    new_files, all_files = get_new_files(folder_path, cutoff_date)
    
    print(f"\nFound {len(all_files)} total PDF files")
    print(f"Found {len(new_files)} files newer than cutoff date")
    
    if not new_files:
        print_warning("No new files to process!")
        return
    
    # Show what will be processed
    print(f"\nFiles to process:")
    for i, file_path in enumerate(new_files, 1):
        mod_time = datetime.fromtimestamp(file_path.stat().st_mtime)
        print(f"  {i}. {file_path.name} (modified: {mod_time.strftime('%Y-%m-%d %H:%M')})")
    
    # Confirm
    response = input(f"\nProcess {len(new_files)} new files? (y/N): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Process files
    session = requests.Session()
    success_count = 0
    fail_count = 0
    
    print_header("Processing New Files")
    
    for i, file_path in enumerate(new_files, 1):
        doc_type = detect_document_type(file_path)
        print(f"\n[{i}/{len(new_files)}] {Colors.YELLOW}{file_path.name}{Colors.END}")
        print(f"  Type: {doc_type}")
        
        success, message = upload_and_process_file(file_path, doc_type, session)
        
        if success:
            success_count += 1
            print_success(f"Processed: {message}")
        else:
            fail_count += 1
            print_error(f"Failed: {message}")
        
        # Small delay
        if i < len(new_files):
            time.sleep(2)
    
    # Summary
    print_header("Processing Complete")
    print_success(f"Successful: {success_count}")
    if fail_count > 0:
        print_error(f"Failed: {fail_count}")
    
    print_info("\nView results at: http://localhost:3000/dashboard/god-mode")

if __name__ == "__main__":
    main() 