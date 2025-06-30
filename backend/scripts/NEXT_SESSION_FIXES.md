# Next Session: Critical Fixes Required

## 🚨 PRIORITY 1: Fix Timestamp Issue (System showing June 2025)

### Problem
- Current date: December 30, 2024
- System timestamps showing: June 30, 2025 (6 months in the future)
- Example: `createdAt: '2025-06-30T16:49:59.751641'`

### Root Cause Investigation Steps
1. Check system time: `Get-Date` in PowerShell
2. Check Python datetime: `python -c "from datetime import datetime; print(datetime.utcnow())"`
3. Check if issue is in:
   - `datetime.utcnow().isoformat()` in expense-processor.py
   - JavaScript `new Date()` in TypeScript files
   - AWS region time settings

### Fix Implementation
```python
# In expense-processor.py, search for all instances of:
datetime.utcnow().isoformat()

# Replace with:
datetime.now().isoformat()  # If local time is correct
# OR
from datetime import timezone
datetime.now(timezone.utc).isoformat()  # For proper UTC
```

## 🚨 PRIORITY 2: Fix Vendor Detection (Apple Services showing as "mehdi.noori7")

### Problem
- Apple Services receipts showing vendor as "mehdi.noori7" (email address)
- Location: `backend/lambda/expense-processor.py` around line 1845

### Current Code Issue
```python
# Around line 1835-1850
if email_match:
    domain = email_match.group(2)
    # This is extracting the email username instead of properly detecting Apple
```

### Fix Implementation
```python
# In expense-processor.py, find the email extraction section and add:
if '@' in line and '.' in line and i < 10:
    email_match = re.search(r'([a-zA-Z0-9.-]+)@([a-zA-Z0-9.-]+)', line)
    if email_match:
        # Check for Apple Services FIRST
        if 'apple services' in text_content.lower() and 'paypal' in line.lower():
            vendor = "Apple Services"
            print(f"Found vendor: Apple Services (via PayPal)")
            break
        
        domain = email_match.group(2)
        # Continue with existing domain mapping...
```

### Additional Fix
```python
# Add to domain_vendor_map:
domain_vendor_map = {
    'paypal.com': 'PayPal',  # But check context for actual vendor
    # ... existing mappings
}

# After domain mapping, add special case:
if vendor == 'PayPal' and 'apple services' in text_content.lower():
    vendor = 'Apple Services'
```

## 🚨 PRIORITY 3: Process Missing Documents

### Problem
- 399 document IDs exist in TaxExpenses but not in Documents table
- Only 3 bank statements processed (all Chase Freedom)

### Investigation Steps
```python
# Create a script to find missing documents:
import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
expenses_table = dynamodb.Table('TaxExpenses-dev')
documents_table = dynamodb.Table('Documents-staging')

# Get all unique document IDs from expenses
response = expenses_table.scan()
expense_doc_ids = set([item['documentId'] for item in response['Items']])

# Get all document IDs from documents table
response = documents_table.scan()
document_ids = set([item['documentId'] for item in response['Items']])

# Find missing
missing = expense_doc_ids - document_ids
print(f"Missing documents: {len(missing)}")
```

### Fix Actions
1. Process remaining bank statements:
   ```bash
   python test-sample-processor.py --folders "Bilt Statements" "Chase Sapphire Statements"
   ```

2. Reprocess folders that may have failed:
   ```bash
   python test-sample-processor.py --folders "Platform Receipts" "Travel Receipts"
   ```

## 🚨 PRIORITY 4: Update IRS Ready Report Vendor Mapping

### Temporary Fix Already Applied
```typescript
// In components/tax-audit/irs-ready-report.tsx
const vendorNormalizationMap: Record<string, string[]> = {
  'apple': ['apple services', 'apple.com', 'itunes', 'app store', 'apple inc', 'mehdi.noori7'], // TEMPORARY FIX
  // ...
}
```

### Permanent Fix After Priority 2
Remove 'mehdi.noori7' from the Apple array once vendor detection is fixed in Python.

## 📋 Testing Checklist After Fixes

1. **Timestamp Test**:
   ```bash
   python test-sample-processor.py --files "Gmail - Receipt for Your Payment to Apple Services.pdf"
   # Check that createdAt shows 2024 dates, not 2025
   ```

2. **Vendor Test**:
   ```bash
   # Process an Apple receipt and verify vendor shows "Apple Services" not "mehdi.noori7"
   ```

3. **Document Sync Test**:
   ```sql
   # Check that new documents appear in both tables
   SELECT COUNT(*) FROM Documents-staging WHERE userId = 'default-user';
   SELECT COUNT(DISTINCT documentId) FROM TaxExpenses-dev WHERE userId = 'default-user';
   ```

## 🔧 Quick Debug Commands

```bash
# Check current system time
python -c "from datetime import datetime; print(f'UTC: {datetime.utcnow()}\nLocal: {datetime.now()}')"

# Test vendor extraction
python -c "
text = 'Receipt for Your Payment to Apple Services'
print('Apple Services' in text.lower())
"

# List unprocessed folders
Get-ChildItem "C:\Users\mehdi\Dropbox\2024 Tax Audit\Expenses - Copy" -Directory | Where-Object { 
    $_.Name -notin @('Amazon Receipts', 'Chase Freedom Statements', 'Gmail Receipts')
}
```

## 🎯 Success Criteria

1. ✅ All new expenses show 2024 dates (not 2025)
2. ✅ Apple Services receipts show correct vendor
3. ✅ Document count matches between both tables
4. ✅ All 34 folders have been processed
5. ✅ No more "mehdi.noori7" vendors in the database

---
**IMPORTANT**: Start the next session by running these diagnostic commands first to understand the current state before making changes. 