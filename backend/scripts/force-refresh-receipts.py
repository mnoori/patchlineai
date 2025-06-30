#!/usr/bin/env python3
"""
Force refresh receipt data and clear cache
==========================================

This script helps refresh the receipt data and clear any cache issues.
"""

import os
import boto3
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)

# AWS configuration
aws_access_key = os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('ACCESS_KEY_ID')
aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('SECRET_ACCESS_KEY')

aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': aws_access_key,
    'aws_secret_access_key': aws_secret_key
}

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', **aws_config)

# Tables - using correct table names
expenses_table = dynamodb.Table('TaxExpenses-dev')
documents_table = dynamodb.Table('Documents-staging')

def count_recent_receipts(hours=1):
    """Count receipts added in the last N hours"""
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    cutoff_iso = cutoff_time.isoformat()
    
    # Query expenses table
    response = expenses_table.scan(
        FilterExpression='createdAt > :cutoff AND bankAccount = :type',
        ExpressionAttributeValues={
            ':cutoff': cutoff_iso,
            ':type': 'gmail-receipts'
        }
    )
    
    return len(response.get('Items', []))

def get_latest_expenses(limit=10):
    """Get the latest expenses"""
    response = expenses_table.scan(
        FilterExpression='bankAccount = :type',
        ExpressionAttributeValues={
            ':type': 'gmail-receipts'
        }
    )
    
    items = response.get('Items', [])
    # Sort by createdAt descending
    items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    
    return items[:limit]

def verify_new_receipts():
    """Verify new receipts were added"""
    print("="*60)
    print("VERIFYING NEW RECEIPTS")
    print("="*60)
    
    # Count recent receipts
    last_hour = count_recent_receipts(1)
    last_24h = count_recent_receipts(24)
    
    print(f"\nReceipts added in last hour: {last_hour}")
    print(f"Receipts added in last 24 hours: {last_24h}")
    
    # Show latest receipts
    print("\nLatest 10 receipts:")
    print("-" * 60)
    
    latest = get_latest_expenses(10)
    for i, expense in enumerate(latest, 1):
        created = expense.get('createdAt', 'Unknown')
        vendor = expense.get('vendor', 'Unknown')
        amount = expense.get('amount', '0')
        filename = expense.get('filename', 'No filename')
        
        # Parse and format date
        try:
            dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
            time_ago = datetime.utcnow() - dt.replace(tzinfo=None)
            
            if time_ago.total_seconds() < 3600:
                ago_str = f"{int(time_ago.total_seconds() / 60)} minutes ago"
            elif time_ago.total_seconds() < 86400:
                ago_str = f"{int(time_ago.total_seconds() / 3600)} hours ago"
            else:
                ago_str = f"{int(time_ago.days)} days ago"
        except:
            ago_str = "Unknown time"
        
        print(f"{i}. {vendor} - ${amount} - {filename[:40]}... ({ago_str})")
    
    return last_hour > 0

def main():
    """Main function"""
    
    # Verify credentials
    if not aws_access_key:
        print("❌ AWS credentials not found!")
        print("Please check your .env.local file")
        return
    
    print(f"✓ AWS credentials loaded")
    
    # Check for new receipts
    has_new = verify_new_receipts()
    
    if has_new:
        print("\n✅ NEW RECEIPTS FOUND!")
        print("\nTo see them in the UI:")
        print("1. Hard refresh your browser: Ctrl+Shift+R")
        print("2. Clear browser cache if needed")
        print("3. Navigate away from Tax Audit tab and come back")
        print("4. Check both 'Receipts' tab and 'IRS Ready' tab")
    else:
        print("\n⚠️  No new receipts found in the last hour")
        print("\nPossible issues:")
        print("1. The expense processor might not be running")
        print("2. The receipts might not have been processed correctly")
        print("3. There might be a date parsing issue")
        
        print("\nSuggested actions:")
        print("1. Check expense-processor.log for errors")
        print("2. Run: python check-processing-status.py")
        print("3. Run: python reprocess-failed-receipts.py")

if __name__ == "__main__":
    main() 