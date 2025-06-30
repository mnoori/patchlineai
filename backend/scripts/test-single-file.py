#!/usr/bin/env python3
"""
Test single file processing to verify expense extraction
"""

import requests
import os
from pathlib import Path

def test_single_file():
    # Test with the first file from your folder
    test_file = r"C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy\Reciepts\NEW-UnIdentified\3633723.pdf"
    
    if not os.path.exists(test_file):
        print("Test file not found!")
        return
    
    session = requests.Session()
    headers = {
        'Cookie': 'userId=default-user',
        'X-User-Id': 'default-user'
    }
    
    filename = Path(test_file).name
    
    print(f"Testing file: {filename}")
    
    try:
        # Step 1: Get presigned S3 URL
        with open(test_file, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            data = {
                'bankType': 'gmail-receipts',
                'userId': 'default-user'
            }
            
            upload_resp = session.post(
                'http://localhost:3000/api/documents/upload',
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )
            
            if upload_resp.status_code != 200:
                print(f"Upload failed: HTTP {upload_resp.status_code}")
                return
            
            upload_data = upload_resp.json()
            upload_url = upload_data.get('uploadUrl')
            s3_key = upload_data.get('s3Key')
            doc_id = upload_data.get('documentId')
            
            print(f"✓ Got upload URL: {doc_id}")
        
        # Step 2: PUT file to S3
        with open(test_file, 'rb') as f:
            file_bytes = f.read()
        
        put_resp = session.put(
            upload_url,
            data=file_bytes,
            headers={"Content-Type": "application/pdf"},
            timeout=120
        )
        
        if put_resp.status_code not in (200, 204):
            print(f"S3 PUT failed: HTTP {put_resp.status_code}")
            return
        
        print(f"✓ Uploaded to S3")
        
        # Step 3: Process document
        proc_data = {
            's3Key': s3_key,
            'documentId': doc_id,
            'filename': filename,
            'userId': 'default-user',
            'documentType': 'gmail-receipts'
        }
        
        proc_resp = session.post(
            'http://localhost:3000/api/documents/process',
            json=proc_data,
            headers=headers,
            timeout=60
        )
        
        if proc_resp.status_code == 200:
            result = proc_resp.json()
            expense_count = len(result.get('expenses', []))
            print(f"✓ Processed: {expense_count} expenses created")
            
            if expense_count > 0:
                print("SUCCESS! Expense extraction is working!")
                expenses = result.get('expenses', [])
                for exp in expenses:
                    print(f"  - {exp.get('description', 'No description')}: ${exp.get('amount', '0')}")
            else:
                print("WARNING: Still creating 0 expenses")
                print("Response:", result)
        else:
            print(f"Processing failed: HTTP {proc_resp.status_code}")
            print("Response:", proc_resp.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_single_file() 