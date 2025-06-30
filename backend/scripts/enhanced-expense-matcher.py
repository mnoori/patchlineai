#!/usr/bin/env python3
"""
Enhanced Expense Matcher
Implements intelligent matching between bank transactions and receipts with:
- ±1 day date tolerance
- Exact and fuzzy amount matching
- Vendor normalization
- Order/reference number extraction
- Confidence scoring
"""

import os
import sys
import boto3
import json
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Tuple, Optional
import logging
from collections import defaultdict
from fuzzywuzzy import fuzz
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler('enhanced-matcher.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
tax_expenses_table = dynamodb.Table(os.environ.get('TAX_EXPENSES_TABLE', 'TaxExpenses-dev'))
documents_table = dynamodb.Table(os.environ.get('DOCUMENTS_TABLE', 'Documents-staging'))

class EnhancedExpenseMatcher:
    def __init__(self, user_id='default-user'):
        self.user_id = user_id
        self.bank_expenses = []
        self.receipts = []
        self.matches = []
        self.unmatched_bank = []
        self.unmatched_receipts = []
        
    def load_expenses(self):
        """Load all expenses from DynamoDB"""
        logger.info(f"Loading expenses for user {self.user_id}")
        
        try:
            # Query expenses using GSI
            response = tax_expenses_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='userId = :userId',
                ExpressionAttributeValues={':userId': self.user_id}
            )
            
            expenses = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = tax_expenses_table.query(
                    IndexName='UserIdIndex',
                    KeyConditionExpression='userId = :userId',
                    ExpressionAttributeValues={':userId': self.user_id},
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                expenses.extend(response.get('Items', []))
            
            # Separate bank expenses and receipts
            for expense in expenses:
                if expense.get('bankAccount') and 'receipt' not in expense.get('bankAccount', '').lower():
                    self.bank_expenses.append(expense)
                else:
                    self.receipts.append(expense)
                    
            logger.info(f"Loaded {len(self.bank_expenses)} bank expenses and {len(self.receipts)} receipts")
            
        except Exception as e:
            logger.error(f"Error loading expenses: {e}")
            raise
    
    def normalize_vendor(self, vendor: str) -> str:
        """Normalize vendor name for better matching"""
        if not vendor:
            return ""
            
        # Convert to lowercase and strip
        normalized = vendor.lower().strip()
        
        # Remove common suffixes
        suffixes = ['inc', 'llc', 'corp', 'corporation', 'ltd', 'limited', 'co', 'company']
        for suffix in suffixes:
            normalized = re.sub(rf'\b{suffix}\b\.?', '', normalized)
        
        # Remove special characters
        normalized = re.sub(r'[^a-z0-9\s]', '', normalized)
        
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        
        # Common vendor mappings
        vendor_mappings = {
            'amzn': 'amazon',
            'amazn': 'amazon',
            'amazon com': 'amazon',
            'amazon marketplace': 'amazon',
            'amzn mktp': 'amazon',
            'aws': 'amazon web services',
            'google cloud': 'google',
            'gcp': 'google',
            'msft': 'microsoft',
            'github': 'github',
            'gh': 'github',
        }
        
        for key, value in vendor_mappings.items():
            if key in normalized:
                return value
                
        return normalized
    
    def extract_reference_numbers(self, text: str) -> List[str]:
        """Extract reference numbers from text"""
        if not text:
            return []
            
        patterns = [
            r'\d{3}-\d{7}-\d{7}',  # Amazon order format
            r'\b[A-Z0-9]{10,}\b',   # General alphanumeric IDs
            r'\b\d{10,}\b',        # Long numeric IDs
            r'#\d{6,}',            # Hash-prefixed numbers
            r'INV-\d+',            # Invoice numbers
            r'ORDER-\d+',          # Order numbers
        ]
        
        references = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            references.extend(matches)
            
        return list(set(references))  # Remove duplicates
    
    def calculate_match_score(self, bank_expense: Dict, receipt: Dict) -> Tuple[float, Dict[str, any]]:
        """Calculate match confidence score between bank expense and receipt"""
        confidence = 0.0
        match_details = {
            'amount_match': False,
            'date_match': False,
            'vendor_match': False,
            'reference_match': False,
            'date_diff': None,
            'amount_diff': None,
            'reasons': []
        }
        
        # Amount matching
        bank_amount = float(bank_expense.get('amount', 0))
        receipt_amount = float(receipt.get('amount', 0))
        amount_diff = abs(bank_amount - receipt_amount)
        match_details['amount_diff'] = amount_diff
        
        if amount_diff == 0:
            confidence += 35
            match_details['amount_match'] = True
            match_details['reasons'].append('exact amount')
        elif amount_diff <= 0.02:  # Within 2 cents
            confidence += 32
            match_details['amount_match'] = True
            match_details['reasons'].append(f'amount ±${amount_diff:.2f}')
        elif bank_amount > 0 and (amount_diff / bank_amount) <= 0.01:  # Within 1%
            confidence += 28
            match_details['amount_match'] = True
            match_details['reasons'].append('amount ±1%')
        elif bank_amount > 0 and (amount_diff / bank_amount) <= 0.05:  # Within 5%
            confidence += 20
            match_details['reasons'].append('amount ±5%')
        
        # Date matching with ±1 day tolerance
        bank_date = datetime.fromisoformat(bank_expense.get('transactionDate', '').replace('Z', '+00:00'))
        receipt_date = datetime.fromisoformat(receipt.get('transactionDate', '').replace('Z', '+00:00'))
        date_diff = abs((bank_date - receipt_date).days)
        match_details['date_diff'] = date_diff
        
        if date_diff == 0:
            confidence += 25
            match_details['date_match'] = True
            match_details['reasons'].append('same date')
        elif date_diff == 1:
            confidence += 20
            match_details['date_match'] = True
            match_details['reasons'].append('±1 day')
            # Extra confidence for exact amount with ±1 day
            if amount_diff == 0:
                confidence += 10
                match_details['reasons'].append('strong match')
        elif date_diff <= 3:
            confidence += 10
            match_details['reasons'].append(f'{date_diff} days apart')
        elif date_diff <= 7:
            confidence += 5
            match_details['reasons'].append(f'{date_diff} days apart')
        
        # Vendor matching
        bank_vendor = self.normalize_vendor(bank_expense.get('vendor', ''))
        receipt_vendor = self.normalize_vendor(receipt.get('vendor', ''))
        
        if bank_vendor and receipt_vendor:
            if bank_vendor == receipt_vendor:
                confidence += 25
                match_details['vendor_match'] = True
                match_details['reasons'].append('exact vendor')
            elif bank_vendor in receipt_vendor or receipt_vendor in bank_vendor:
                confidence += 20
                match_details['vendor_match'] = True
                match_details['reasons'].append('vendor match')
            else:
                # Fuzzy matching
                similarity = fuzz.ratio(bank_vendor, receipt_vendor)
                if similarity >= 80:
                    confidence += 15
                    match_details['vendor_match'] = True
                    match_details['reasons'].append(f'vendor {similarity}% similar')
                elif similarity >= 60:
                    confidence += 8
                    match_details['reasons'].append(f'vendor {similarity}% similar')
        
        # Reference number matching
        bank_refs = self.extract_reference_numbers(bank_expense.get('description', ''))
        receipt_refs = self.extract_reference_numbers(receipt.get('description', ''))
        
        if bank_refs and receipt_refs:
            matching_refs = set(bank_refs) & set(receipt_refs)
            if matching_refs:
                confidence += 20
                match_details['reference_match'] = True
                match_details['reasons'].append(f'ref: {list(matching_refs)[0]}')
        
        # Additional matching for specific vendors
        if 'amazon' in bank_vendor and 'amazon' in receipt_vendor:
            # Amazon-specific matching logic
            if amount_diff <= 0.10 and date_diff <= 2:
                confidence += 5
                match_details['reasons'].append('amazon pattern')
        
        return confidence, match_details
    
    def find_matches(self):
        """Find matches between bank expenses and receipts"""
        logger.info("Starting enhanced matching process...")
        
        used_receipts = set()
        
        for bank_expense in self.bank_expenses:
            best_match = None
            best_confidence = 0
            best_details = None
            
            for receipt in self.receipts:
                # Skip if receipt already matched
                if receipt['expenseId'] in used_receipts:
                    continue
                
                confidence, details = self.calculate_match_score(bank_expense, receipt)
                
                # Only consider matches with confidence >= 40%
                if confidence >= 40 and confidence > best_confidence:
                    best_match = receipt
                    best_confidence = confidence
                    best_details = details
            
            if best_match:
                used_receipts.add(best_match['expenseId'])
                self.matches.append({
                    'bank_expense': bank_expense,
                    'receipt': best_match,
                    'confidence': best_confidence,
                    'match_details': best_details
                })
                logger.info(
                    f"Matched: {bank_expense.get('vendor')} ${bank_expense.get('amount')} "
                    f"on {bank_expense.get('transactionDate')[:10]} "
                    f"with receipt (confidence: {best_confidence}%)"
                )
            else:
                self.unmatched_bank.append(bank_expense)
        
        # Find unmatched receipts
        for receipt in self.receipts:
            if receipt['expenseId'] not in used_receipts:
                self.unmatched_receipts.append(receipt)
        
        logger.info(f"Matching complete: {len(self.matches)} matches found")
        logger.info(f"Unmatched: {len(self.unmatched_bank)} bank transactions, {len(self.unmatched_receipts)} receipts")
    
    def update_match_records(self):
        """Update DynamoDB with match information"""
        logger.info("Updating match records in database...")
        
        for match in self.matches:
            try:
                # Update bank expense with receipt reference
                tax_expenses_table.update_item(
                    Key={'expenseId': match['bank_expense']['expenseId']},
                    UpdateExpression='SET matchedReceiptId = :receiptId, matchConfidence = :confidence, matchDetails = :details, updatedAt = :timestamp',
                    ExpressionAttributeValues={
                        ':receiptId': match['receipt']['expenseId'],
                        ':confidence': Decimal(str(match['confidence'])),
                        ':details': match['match_details'],
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                
                # Update receipt with bank expense reference
                tax_expenses_table.update_item(
                    Key={'expenseId': match['receipt']['expenseId']},
                    UpdateExpression='SET matchedBankExpenseId = :bankId, matchConfidence = :confidence, updatedAt = :timestamp',
                    ExpressionAttributeValues={
                        ':bankId': match['bank_expense']['expenseId'],
                        ':confidence': Decimal(str(match['confidence'])),
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
                
            except Exception as e:
                logger.error(f"Error updating match record: {e}")
    
    def generate_report(self):
        """Generate matching report"""
        logger.info("Generating matching report...")
        
        # Summary statistics
        total_bank = len(self.bank_expenses)
        total_receipts = len(self.receipts)
        matched = len(self.matches)
        high_confidence = len([m for m in self.matches if m['confidence'] >= 80])
        medium_confidence = len([m for m in self.matches if 60 <= m['confidence'] < 80])
        low_confidence = len([m for m in self.matches if m['confidence'] < 60])
        
        report = {
            'summary': {
                'total_bank_transactions': total_bank,
                'total_receipts': total_receipts,
                'matched_transactions': matched,
                'match_rate': f"{(matched / total_bank * 100):.1f}%" if total_bank > 0 else "0%",
                'high_confidence_matches': high_confidence,
                'medium_confidence_matches': medium_confidence,
                'low_confidence_matches': low_confidence,
                'unmatched_bank': len(self.unmatched_bank),
                'unmatched_receipts': len(self.unmatched_receipts)
            },
            'matches': self.matches,
            'unmatched_bank': self.unmatched_bank,
            'unmatched_receipts': self.unmatched_receipts
        }
        
        # Save report
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f'matching_report_{timestamp}.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Report saved to {report_file}")
        
        # Print summary
        print("\n" + "="*60)
        print("ENHANCED MATCHING SUMMARY")
        print("="*60)
        print(f"Total Bank Transactions: {total_bank}")
        print(f"Total Receipts: {total_receipts}")
        print(f"Matched Transactions: {matched} ({report['summary']['match_rate']})")
        print(f"  - High Confidence (≥80%): {high_confidence}")
        print(f"  - Medium Confidence (60-79%): {medium_confidence}")
        print(f"  - Low Confidence (<60%): {low_confidence}")
        print(f"Unmatched Bank Transactions: {len(self.unmatched_bank)}")
        print(f"Unmatched Receipts: {len(self.unmatched_receipts)}")
        print("="*60)
        
        # Export to Excel
        self.export_to_excel(timestamp)
    
    def export_to_excel(self, timestamp):
        """Export matching results to Excel"""
        logger.info("Exporting to Excel...")
        
        # Prepare data for Excel
        matches_data = []
        for match in self.matches:
            matches_data.append({
                'Bank Date': match['bank_expense'].get('transactionDate', '')[:10],
                'Bank Vendor': match['bank_expense'].get('vendor', ''),
                'Bank Description': match['bank_expense'].get('description', ''),
                'Bank Amount': match['bank_expense'].get('amount', 0),
                'Bank File': match['bank_expense'].get('filename', 'Unknown'),
                'Receipt Date': match['receipt'].get('transactionDate', '')[:10],
                'Receipt Vendor': match['receipt'].get('vendor', ''),
                'Receipt Description': match['receipt'].get('description', ''),
                'Receipt Amount': match['receipt'].get('amount', 0),
                'Receipt File': match['receipt'].get('filename', 'Unknown'),
                'Match Confidence': f"{match['confidence']}%",
                'Date Diff (days)': match['match_details']['date_diff'],
                'Amount Diff': match['match_details']['amount_diff'],
                'Match Reasons': ', '.join(match['match_details']['reasons'])
            })
        
        # Create Excel writer
        excel_file = f'enhanced_matching_{timestamp}.xlsx'
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            # Matched transactions
            if matches_data:
                df_matches = pd.DataFrame(matches_data)
                df_matches.to_excel(writer, sheet_name='Matched Transactions', index=False)
            
            # Unmatched bank transactions
            if self.unmatched_bank:
                df_unmatched_bank = pd.DataFrame([{
                    'Date': exp.get('transactionDate', '')[:10],
                    'Vendor': exp.get('vendor', ''),
                    'Description': exp.get('description', ''),
                    'Amount': exp.get('amount', 0),
                    'File': exp.get('filename', 'Unknown')
                } for exp in self.unmatched_bank])
                df_unmatched_bank.to_excel(writer, sheet_name='Unmatched Bank', index=False)
            
            # Unmatched receipts
            if self.unmatched_receipts:
                df_unmatched_receipts = pd.DataFrame([{
                    'Date': rec.get('transactionDate', '')[:10],
                    'Vendor': rec.get('vendor', ''),
                    'Description': rec.get('description', ''),
                    'Amount': rec.get('amount', 0),
                    'File': rec.get('filename', 'Unknown')
                } for rec in self.unmatched_receipts])
                df_unmatched_receipts.to_excel(writer, sheet_name='Unmatched Receipts', index=False)
            
            # Summary
            summary_data = {
                'Metric': [
                    'Total Bank Transactions',
                    'Total Receipts',
                    'Matched Transactions',
                    'Match Rate',
                    'High Confidence (≥80%)',
                    'Medium Confidence (60-79%)',
                    'Low Confidence (<60%)',
                    'Unmatched Bank',
                    'Unmatched Receipts'
                ],
                'Value': [
                    len(self.bank_expenses),
                    len(self.receipts),
                    len(self.matches),
                    f"{(len(self.matches) / len(self.bank_expenses) * 100):.1f}%" if self.bank_expenses else "0%",
                    len([m for m in self.matches if m['confidence'] >= 80]),
                    len([m for m in self.matches if 60 <= m['confidence'] < 80]),
                    len([m for m in self.matches if m['confidence'] < 60]),
                    len(self.unmatched_bank),
                    len(self.unmatched_receipts)
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
        
        logger.info(f"Excel report saved to {excel_file}")
    
    def run(self):
        """Run the complete matching process"""
        try:
            self.load_expenses()
            self.find_matches()
            self.update_match_records()
            self.generate_report()
            logger.info("Enhanced matching process completed successfully!")
        except Exception as e:
            logger.error(f"Error in matching process: {e}")
            raise

if __name__ == "__main__":
    # Check for user ID argument
    user_id = 'default-user'
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    
    # Run the matcher
    matcher = EnhancedExpenseMatcher(user_id)
    matcher.run() 