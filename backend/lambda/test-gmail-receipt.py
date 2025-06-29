#!/usr/bin/env python3
"""Test script for Gmail receipt parser"""

import json
import sys
import os

# Add the parent directory to the path to import the expense processor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import using the module name without hyphen
import importlib.util
spec = importlib.util.spec_from_file_location("expense_processor", "expense-processor.py")
expense_processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expense_processor)

# Now we can use the GmailReceiptParser
GmailReceiptParser = expense_processor.GmailReceiptParser

# Test data for Midjourney receipt
midjourney_textract = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Mehdi <mehdi.noori7@gmail.com>'},
        {'BlockType': 'LINE', 'Text': 'Your receipt from Midjourney Inc #2278-9512-8517'},
        {'BlockType': 'LINE', 'Text': 'Midjourney Inc <invoice+statements@midjourney.com>'},
        {'BlockType': 'LINE', 'Text': 'Reply-To: Midjourney Inc <billing@midjourney.com>'},
        {'BlockType': 'LINE', 'Text': 'To: mehdi.noori7@gmail.com'},
        {'BlockType': 'LINE', 'Text': 'Fri, Nov 29, 2024 at 10:39 PM'},
        {'BlockType': 'LINE', 'Text': 'Midjourney Inc'},
        {'BlockType': 'LINE', 'Text': 'Receipt from Midjourney Inc'},
        {'BlockType': 'LINE', 'Text': '$10.89'},
        {'BlockType': 'LINE', 'Text': 'Paid November 29, 2024'},
        {'BlockType': 'LINE', 'Text': 'Download invoice Download receipt'},
        {'BlockType': 'LINE', 'Text': 'Receipt number 2278-9512-8517'},
        {'BlockType': 'LINE', 'Text': 'Invoice number EB5152EE-0021'},
        {'BlockType': 'LINE', 'Text': 'Payment method VISA - 1301'},
        {'BlockType': 'LINE', 'Text': 'Receipt #2278-9512-8517'},
        {'BlockType': 'LINE', 'Text': 'NOV 29 - DEC 30, 2024'},
        {'BlockType': 'LINE', 'Text': 'Basic Plan $10.00'},
        {'BlockType': 'LINE', 'Text': 'Qty 1'},
        {'BlockType': 'LINE', 'Text': 'Subtotal $10.00'},
        {'BlockType': 'LINE', 'Text': 'Total excluding tax $10.00'},
        {'BlockType': 'LINE', 'Text': 'Sales Tax - New York (8.875%) $0.89'},
        {'BlockType': 'LINE', 'Text': 'Total $10.89'},
    ]
}

# Test data for Apple receipt
apple_textract = {
    'Blocks': [
        {'BlockType': 'LINE', 'Text': 'Gmail'},
        {'BlockType': 'LINE', 'Text': 'Your receipt from Apple.'},
        {'BlockType': 'LINE', 'Text': 'Apple <no_reply@email.apple.com>'},
        {'BlockType': 'LINE', 'Text': 'To: mehdi.noori7@gmail.com'},
        {'BlockType': 'LINE', 'Text': 'Thu, Nov 28, 2024 at 2:45 AM'},
        {'BlockType': 'LINE', 'Text': 'Receipt'},
        {'BlockType': 'LINE', 'Text': 'Save 3% on all your Apple purchases with Apple Card.'},
        {'BlockType': 'LINE', 'Text': 'APPLE ACCOUNT'},
        {'BlockType': 'LINE', 'Text': 'mehdi.noori7@gmail.com'},
        {'BlockType': 'LINE', 'Text': 'DATE'},
        {'BlockType': 'LINE', 'Text': 'Nov 27, 2024'},
        {'BlockType': 'LINE', 'Text': 'ORDER ID'},
        {'BlockType': 'LINE', 'Text': 'MN40G69DJL'},
        {'BlockType': 'LINE', 'Text': 'BILLED TO'},
        {'BlockType': 'LINE', 'Text': 'PayPal'},
        {'BlockType': 'LINE', 'Text': 'Mehdi Noori'},
        {'BlockType': 'LINE', 'Text': '1529 Cambridge St'},
        {'BlockType': 'LINE', 'Text': 'Apt 2906'},
        {'BlockType': 'LINE', 'Text': 'Cambridge, MA 02139'},
        {'BlockType': 'LINE', 'Text': 'USA'},
        {'BlockType': 'LINE', 'Text': 'iCloud+'},
        {'BlockType': 'LINE', 'Text': '$9.99'},
        {'BlockType': 'LINE', 'Text': 'iCloud+ with 2 TB of Storage'},
        {'BlockType': 'LINE', 'Text': 'Monthly'},
        {'BlockType': 'LINE', 'Text': 'Renews Dec 28, 2024'},
        {'BlockType': 'LINE', 'Text': 'TOTAL $9.99'},
    ]
}

def test_parser():
    """Test the Gmail receipt parser"""
    
    # Test Midjourney receipt
    print("Testing Midjourney Receipt Parser...")
    parser = GmailReceiptParser('gmail-receipts', 'test-user', 'test-doc-1')
    expenses = parser.parse_textract_output(midjourney_textract)
    
    print(f"\nFound {len(expenses)} expenses from Midjourney receipt:")
    for expense in expenses:
        print(f"  - Date: {expense['date']}")
        print(f"    Description: {expense['description']}")
        print(f"    Amount: ${expense['amount']}")
        print(f"    Category: {expense['category']}")
        print(f"    Receipt #: {expense.get('receiptNumber', 'N/A')}")
        print(f"    Invoice #: {expense.get('invoiceNumber', 'N/A')}")
    
    # Test Apple receipt
    print("\n\nTesting Apple Receipt Parser...")
    parser2 = GmailReceiptParser('gmail-receipts', 'test-user', 'test-doc-2')
    expenses2 = parser2.parse_textract_output(apple_textract)
    
    print(f"\nFound {len(expenses2)} expenses from Apple receipt:")
    for expense in expenses2:
        print(f"  - Date: {expense['date']}")
        print(f"    Description: {expense['description']}")
        print(f"    Amount: ${expense['amount']}")
        print(f"    Category: {expense['category']}")
        print(f"    Order #: {expense.get('orderNumber', 'N/A')}")
    
    # Test with a generic receipt
    print("\n\nTesting Generic Receipt Parser...")
    generic_textract = {
        'Blocks': [
            {'BlockType': 'LINE', 'Text': 'Invoice'},
            {'BlockType': 'LINE', 'Text': 'From: SomeCompany LLC'},
            {'BlockType': 'LINE', 'Text': 'Date: December 1, 2024'},
            {'BlockType': 'LINE', 'Text': 'Service: Cloud Hosting'},
            {'BlockType': 'LINE', 'Text': 'Total: $99.99'},
        ]
    }
    
    parser3 = GmailReceiptParser('gmail-receipts', 'test-user', 'test-doc-3')
    expenses3 = parser3.parse_textract_output(generic_textract)
    
    print(f"\nFound {len(expenses3)} expenses from generic receipt:")
    for expense in expenses3:
        print(f"  - Date: {expense['date']}")
        print(f"    Description: {expense['description']}")
        print(f"    Amount: ${expense['amount']}")
        print(f"    Category: {expense['category']}")
        print(f"    Vendor: {expense['vendor']}")

if __name__ == '__main__':
    test_parser() 