#!/usr/bin/env python3
"""
Analyze Organized Folder Structure
==================================

Based on user's organization:
- 4-5+ files with same pattern → own folder
- 1-2 files → either in "other" folder or left in their own folders
"""

import os
import json
from pathlib import Path
from collections import defaultdict

# Tax folder location
TAX_FOLDER = Path(r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy")

# Color codes for output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def analyze_organized_structure():
    """Analyze the organized folder structure and select samples"""
    
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'ORGANIZED FOLDER ANALYSIS'.center(80)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}\n")
    
    # Find all folders with PDFs
    folders_with_samples = []
    total_files = 0
    
    # Walk through the directory structure
    for root, dirs, files in os.walk(TAX_FOLDER):
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        if pdf_files:
            root_path = Path(root)
            rel_path = root_path.relative_to(TAX_FOLDER)
            
            # Pick the first PDF as sample
            sample_file = root_path / pdf_files[0]
            
            folders_with_samples.append({
                'folder': str(rel_path),
                'file_count': len(pdf_files),
                'sample_file': str(sample_file),
                'sample_name': pdf_files[0],
                'all_files': pdf_files
            })
            
            total_files += len(pdf_files)
    
    # Sort by folder path
    folders_with_samples.sort(key=lambda x: x['folder'])
    
    print(f"{Colors.GREEN}Total PDF files: {total_files}{Colors.END}")
    print(f"{Colors.GREEN}Folders with PDFs: {len(folders_with_samples)}{Colors.END}\n")
    
    # Group by major categories
    categories = defaultdict(list)
    for item in folders_with_samples:
        parts = item['folder'].split('\\')
        category = parts[0] if parts else 'Root'
        categories[category].append(item)
    
    # Display organized structure
    for category, items in categories.items():
        print(f"\n{Colors.YELLOW}{Colors.BOLD}{category}:{Colors.END}")
        category_total = sum(item['file_count'] for item in items)
        print(f"  Total files: {category_total}")
        
        for item in items:
            indent = "  " * (item['folder'].count('\\') + 1)
            folder_name = item['folder'].split('\\')[-1]
            
            print(f"{indent}{Colors.CYAN}{folder_name}{Colors.END}: {item['file_count']} files")
            print(f"{indent}  Sample: {Colors.GREEN}{item['sample_name']}{Colors.END}")
            
            # Show logic for why this folder exists
            if item['file_count'] >= 4:
                print(f"{indent}  {Colors.MAGENTA}→ Own folder (4+ similar files){Colors.END}")
            elif item['file_count'] <= 2:
                if 'Other' in item['folder'] or 'NEW-UnIdentified' in item['folder']:
                    print(f"{indent}  {Colors.MAGENTA}→ In 'Other' folder (1-2 unique files){Colors.END}")
                else:
                    print(f"{indent}  {Colors.MAGENTA}→ Small group kept separate{Colors.END}")
    
    # Save the sample list
    print(f"\n{Colors.BLUE}Saving sample files list...{Colors.END}")
    
    # Create a simpler structure for processing
    sample_list = []
    for item in folders_with_samples:
        sample_list.append({
            'folder': item['folder'],
            'sample_file': item['sample_file'],
            'file_count': item['file_count'],
            'document_type': detect_document_type_from_path(item['folder'], item['sample_name'])
        })
    
    with open('organized-samples.json', 'w') as f:
        json.dump({
            'total_files': total_files,
            'total_folders': len(folders_with_samples),
            'samples': sample_list
        }, f, indent=2)
    
    print(f"{Colors.GREEN}✓ Sample list saved to: organized-samples.json{Colors.END}")
    
    # Summary
    print(f"\n{Colors.BLUE}{Colors.BOLD}SUMMARY:{Colors.END}")
    print(f"  • {len(folders_with_samples)} folders to process (one sample each)")
    print(f"  • This covers {total_files} total files")
    print(f"  • Key folders with many files:")
    
    # Show top folders by file count
    sorted_folders = sorted(folders_with_samples, key=lambda x: x['file_count'], reverse=True)
    for folder in sorted_folders[:10]:
        if folder['file_count'] > 5:
            print(f"    - {folder['folder']}: {folder['file_count']} files")
    
    return folders_with_samples

def detect_document_type_from_path(folder_path: str, filename: str) -> str:
    """Detect document type based on folder structure and filename"""
    folder_lower = folder_path.lower()
    filename_lower = filename.lower()
    
    # Bank statements
    if 'bank statement' in folder_lower:
        if 'bilt' in folder_lower:
            return 'bilt'
        elif 'chase freedom' in folder_lower:
            return 'chase-freedom'
        elif 'chase saphire' in folder_lower:
            return 'chase-sapphire'
        elif 'chase checking' in folder_lower:
            return 'chase-checking'
        elif 'bofa' in folder_lower:
            return 'bofa'
    
    # Receipts
    elif 'reciepts' in folder_lower or 'receipts' in folder_lower:
        # Check subfolder patterns
        if 'amazon' in folder_lower:
            return 'amazon-receipts'
        elif 'creativecloud' in folder_lower:
            return 'creative-cloud-receipts'
        elif 'appleservices' in folder_lower or 'applecloud' in folder_lower:
            return 'gmail-receipts'  # Apple uses gmail parser
        elif 'midjourney' in folder_lower:
            return 'gmail-receipts'
        elif 'advertising' in folder_lower:
            return 'gmail-receipts'  # Meta/Google ads
        elif 'new-unidentified' in folder_lower:
            # Check filename for patterns
            if 'invoice' in filename_lower and '(' in filename:
                return 'creative-cloud-receipts'
            else:
                return 'gmail-receipts'
        else:
            return 'gmail-receipts'
    
    return 'general'

if __name__ == "__main__":
    analyze_organized_structure() 