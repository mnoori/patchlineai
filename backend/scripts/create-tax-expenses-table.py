import boto3
import os
from datetime import datetime
import sys

def create_tax_expenses_table():
    """
    Create a DynamoDB table for storing individual tax expense line items
    """
    print("Setting up TaxExpenses table...")
    
    # Initialize DynamoDB client
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    
    # Define table name based on environment
    env = os.environ.get('ENV', 'dev')
    table_name = f'TaxExpenses-{env}'
    
    print(f"Creating table: {table_name}")
    
    try:
        # Check if table already exists
        existing_tables = dynamodb.list_tables()['TableNames']
        if table_name in existing_tables:
            print(f"Table {table_name} already exists. Skipping creation.")
            return table_name
        
        # Create the table
        response = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {
                    'AttributeName': 'expenseId',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'expenseId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'userId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'documentId',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'transactionDate',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'category',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'businessType',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'scheduleCLine',
                    'AttributeType': 'S'
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'UserIdIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'userId',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'transactionDate',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                },
                {
                    'IndexName': 'DocumentIdIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'documentId',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                },
                {
                    'IndexName': 'CategoryIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'userId',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'category',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                },
                {
                    'IndexName': 'BusinessTypeIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'businessType',
                            'KeyType': 'HASH'
                        },
                        {
                            'AttributeName': 'scheduleCLine',
                            'KeyType': 'RANGE'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            Tags=[
                {
                    'Key': 'Project',
                    'Value': 'patchline-tax-audit'
                },
                {
                    'Key': 'Environment',
                    'Value': env
                }
            ]
        )
        
        print(f"Successfully created table: {table_name}")
        print(f"Table ARN: {response['TableDescription']['TableArn']}")
        
        # Wait for table to become active
        waiter = dynamodb.get_waiter('table_exists')
        print("Waiting for table to become active...")
        waiter.wait(TableName=table_name)
        
        print(f"Table {table_name} is now active and ready to use!")
        
        # Add sample structure documentation
        print("\nTable Structure:")
        print("- expenseId (String): Primary key")
        print("- documentId (String): Reference to source document")
        print("- userId (String): User identifier")
        print("- lineNumber (Number): Line number in source document")
        print("- transactionDate (String): Date of expense (ISO format)")
        print("- amount (Number): Dollar amount")
        print("- description (String): Full transaction description")
        print("- vendor (String): Extracted vendor/merchant name")
        print("- category (String): Auto-classified category")
        print("- scheduleCLine (String): Schedule C line item (e.g., 'Line 8')")
        print("- businessType (String): 'media' or 'consulting'")
        print("- classificationStatus (String): 'pending', 'approved', 'rejected'")
        print("- confidenceScore (Number): AI confidence (0-100)")
        print("- manualNotes (String): User notes")
        print("- proofOfPayment (String): Type of proof (check, card, etc.)")
        print("- createdAt (String): Creation timestamp")
        print("- updatedAt (String): Last update timestamp")
        
        return table_name
        
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    create_tax_expenses_table() 