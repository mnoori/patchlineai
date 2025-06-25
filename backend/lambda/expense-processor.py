import json
import re
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
import boto3

dynamodb = boto3.resource('dynamodb')
textract = boto3.client('textract')

class BankStatementParser:
    """Base class for bank statement parsers"""
    
    def __init__(self, bank_type: str, user_id: str, document_id: str):
        self.bank_type = bank_type
        self.user_id = user_id
        self.document_id = document_id
        self.current_year = datetime.now().year
        
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Textract output and extract expenses"""
        raise NotImplementedError("Subclasses must implement parse_textract_output")
    
    def extract_date(self, date_str: str) -> Optional[str]:
        """Extract and normalize date from various formats"""
        if not date_str:
            return None
            
        # Remove extra spaces
        date_str = ' '.join(date_str.split())
        
        # Try different date patterns
        patterns = [
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', '%m/%d/%Y'),  # MM/DD/YYYY
            (r'(\d{1,2})/(\d{1,2})/(\d{2})', '%m/%d/%y'),  # MM/DD/YY
            (r'(\d{1,2})/(\d{1,2})', '%m/%d'),             # MM/DD
            (r'(\d{1,2})-(\d{1,2})-(\d{4})', '%m-%d-%Y'),  # MM-DD-YYYY
            (r'(\d{1,2})-(\d{1,2})', '%m-%d'),             # MM-DD
        ]
        
        for pattern, date_format in patterns:
            match = re.match(pattern, date_str)
            if match:
                try:
                    if len(match.groups()) == 2:  # MM/DD format
                        # Add current year
                        date_obj = datetime.strptime(f"{date_str}/{self.current_year}", f"{date_format}/%Y")
                    else:
                        date_obj = datetime.strptime(date_str, date_format)
                    
                    return date_obj.strftime('%Y-%m-%d')
                except:
                    continue
        
        return None
    
    def extract_amount(self, amount_str: str) -> Optional[Decimal]:
        """Extract amount from string"""
        if not amount_str:
            return None
            
        # Remove currency symbols and spaces
        amount_str = amount_str.replace('$', '').replace(',', '').strip()
        
        # Handle negative amounts
        is_negative = False
        if amount_str.startswith('-') or amount_str.startswith('(') or amount_str.endswith(')'):
            is_negative = True
            amount_str = amount_str.replace('-', '').replace('(', '').replace(')', '')
        
        try:
            amount = Decimal(amount_str)
            if is_negative:
                amount = -amount
            
            # Validate reasonable amount range
            if abs(amount) > 1000000:  # Max $1M
                return None
                
            return amount
        except:
            return None
    
    def generate_expense_id(self, date: str, amount: str, description: str) -> str:
        """Generate unique expense ID"""
        content = f"{self.user_id}:{date}:{amount}:{description}:{self.document_id}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def categorize_expense(self, description: str, amount: Decimal) -> Tuple[str, str]:
        """Basic expense categorization"""
        desc_lower = description.lower()
        
        # Travel-related
        if any(word in desc_lower for word in ['airbnb', 'hotel', 'flight', 'airline', 'uber', 'lyft', 'taxi']):
            return 'travel', 'media'
        
        # Professional services
        if any(word in desc_lower for word in ['legal', 'lawyer', 'attorney', 'accountant', 'cpa']):
            return 'legal-professional', 'consulting'
        
        # Office expenses
        if any(word in desc_lower for word in ['office', 'supplies', 'staples', 'amazon']):
            return 'office-expenses', 'media'
        
        # Utilities
        if any(word in desc_lower for word in ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att']):
            return 'utilities', 'media'
        
        # Advertising
        if any(word in desc_lower for word in ['facebook', 'google', 'ads', 'marketing']):
            return 'advertising', 'media'
        
        # Default
        return 'other-expenses', 'unknown'


class ChaseStatementParser(BankStatementParser):
    """Parser for Chase bank statements"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Chase statement format"""
        expenses = []
        
        # Look for tables in Textract output
        for item in textract_data.get('Blocks', []):
            if item['BlockType'] == 'TABLE':
                table_expenses = self._parse_table(item, textract_data)
                expenses.extend(table_expenses)
        
        return expenses
    
    def _parse_table(self, table_block: Dict, full_data: Dict) -> List[Dict]:
        """Parse a table from Chase statement"""
        expenses = []
        
        # Get all cells in the table
        cells = []
        for relationship in table_block.get('Relationships', []):
            if relationship['Type'] == 'CHILD':
                for cell_id in relationship['Ids']:
                    cell_block = self._get_block_by_id(cell_id, full_data)
                    if cell_block and cell_block['BlockType'] == 'CELL':
                        cells.append(cell_block)
        
        # Group cells by row
        rows = {}
        for cell in cells:
            row_index = cell.get('RowIndex', 0)
            if row_index not in rows:
                rows[row_index] = []
            rows[row_index].append(cell)
        
        # Process each row
        for row_index in sorted(rows.keys()):
            if row_index == 1:  # Skip header row
                continue
                
            row_cells = sorted(rows[row_index], key=lambda x: x.get('ColumnIndex', 0))
            
            # Extract data based on column positions
            if len(row_cells) >= 3:
                date_text = self._get_cell_text(row_cells[0], full_data)
                desc_text = self._get_cell_text(row_cells[1], full_data) if len(row_cells) > 1 else ""
                amount_text = self._get_cell_text(row_cells[-1], full_data)  # Amount usually in last column
                
                # Parse the extracted data
                date = self.extract_date(date_text)
                amount = self.extract_amount(amount_text)
                
                if date and amount and desc_text:
                    category, business = self.categorize_expense(desc_text, amount)
                    
                    expense = {
                        'expenseId': self.generate_expense_id(date, str(amount), desc_text),
                        'userId': self.user_id,
                        'documentId': self.document_id,
                        'date': date,
                        'description': desc_text[:500],  # Limit description length
                        'vendor': desc_text.split()[0] if desc_text else 'Unknown',
                        'amount': str(amount),
                        'category': category,
                        'business': business,
                        'bankAccount': self.bank_type,
                        'status': 'pending',
                        'confidence': 0.8,
                        'createdAt': datetime.utcnow().isoformat()
                    }
                    
                    expenses.append(expense)
        
        return expenses
    
    def _get_block_by_id(self, block_id: str, full_data: Dict) -> Optional[Dict]:
        """Get a block by its ID"""
        for block in full_data.get('Blocks', []):
            if block.get('Id') == block_id:
                return block
        return None
    
    def _get_cell_text(self, cell: Dict, full_data: Dict) -> str:
        """Get text content from a cell"""
        text_parts = []
        
        for relationship in cell.get('Relationships', []):
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    child_block = self._get_block_by_id(child_id, full_data)
                    if child_block and child_block['BlockType'] in ['WORD', 'LINE']:
                        text_parts.append(child_block.get('Text', ''))
        
        return ' '.join(text_parts)


