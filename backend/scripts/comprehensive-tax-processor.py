#!/usr/bin/env python3
"""
Comprehensive Tax Document Processor
====================================

A unified processor that:
1. Intelligently detects document types from folder structure
2. Stores original filenames and complete metadata
3. Preserves page numbers and bounding boxes for future PDF annotation
4. Stores raw Textract data for reprocessing/matching
5. Handles all document types with appropriate parsers
"""

import os
import sys
import json
import boto3
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import re

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Import the expense processor
from lambda_folder.expense_processor import get_parser, generate_receipt_description

# Load environment variables
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except ImportError:
    pass

# Configuration
API_BASE_URL = "http://localhost:3000/api"
USER_ID = "default-user"
TAX_FOLDER = Path(r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy")

# AWS Configuration
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)
s3_client = boto3.client('s3', **aws_config)
textract = boto3.client('textract', **aws_config)

# DynamoDB tables
documents_table = dynamodb.Table('Documents-staging')
expenses_table = dynamodb.Table('TaxExpenses-dev')
metadata_table = dynamodb.Table('DocumentMetadata-dev')  # New table for extended metadata

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

def detect_document_type(file_path: Path) -> Tuple[str, str]:
    """
    Detect document type and category based on folder structure.
    Returns: (document_type, category)
    """
    path_str = str(file_path).lower()
    path_parts = file_path.parts
    
    # Build a reverse path lookup
    folder_chain = [part.lower() for part in path_parts[-4:]]  # Last 4 folders
    
    # Bank statements
    if any('bank statement' in folder for folder in folder_chain):
        if 'bilt' in path_str:
            return 'bilt', 'bank-statement'
        elif 'bofa' in path_str or 'bank of america' in path_str:
            return 'bofa', 'bank-statement'
        elif 'chase' in path_str:
            if 'sapphire' in path_str or 'saphire' in path_str:
                return 'chase-sapphire', 'bank-statement'
            elif 'freedom' in path_str:
                return 'chase-freedom', 'bank-statement'
            elif 'checking' in path_str:
                return 'chase-checking', 'bank-statement'
        return 'bank-statement', 'bank-statement'
    
    # Receipts
    elif any('receipt' in folder or 'reciept' in folder for folder in folder_chain):
        # Check for specific receipt types
        if 'amazon' in path_str:
            return 'amazon-receipts', 'receipt'
        elif 'creative' in path_str and 'cloud' in path_str:
            return 'creative-cloud-receipts', 'receipt'
        elif 'adobe' in path_str:
            return 'creative-cloud-receipts', 'receipt'
        elif any(vendor in path_str for vendor in ['apple', 'midjourney', 'meta', 'facebook']):
            return 'gmail-receipts', 'receipt'
        elif 'new-unidentified' in path_str:
            # For unidentified receipts, check filename patterns
            filename_lower = file_path.name.lower()
            if 'invoice' in filename_lower and re.search(r'invoice.*\(\d+\)', filename_lower):
                return 'creative-cloud-receipts', 'receipt'
            else:
                return 'gmail-receipts', 'receipt'
        else:
            return 'gmail-receipts', 'receipt'
    
    # Other documents
    elif 'invoice' in path_str:
        return 'invoice', 'invoice'
    elif 'tax' in path_str:
        return 'tax-document', 'tax'
    else:
        return 'general', 'other'

