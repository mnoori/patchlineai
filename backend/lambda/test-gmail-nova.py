#!/usr/bin/env python3
"""Test Gmail receipt parser with Nova Micro integration"""

import json
import requests
import time

# Test data for Meta ads receipt
meta_ads_textract = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Mehdi <mehdi.noori7@gmail.com>'},
        {'BlockType': 'LINE', 'Text': 'Your Meta ads receipt'},
        {'BlockType': 'LINE', 'Text': 'Meta <noreply@facebookmail.com>'},
        {'BlockType': 'LINE', 'Text': 'To: mehdi.noori7@gmail.com'},
        {'BlockType': 'LINE', 'Text': 'Mon, Dec 24, 2024 at 3:45 PM'},
        {'BlockType': 'LINE', 'Text': 'Meta Platforms Inc., formerly Facebook, Inc. This is an automated message. Please do not reply. If you have questions about ads, you can get help. You can also manage your email notification settings'},
        {'BlockType': 'LINE', 'Text': 'Receipt for your Meta ads purchase'},
        {'BlockType': 'LINE', 'Text': 'Hi Mehdi,'},
        {'BlockType': 'LINE', 'Text': 'Thanks for advertising on Meta technologies. This receipt is for your records.'},
        {'BlockType': 'LINE', 'Text': 'Date: December 24, 2024'},
        {'BlockType': 'LINE', 'Text': 'Campaign: Holiday Music Promotion'},
        {'BlockType': 'LINE', 'Text': 'Ad Account: Music Artist Marketing'},
        {'BlockType': 'LINE', 'Text': 'Ad Set: Instagram Story Ads'},
        {'BlockType': 'LINE', 'Text': 'Impressions: 2,543'},
        {'BlockType': 'LINE', 'Text': 'Clicks: 87'},
        {'BlockType': 'LINE', 'Text': 'Total: $10.05'},
        {'BlockType': 'LINE', 'Text': 'Payment Method: •••• 1234'},
        {'BlockType': 'LINE', 'Text': 'Transaction ID: fb_ads_12345678'},
        {'BlockType': 'LINE', 'Text': 'Thank you for advertising with Meta!'},
    ]
}

def test_parser(test_name, textract_data):
    """Test the expense processor with given data"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"{'='*60}")
    
    # Call the expense processor server
    url = 'http://localhost:8000/process'
    payload = {
        'userId': 'test-user',
        'documentId': 'test-doc-gmail',
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
    print("🚀 Testing Gmail Receipt Parser with Nova Micro")
    
    # Make sure the server is running
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test Meta ads receipt
    test_parser("Meta Ads Receipt", meta_ads_textract)
    
    print("\n✅ Tests completed!") 