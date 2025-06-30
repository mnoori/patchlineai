#!/usr/bin/env python3
"""
Batch Process Tax Documents with Real-Time Logs
==============================================
This script processes tax documents and shows the AI processing happening in real-time
by monitoring the expense processor logs.

Usage:
    python batch-process-with-logs.py
    python batch-process-with-logs.py --dry-run
"""

import os
import sys
import json
import time
import requests
import threading
import queue
from pathlib import Path
from datetime import datetime
import argparse
import subprocess

# Configuration
TAX_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy"
API_BASE_URL = "http://localhost:3000/api"
LOG_FILE = Path(__file__).parent / "expense-processor.log"

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    """Print a formatted header."""
    print(f"\n{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{text:^80}{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")

def print_processing(text):
    print(f"{Colors.CYAN}⚙ {text}{Colors.END}")

def print_ai(text):
    print(f"{Colors.MAGENTA}🤖 {text}{Colors.END}")

def tail_log_file(log_queue, stop_event):
    """Tail the expense processor log file in a separate thread."""
    try:
        # Start from the end of the file
        with open(LOG_FILE, 'r') as f:
            f.seek(0, 2)  # Go to end of file
            
            while not stop_event.is_set():
                line = f.readline()
                if line:
                    line = line.strip()
                    if line and not line.startswith('2025-06-29'):  # Skip timestamp-only lines
                        log_queue.put(line)
                else:
                    time.sleep(0.1)
    except Exception as e:
        log_queue.put(f"Log monitoring error: {str(e)}")

def process_log_queue(log_queue, processing_file=None):
    """Process and display relevant log entries."""
    while not log_queue.empty():
        try:
            line = log_queue.get_nowait()
            
            # Highlight important log lines
            if "[AI] STARTING AI DESCRIPTION GENERATION" in line:
                print_ai("AI Processing Started...")
            elif "[AI] AI Generated description:" in line:
                desc = line.split("AI Generated description: '")[1].split("'")[0]
                print_ai(f"Generated: {desc[:100]}...")
            elif "Added generic expense:" in line or "Added Amazon order:" in line:
                print(f"  💰 {line}")
            elif "Amount:" in line and "$" in line:
                print(f"  💵 {line}")
            elif "Vendor:" in line:
                print(f"  🏪 {line}")
            elif "[AI] Attempting Bedrock call" in line:
                model = line.split("model: ")[1] if "model: " in line else "AI Model"
                print_ai(f"Calling {model}...")
            elif "EXPENSE PROCESSOR SERVER - NEW REQUEST" in line:
                print(f"\n{Colors.BOLD}📨 New Request to Expense Processor{Colors.END}")
            elif "Extracted" in line and "expenses" in line:
                print(f"  ✅ {line}")
                
        except queue.Empty:
            break

def process_single_file(file_path, document_type, session, log_queue, dry_run=False):
    """Process a single file and show real-time logs."""
    file_name = file_path.name
    
    if dry_run:
        print_info(f"[DRY RUN] Would process: {file_name} as {document_type}")
        return True
    
    print(f"\n{Colors.BOLD}📄 Processing: {file_name}{Colors.END}")
    print("-" * 80)
    
    try:
        # Clear the log queue
        while not log_queue.empty():
            log_queue.get_nowait()
        
        # Upload the file
        print_processing("Uploading file...")
        with open(file_path, 'rb') as f:
            files = {'file': (file_name, f, 'application/pdf')}
            data = {
                'documentType': document_type,
                'userId': 'default-user'
            }
            
            # Start upload
            upload_start = time.time()
            response = session.post(
                f"{API_BASE_URL}/upload",
                files=files,
                data=data,
                timeout=120
            )
        
        # Process logs while waiting for response
        time.sleep(0.5)  # Give logs time to populate
        process_log_queue(log_queue)
        
        if response.status_code != 200:
            print_error(f"Upload failed: {response.status_code}")
            return False
            
        upload_result = response.json()
        
        # Show results
        if 'expenses' in upload_result:
            expenses = upload_result['expenses']
            print(f"\n{Colors.GREEN}✅ Processing Complete!{Colors.END}")
            print(f"Found {len(expenses)} expense(s) in {time.time() - upload_start:.1f} seconds")
            
            for i, expense in enumerate(expenses, 1):
                print(f"\n  Expense {i}:")
                print(f"    💰 Amount: ${expense.get('amount', 0):.2f}")
                print(f"    🏪 Vendor: {expense.get('vendor', 'Unknown')}")
                print(f"    📅 Date: {expense.get('date', 'No date')}")
                desc = expense.get('description', 'No description')
                if len(desc) > 100:
                    desc = desc[:97] + "..."
                print(f"    📝 {desc}")
                
        # Process any remaining logs
        time.sleep(0.5)
        process_log_queue(log_queue)
        
        return True
        
    except Exception as e:
        print_error(f"Error processing {file_name}: {str(e)}")
        return False

