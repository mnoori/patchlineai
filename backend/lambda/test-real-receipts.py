#!/usr/bin/env python3
"""Test Gmail receipt parser with real receipt examples"""

import json
import requests
import time

# Test based on actual Meta receipt from logs
meta_receipt_real = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Your Meta ads receipt (Account ID: 434492877229135)'},
        {'BlockType': 'LINE', 'Text': 'Meta <noreply@facebookmail.com>'},
        {'BlockType': 'LINE', 'Text': 'Meta Platforms Inc., formerly Facebook, Inc. This is an automated message. Please do not reply. If you have questions about ads, you can get help. You can also manage your email notification settings'},
        {'BlockType': 'LINE', 'Text': 'Receipt for your Meta ads purchase'},
        {'BlockType': 'LINE', 'Text': 'Hi there,'},
        {'BlockType': 'LINE', 'Text': 'Thanks for advertising on Meta technologies.'},
        {'BlockType': 'LINE', 'Text': 'Account ID: 434492877229135'},
        {'BlockType': 'LINE', 'Text': 'Date: December 23, 2024'},
        {'BlockType': 'LINE', 'Text': 'Amount: $2.77'},
        {'BlockType': 'LINE', 'Text': 'Payment method: •••• 1234'},
        {'BlockType': 'LINE', 'Text': 'Results delivered'},
        {'BlockType': 'LINE', 'Text': 'Your ads delivered results'},
    ]
}

# Other receipt examples
capcut_receipt = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Receipt for Your Payment to PIPO (SG) PTE LTD: CAPCUT'},
        {'BlockType': 'LINE', 'Text': 'CapCut <noreply@capcut.com>'},
        {'BlockType': 'LINE', 'Text': 'Payment Receipt'},
        {'BlockType': 'LINE', 'Text': 'Date: December 15, 2024'},
        {'BlockType': 'LINE', 'Text': 'CapCut Pro Subscription'},
        {'BlockType': 'LINE', 'Text': 'Monthly Plan'},
        {'BlockType': 'LINE', 'Text': 'Amount: $7.99'},
        {'BlockType': 'LINE', 'Text': 'Thank you for your purchase!'},
    ]
}

instacart_receipt = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Your Instacart order receipt'},
        {'BlockType': 'LINE', 'Text': 'Instacart <receipts@instacart.com>'},
        {'BlockType': 'LINE', 'Text': 'Order delivered from Whole Foods'},
        {'BlockType': 'LINE', 'Text': 'Date: December 20, 2024'},
        {'BlockType': 'LINE', 'Text': 'Order total: $45.67'},
        {'BlockType': 'LINE', 'Text': 'Delivery fee: $3.99'},
        {'BlockType': 'LINE', 'Text': 'Tip: $9.13'},
        {'BlockType': 'LINE', 'Text': 'Total: $58.79'},
    ]
}

def test_parser(test_name, textract_data, expected_vendor=None, expected_category=None):
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
            
            if 'expenses' in result and result['expenses']:
                expense = result['expenses'][0]
                print(f"\n📄 Expense Details:")
                print(f"   Date: {expense.get('date')}")
                print(f"   Description: {expense.get('description')}")
                print(f"   Vendor: {expense.get('vendor')}")
                print(f"   Amount: ${expense.get('amount')}")
                print(f"   Category: {expense.get('category')}")
                
                # Validate expectations
                if expected_vendor and expense.get('vendor') != expected_vendor:
                    print(f"\n❌ ERROR: Expected vendor '{expected_vendor}' but got '{expense.get('vendor')}'")
                if expected_category and expense.get('category') != expected_category:
                    print(f"❌ ERROR: Expected category '{expected_category}' but got '{expense.get('category')}'")
                
                # Check vendor length
                vendor_len = len(expense.get('vendor', ''))
                if vendor_len > 50:
                    print(f"\n⚠️  WARNING: Vendor field too long ({vendor_len} chars): {expense.get('vendor')[:100]}...")
            else:
                print("❌ No expenses extracted!")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error calling server: {e}")

# Run tests
if __name__ == "__main__":
    print("🚀 Testing Gmail Receipt Parser with Real Examples")
    
    # Make sure the server is running
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Test real receipts
    test_parser("Meta Ads Receipt (Real)", meta_receipt_real, 
                expected_vendor="Meta", expected_category="advertising")
    
    test_parser("CapCut Pro Subscription", capcut_receipt,
                expected_vendor="CapCut", expected_category="platform_expenses")
    
    test_parser("Instacart Whole Foods", instacart_receipt,
                expected_vendor="Instacart", expected_category="office_expenses")
    
    print("\n✅ All tests completed!") 