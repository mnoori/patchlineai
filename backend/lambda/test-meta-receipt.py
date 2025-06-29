#!/usr/bin/env python3

import json
import requests
import sys

def test_meta_receipt():
    """Test processing of a Meta ads receipt"""
    
    # Test with one of the existing documents
    document_id = "doc_1751155907885_bwswl"  # From the log
    
    # Call the test process endpoint
    url = "http://localhost:3001/api/tax-audit/test-process"
    
    payload = {
        "documentId": document_id
    }
    
    print(f"🧪 Testing Meta ads receipt processing...")
    print(f"Document ID: {document_id}")
    print(f"Endpoint: {url}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Test successful!")
            print(json.dumps(result, indent=2))
            
            # Extract the expense result
            if 'expenseResult' in result:
                expense_result = result['expenseResult']
                if 'expenses' in expense_result:
                    expenses = expense_result['expenses']
                    print(f"\n📊 Found {len(expenses)} expenses:")
                    for expense in expenses:
                        print(f"  - Amount: ${expense.get('amount', 'N/A')}")
                        print(f"    Date: {expense.get('transactionDate', 'N/A')}")  
                        print(f"    Description: {expense.get('description', 'N/A')}")
                        print(f"    Vendor: {expense.get('vendor', 'N/A')}")
                        print()
        else:
            print(f"❌ Test failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")

def test_local_description_generation():
    """Test description generation locally"""
    
    # Sample Meta ads receipt text
    sample_text = """
    Your Meta ads receipt
    Account ID: 434492877229135
    
    Date: December 25, 2024
    Campaign: Holiday Music Promotion
    Ad Set: DJ Equipment Targeting
    Objective: Traffic
    Amount: $35.00
    
    This receipt is for advertising on Meta platforms including Facebook and Instagram.
    """
    
    print("🧪 Testing local description generation...")
    
    # This would normally call the expense processor
    print("Sample text:")
    print(sample_text)
    
    # We can test the pattern matching here
    import re
    
    account_match = re.search(r'Account ID[:\s_]*(\d+)', sample_text, re.IGNORECASE)
    campaign_match = re.search(r'Campaign[:\s]*([^\n\r]+)', sample_text, re.IGNORECASE)
    adset_match = re.search(r'Ad Set[:\s]*([^\n\r]+)', sample_text, re.IGNORECASE)
    objective_match = re.search(r'Objective[:\s]*([^\n\r]+)', sample_text, re.IGNORECASE)
    
    print(f"\nPattern matching results:")
    print(f"Account ID: {account_match.group(1) if account_match else 'Not found'}")
    print(f"Campaign: {campaign_match.group(1).strip() if campaign_match else 'Not found'}")
    print(f"Ad Set: {adset_match.group(1).strip() if adset_match else 'Not found'}")
    print(f"Objective: {objective_match.group(1).strip() if objective_match else 'Not found'}")

if __name__ == "__main__":
    print("🔍 Meta Ads Receipt Processing Test")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "local":
        test_local_description_generation()
    else:
        test_meta_receipt() 