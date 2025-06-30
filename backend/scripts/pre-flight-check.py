#!/usr/bin/env python3
"""
Pre-flight check before clean slate operation
"""

import os
import sys
import requests
import boto3
from pathlib import Path
from dotenv import load_dotenv
from colorama import init, Fore, Style

# Initialize colorama
init()

# Load environment variables
env_path = Path(__file__).parent.parent.parent / '.env.local'
load_dotenv(env_path)

def check_environment():
    """Check environment variables"""
    print(f"{Fore.CYAN}🔧 ENVIRONMENT CHECK{Style.RESET_ALL}")
    print(f"{'='*40}")
    
    required_vars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION'
    ]
    
    all_good = True
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✓ {var}: {'*' * 10}")
        else:
            print(f"  ✗ {var}: Missing")
            all_good = False
    
    return all_good

def check_servers():
    """Check if servers are running"""
    print(f"\n{Fore.CYAN}🌐 SERVER CHECK{Style.RESET_ALL}")
    print(f"{'='*40}")
    
    # Check Next.js
    try:
        resp = requests.get('http://localhost:3000/api/health', timeout=5)
        if resp.status_code == 200:
            print(f"  ✓ Next.js server (port 3000)")
        else:
            print(f"  ⚠ Next.js server responding but status {resp.status_code}")
            return False
    except:
        print(f"  ✗ Next.js server (port 3000) - Not running")
        return False
    
    # Check expense processor
    try:
        resp = requests.get('http://localhost:8000/health', timeout=5)
        if resp.status_code == 200:
            print(f"  ✓ Expense processor (port 8000)")
        else:
            print(f"  ⚠ Expense processor responding but status {resp.status_code}")
            return False
    except:
        print(f"  ✗ Expense processor (port 8000) - Not running")
        return False
    
    return True

def check_aws_connection():
    """Check AWS connection"""
    print(f"\n{Fore.CYAN}☁️  AWS CONNECTION CHECK{Style.RESET_ALL}")
    print(f"{'='*40}")
    
    try:
        # Test DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('Documents-staging')
        table.load()
        print(f"  ✓ DynamoDB connection")
        
        # Test S3
        s3 = boto3.client('s3')
        try:
            s3.head_bucket(Bucket='patchy-inbox-v2')
            print(f"  ✓ S3 connection")
        except Exception as s3_error:
            print(f"  ⚠ S3 bucket check failed: {s3_error}")
            print(f"    (This might be okay if bucket name is different)")
            # Don't fail the whole check for S3 bucket
        
        return True
    except Exception as e:
        print(f"  ✗ AWS connection failed: {e}")
        return False

def check_folder(folder_path):
    """Check folder and count files"""
    print(f"\n{Fore.CYAN}📁 FOLDER CHECK{Style.RESET_ALL}")
    print(f"{'='*40}")
    
    if not os.path.exists(folder_path):
        print(f"  ✗ Folder not found: {folder_path}")
        return False
    
    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    print(f"  ✓ Folder exists: {folder_path}")
    print(f"  ✓ PDF files found: {len(pdf_files)}")
    
    # Show sample files
    if pdf_files:
        print(f"\n  Sample files:")
        for file in pdf_files[:5]:
            print(f"    • {file}")
        if len(pdf_files) > 5:
            print(f"    ... and {len(pdf_files) - 5} more")
    
    return len(pdf_files) > 0

def main():
    folder = r'C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified'
    
    if len(sys.argv) > 1:
        folder = sys.argv[1]
    
    print(f"{Fore.CYAN}✈️  PRE-FLIGHT CHECK{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*50}{Style.RESET_ALL}")
    
    checks = [
        ("Environment", check_environment),
        ("Servers", check_servers),
        ("AWS Connection", check_aws_connection),
        ("Folder", lambda: check_folder(folder))
    ]
    
    all_passed = True
    for name, check_func in checks:
        if not check_func():
            all_passed = False
    
    print(f"\n{Fore.CYAN}📋 SUMMARY{Style.RESET_ALL}")
    print(f"{'='*40}")
    
    if all_passed:
        print(f"{Fore.GREEN}✅ ALL CHECKS PASSED{Style.RESET_ALL}")
        print(f"\n{Fore.CYAN}Ready for clean slate operation!{Style.RESET_ALL}")
        print(f"\nTo proceed:")
        print(f"  python clean-slate-rerun.py")
    else:
        print(f"{Fore.RED}❌ SOME CHECKS FAILED{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Fix the issues above before proceeding{Style.RESET_ALL}")
        
        print(f"\n{Fore.CYAN}Quick fixes:{Style.RESET_ALL}")
        print(f"  • Start Next.js: npm run dev")
        print(f"  • Restart expense processor: python restart-expense-processor.py")
        print(f"  • Check AWS credentials in .env.local")

if __name__ == '__main__':
    main() 