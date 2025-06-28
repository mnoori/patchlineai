import fitz  # PyMuPDF
import boto3
import json
import os
import tempfile
from typing import List, Dict, Any
import re

s3 = boto3.client('s3')
textract = boto3.client('textract')

def lambda_handler(event, context):
    """
    Preprocess PDF documents by splitting into pages and analyzing each
    """
    bucket = event['bucket']
    key = event['key']
    document_id = event['documentId']
    bank_type = event.get('bankType', 'unknown')
    
    print(f"Starting PDF preprocessing for {document_id}")
    print(f"Bank type: {bank_type}")
    print(f"S3 location: s3://{bucket}/{key}")
    
    # Download PDF from S3
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
        s3.download_file(bucket, key, tmp_file.name)
        pdf_path = tmp_file.name
    
    try:
        # Process PDF
        results = process_pdf(pdf_path, bucket, document_id, bank_type)
        
        # Clean up
        os.unlink(pdf_path)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'documentId': document_id,
                'totalPages': results['total_pages'],
                'processedPages': results['processed_pages'],
                'transactionPages': results['transaction_pages'],
                'skippedPages': results['skipped_pages']
            })
        }
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise e

def process_pdf(pdf_path: str, bucket: str, document_id: str, bank_type: str) -> Dict[str, Any]:
    """
    Split PDF into pages and determine which contain transactions
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    print(f"PDF has {total_pages} pages")
    
    results = {
        'total_pages': total_pages,
        'processed_pages': 0,
        'transaction_pages': [],
        'skipped_pages': []
    }
    
    for page_num in range(total_pages):
        print(f"\nProcessing page {page_num + 1} of {total_pages}")
        
        page = doc[page_num]
        text = page.get_text()
        
        # Check if page likely contains transactions
        if should_process_page(text, bank_type):
            print(f"Page {page_num + 1} appears to contain transactions")
            
            # Extract page as separate PDF
            page_doc = fitz.open()
            page_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
            
            # Save to S3
            page_key = f"preprocessed/{document_id}/page_{page_num + 1}.pdf"
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_page:
                page_doc.save(tmp_page.name)
                s3.upload_file(tmp_page.name, bucket, page_key)
                os.unlink(tmp_page.name)
            
            page_doc.close()
            
            # Start Textract job for this page
            start_textract_job(bucket, page_key, document_id, page_num + 1)
            
            results['transaction_pages'].append({
                'page_num': page_num + 1,
                's3_key': page_key
            })
            results['processed_pages'] += 1
        else:
            print(f"Page {page_num + 1} skipped - no transactions detected")
            results['skipped_pages'].append(page_num + 1)
    
    doc.close()
    
    # Save preprocessing metadata
    metadata_key = f"preprocessed/{document_id}/metadata.json"
    s3.put_object(
        Bucket=bucket,
        Key=metadata_key,
        Body=json.dumps({
            'documentId': document_id,
            'bankType': bank_type,
            'results': results
        })
    )
    
    return results

def should_process_page(text: str, bank_type: str) -> bool:
    """
    Determine if a page likely contains transaction data
    """
    text_lower = text.lower()
    
    # Skip pages that are mostly empty
    if len(text.strip()) < 100:
        return False
    
    # Skip pages with only headers/footers
    if 'page' in text_lower and 'of' in text_lower and len(text.strip()) < 200:
        return False
    
    # Look for transaction indicators
    transaction_indicators = [
        # Date patterns
        r'\d{1,2}/\d{1,2}',  # MM/DD
        r'\d{1,2}-\d{1,2}',  # MM-DD
        
        # Amount patterns
        r'\$[\d,]+\.\d{2}',  # $X,XXX.XX
        r'[\d,]+\.\d{2}',    # X,XXX.XX
        
        # Transaction keywords
        'transaction', 'purchase', 'payment', 'deposit', 'withdrawal',
        'debit', 'credit', 'balance', 'amount'
    ]
    
    # Bank-specific patterns
    if bank_type == 'chase-sapphire':
        transaction_indicators.extend(['purchase', 'payment', 'cash advance'])
    elif bank_type == 'chase-freedom':
        transaction_indicators.extend(['purchase', 'payment', 'cash advance', 'merchant activity'])
    elif bank_type == 'bilt':
        transaction_indicators.extend(['transaction summary', 'reference number'])
    elif bank_type == 'bofa':
        transaction_indicators.extend(['posted transactions', 'pending transactions'])
    
    # Count indicators found
    indicator_count = 0
    for indicator in transaction_indicators:
        if isinstance(indicator, str):
            if indicator in text_lower:
                indicator_count += 1
        else:  # regex pattern
            if re.search(indicator, text):
                indicator_count += 1
    
    # Need at least 3 indicators to consider it a transaction page
    return indicator_count >= 3

def start_textract_job(bucket: str, key: str, document_id: str, page_num: int):
    """
    Start Textract job for a single page
    """
    job_name = f"{document_id}_page_{page_num}"
    
    response = textract.start_document_analysis(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        },
        FeatureTypes=['TABLES', 'FORMS'],
        JobTag=job_name,
        NotificationChannel={
            'SNSTopicArn': os.environ.get('TEXTRACT_SNS_TOPIC_ARN', ''),
            'RoleArn': os.environ.get('TEXTRACT_ROLE_ARN', '')
        } if os.environ.get('TEXTRACT_SNS_TOPIC_ARN') else None
    )
    
    print(f"Started Textract job {response['JobId']} for page {page_num}")
    
    # Store job metadata
    job_metadata = {
        'jobId': response['JobId'],
        'documentId': document_id,
        'pageNum': page_num,
        'status': 'IN_PROGRESS'
    }
    
    s3.put_object(
        Bucket=bucket,
        Key=f"preprocessed/{document_id}/jobs/page_{page_num}_job.json",
        Body=json.dumps(job_metadata)
    )
    
    return response['JobId'] 