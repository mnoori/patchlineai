#!/usr/bin/env python3
"""Check expenses for specific document IDs"""
import boto3
import os
from pathlib import Path

# Load environment
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent / '.env.local'
    load_dotenv(env_path)
except:
    pass

# AWS Config
aws_config = {
    'region_name': os.getenv('AWS_REGION', 'us-east-1'),
    'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID'),
    'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY')
}

# Initialize
dynamodb = boto3.resource('dynamodb', **aws_config)
expenses_table = dynamodb.Table('TaxExpenses-dev')

# Check specific documents
test_docs = [
    {
        'id': 'doc_1751295004547_60cuml',
        'name': 'Creative Cloud invoice (1).pdf',
        'type': 'creative-cloud-receipts'
    },
    {
        'id': 'doc_1751294591664_y3r4dv',
        'name': 'Gmail - Mehdi, Here is your order receipt_17.pdf',
        'type': 'gmail-receipts'
    },
    {
        'id': 'doc_1751294504977_yya5ob',
        'name': 'Bilt-April.pdf', 
        'type': 'bilt'
    }
]

print("Checking expenses for test documents...\n")

for doc in test_docs:
    response = expenses_table.scan(
        FilterExpression='documentId = :doc_id',
        ExpressionAttributeValues={':doc_id': doc['id']}
    )
    
    expenses = response.get('Items', [])
    print(f"Document: {doc['name']}")
    print(f"  Type: {doc['type']}")
    print(f"  ID: {doc['id']}")
    print(f"  Expenses found: {len(expenses)}")
    
    if expenses:
        total = sum(float(e.get('amount', 0)) for e in expenses)
        print(f"  Total amount: ${total:,.2f}")
        print(f"  Sample expense:")
        exp = expenses[0]
        print(f"    - {exp.get('date', 'N/A')} | ${exp.get('amount', 0)} | {exp.get('description', 'N/A')[:50]}")
    print() 