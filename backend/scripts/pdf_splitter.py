import os
import sys
import boto3
from PyPDF2 import PdfReader, PdfWriter
import tempfile
import json
import warnings

# Suppress PyPDF2 warnings
warnings.filterwarnings("ignore", category=UserWarning, module='PyPDF2')

def split_pdf_to_pages(s3_key, bucket_name='patchline-documents-staging'):
    """
    Download PDF from S3, split into individual pages, upload each page back to S3
    Returns list of S3 keys for each page
    """
    s3_client = boto3.client('s3')
    
    # Create temp directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        # Download original PDF
        local_pdf_path = os.path.join(temp_dir, 'original.pdf')
        s3_client.download_file(bucket_name, s3_key, local_pdf_path)
        
        # Read PDF and get page count
        reader = PdfReader(local_pdf_path)
        num_pages = len(reader.pages)
        
        # Extract base path for page uploads
        base_path = s3_key.rsplit('.', 1)[0]  # Remove .pdf extension
        page_keys = []
        
        # Split into individual pages
        for page_num in range(num_pages):
            # Create single-page PDF
            writer = PdfWriter()
            writer.add_page(reader.pages[page_num])
            
            # Save page to temp file
            page_filename = f'page_{page_num + 1}.pdf'
            page_path = os.path.join(temp_dir, page_filename)
            with open(page_path, 'wb') as page_file:
                writer.write(page_file)
            
            # Upload page to S3
            page_s3_key = f"{base_path}/pages/{page_filename}"
            s3_client.upload_file(page_path, bucket_name, page_s3_key)
            
            page_keys.append({
                'pageNumber': page_num + 1,
                's3Key': page_s3_key,
                'bucket': bucket_name
            })
        
        return {
            'success': True,
            'totalPages': num_pages,
            'pages': page_keys
        }

if __name__ == '__main__':
    # Redirect stderr to null to suppress warnings
    sys.stderr = open(os.devnull, 'w')
    
    # Get S3 key from command line argument
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No S3 key provided'}))
        sys.exit(1)
    
    s3_key = sys.argv[1]
    
    try:
        result = split_pdf_to_pages(s3_key)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1) 