class BiltStatementParser(BankStatementParser):
    """Parser for Bilt credit card statements"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Bilt statement format"""
        expenses = []
        
        # Bilt has a specific transaction summary format
        in_transaction_section = False
        
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '')
                
                # Look for transaction section start
                if 'transaction summary' in text.lower():
                    in_transaction_section = True
                    continue
                
                # Look for section end
                if in_transaction_section and 'important information' in text.lower():
                    break
                
                # Parse transaction lines
                if in_transaction_section:
                    expense = self._parse_transaction_line(text)
                    if expense:
                        expenses.append(expense)
        
        # Also check tables
        for item in textract_data.get('Blocks', []):
            if item['BlockType'] == 'TABLE':
                table_expenses = self._parse_bilt_table(item, textract_data)
                expenses.extend(table_expenses)
        
        return expenses
    
    def _parse_transaction_line(self, line: str) -> Optional[Dict]:
        """Parse a single transaction line from Bilt"""
        # Bilt format: MM/DD MM/DD REFERENCE_NUMBER DESCRIPTION AMOUNT
        pattern = r'(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+(\d+)\s+(.+?)\s+(\$?[\d,]+\.\d{2})$'
        match = re.match(pattern, line)
        
        if match:
            trans_date, post_date, ref_num, description, amount = match.groups()
            
            date = self.extract_date(trans_date)
            amount_decimal = self.extract_amount(amount)
            
            if date and amount_decimal:
                category, business = self.categorize_expense(description, amount_decimal)
                
                return {
                    'expenseId': self.generate_expense_id(date, str(amount_decimal), description),
                    'userId': self.user_id,
                    'documentId': self.document_id,
                    'date': date,
                    'description': description[:500],
                    'vendor': description.split()[0] if description else 'Unknown',
                    'amount': str(amount_decimal),
                    'category': category,
                    'business': business,
                    'bankAccount': self.bank_type,
                    'referenceNumber': ref_num,
                    'status': 'pending',
                    'confidence': 0.9,
                    'createdAt': datetime.utcnow().isoformat()
                }
        
        return None
    
    def _parse_bilt_table(self, table_block: Dict, full_data: Dict) -> List[Dict]:
        """Parse Bilt transaction table"""
        # Similar to Chase parser but adapted for Bilt format
        return []  # Implement if needed


def get_parser(bank_type: str, user_id: str, document_id: str) -> BankStatementParser:
    """Get the appropriate parser for the bank type"""
    parsers = {
        'chase-checking': ChaseStatementParser,
        'chase-freedom': ChaseStatementParser,
        'chase-sapphire': ChaseStatementParser,
        'bilt': BiltStatementParser,
        # Add more parsers as needed
    }
    
    parser_class = parsers.get(bank_type, BankStatementParser)
    return parser_class(bank_type, user_id, document_id)


def lambda_handler(event, context):
    """Process expenses from Textract output"""
    body = json.loads(event['body']) if isinstance(event.get('body'), str) else event
    
    user_id = body['userId']
    document_id = body['documentId']
    bank_type = body.get('bankType', 'unknown')
    textract_job_id = body.get('jobId')
    
    print(f"Processing expenses for document {document_id}")
    print(f"Bank type: {bank_type}")
    print(f"Textract job: {textract_job_id}")
    
    # Get Textract results
    textract_data = textract.get_document_analysis(JobId=textract_job_id)
    
    # Get the appropriate parser
    parser = get_parser(bank_type, user_id, document_id)
    
    # Parse expenses
    expenses = parser.parse_textract_output(textract_data)
    
    print(f"Extracted {len(expenses)} expenses")
    
    # Save to DynamoDB
    table = dynamodb.Table('TaxExpenses-dev')
    saved_count = 0
    
    for expense in expenses:
        try:
            table.put_item(Item=expense)
            saved_count += 1
        except Exception as e:
            print(f"Error saving expense: {str(e)}")
            print(f"Expense data: {json.dumps(expense)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'expensesExtracted': len(expenses),
            'expensesSaved': saved_count
        })
    } 