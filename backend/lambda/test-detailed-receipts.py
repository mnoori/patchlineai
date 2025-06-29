#!/usr/bin/env python3
"""Test Gmail receipt parser with detailed descriptions"""

import json
import requests
import time

# Test receipts
test_receipts = {
    "Meta Ads Campaign": {
        'Blocks': [
            {'BlockType': 'LINE', 'Text': 'Gmail'},
            {'BlockType': 'LINE', 'Text': 'Your Meta ads receipt'},
            {'BlockType': 'LINE', 'Text': 'Meta <noreply@facebookmail.com>'},
            {'BlockType': 'LINE', 'Text': 'Receipt for your Meta ads purchase'},
            {'BlockType': 'LINE', 'Text': 'Date: December 24, 2024'},
            {'BlockType': 'LINE', 'Text': 'Campaign: Holiday Music Promotion 2024'},
            {'BlockType': 'LINE', 'Text': 'Ad Set: Instagram Story Ads - Target Ages 18-35'},
            {'BlockType': 'LINE', 'Text': 'Objective: Traffic'},
            {'BlockType': 'LINE', 'Text': 'Impressions: 2,543'},
            {'BlockType': 'LINE', 'Text': 'Clicks: 87'},
            {'BlockType': 'LINE', 'Text': 'Total: $10.05'},
            {'BlockType': 'LINE', 'Text': 'Transaction ID: fb_ads_12345678'},
        ]
    },
    
    "Midjourney Pro": {
        'Blocks': [
            {'BlockType': 'LINE', 'Text': 'Your receipt from Midjourney Inc'},
            {'BlockType': 'LINE', 'Text': 'Midjourney Inc <invoice@midjourney.com>'},
            {'BlockType': 'LINE', 'Text': 'Paid November 29, 2024'},
            {'BlockType': 'LINE', 'Text': 'Midjourney Pro Plan'},
            {'BlockType': 'LINE', 'Text': 'Monthly Subscription'},
            {'BlockType': 'LINE', 'Text': 'Fast GPU Time: Unlimited'},
            {'BlockType': 'LINE', 'Text': 'Relaxed GPU Time: Unlimited'},
            {'BlockType': 'LINE', 'Text': 'Amount: $60.00'},
            {'BlockType': 'LINE', 'Text': 'Receipt number: 2278-9512-8517'},
        ]
    },
    
    "Apple iCloud+": {
        'Blocks': [
            {'BlockType': 'LINE', 'Text': 'Apple Receipt'},
            {'BlockType': 'LINE', 'Text': 'APPLE.COM/BILL'},
            {'BlockType': 'LINE', 'Text': 'Date: December 20, 2024'},
            {'BlockType': 'LINE', 'Text': 'iCloud+ with 2 TB of Storage'},
            {'BlockType': 'LINE', 'Text': 'Monthly Subscription'},
            {'BlockType': 'LINE', 'Text': 'Renews January 20, 2025'},
            {'BlockType': 'LINE', 'Text': 'TOTAL: $9.99'},
            {'BlockType': 'LINE', 'Text': 'ORDER ID: ML2K3N4P5Q'},
        ]
    },
    
    "Google Ads": {
        'Blocks': [
            {'BlockType': 'LINE', 'Text': 'Google Ads Receipt'},
            {'BlockType': 'LINE', 'Text': 'Google <noreply@google.com>'},
            {'BlockType': 'LINE', 'Text': 'Invoice Date: December 23, 2024'},
            {'BlockType': 'LINE', 'Text': 'Campaign: Music Lessons NYC - Search Network'},
            {'BlockType': 'LINE', 'Text': 'Account: 123-456-7890'},
            {'BlockType': 'LINE', 'Text': 'Clicks: 156'},
            {'BlockType': 'LINE', 'Text': 'Impressions: 3,421'},
            {'BlockType': 'LINE', 'Text': 'Average CPC: $1.25'},
            {'BlockType': 'LINE', 'Text': 'Total Amount: $195.00'},
        ]
    }
}

def test_parser(test_name, textract_data):
    """Test the expense processor with given data"""
    print(f"\n{'='*80}")
    print(f"Testing: {test_name}")
    print(f"{'='*80}")
    
    # Call the expense processor server
    url = 'http://localhost:8000/process'
    payload = {
        'userId': 'test-user',
        'documentId': f'test-doc-{test_name.lower().replace(" ", "-")}',
        'bankType': 'gmail-receipts',
        'textractData': textract_data
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Extracted {result.get('expensesExtracted', 0)} expenses")
            
            if 'expenses' in result:
                for expense in result['expenses']:
                    print(f"\n📄 Expense Details:")
                    print(f"   Date: {expense.get('date')}")
                    print(f"   Description: {expense.get('description')}")
                    print(f"   Vendor: {expense.get('vendor')}")
                    print(f"   Amount: ${expense.get('amount')}")
                    print(f"   Category: {expense.get('category')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error calling server: {e}")

# Run tests
if __name__ == "__main__":
    print("🚀 Testing Gmail Receipt Parser with Detailed Descriptions")
    
    # Make sure the server is running
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test all receipt types
    for name, data in test_receipts.items():
        test_parser(name, data)
    
    print("\n✅ All tests completed!") 