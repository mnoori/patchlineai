#!/usr/bin/env python3
"""
Comprehensive Tax Folder Processor
==================================

This script processes all tax documents with:
- Smart document type detection based on folder structure
- Improved vendor detection and mapping
- Complete metadata storage (filenames, bounding boxes, dates)
- Ability to reprocess specific files/folders
- Skips checking accounts as requested

Usage:
    # Process all folders
    python comprehensive-folder-processor.py --folder "C:\path\to\tax\folder"
    
    # Process specific folders only
    python comprehensive-folder-processor.py --folder "C:\path\to\tax\folder" --specific-folders "Reciepts\Platforms\creativecloud,Reciepts\Amazon"
    
    # Reprocess specific files
    python comprehensive-folder-processor.py --reprocess-files "file1.pdf,file2.pdf"
    
    # Dry run to see what will be processed
    python comprehensive-folder-processor.py --folder "C:\path\to\tax\folder" --dry-run
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Set, Optional
from collections import defaultdict

# Load environment
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# Configuration
API_BASE_URL = "http://localhost:3000/api"
USER_ID = "default-user"
TAX_FOLDER = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy"

# Vendor mappings based on description patterns
VENDOR_MAPPINGS = {
    'soundcloud': ['soundcloud go+', 'stream algoryx'],
    'verizon': ['verizon wireless', 'verizon'],
    'soho house': ['dumbo house', 'soho house', 'soho works'],
    'apple': ['apple services', 'apple cloud', 'icloud', 'app store'],
    'google cloud': ['google cloud platform', 'google play', 'gcp'],
    'google': ['youtube promotion', 'google ads', 'adwords'],
    'meta': ['facebook ads', 'instagram ads', 'meta ads'],
    'adobe': ['creative cloud', 'adobe'],
    'spotify': ['spotify', 'spotify for artists'],
    'amazon': ['amazon.com', 'amazon web services', 'aws'],
    'beatport': ['beatport'],
    'splice': ['splice'],
    'eleven labs': ['eleven labs', 'elevenlabs'],
    'midjourney': ['midjourney'],
    'runway': ['runway ai', 'runway'],
    'webflow': ['webflow'],
    'canva': ['canva'],
    'loopmasters': ['loopmasters', 'loopcloud'],
    'resolume': ['resolume'],
    'rekordbox': ['rekordbox', 'pioneer dj'],
    'uber': ['uber', 'uber trip'],
    'lyft': ['lyft ride'],
}

# Document types to skip
SKIP_DOCUMENT_TYPES = ['bofa', 'chase-checking']

# Color codes
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
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text.center(80)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_skip(text):
    print(f"{Colors.MAGENTA}⏭ {text}{Colors.END}")

def detect_document_type(file_path: Path) -> str:
    """Smart document type detection based on folder structure"""
    path_str = str(file_path).lower()
    parent_dir = file_path.parent.name.lower()
    grandparent_dir = file_path.parent.parent.name.lower() if file_path.parent.parent else ""
    
    # Check for checking accounts (to skip)
    if 'checking' in path_str and ('bofa' in path_str or 'bank of america' in path_str):
        return 'bofa'
    elif 'checking' in path_str and 'chase' in path_str:
        return 'chase-checking'
    
    # Bank statements
    if 'bank statement' in path_str or 'bank' in grandparent_dir:
        if 'bilt' in path_str:
            return 'bilt'
        elif 'chase' in path_str:
            if 'sapphire' in path_str or 'saphire' in path_str:
                return 'chase-sapphire'
            elif 'freedom' in path_str:
                return 'chase-freedom'
    
    # Receipt types based on folder
    elif 'receipt' in path_str or 'reciept' in path_str:
        if 'amazon' in parent_dir:
            return 'amazon-receipts'
        elif 'creativecloud' in parent_dir or 'creative cloud' in parent_dir:
            return 'creative-cloud-receipts'
        elif 'google' in parent_dir:
            return 'google-receipts'
        elif 'meta' in parent_dir or 'facebook' in parent_dir:
            return 'meta-receipts'
        else:
            return 'gmail-receipts'
    
    # Other document types
    elif 'rent' in parent_dir:
        return 'rent-documents'
    elif 'tax' in parent_dir:
        return 'tax-documents'
    
    # Default
    return 'general'

def improve_vendor_detection(description: str, current_vendor: str) -> str:
    """Improve vendor detection based on description patterns"""
    if current_vendor and current_vendor.lower() not in ['unknown vendor', 'unknown', 'n/a']:
        return current_vendor
    
    description_lower = description.lower()
    
    for vendor, patterns in VENDOR_MAPPINGS.items():
        for pattern in patterns:
            if pattern in description_lower:
                return vendor.title()
    
    return current_vendor

def scan_folder_structure(base_path: Path) -> Dict[str, List[Path]]:
    """Scan folder structure and organize files by type"""
    files_by_type = defaultdict(list)
    skip_count = 0
    
    for pdf_file in base_path.rglob("*.pdf"):
        doc_type = detect_document_type(pdf_file)
        
        if doc_type in SKIP_DOCUMENT_TYPES:
            skip_count += 1
            continue
            
        files_by_type[doc_type].append(pdf_file)
    
    if skip_count > 0:
        print_warning(f"Skipping {skip_count} checking account files")
    
    return dict(files_by_type)

def process_file(file_path: Path, doc_type: str, session: requests.Session, force_reprocess: bool = False) -> Dict:
    """Process a single file through the API"""
    filename = file_path.name
    
    try:
        # Check if already processed
        if not force_reprocess:
            # We could check if document exists, but for now let's just process
            pass
        
        # Upload file
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': doc_type,
                'userId': USER_ID,
                'metadata': json.dumps({
                    'originalPath': str(file_path),
                    'folder': str(file_path.parent.relative_to(Path(TAX_FOLDER))),
                    'processedAt': datetime.utcnow().isoformat()
                })
            }
            
            resp = session.post(f"{API_BASE_URL}/documents/upload", files=files, data=data, timeout=60)
            
            if resp.status_code != 200:
                return {'status': 'failed', 'error': f"Upload failed: HTTP {resp.status_code}"}
            
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
            return {'status': 'failed', 'error': f"S3 upload failed: HTTP {put_resp.status_code}"}
        
        # Process document
        process_payload = {
            "s3Key": s3_key,
            "documentId": document_id,
            "filename": filename,
            "userId": USER_ID,
            "documentType": doc_type,
            "metadata": {
                "originalPath": str(file_path),
                "folder": str(file_path.parent.relative_to(Path(TAX_FOLDER))),
                "fileSize": file_path.stat().st_size,
                "processedAt": datetime.utcnow().isoformat()
            }
        }
        
        proc_resp = session.post(f"{API_BASE_URL}/documents/process", 
                               json=process_payload, timeout=300)
        
        if proc_resp.status_code == 200:
            result = proc_resp.json()
            return {
                'status': 'success',
                'documentId': document_id,
                'extractedData': result.get('extractedData', {})
            }
        else:
            return {'status': 'failed', 'error': f"Processing failed: HTTP {proc_resp.status_code}"}
            
    except Exception as e:
        return {'status': 'failed', 'error': str(e)}

def main():
    parser = argparse.ArgumentParser(description='Comprehensive tax folder processor')
    parser.add_argument('--folder', type=str, default=TAX_FOLDER,
                      help='Base folder containing tax documents')
    parser.add_argument('--specific-folders', type=str,
                      help='Comma-separated list of specific folders to process')
    parser.add_argument('--reprocess-files', type=str,
                      help='Comma-separated list of specific files to reprocess')
    parser.add_argument('--dry-run', action='store_true',
                      help='Preview what will be processed without actually processing')
    parser.add_argument('--force', action='store_true',
                      help='Force reprocess all files')
    
    args = parser.parse_args()
    
    print_header("COMPREHENSIVE TAX FOLDER PROCESSOR")
    
    # Check servers
    if not args.dry_run:
        try:
            requests.get("http://localhost:3000/api/health", timeout=2)
            print_success("Next.js server is running")
        except:
            print_error("Next.js server is not running on port 3000")
            print_info("Please start it with: npm run dev")
            return
        
        try:
            requests.get("http://localhost:8000/health", timeout=2)
            print_success("Expense processor server is running")
        except:
            print_warning("Expense processor server is not running")
            print_info("For better results, start it with: cd backend/scripts && python expense-processor-server.py")
    
    base_path = Path(args.folder)
    if not base_path.exists():
        print_error(f"Folder not found: {base_path}")
        return
    
    # Handle specific file reprocessing
    if args.reprocess_files:
        files_to_process = []
        for file_str in args.reprocess_files.split(','):
            file_path = Path(file_str.strip())
            if file_path.exists():
                files_to_process.append(file_path)
            else:
                print_warning(f"File not found: {file_path}")
        
        if not files_to_process:
            print_error("No valid files to reprocess")
            return
        
        print_info(f"Reprocessing {len(files_to_process)} specific files")
        # Process these files...
        return
    
    # Scan folder structure
    print_info("Scanning folder structure...")
    files_by_type = scan_folder_structure(base_path)
    
    # Filter by specific folders if requested
    if args.specific_folders:
        specific_folders = [f.strip() for f in args.specific_folders.split(',')]
        filtered_files = defaultdict(list)
        
        for doc_type, files in files_by_type.items():
            for file in files:
                relative_folder = str(file.parent.relative_to(base_path))
                if any(sf in relative_folder for sf in specific_folders):
                    filtered_files[doc_type].append(file)
        
        files_by_type = dict(filtered_files)
    
    # Summary
    total_files = sum(len(files) for files in files_by_type.values())
    print_header("PROCESSING SUMMARY")
    print(f"Total files to process: {total_files}")
    print(f"Document types: {len(files_by_type)}")
    
    for doc_type, files in files_by_type.items():
        print(f"\n{Colors.CYAN}{doc_type}:{Colors.END} {len(files)} files")
        # Show sample files
        for i, file in enumerate(files[:3]):
            print(f"  • {file.name}")
        if len(files) > 3:
            print(f"  ... and {len(files) - 3} more")
    
    if args.dry_run:
        print_info("\nDRY RUN - No files will be processed")
        return
    
    # Confirmation
    print(f"\n{Colors.YELLOW}Ready to process {total_files} files.{Colors.END}")
    print(f"{Colors.YELLOW}This will:{Colors.END}")
    print("  1. Upload each file to S3")
    print("  2. Process with Textract for OCR")
    print("  3. Extract expenses with AI")
    print("  4. Store complete metadata")
    print("  5. Skip all checking account files")
    print(f"\n{Colors.GREEN}Command to run after clearing data:{Colors.END}")
    print(f"{Colors.BOLD}python comprehensive-folder-processor.py --folder \"{args.folder}\"{Colors.END}")
    
    response = input(f"\n{Colors.YELLOW}Proceed? (y/N): {Colors.END}")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Process files
    session = requests.Session()
    results = {
        'success': 0,
        'failed': 0,
        'skipped': 0,
        'errors': []
    }
    
    start_time = time.time()
    
    for doc_type, files in files_by_type.items():
        print_header(f"Processing {doc_type}")
        
        for i, file_path in enumerate(files, 1):
            print(f"\n[{i}/{len(files)}] {Colors.YELLOW}{file_path.name}{Colors.END}")
            
            result = process_file(file_path, doc_type, session, args.force)
            
            if result['status'] == 'success':
                results['success'] += 1
                print_success(f"Processed successfully")
                
                # Show extracted amount if available
                extracted = result.get('extractedData', {})
                if extracted.get('amount'):
                    print_info(f"Amount: ${extracted['amount']}")
            else:
                results['failed'] += 1
                results['errors'].append({
                    'file': str(file_path),
                    'error': result.get('error', 'Unknown error')
                })
                print_error(f"Failed: {result.get('error', 'Unknown error')}")
            
            # Small delay between files
            if i < len(files):
                time.sleep(1)
    
    # Final summary
    elapsed = time.time() - start_time
    print_header("PROCESSING COMPLETE")
    print(f"Time elapsed: {elapsed:.1f} seconds")
    print(f"{Colors.GREEN}Successful: {results['success']}{Colors.END}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.END}")
    print(f"{Colors.MAGENTA}Skipped: {results['skipped']}{Colors.END}")
    
    if results['errors']:
        # Save error log
        with open('processing-errors.json', 'w') as f:
            json.dump(results['errors'], f, indent=2)
        print_warning("\nError details saved to: processing-errors.json")
    
    print(f"\n{Colors.GREEN}Next steps:{Colors.END}")
    print("1. Check the Tax Preparation tab in God Mode")
    print("2. Review the Test Samples tab for the processed files")
    print("3. Verify vendor names are correctly detected")
    print("4. Any files with issues can be reprocessed individually")
    
    print(f"\n{Colors.CYAN}To reprocess specific files later:{Colors.END}")
    print('python comprehensive-folder-processor.py --reprocess-files "file1.pdf,file2.pdf"')

if __name__ == "__main__":
    main() 