import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize S3 client
s3 = boto3.client('s3')

BUCKET_NAME = os.getenv('DOCUMENTS_BUCKET', 'patchline-documents-staging')

def list_bofa_documents():
    """List all BofA documents in S3"""
    print("Searching for BofA documents in S3...")
    
    # List objects with prefix
    response = s3.list_objects_v2(
        Bucket=BUCKET_NAME,
        Prefix='documents/default-user/bofa/'
    )
    
    if 'Contents' not in response:
        print("No BofA documents found")
        return []
    
    documents = []
    for obj in response['Contents']:
        if obj['Key'].endswith('.pdf'):
            documents.append(obj['Key'])
            print(f"Found: {obj['Key']}")
    
    return documents

def list_all_documents():
    """List all documents in the bucket"""
    print(f"\nListing all documents in bucket: {BUCKET_NAME}")
    
    try:
        response = s3.list_objects_v2(
            Bucket=BUCKET_NAME,
            Prefix='documents/',
            MaxKeys=20
        )
        
        if 'Contents' not in response:
            print("No documents found in bucket")
            return
        
        print(f"Found {len(response['Contents'])} objects:")
        for obj in response['Contents']:
            print(f"  {obj['Key']} (Size: {obj['Size']} bytes)")
            
    except Exception as e:
        print(f"Error listing bucket contents: {e}")

def get_textract_results(document_id):
    """Get Textract results for a document"""
    textract_key = f"textract-output/{document_id}/full-results.json"
    
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=textract_key)
        data = json.loads(response['Body'].read())
        return data
    except Exception as e:
        print(f"Error getting Textract results: {e}")
        return None

def analyze_bofa_textract(document_key):
    """Analyze Textract results for a BofA document"""
    # Extract document ID from key
    parts = document_key.split('/')
    document_id = parts[-2] if len(parts) > 2 else None
    
    if not document_id:
        print(f"Could not extract document ID from: {document_key}")
        return
    
    print(f"\nAnalyzing document: {document_id}")
    
    # Get Textract results
    results = get_textract_results(document_id)
    if not results:
        print("No Textract results found")
        return
    
    print(f"Tables found: {len(results.get('tables', []))}")
    print(f"Forms found: {len(results.get('forms', []))}")
    print(f"Text length: {len(results.get('text', ''))}")
    
    # Analyze tables
    tables = results.get('tables', [])
    for i, table in enumerate(tables):
        print(f"\nTable {i+1}:")
        if 'rows' in table and len(table['rows']) > 0:
            print(f"  Rows: {len(table['rows'])}")
            
            # Show first 5 rows
            for j, row in enumerate(table['rows'][:5]):
                cells = [cell.get('text', '') for cell in row.get('cells', [])]
                print(f"  Row {j+1}: {cells}")
            
            if len(table['rows']) > 5:
                print(f"  ... and {len(table['rows']) - 5} more rows")
    
    # Look for transaction patterns in text
    text = results.get('text', '')
    lines = text.split('\n')
    
    print("\nSearching for transaction patterns in text...")
    transaction_count = 0
    
    for i, line in enumerate(lines):
        # Look for BofA transaction patterns
        if ('Withdrawals and other debits' in line or 
            'Deposits and other credits' in line or
            'ELECTRONIC PAYMENT' in line or
            'AMAZON' in line):
            print(f"  Line {i}: {line[:100]}...")
            
            # Show next few lines for context
            for j in range(1, min(4, len(lines) - i)):
                print(f"    +{j}: {lines[i+j][:100]}...")

if __name__ == "__main__":
    # First list all documents to see the structure
    list_all_documents()
    
    documents = list_bofa_documents()
    
    if documents:
        # Analyze the most recent document
        latest_doc = documents[-1]
        analyze_bofa_textract(latest_doc)
    else:
        print("No BofA documents found to analyze") 