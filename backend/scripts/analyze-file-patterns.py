#!/usr/bin/env python3
"""
Analyze File Patterns in Tax Folder
===================================

Step 1: Find unique file name patterns and group them
"""

import os
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

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

def normalize_filename(filename: str) -> str:
    """
    Normalize a filename to identify its pattern.
    Returns a pattern string where variable parts are replaced with placeholders.
    """
    pattern = filename.lower()
    
    # Remove file extension
    pattern = pattern.replace('.pdf', '')
    
    # Replace numbers in parentheses like (1), (2), (22)
    pattern = re.sub(r'\s*\(\d+\)\s*', ' (NUM)', pattern)
    
    # Replace dates in various formats
    pattern = re.sub(r'\d{4}-\d{2}-\d{2}', 'DATE', pattern)
    pattern = re.sub(r'\d{2}-\d{2}-\d{4}', 'DATE', pattern)
    pattern = re.sub(r'\d{1,2}/\d{1,2}/\d{4}', 'DATE', pattern)
    pattern = re.sub(r'\d{1,2}-\d{1,2}-\d{2}', 'DATE', pattern)
    
    # Replace month names
    months = ['january', 'february', 'march', 'april', 'may', 'june', 
              'july', 'august', 'september', 'october', 'november', 'december',
              'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for month in months:
        pattern = re.sub(rf'\b{month}\b', 'MONTH', pattern, flags=re.IGNORECASE)
    
    # Replace order numbers and long alphanumeric sequences
    pattern = re.sub(r'\b[A-Z0-9]{8,}\b', 'ORDERNUM', pattern)
    pattern = re.sub(r'#?\d{6,}', 'ORDERNUM', pattern)
    
    # Replace amounts like $10.99, $1,234.56
    pattern = re.sub(r'\$?[\d,]+\.\d{2}', 'AMOUNT', pattern)
    
    # Replace remaining standalone numbers
    pattern = re.sub(r'\b\d+\b', 'NUM', pattern)
    
    # Clean up extra spaces
    pattern = ' '.join(pattern.split())
    
    return pattern

def analyze_file_patterns():
    """Analyze all PDF files and group by pattern"""
    
    if not TAX_FOLDER.exists():
        print(f"{Colors.RED}Error: Tax folder not found at {TAX_FOLDER}{Colors.END}")
        return
    
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'FILE PATTERN ANALYSIS'.center(80)}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.END}\n")
    
    print(f"Analyzing folder: {TAX_FOLDER}\n")
    
    # Group files by folder structure and pattern
    pattern_groups = defaultdict(list)
    folder_stats = defaultdict(int)
    
    total_files = 0
    for pdf_file in TAX_FOLDER.rglob("*.pdf"):
        total_files += 1
        
        # Get relative path from tax folder
        rel_path = pdf_file.relative_to(TAX_FOLDER)
        folder_path = rel_path.parent
        
        # Count files per folder
        folder_stats[str(folder_path)] += 1
        
        # Create pattern key combining folder and filename pattern
        filename_pattern = normalize_filename(pdf_file.name)
        pattern_key = f"{folder_path} / {filename_pattern}"
        
        pattern_groups[pattern_key].append(pdf_file)
    
    print(f"{Colors.GREEN}Total PDF files found: {total_files}{Colors.END}\n")
    
    # Show folder statistics
    print(f"{Colors.YELLOW}Files by folder:{Colors.END}")
    for folder, count in sorted(folder_stats.items()):
        print(f"  {folder}: {count} files")
    
    print(f"\n{Colors.YELLOW}Unique file patterns found: {len(pattern_groups)}{Colors.END}\n")
    
    # Sort patterns by number of files (descending)
    sorted_patterns = sorted(pattern_groups.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Create sample files list
    sample_files = []
    
    print(f"{Colors.CYAN}File patterns (sorted by frequency):{Colors.END}\n")
    
    for i, (pattern, files) in enumerate(sorted_patterns, 1):
        print(f"{Colors.BOLD}{i}. Pattern: {pattern}{Colors.END}")
        print(f"   Files: {len(files)}")
        
        # Show first file as sample
        sample_file = files[0]
        sample_files.append((pattern, sample_file, files))
        print(f"   Sample: {Colors.GREEN}{sample_file.name}{Colors.END}")
        
        # Show a few more examples if there are multiple files
        if len(files) > 1:
            print(f"   Others: ", end="")
            for j, other_file in enumerate(files[1:4]):  # Show up to 3 more
                if j > 0:
                    print(", ", end="")
                print(f"{other_file.name}", end="")
            if len(files) > 4:
                print(f", ... ({len(files) - 4} more)")
            else:
                print()
        
        print()  # Empty line between patterns
    
    # Save the sample files list
    print(f"\n{Colors.BLUE}Saving sample files list...{Colors.END}")
    
    with open('file-pattern-analysis.txt', 'w') as f:
        f.write(f"File Pattern Analysis\n")
        f.write(f"====================\n")
        f.write(f"Analyzed: {TAX_FOLDER}\n")
        f.write(f"Total files: {total_files}\n")
        f.write(f"Unique patterns: {len(pattern_groups)}\n\n")
        
        for i, (pattern, sample_file, all_files) in enumerate(sample_files, 1):
            f.write(f"\nPattern {i}: {pattern}\n")
            f.write(f"Files: {len(all_files)}\n")
            f.write(f"Sample: {sample_file}\n")
            f.write(f"All files in this pattern:\n")
            for file in all_files:
                f.write(f"  - {file}\n")
    
    # Also save as JSON for programmatic use
    import json
    
    sample_data = []
    for pattern, sample_file, all_files in sample_files:
        sample_data.append({
            'pattern': pattern,
            'sample_file': str(sample_file),
            'file_count': len(all_files),
            'all_files': [str(f) for f in all_files]
        })
    
    with open('file-patterns.json', 'w') as f:
        json.dump({
            'tax_folder': str(TAX_FOLDER),
            'total_files': total_files,
            'unique_patterns': len(pattern_groups),
            'patterns': sample_data
        }, f, indent=2)
    
    print(f"{Colors.GREEN}✓ Analysis saved to:{Colors.END}")
    print(f"  - file-pattern-analysis.txt (human readable)")
    print(f"  - file-patterns.json (for processing)")
    
    print(f"\n{Colors.CYAN}Next steps:{Colors.END}")
    print(f"1. Review the patterns above")
    print(f"2. Run test processing on the {len(sample_files)} sample files")
    print(f"3. Check if AI descriptions are generated correctly")
    print(f"4. Apply fixes before processing all files")
    
    return sample_files

if __name__ == "__main__":
    analyze_file_patterns() 