def get_unique_files_by_pattern(folder: Path) -> List[Tuple[Path, List[Path]]]:
    """
    Group files by unique naming patterns and return one sample from each group.
    Returns: List of (sample_file, all_files_in_group)
    """
    print_header("ANALYZING FILE PATTERNS")
    
    # Pattern groups
    pattern_groups = defaultdict(list)
    
    for pdf_file in folder.rglob("*.pdf"):
        # Skip if file doesn't exist
        if not pdf_file.exists():
            continue
            
        filename = pdf_file.name
        
        # Define pattern for the file
        # Remove numbers in parentheses, dates, and common variations
        pattern = filename.lower()
        pattern = re.sub(r'\s*\(\d+\)\s*', '', pattern)  # Remove (1), (2), etc.
        pattern = re.sub(r'\d{4}-\d{2}-\d{2}', 'DATE', pattern)  # Replace dates
        pattern = re.sub(r'\d{2}-\d{2}-\d{4}', 'DATE', pattern)
        pattern = re.sub(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*', 'MONTH', pattern)
        pattern = re.sub(r'\d+', 'NUM', pattern)  # Replace numbers
        
        # Add folder context to pattern
        parent_folder = pdf_file.parent.name.lower()
        pattern_key = f"{parent_folder}/{pattern}"
        
        pattern_groups[pattern_key].append(pdf_file)
    
    # Get one sample from each group
    unique_samples = []
    for pattern, files in pattern_groups.items():
        sample_file = files[0]  # Take the first file as sample
        unique_samples.append((sample_file, files))
        
        print(f"\n{Colors.YELLOW}Pattern:{Colors.END} {pattern}")
        print(f"  {Colors.CYAN}Sample:{Colors.END} {sample_file.name}")
        print(f"  {Colors.CYAN}Total files:{Colors.END} {len(files)}")
        if len(files) > 1:
            print(f"  {Colors.CYAN}Others:{Colors.END} {files[1].name}, ...")
    
    print(f"\n{Colors.GREEN}Found {len(unique_samples)} unique file patterns{Colors.END}")
    return unique_samples

def extract_textract_metadata(textract_data: Dict, page_num: int = 1) -> Dict:
    """
    Extract page numbers and bounding box information from Textract data.
    """
    metadata = {
        'pages': {},
        'total_blocks': 0,
        'tables': [],
        'forms': []
    }
    
    for block in textract_data.get('Blocks', []):
        block_type = block.get('BlockType')
        
        # Track page information
        page = block.get('Page', page_num)
        if page not in metadata['pages']:
            metadata['pages'][page] = {
                'lines': 0,
                'words': 0,
                'tables': 0,
                'key_values': 0,
                'expense_locations': []  # Store bounding boxes of identified expenses
            }
        
        metadata['total_blocks'] += 1
        
        # Count different block types per page
        if block_type == 'LINE':
            metadata['pages'][page]['lines'] += 1
        elif block_type == 'WORD':
            metadata['pages'][page]['words'] += 1
        elif block_type == 'TABLE':
            metadata['pages'][page]['tables'] += 1
            # Store table bounding box for future annotation
            metadata['tables'].append({
                'page': page,
                'boundingBox': block.get('Geometry', {}).get('BoundingBox', {}),
                'id': block.get('Id')
            })
        elif block_type == 'KEY_VALUE_SET':
            metadata['pages'][page]['key_values'] += 1
            metadata['forms'].append({
                'page': page,
                'boundingBox': block.get('Geometry', {}).get('BoundingBox', {}),
                'id': block.get('Id')
            })
    
    return metadata

def process_document_with_metadata(file_path: Path, doc_type: str, category: str) -> Dict:
    """
    Process a document and extract all metadata including bounding boxes.
    """
    print(f"\n{Colors.YELLOW}Processing:{Colors.END} {file_path.name}")
    print(f"  Type: {doc_type}, Category: {category}")
    
    try:
        # Generate document ID
        doc_id = f"doc_{int(datetime.now().timestamp() * 1000)}_{hashlib.md5(str(file_path).encode()).hexdigest()[:6]}"
        
        # Upload to S3
        s3_bucket = os.getenv('S3_BUCKET', 'patchy-inbox-v2')
        s3_key = f"tax-documents/{USER_ID}/{doc_id}/{file_path.name}"
        
        with open(file_path, 'rb') as f:
            s3_client.put_object(
                Bucket=s3_bucket,
                Key=s3_key,
                Body=f.read(),
                ContentType='application/pdf'
            )
        print_success(f"Uploaded to S3: {s3_key}")
        
        # Start Textract
        response = textract.start_document_analysis(
            DocumentLocation={
                'S3Object': {
                    'Bucket': s3_bucket,
                    'Name': s3_key
                }
            },
            FeatureTypes=['TABLES', 'FORMS']
        )
        
        job_id = response['JobId']
        print_info(f"Textract job started: {job_id}")
        
        # Wait for completion
        while True:
            response = textract.get_document_analysis(JobId=job_id)
            status = response['JobStatus']
            
            if status in ['SUCCEEDED', 'FAILED']:
                break
            
            print(".", end="", flush=True)
            import time
            time.sleep(2)
        
        print()  # New line after dots
        
        if status == 'FAILED':
            print_error("Textract processing failed")
            return None
        
        # Get all pages
        textract_data = response
        all_blocks = response['Blocks']
        
        # Get additional pages if any
        next_token = response.get('NextToken')
        while next_token:
            response = textract.get_document_analysis(JobId=job_id, NextToken=next_token)
            all_blocks.extend(response['Blocks'])
            next_token = response.get('NextToken')
        
        textract_data['Blocks'] = all_blocks
        
        # Extract metadata
        doc_metadata = extract_textract_metadata(textract_data)
        
        # Process expenses using appropriate parser
        parser = get_parser(doc_type, USER_ID, doc_id)
        expenses = parser.parse_textract_output(textract_data)
        
        print_success(f"Extracted {len(expenses)} expenses")
        
        # Add bounding box info to expenses
        for expense in expenses:
            # Try to find the text location in Textract data
            expense_text = expense.get('description', '')
            for block in textract_data['Blocks']:
                if block.get('BlockType') == 'LINE' and expense_text in block.get('Text', ''):
                    page = block.get('Page', 1)
                    bbox = block.get('Geometry', {}).get('BoundingBox', {})
                    expense['location'] = {
                        'page': page,
                        'boundingBox': bbox
                    }
                    # Add to metadata
                    doc_metadata['pages'][page]['expense_locations'].append({
                        'expenseId': expense['expenseId'],
                        'boundingBox': bbox,
                        'text': expense_text
                    })
                    break
        
        # Store document in DynamoDB with full metadata
        document_record = {
            'documentId': doc_id,
            'userId': USER_ID,
            'fileName': file_path.name,
            'originalPath': str(file_path),
            'relativePath': str(file_path.relative_to(TAX_FOLDER)),
            'documentType': doc_type,
            'category': category,
            's3Key': s3_key,
            's3Bucket': s3_bucket,
            'fileSize': file_path.stat().st_size,
            'pageCount': len(doc_metadata['pages']),
            'metadata': doc_metadata,
            'textractJobId': job_id,
            'expenseCount': len(expenses),
            'uploadDate': datetime.utcnow().isoformat(),
            'processedDate': datetime.utcnow().isoformat(),
            'status': 'completed'
        }
        
        documents_table.put_item(Item=document_record)
        print_success("Stored document record with metadata")
        
        # Store raw Textract data for future use
        raw_data_record = {
            'documentId': doc_id,
            'textractData': json.dumps(textract_data),  # Store as JSON string
            'extractedAt': datetime.utcnow().isoformat()
        }
        
        # Store in metadata table (or create a dedicated raw data table)
        metadata_table.put_item(Item=raw_data_record)
        print_success("Stored raw Textract data")
        
        # Store expenses
        for expense in expenses:
            expense['fileName'] = file_path.name
            expense['originalPath'] = str(file_path)
            expenses_table.put_item(Item=expense)
        
        return {
            'documentId': doc_id,
            'fileName': file_path.name,
            'expenseCount': len(expenses),
            'metadata': doc_metadata,
            'expenses': expenses
        }
        
    except Exception as e:
        print_error(f"Error processing document: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def generate_processing_report(results: List[Dict]):
    """Generate a comprehensive processing report"""
    report = {
        'processedAt': datetime.utcnow().isoformat(),
        'summary': {
            'totalFiles': len(results),
            'successfulFiles': len([r for r in results if r]),
            'failedFiles': len([r for r in results if not r]),
            'totalExpenses': sum(r['expenseCount'] for r in results if r),
            'totalPages': sum(len(r['metadata']['pages']) for r in results if r)
        },
        'byDocumentType': defaultdict(lambda: {'count': 0, 'expenses': 0}),
        'byCategory': defaultdict(lambda: {'count': 0, 'expenses': 0}),
        'files': []
    }
    
    for result in results:
        if result:
            doc_type = result.get('documentType', 'unknown')
            category = result.get('category', 'unknown')
            
            report['byDocumentType'][doc_type]['count'] += 1
            report['byDocumentType'][doc_type]['expenses'] += result['expenseCount']
            
            report['byCategory'][category]['count'] += 1
            report['byCategory'][category]['expenses'] += result['expenseCount']
            
            report['files'].append({
                'fileName': result['fileName'],
                'documentId': result['documentId'],
                'type': doc_type,
                'expenses': result['expenseCount'],
                'pages': len(result['metadata']['pages'])
            })
    
    # Save report
    report_path = Path('comprehensive-processing-report.json')
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print_header("PROCESSING REPORT")
    print(f"{Colors.GREEN}Total files processed: {report['summary']['totalFiles']}{Colors.END}")
    print(f"{Colors.GREEN}Successful: {report['summary']['successfulFiles']}{Colors.END}")
    print(f"{Colors.RED}Failed: {report['summary']['failedFiles']}{Colors.END}")
    print(f"{Colors.CYAN}Total expenses extracted: {report['summary']['totalExpenses']}{Colors.END}")
    print(f"{Colors.CYAN}Total pages analyzed: {report['summary']['totalPages']}{Colors.END}")
    
    print(f"\n{Colors.YELLOW}By Document Type:{Colors.END}")
    for doc_type, stats in report['byDocumentType'].items():
        print(f"  {doc_type}: {stats['count']} files, {stats['expenses']} expenses")
    
    print(f"\n{Colors.YELLOW}By Category:{Colors.END}")
    for category, stats in report['byCategory'].items():
        print(f"  {category}: {stats['count']} files, {stats['expenses']} expenses")
    
    print(f"\n{Colors.GREEN}Report saved to: {report_path}{Colors.END}")

def main():
    print_header("COMPREHENSIVE TAX DOCUMENT PROCESSOR")
    
    # Check if folder exists
    if not TAX_FOLDER.exists():
        print_error(f"Tax folder not found: {TAX_FOLDER}")
        return
    
    # Get unique file patterns
    unique_patterns = get_unique_files_by_pattern(TAX_FOLDER)
    
    print(f"\n{Colors.YELLOW}Found {len(unique_patterns)} unique file patterns to process{Colors.END}")
    
    # Confirm processing
    response = input(f"\nProcess these {len(unique_patterns)} sample files? (y/N): ")
    if response.lower() != 'y':
        print("Processing cancelled.")
        return
    
    # Process each unique pattern
    results = []
    for i, (sample_file, all_files) in enumerate(unique_patterns, 1):
        print_header(f"PROCESSING PATTERN {i}/{len(unique_patterns)}")
        
        # Detect document type
        doc_type, category = detect_document_type(sample_file)
        
        # Process the sample file
        result = process_document_with_metadata(sample_file, doc_type, category)
        if result:
            result['documentType'] = doc_type
            result['category'] = category
            result['patternFiles'] = len(all_files)
            results.append(result)
        else:
            results.append(None)
        
        # Show other files in pattern
        if len(all_files) > 1:
            print(f"\n{Colors.CYAN}Other files in this pattern ({len(all_files)-1} more):{Colors.END}")
            for other_file in all_files[1:4]:  # Show first 3
                print(f"  - {other_file.name}")
            if len(all_files) > 4:
                print(f"  ... and {len(all_files)-4} more")
    
    # Generate report
    generate_processing_report(results)
    
    print_header("PROCESSING COMPLETE")
    print_info("\nNext steps:")
    print("1. Review the processing report")
    print("2. Run full processing on remaining files in each pattern")
    print("3. Use stored metadata for PDF annotation")
    print("4. Match expenses using stored bounding boxes")

if __name__ == "__main__":
    main() 