def process_folder(folder_path, document_type, session, log_queue, dry_run=False):
    """Process all PDFs in a folder with real-time logging."""
    folder = Path(folder_path)
    if not folder.exists():
        print_error(f"Folder not found: {folder}")
        return 0, 0
    
    pdf_files = list(folder.glob("*.pdf"))
    if not pdf_files:
        print_info(f"No PDF files in {folder.name}")
        return 0, 0
    
    print_header(f"{folder.name} ({len(pdf_files)} files)")
    print_info(f"Document Type: {document_type}")
    
    success_count = 0
    for i, pdf_file in enumerate(sorted(pdf_files), 1):
        if process_single_file(pdf_file, document_type, session, log_queue, dry_run):
            success_count += 1
            
        # Rate limiting
        if i < len(pdf_files) and not dry_run:
            print(f"\n⏳ Waiting 3 seconds before next file...")
            time.sleep(3)
    
    return success_count, len(pdf_files)

def main():
    parser = argparse.ArgumentParser(description="Process tax documents with real-time logs")
    parser.add_argument("--dry-run", action="store_true", help="Preview what will be processed")
    args = parser.parse_args()
    
    print_header("Tax Document Batch Processing")
    print(f"Source: {TAX_FOLDER}")
    print(f"Log monitoring: {LOG_FILE}")
    
    if args.dry_run:
        print_info("DRY RUN MODE - No files will be processed")
    
    # Check if expense processor is running
    if not args.dry_run:
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            print_success("Expense processor server is running")
        except:
            print_error("Expense processor server is NOT running!")
            print_info("Please start it first: cd backend/scripts; python expense-processor-server.py")
            sys.exit(1)
    
    # Set up log monitoring
    log_queue = queue.Queue()
    stop_event = threading.Event()
    
    if not args.dry_run and LOG_FILE.exists():
        log_thread = threading.Thread(target=tail_log_file, args=(log_queue, stop_event))
        log_thread.daemon = True
        log_thread.start()
        print_success("Started log monitoring")
    
    # Create session
    session = requests.Session()
    
    # Track statistics
    total_success = 0
    total_files = 0
    start_time = time.time()
    
    try:
        # Process Bank Statements
        print_header("BANK STATEMENTS")
        
        bank_dir = Path(TAX_FOLDER) / "Bank Statement"
        
        # Process Bilt
        success, total = process_folder(
            bank_dir / "Bilt", 
            "bilt", 
            session, 
            log_queue,
            args.dry_run
        )
        total_success += success
        total_files += total
        
        # Process Chase Sapphire
        success, total = process_folder(
            bank_dir / "Chase Saphire", 
            "chase-sapphire", 
            session, 
            log_queue,
            args.dry_run
        )
        total_success += success
        total_files += total
        
        # Process Receipts
        print_header("RECEIPTS")
        
        receipts_dir = Path(TAX_FOLDER) / "Reciepts"
        
        if receipts_dir.exists():
            # Process Amazon receipts
            success, total = process_folder(
                receipts_dir / "Amazon", 
                "amazon-receipts", 
                session, 
                log_queue,
                args.dry_run
            )
            total_success += success
            total_files += total
            
            # Process all other receipt folders as Gmail receipts
            for folder in receipts_dir.iterdir():
                if folder.is_dir() and folder.name != "Amazon":
                    success, total = process_folder(
                        folder, 
                        "gmail-receipts", 
                        session, 
                        log_queue,
                        args.dry_run
                    )
                    total_success += success
                    total_files += total
    
    finally:
        # Stop log monitoring
        stop_event.set()
    
    # Print summary
    elapsed_time = time.time() - start_time
    print_header("PROCESSING COMPLETE!")
    print(f"\n📊 Summary:")
    print(f"  ✅ Successfully processed: {total_success}/{total_files} files")
    print(f"  ⏱️  Time elapsed: {elapsed_time:.1f} seconds")
    print(f"  ⚡ Average time per file: {elapsed_time/max(total_files, 1):.1f} seconds")
    
    if total_success > 0 and not args.dry_run:
        print(f"\n🎯 Next steps:")
        print(f"  1. Go to http://localhost:3000/dashboard/god-mode")
        print(f"  2. Navigate to the 'Tax Preparation' tab")
        print(f"  3. Click on 'IRS Ready' tab to see matched transactions")
        print(f"  4. Export your audit-ready report")

if __name__ == "__main__":
    main() 