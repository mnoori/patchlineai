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
                        # Determine the year based on month
                        month = int(match.group(1))
                        current_month = datetime.now().month
                        year = self.current_year
                        
                        # If we're in early 2025 and see Nov/Dec dates, they're from 2024
                        if self.current_year == 2025 and month >= 11:
                            year = 2024
                        
                        date_obj = datetime.strptime(f"{date_str}/{year}", f"{date_format}/%Y")
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
    
    def categorize_expense(self, description: str, amount: Decimal) -> str:
        """Basic expense categorization"""
        desc_lower = description.lower()
        
        # Interest charges - HIGHEST PRIORITY
        if any(word in desc_lower for word in ['interest charge', 'interest charged', 'finance charge', 'interest fee']):
            return 'interest'
        
        # Meals - Important for tax deductibility
        if any(word in desc_lower for word in ['restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast',
                                                'food', 'dining', 'eat', 'soho house', 'grubhub', 'doordash',
                                                'uber eats', 'seamless', 'postmates']):
            return 'meals'
        
        # Travel-related
        if any(word in desc_lower for word in ['airbnb', 'hotel', 'flight', 'airline', 'uber', 'lyft', 'taxi']):
            return 'travel'
        
        # Professional services
        if any(word in desc_lower for word in ['legal', 'lawyer', 'attorney', 'accountant', 'cpa']):
            return 'legal_professional'
        
        # Office expenses
        if any(word in desc_lower for word in ['office', 'supplies', 'staples', 'amazon']):
            return 'office_expenses'
        
        # Utilities
        if any(word in desc_lower for word in ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att']):
            return 'utilities'
        
        # Advertising
        if any(word in desc_lower for word in ['facebook', 'google', 'ads', 'marketing']):
            return 'advertising'
        
        # Platform expenses
        if any(word in desc_lower for word in ['aws', 'azure', 'google cloud', 'gcp', 'api', 'hosting', 'server']):
            return 'platform_expenses'
        
        # Default
        return 'other_expenses'


class ChaseStatementParser(BankStatementParser):
    """Parser for Chase bank statements"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Chase statement format"""
        expenses = []
        
        # First try table parsing
        table_count = 0
        for item in textract_data.get('Blocks', []):
            if item['BlockType'] == 'TABLE':
                table_count += 1
                table_expenses = self._parse_table(item, textract_data)
                expenses.extend(table_expenses)
        
        print(f"Found {table_count} tables, extracted {len(expenses)} expenses from tables")
        
        # If no expenses from tables, try text parsing
        if len(expenses) == 0:
            print("No expenses from tables, trying text parsing")
            text_expenses = self._parse_text_transactions(textract_data)
            expenses.extend(text_expenses)
        
        return expenses
    
    def _parse_text_transactions(self, textract_data: Dict) -> List[Dict]:
        """Parse transactions from text blocks"""
        expenses = []
        lines = []
        
        # Extract all text lines
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    lines.append(text)
        
        print(f"Processing {len(lines)} text lines")
        
        # Look for transaction patterns
        in_transaction_section = False
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Check for transaction section markers
            if any(marker in line_lower for marker in ['purchase', 'payment', 'transaction detail']):
                in_transaction_section = True
                print(f"Found transaction section: {line}")
                continue
            
            # Check for end of transaction section
            if in_transaction_section and any(marker in line_lower for marker in ['total', 'balance', 'interest', 'fee']):
                in_transaction_section = False
                continue
            
            # Try to parse transaction - Chase Sapphire format
            # Pattern 1: MM/DD Description Amount
            pattern1 = r'^(\d{1,2}/\d{1,2})\s+(.+?)\s+(\$?[\d,]+\.\d{2})$'
            match = re.match(pattern1, line)
            
            if match:
                date_str, description, amount_str = match.groups()
                date = self.extract_date(date_str)
                amount = self.extract_amount(amount_str)
                
                if date and amount and amount > 0:
                    category = self.categorize_expense(description, amount)
                    
                    expense = {
                        'expenseId': self.generate_expense_id(date, str(amount), description),
                        'userId': self.user_id,
                        'documentId': self.document_id,
                        'date': date,
                        'description': description,
                        'vendor': self._extract_vendor(description),
                        'amount': str(amount),
                        'category': category,
                        'bankAccount': self.bank_type,
                        'status': 'pending',
                        'confidence': 0.8,
                        'createdAt': datetime.utcnow().isoformat()
                    }
                    expenses.append(expense)
                    print(f"Found transaction: {date} - {description} - ${amount}")
            
            # Pattern 2: Check if date is on one line and description/amount on next
            if i + 1 < len(lines) and re.match(r'^\d{1,2}/\d{1,2}$', line):
                date = self.extract_date(line)
                next_line = lines[i + 1]
                
                # Try to extract description and amount from next line
                desc_amount_match = re.match(r'^(.+?)\s+(\$?[\d,]+\.\d{2})$', next_line)
                if date and desc_amount_match:
                    description, amount_str = desc_amount_match.groups()
                    amount = self.extract_amount(amount_str)
                    
                    if amount and amount > 0:
                        category = self.categorize_expense(description, amount)
                        
                        expense = {
                            'expenseId': self.generate_expense_id(date, str(amount), description),
                            'userId': self.user_id,
                            'documentId': self.document_id,
                            'date': date,
                            'description': description,
                            'vendor': self._extract_vendor(description),
                            'amount': str(amount),
                            'category': category,
                            'bankAccount': self.bank_type,
                            'status': 'pending',
                            'confidence': 0.7,
                            'createdAt': datetime.utcnow().isoformat()
                        }
                        expenses.append(expense)
                        print(f"Found multi-line transaction: {date} - {description} - ${amount}")
        
        print(f"Extracted {len(expenses)} expenses from text")
        return expenses
    
    def _extract_vendor(self, description: str) -> str:
        """Extract vendor name from description"""
        # Remove common suffixes and clean up
        vendor = description.split(' ')[0] if description else 'Unknown'
        
        # Remove transaction codes and clean up
        vendor = re.sub(r'\d{4,}', '', vendor)  # Remove long numbers
        vendor = re.sub(r'[*#]', '', vendor)    # Remove special chars
        
        return vendor.strip() or 'Unknown'
    
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
                
                # For Chase Sapphire, amount might be in different columns
                amount = None
                amount_text = ""
                
                # Check last few columns for amount
                for i in range(len(row_cells) - 1, max(1, len(row_cells) - 4), -1):
                    cell_text = self._get_cell_text(row_cells[i], full_data)
                    test_amount = self.extract_amount(cell_text)
                    if test_amount and test_amount > 0:
                        amount = test_amount
                        amount_text = cell_text
                        break
                
                # Parse the extracted data
                date = self.extract_date(date_text)
                
                if date and amount and desc_text:
                    category = self.categorize_expense(desc_text, amount)
                    
                    expense = {
                        'expenseId': self.generate_expense_id(date, str(amount), desc_text),
                        'userId': self.user_id,
                        'documentId': self.document_id,
                        'date': date,
                        'description': desc_text,
                        'vendor': self._extract_vendor(desc_text),
                        'amount': str(amount),
                        'category': category,
                        'bankAccount': self.bank_type,
                        'status': 'pending',
                        'confidence': 0.8,
                        'createdAt': datetime.utcnow().isoformat()
                    }
                    
                    expenses.append(expense)
                    print(f"Table transaction: {date} - {desc_text} - ${amount}")
        
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
                category = self.categorize_expense(description, amount_decimal)
                
                return {
                    'expenseId': self.generate_expense_id(date, str(amount_decimal), description),
                    'userId': self.user_id,
                    'documentId': self.document_id,
                    'date': date,
                    'description': description,
                    'vendor': description.split()[0] if description else 'Unknown',
                    'amount': str(amount_decimal),
                    'category': category,
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


class AmazonReceiptParser(BankStatementParser):
    """Parser for Amazon receipts"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Amazon receipt format"""
        expenses = []
        
        # Extract order information
        order_date = None
        order_number = None
        
        # Extract all text first
        full_text = []
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    full_text.append(text)
        
        text_content = '\n'.join(full_text)
        
        # Find order date
        order_date_match = re.search(r'Order placed\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})', text_content, re.IGNORECASE)
        if order_date_match:
            date_str = order_date_match.group(1)
            # Parse date like "July 23, 2024"
            try:
                date_obj = datetime.strptime(date_str, '%B %d, %Y')
                order_date = date_obj.strftime('%Y-%m-%d')
            except:
                try:
                    date_obj = datetime.strptime(date_str, '%b %d, %Y')
                    order_date = date_obj.strftime('%Y-%m-%d')
                except:
                    pass
        
        # Find order number
        order_num_match = re.search(r'Order\s*#\s*([\d-]+)', text_content, re.IGNORECASE)
        if order_num_match:
            order_number = order_num_match.group(1)
        
        print(f"Amazon receipt - Order date: {order_date}, Order #: {order_number}")
        
        # Debug: Print first few lines to see structure
        print("\n=== First 20 lines of Amazon receipt ===")
        for i, line in enumerate(full_text[:20]):
            print(f"{i}: {line}")
        print("=== End sample ===\n")
        
        # Parse individual items
        # Strategy 1: Look for price patterns in text
        seen_items = set()  # Track items to avoid duplicates
        
        for i, line in enumerate(full_text):
            # Skip summary lines and refund/return messages
            line_lower = line.lower()
            if any(skip in line_lower for skip in ['grand total', 'refund total', 'subtotal', 
                                                    'shipping', 'tax', 'order summary', 
                                                    'payment method', 'ship to', 'return window',
                                                    'refund has been', 'when will i get', 'your return',
                                                    'returns are easy', 'return policy', 'customer service',
                                                    'gift options', 'delivery instructions']):
                continue
            
            # Pattern: Item description $XX.XX
            price_match = re.match(r'^(.+?)\s+\$(\d+\.\d{2})$', line)
            if price_match:
                description, price_str = price_match.groups()
                amount = Decimal(price_str)
                
                print(f"DEBUG: Found potential item - Line {i}: {line}")
                print(f"  Description: {description}, Amount: ${amount}")
                
                # Validate it's a reasonable item price and description
                if (0 < amount < 10000 and len(description) > 5 and 
                    not any(word in description.lower() for word in ['total', 'balance', 'refund', 'return', 
                                                                      'credit', 'payment', 'shipping', 'tax'])):
                    
                    # Create a unique key to avoid duplicates
                    item_key = f"{description.strip()}_{amount}"
                    if item_key in seen_items:
                        print(f"  SKIPPED: Duplicate")
                        continue
                    seen_items.add(item_key)
                    
                    category = self._categorize_amazon_item(description)
                    
                    expense = {
                        'expenseId': self.generate_expense_id(order_date or str(datetime.now().date()), 
                                                            str(amount), description),
                        'userId': self.user_id,
                        'documentId': self.document_id,
                        'date': order_date or str(datetime.now().date()),
                        'description': description.strip(),
                        'vendor': self._get_amazon_vendor_category(description),
                        'amount': str(amount),
                        'category': category,
                        'bankAccount': 'amazon-receipts',
                        'orderNumber': order_number,
                        'status': 'pending',
                        'confidence': 0.9,
                        'createdAt': datetime.utcnow().isoformat()
                    }
                    expenses.append(expense)
                    print(f"  ADDED: Amazon item: {description} - ${amount}")
                else:
                    print(f"  SKIPPED: Failed validation")
            
            # Strategy 2: Look for "Sold by" pattern
            if ('sold by' in line_lower or 'supplied by' in line_lower):
                print(f"DEBUG: Found 'Sold by' pattern at line {i}: {line}")
                # Look for product name in previous lines
                product_name = None
                for j in range(max(0, i-5), i):
                    prev_line = full_text[j].strip()
                    # Skip metadata lines and return/refund messages
                    if (prev_line and len(prev_line) > 10 and 
                        not prev_line.startswith('$') and
                        'sold by' not in prev_line.lower() and
                        'supplied by' not in prev_line.lower() and
                        not any(skip in prev_line.lower() for skip in ['return', 'refund', 'your order', 
                                                                         'ship to', 'delivery'])):
                        product_name = prev_line
                        print(f"  Potential product name from line {j}: {prev_line}")
                        break
                
                # Look for price in next few lines
                if product_name:
                    print(f"  Looking for price after line {i}")
                    for j in range(i+1, min(len(full_text), i+5)):
                        next_line = full_text[j].strip()
                        print(f"    Checking line {j}: {next_line}")
                        # Match standalone price or price with quantity
                        price_patterns = [
                            r'^\$(\d+\.\d{2})$',  # Just price
                            r'^(\d+)\s+\$(\d+\.\d{2})$',  # Quantity Price
                            r'^\$(\d+\.\d{2})\s+each$'  # Price each
                        ]
                        
                        for pattern in price_patterns:
                            price_match = re.match(pattern, next_line)
                            if price_match:
                                print(f"    MATCHED pattern: {pattern}")
                                if pattern == price_patterns[1]:  # Quantity Price pattern
                                    quantity, price_str = price_match.groups()
                                    amount = Decimal(price_str)
                                else:
                                    amount = Decimal(price_match.group(1))
                                
                                if 0 < amount < 10000:
                                    # Check for duplicates
                                    item_key = f"{product_name.strip()}_{amount}"
                                    if item_key in seen_items:
                                        break
                                    seen_items.add(item_key)
                                    
                                    category = self._categorize_amazon_item(product_name)
                                    
                                    expense = {
                                        'expenseId': self.generate_expense_id(order_date or str(datetime.now().date()), 
                                                                            str(amount), product_name),
                                        'userId': self.user_id,
                                        'documentId': self.document_id,
                                        'date': order_date or str(datetime.now().date()),
                                        'description': product_name.strip(),
                                        'vendor': self._get_amazon_vendor_category(product_name),
                                        'amount': str(amount),
                                        'category': category,
                                        'bankAccount': 'amazon-receipts',
                                        'orderNumber': order_number,
                                        'status': 'pending',
                                        'confidence': 0.85,
                                        'createdAt': datetime.utcnow().isoformat()
                                    }
                                    expenses.append(expense)
                                    print(f"Found Amazon item (alt): {product_name} - ${amount}")
                                    break
        
        # Also check tables
        print(f"\nChecking tables for Amazon items...")
        table_count = 0
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'TABLE':
                table_count += 1
                print(f"Processing table {table_count}")
                table_expenses = self._parse_amazon_table(block, textract_data, order_date, order_number)
                if table_expenses:
                    print(f"  Found {len(table_expenses)} items in table")
                expenses.extend(table_expenses)
        
        if table_count == 0:
            print("No tables found in document")
        
        print(f"\nAmazon receipt extraction complete - found {len(expenses)} items")
        return expenses
    
    def _categorize_amazon_item(self, description: str) -> str:
        """Categorize Amazon items based on description"""
        desc_lower = description.lower()
        
        # Tech equipment
        if any(word in desc_lower for word in ['cable', 'adapter', 'laptop', 'stand', 'monitor', 
                                                'keyboard', 'mouse', 'headphone', 'microphone',
                                                'camera', 'tripod', 'light']):
            return 'depreciation'  # Equipment that can be depreciated
        
        # Office supplies
        if any(word in desc_lower for word in ['paper', 'pen', 'notebook', 'folder', 'stapler', 
                                                'tape', 'marker', 'envelope']):
            return 'office_expenses'
        
        # Software/subscriptions
        if any(word in desc_lower for word in ['software', 'subscription', 'license', 'app']):
            return 'other_expenses'  # Software subscriptions
        
        # Shipping supplies
        if any(word in desc_lower for word in ['box', 'bubble', 'mailer', 'packaging']):
            return 'supplies'
        
        # Default to office expenses for Amazon purchases
        return 'office_expenses'
    
    def _get_amazon_vendor_category(self, description: str) -> str:
        """Get vendor subcategory for Amazon items"""
        desc_lower = description.lower()
        
        if any(word in desc_lower for word in ['cable', 'adapter', 'laptop', 'monitor', 'keyboard']):
            return 'Amazon.com - Tech Equipment'
        elif any(word in desc_lower for word in ['paper', 'pen', 'notebook', 'folder']):
            return 'Amazon.com - Office Supplies'
        elif any(word in desc_lower for word in ['software', 'subscription', 'digital']):
            return 'Amazon.com - Software'
        else:
            return 'Amazon.com'
    
    def _parse_amazon_table(self, table_block: Dict, full_data: Dict, order_date: str, order_number: str) -> List[Dict]:
        """Parse Amazon receipt tables"""
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
        
        print(f"  Table has {len(rows)} rows")
        
        # Process each row
        for row_index in sorted(rows.keys()):
            row_cells = sorted(rows[row_index], key=lambda x: x.get('ColumnIndex', 0))
            
            # Extract text from all cells
            cell_texts = [self._get_cell_text(cell, full_data) for cell in row_cells]
            row_text = ' | '.join(cell_texts)
            print(f"  Row {row_index}: {row_text}")
            
            # Look for product and price patterns
            # Amazon tables might have: [Product Description] [Quantity] [Price]
            if len(cell_texts) >= 2:
                # Check if any cell contains a price
                price = None
                description = None
                
                for i, text in enumerate(cell_texts):
                    # Check for price patterns
                    price_match = re.match(r'^\$?(\d+\.\d{2})$', text.strip())
                    if price_match and not price:
                        price = Decimal(price_match.group(1))
                        # Description is usually in first column or before price
                        if i > 0 and cell_texts[0].strip():
                            description = cell_texts[0].strip()
                        elif i > 1 and cell_texts[i-1].strip():
                            description = cell_texts[i-1].strip()
                
                if price and description and price > 0 and price < 10000:
                    # Validate description
                    desc_lower = description.lower()
                    if (len(description) > 5 and 
                        not any(skip in desc_lower for skip in ['total', 'subtotal', 'tax', 
                                                                'shipping', 'refund', 'balance'])):
                        
                        category = self._categorize_amazon_item(description)
                        
                        expense = {
                            'expenseId': self.generate_expense_id(order_date or str(datetime.now().date()), 
                                                                str(price), description),
                            'userId': self.user_id,
                            'documentId': self.document_id,
                            'date': order_date or str(datetime.now().date()),
                            'description': description,
                            'vendor': self._get_amazon_vendor_category(description),
                            'amount': str(price),
                            'category': category,
                            'bankAccount': 'amazon-receipts',
                            'orderNumber': order_number,
                            'status': 'pending',
                            'confidence': 0.85,
                            'createdAt': datetime.utcnow().isoformat()
                        }
                        expenses.append(expense)
                        print(f"    FOUND item in table: {description} - ${price}")
        
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


def get_parser(bank_type: str, user_id: str, document_id: str) -> BankStatementParser:
    """Get the appropriate parser for the bank type"""
    parsers = {
        'chase-checking': ChaseStatementParser,
        'chase-freedom': ChaseStatementParser,
        'chase-sapphire': ChaseStatementParser,
        'bilt': BiltStatementParser,
        'amazon-receipts': AmazonReceiptParser,
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