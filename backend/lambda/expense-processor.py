import json
import os
import re
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
import boto3

# Initialize Bedrock client with proper credential handling
try:
    # Check if we have AWS credentials in environment (support both naming conventions)
    aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID') or os.environ.get('ACCESS_KEY_ID')
    aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY') or os.environ.get('SECRET_ACCESS_KEY')
    
    if aws_access_key and aws_secret_key:
        bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=os.environ.get('AWS_REGION', 'us-east-1'),
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key
        )
        print(f"Bedrock client initialized with explicit credentials (using {'AWS_' if os.environ.get('AWS_ACCESS_KEY_ID') else ''}ACCESS_KEY_ID)")
    else:
        # Try default credential chain
        bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=os.environ.get('AWS_REGION', 'us-east-1')
        )
        print("Bedrock client initialized with default credentials")
    
    # Test if we can access Bedrock by listing models (lightweight test)
    print("Bedrock client initialized successfully")
except Exception as e:
    print(f"Warning: Could not initialize Bedrock client: {e}")
    bedrock_runtime = None

def generate_smart_fallback_description(receipt_text: str, vendor: str = None, amount: float = None) -> str:
    """Generate a smart description without using Bedrock"""
    text_lower = receipt_text.lower()
    
    # Extract additional details from receipt
    details = []
    
    # Meta/Facebook ads
    if vendor == "Meta" or 'facebook' in text_lower:
        # Look for account ID
        account_match = re.search(r'Account ID[:\s_]*(\d+)', receipt_text, re.IGNORECASE)
        account_id = account_match.group(1) if account_match else None
        
        # Look for campaign name
        campaign_match = re.search(r'Campaign[:\s]*([^\n]+)', receipt_text, re.IGNORECASE)
        if campaign_match:
            campaign_name = campaign_match.group(1).strip()
            details.append(campaign_name)
        
        # Look for ad set
        adset_match = re.search(r'Ad Set[:\s]*([^\n]+)', receipt_text, re.IGNORECASE)
        if adset_match:
            details.append(adset_match.group(1).strip())
        
        # Extract date for billing period
        date_match = re.search(r'Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})', receipt_text, re.IGNORECASE)
        billing_period = ""
        if date_match:
            try:
                date_obj = datetime.strptime(date_match.group(1), '%B %d, %Y')
                billing_period = f" - {date_obj.strftime('%B %Y')}"
            except:
                billing_period = ""
        
        # Create IRS-compliant descriptions using "Advertising" for Schedule C Line 8
        if 'results' in text_lower:
            base = "Advertising - Meta Business Platform - AI Music Customer Acquisition Campaign"
        elif 'boost' in text_lower:
            base = "Advertising - Meta Post Promotion - Live Performance Event Marketing"
        elif 'instagram' in text_lower and 'story' in text_lower:
            base = "Advertising - Instagram Stories - Creative Services Brand Awareness"
        elif 'instagram' in text_lower:
            base = "Advertising - Instagram Business Ads - Patchline AI Platform Promotion"
        elif 'facebook' in text_lower:
            base = "Advertising - Facebook Business Ads - AI Music Technology Marketing"
        else:
            base = "Advertising - Meta Business Platform - Digital Marketing Services"
        
        # Add billing period
        base += billing_period
        
        # Add account ID if found (last 6 digits only for brevity)
        if account_id:
            base += f" (ID: {account_id[-6:]})"
        
        # Add campaign name if available
        if details and campaign_name:
            # Clean up campaign name for IRS
            if 'music' in campaign_name.lower():
                return f"{base} - Music Technology Campaign"[:150]
            elif 'ai' in campaign_name.lower() or 'patchline' in campaign_name.lower():
                return f"{base} - AI Platform Launch Campaign"[:150]
            elif 'event' in campaign_name.lower() or 'performance' in campaign_name.lower():
                return f"{base} - Live Performance Marketing"[:150]
            else:
                return f"{base} - {campaign_name[:30]}"[:150]
        
        return base[:150]
    
    # Midjourney
    elif vendor == "Midjourney" or 'midjourney' in text_lower:
        plan = ""
        if 'pro plan' in text_lower:
            plan = "Professional"
        elif 'standard plan' in text_lower:
            plan = "Standard"
        elif 'basic plan' in text_lower:
            plan = "Basic"
        
        # Look for billing period
        if 'monthly' in text_lower:
            period = "Monthly"
        elif 'yearly' in text_lower or 'annual' in text_lower:
            period = "Annual"
        else:
            period = ""
        
        # IRS-friendly description for Office Expenses/Equipment
        if plan and period:
            return f"Office Expenses - Midjourney {plan} {period} - AI Visual Content Generation License"
        elif plan:
            return f"Office Expenses - Midjourney {plan} License - AI Visual Content Generation Software"
        return "Office Expenses - Midjourney Subscription - AI Visual Content Creation for Business"
    
    # Apple
    elif vendor == "Apple" or 'apple' in text_lower:
        if 'icloud' in text_lower:
            storage = ""
            if '2 tb' in text_lower or '2tb' in text_lower:
                storage = "2TB"
            elif '200 gb' in text_lower or '200gb' in text_lower:
                storage = "200GB"
            elif '50 gb' in text_lower or '50gb' in text_lower:
                storage = "50GB"
            
            if storage:
                return f"Utilities - iCloud Storage {storage} - Business Data Backup & Project Files"
            return "Utilities - iCloud Storage - Creative Asset Management & Client Files"
        elif 'music' in text_lower:
            if 'family' in text_lower:
                return "Office Expenses - Apple Music Family - Team Music Research & Reference Library"
            elif 'individual' in text_lower:
                return "Office Expenses - Apple Music Individual - Music Research & Creative Reference"
            return "Office Expenses - Apple Music Subscription - Digital Music Research Library"
        elif 'tv' in text_lower:
            return "Office Expenses - Apple TV+ Subscription - Industry Research & Content Analysis"
        elif 'one' in text_lower:
            if 'premier' in text_lower:
                return "Office Expenses - Apple One Premier - Business Productivity & Creative Suite"
            elif 'family' in text_lower:
                return "Office Expenses - Apple One Family - Team Productivity Bundle"
            return "Office Expenses - Apple One Bundle - Creative Production & Business Tools"
        else:
            return "Office Expenses - Apple Digital Services - Business Productivity Tools"
    
    # Google
    elif vendor == "Google" or 'google' in text_lower:
        if 'workspace' in text_lower:
            if 'business' in text_lower:
                return "Office Expenses - Google Workspace Business - Team Collaboration & Email"
            elif 'enterprise' in text_lower:
                return "Office Expenses - Google Workspace Enterprise - Business Communication Platform"
            return "Office Expenses - Google Workspace - Business Email & Communication Tools"
        elif 'drive' in text_lower:
            storage_match = re.search(r'(\d+)\s*(gb|tb)', text_lower)
            if storage_match:
                size = storage_match.group(1)
                unit = storage_match.group(2).upper()
                return f"Utilities - Google Drive Storage {size}{unit} - Client Project Archive & Backup"
            return "Utilities - Google Drive Storage - Digital Asset Management & File Backup"
        elif 'ads' in text_lower or 'adwords' in text_lower:
            # Look for campaign details
            campaign_match = re.search(r'Campaign[:\s]*([^\n]+)', receipt_text, re.IGNORECASE)
            if campaign_match:
                campaign = campaign_match.group(1).strip()
                if 'music' in campaign.lower():
                    return "Advertising - Google Ads - Music Technology Marketing Campaign"
                elif 'ai' in campaign.lower():
                    return "Advertising - Google Ads - AI Platform Customer Acquisition"
                else:
                    return f"Advertising - Google Search Ads - {campaign[:40]}"
            return "Advertising - Google Ads - Digital Marketing & Customer Acquisition"
        else:
            return "Utilities - Google Cloud Services - Technical Infrastructure & Hosting"
    
    # Adobe
    elif vendor == "Adobe" or 'adobe' in text_lower:
        if 'creative cloud' in text_lower:
            if 'all apps' in text_lower:
                return "Office Expenses - Adobe Creative Cloud All Apps - Complete Video/Audio Production Suite"
            elif 'photography' in text_lower:
                return "Office Expenses - Adobe Photography Plan - Visual Content Creation & Image Processing"
            return "Office Expenses - Adobe Creative Cloud - Digital Design & Content Creation Software"
        elif 'photoshop' in text_lower:
            return "Office Expenses - Adobe Photoshop - Image Processing & Visual Content Creation"
        elif 'premiere' in text_lower:
            return "Office Expenses - Adobe Premiere Pro - Video Production & Content Creation Software"
        elif 'illustrator' in text_lower:
            return "Office Expenses - Adobe Illustrator - Vector Graphics & Logo Design Software"
        elif 'after effects' in text_lower:
            return "Adobe After Effects - Motion Graphics Software"
        else:
            return "Adobe Software License - Creative Production Tools"
    
    # Spotify
    elif vendor == "Spotify" or 'spotify' in text_lower:
        if 'premium duo' in text_lower:
            return "Spotify Premium Duo - Music Research & Analysis"
        elif 'premium family' in text_lower:
            return "Spotify Premium Team - Music Industry Research"
        elif 'premium' in text_lower:
            return "Spotify Premium - Music Reference & Analysis"
        elif 'for artists' in text_lower:
            return "Spotify for Artists - Platform Analytics"
        else:
            return "Music Streaming Service - Market Research"
    
    # Microsoft
    elif vendor == "Microsoft" or 'microsoft' in text_lower:
        if '365' in text_lower:
            if 'business' in text_lower:
                return "Microsoft 365 Business - Office Productivity Suite"
            elif 'personal' in text_lower:
                return "Microsoft 365 - Document Processing Software"
            elif 'family' in text_lower:
                return "Microsoft 365 Team - Collaborative Tools"
            return "Microsoft Office Suite - Business Documentation"
        elif 'azure' in text_lower:
            # Look for service details
            if 'compute' in text_lower:
                return "Azure Cloud Computing - AI Processing Infrastructure"
            elif 'storage' in text_lower:
                return "Azure Storage - Data Archival Services"
            elif 'database' in text_lower:
                return "Azure Database - Business Data Management"
            elif 'cognitive' in text_lower or 'ai' in text_lower:
                return "Azure AI Services - Machine Learning Platform"
            return "Microsoft Azure - Cloud Infrastructure Services"
        elif 'github' in text_lower:
            if 'copilot' in text_lower:
                return "GitHub Copilot - AI Development Assistant"
            elif 'pro' in text_lower:
                return "GitHub Pro - Code Repository Management"
            return "GitHub Services - Software Development Platform"
        else:
            return "Microsoft Services - Business Technology"
    
    # CapCut
    elif vendor == "CapCut" or 'capcut' in text_lower or 'pipo' in text_lower:
        # Extract date for billing period
        date_match = re.search(r'Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})', receipt_text, re.IGNORECASE)
        if not date_match:
            date_match = re.search(r'([A-Za-z]+\s+\d{1,2},\s+\d{4})', receipt_text)
        
        billing_period = ""
        if date_match:
            try:
                date_obj = datetime.strptime(date_match.group(1), '%B %d, %Y')
                billing_period = f" - {date_obj.strftime('%B %Y')}"
            except:
                try:
                    date_obj = datetime.strptime(date_match.group(1), '%b %d, %Y')
                    billing_period = f" - {date_obj.strftime('%B %Y')}"
                except:
                    billing_period = ""
        
        if 'pro' in text_lower:
            return f"CapCut Pro Monthly Subscription{billing_period} - Video Content Production"[:150]
        elif 'annual' in text_lower or 'yearly' in text_lower:
            return f"CapCut Pro Annual License{billing_period} - Professional Video Editing"[:150]
        else:
            return f"CapCut Video Editing Subscription{billing_period} - Content Creation Tools"[:150]
    
    # Instacart
    elif vendor == "Instacart" or 'instacart' in text_lower:
        # Look for store name - multiple patterns
        store = None
        store_patterns = [
            r'delivered from\s+([A-Za-z\s&\']+?)(?:\s+on|\s*$)',
            r'order from\s+([A-Za-z\s&\']+?)(?:\s+delivered|\s*$)',
            r'from\s+([A-Za-z\s&\']+?)\s+(?:delivered|on)',
            r'receipt.*?from\s+([A-Za-z\s&\']+?)(?:\s|$)'
        ]
        
        for pattern in store_patterns:
            store_match = re.search(pattern, text_lower, re.IGNORECASE)
            if store_match:
                store = store_match.group(1).strip().title()
                # Clean up store name
                store = store.replace('  ', ' ').strip()
                if store and store.lower() not in ['your', 'the', 'order']:
                    break
                else:
                    store = None
        
        if store:
            return f"Office Supplies - {store} (Event Catering/Refreshments)"
        return "Office Supplies - Event Refreshments & Catering"
    
    # Generic order receipts
    elif 'order' in text_lower and 'receipt' in text_lower:
        # Look for order number
        order_match = re.search(r'order\s*(?:number|#|id)?[:\s]*([A-Z0-9-]+)', receipt_text, re.IGNORECASE)
        order_num = order_match.group(1) if order_match else None
        
        # Look for what was ordered
        if vendor:
            # Make it business-relevant
            if 'equipment' in text_lower or 'gear' in text_lower:
                desc = f"{vendor} - Audio/Visual Equipment"
            elif 'software' in text_lower:
                desc = f"{vendor} - Software License"
            elif 'hardware' in text_lower:
                desc = f"{vendor} - Computer Hardware"
            elif 'cable' in text_lower or 'adapter' in text_lower:
                desc = f"{vendor} - Technical Equipment"
            else:
                desc = f"{vendor} - Business Supplies"
            
            if order_num:
                desc += f" (Order: {order_num[-8:]})"  # Last 8 chars of order
            return desc[:100]
        else:
            return "Online Purchase - Business Operations"
    
    # Generic fallback - try to extract service/product info
    else:
        # Look for service/product mentions
        service_match = re.search(r'(?:Service|Product|Subscription)[:\s]*([^\n]+)', receipt_text, re.IGNORECASE)
        if service_match:
            service = service_match.group(1).strip()
            # Make it business-relevant
            if vendor:
                return f"{vendor} - {service} (Business Services)"[:100]
            else:
                return f"Professional Services - {service}"[:100]
        
        # Look for description
        desc_match = re.search(r'(?:Description|Item)[:\s]*([^\n]+)', receipt_text, re.IGNORECASE)
        if desc_match:
            desc = desc_match.group(1).strip()
            if vendor:
                return f"{vendor} - {desc} (Business Expense)"[:100]
            else:
                return f"Business Purchase - {desc}"[:100]
        
        # Final fallback based on vendor
        if vendor:
            # Try to categorize by vendor name
            vendor_lower = vendor.lower()
            if any(tech in vendor_lower for tech in ['tech', 'software', 'cloud', 'digital', 'ai']):
                return f"{vendor} - Technology Services"
            elif any(creative in vendor_lower for creative in ['music', 'audio', 'video', 'media', 'creative']):
                return f"{vendor} - Creative Production Services"
            elif any(market in vendor_lower for market in ['marketing', 'advertising', 'social']):
                return f"{vendor} - Marketing Services"
            else:
                return f"{vendor} - Professional Services"
        
        return "Business Services - General Operations"


def generate_receipt_description(receipt_text: str, vendor: str = None, amount: float = None) -> str:
    """Generate a concise description for a receipt using Nova Micro"""
    # Check if Bedrock is available
    if not bedrock_runtime:
        print("Bedrock runtime not available, using smart fallback")
        return generate_smart_fallback_description(receipt_text, vendor, amount)
    
    try:
        print(f"\n=== Calling Nova Micro for description generation ===")
        print(f"Vendor: {vendor}, Amount: ${amount}")
        print(f"Text preview (first 200 chars): {receipt_text[:200]}...")
        
        prompt = f"""You are a tax defense attorney preparing expense descriptions for IRS audit defense. Create a description that will EXACTLY match bank statement entries and withstand scrutiny.

RECEIPT DATA:
{receipt_text[:1500]}

VENDOR: {vendor or 'Unknown'}
AMOUNT: ${amount or 0:.2f}

BUSINESS PROFILE:
- Entity: Algoryx Art & Tech Lab (DBA Patchline AI)
- Industry: AI-powered music technology, creative software development, live performance
- Business Activities: AI music platform development, live DJ/VJ performances, creative AI consulting
- Tax Status: Startup with $150,000 net operating loss requiring detailed documentation

AUDIT DEFENSE REQUIREMENTS:
1. **EXACT MATCHING**: Description must match bank statement transaction descriptions for reconciliation
2. **BUSINESS NECESSITY**: Must demonstrate "ordinary and necessary" business expense under IRC Section 162
3. **SPECIFICITY**: Include specific business purpose, not generic descriptions
4. **BILLING PERIODS**: For subscriptions, include exact billing period (e.g., "December 2024 Monthly")
5. **SCHEDULE C COMPLIANCE**: Use exact Schedule C terminology for categorization
6. **SUPPORTING DETAILS**: Include service/product details that justify business use
7. **AUDIT TRAIL**: Include reference numbers, account IDs, or other identifying information when available

CRITICAL FORMATTING:
- Maximum 150 characters
- Start with Schedule C category when applicable
- Include billing period for recurring expenses
- Use business-specific terminology
- Include account/reference numbers if available

ENHANCED EXAMPLES:
- "Advertising - Meta Business Platform - December 2024 Campaign - AI Music Promotion (Acct: 123456)"
- "Office Expenses - CapCut Pro Monthly - December 2024 - Video Content Production Software"
- "Utilities - Cloud Storage 2TB - December 2024 - Client Project Files & Creative Assets"
- "Equipment - Midjourney Pro Annual License - AI Visual Content Generation for Live Performances"
- "Professional Services - Adobe Creative Cloud - December 2024 - Video/Audio Production Suite"

MATCHING PRIORITY: The description should be recognizable when cross-referenced with bank statements showing the same vendor and amount.

Generate the audit-ready description:"""

        print(f"Calling Bedrock with model: anthropic.claude-3-5-sonnet-20241022-v2:0")
        
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',  # Updated to Sonnet 3.5 v2
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 200,
                'temperature': 0.2,  # Lower temperature for consistency
                'top_p': 0.9
            }),
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        print(f"Bedrock response: {json.dumps(response_body, indent=2)}")
        
        description = response_body.get('content', [{}])[0].get('text', '').strip()
        
        print(f"Generated description: '{description}'")
        
        # Fallback if no description generated
        if not description:
            print("No description generated, using smart fallback")
            return generate_smart_fallback_description(receipt_text, vendor, amount)
            
        # Ensure it's not too long
        if len(description) > 100:
            description = description[:97] + "..."
            
        return description
        
    except Exception as e:
        print(f"Error generating description with Nova Micro: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        # Fallback to smart description
        return generate_smart_fallback_description(receipt_text, vendor, amount)

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
        
        # Look for transaction section markers
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
        print("\n=== First 30 lines of Amazon receipt ===")
        for i, line in enumerate(full_text[:30]):
            print(f"{i}: {line}")
        print("=== End sample ===\n")
        
        # Parse individual items
        # Global duplicate tracking across all strategies
        seen_items = set()  # Track items to avoid duplicates
        seen_amounts = set()  # Track amounts to avoid duplicate prices
        
        for i, line in enumerate(full_text):
            # Skip summary lines and refund/return messages - NEVER extract totals
            line_lower = line.lower()
            
            # ABSOLUTELY NEVER process any line with "total" anywhere
            if 'total' in line_lower:
                print(f"SKIPPED LINE {i}: Contains 'total' - '{line}'")
                continue
                
            if any(skip in line_lower for skip in ['subtotal', 'shipping', 'tax', 'order summary', 
                                                    'payment method', 'ship to', 'return window',
                                                    'refund has been', 'when will i get', 'your return',
                                                    'returns are easy', 'return policy', 'customer service',
                                                    'gift options', 'delivery instructions', 'balance',
                                                    'estimated', 'summary', 'discount', 'promotion']):
                continue
            
            # Pattern: Item description $XX.XX
            price_match = re.match(r'^(.+?)\s+\$(\d+\.\d{2})$', line)
            if price_match:
                description, price_str = price_match.groups()
                amount = Decimal(price_str)
                
                print(f"DEBUG: Found potential item - Line {i}: {line}")
                print(f"  Description: '{description}', Amount: ${amount}")
                
                # Debug: Check if this looks like an address
                if any(addr_word in description.lower() for addr_word in ['brooklyn', 'ny', 'fleet', 'pl', 'united states']):
                    print(f"  WARNING: This looks like an address, not a product!")
                
                # More strict validation for description
                desc_lower = description.lower().strip()
                
                # NEVER extract any line with "total" - this is critical
                if 'total' in desc_lower:
                    print(f"  SKIPPED: Contains 'total' - '{description}'")
                    continue
                
                # NEVER extract addresses or personal info
                address_keywords = ['brooklyn', 'ny ', 'new york', 'united states', 'fleet pl', 
                                  'mehdi noori', 'zip code', 'street', 'avenue', 'blvd', 'road']
                if any(addr in desc_lower for addr in address_keywords):
                    print(f"  SKIPPED: Contains address/personal info - '{description}'")
                    continue
                
                # Skip if description contains other summary keywords
                summary_keywords = ['balance', 'refund', 'return', 'credit', 'payment', 
                                  'shipping', 'tax', 'subtotal', 'discount', 'promotion', 'coupon',
                                  'fee', 'charge', 'adjustment', 'summary', 'estimated']
                
                # Skip if description is too short or contains summary keywords
                if (len(description.strip()) <= 8 or  # Increased minimum length
                    any(keyword in desc_lower for keyword in summary_keywords) or
                    desc_lower.endswith(':') or  # Skip lines ending with colon
                    re.match(r'^[^a-zA-Z]*$', description.strip())):  # Skip lines with no letters
                    print(f"  SKIPPED: Description validation failed - '{description}'")
                    continue
                
                # Validate it's a reasonable item price
                if not (0 < amount < 10000):
                    print(f"  SKIPPED: Price validation failed - ${amount}")
                    continue
                
                # Create a unique key to avoid duplicates
                item_key = f"{description.strip()}_{amount}"
                amount_key = f"{amount}_{order_date}"
                if item_key in seen_items or amount_key in seen_amounts:
                    print(f"  SKIPPED: Duplicate item or amount")
                    continue
                seen_items.add(item_key)
                seen_amounts.add(amount_key)
                
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
                # Also check for multi-line product descriptions
                # Look for lines that are clearly product names (very specific criteria)
                if (len(line) > 30 and  # Must be quite long
                    not line.startswith('$') and  # Not a price line
                    not any(skip in line_lower for skip in ['sold by', 'ship to', 'order placed', 
                                                           'payment method', 'return', 'refund', 'visa ending',
                                                           'brooklyn', 'ny ', 'new york', 'united states',
                                                           'mehdi noori', 'fleet pl', 'total']) and
                    re.search(r'[a-zA-Z]', line) and  # Contains letters
                    not line_lower.endswith(':') and  # Not a header line
                    not re.match(r'^[A-Z\s,\d-]+$', line) and  # Not all caps (likely address/name)
                    (',' in line and '-' in line) and  # Must have both comma AND dash (product descriptions)
                    len(line.split()) >= 6 and  # Must have at least 6 words
                    any(product_word in line_lower for product_word in ['stand', 'tripod', 'projector', 'laptop', 
                                                                       'equipment', 'holder', 'cable', 'adapter'])):  # Must contain product-like words
                    
                    # Look ahead for a price in the next few lines
                    for j in range(i+1, min(len(full_text), i+4)):
                        next_line = full_text[j].strip()
                        # Look for standalone price
                        standalone_price_match = re.match(r'^\$(\d+\.\d{2})$', next_line)
                        if standalone_price_match:
                            amount = Decimal(standalone_price_match.group(1))
                            if 0 < amount < 10000:
                                description = line.strip()
                                
                                # Skip if we already have this item
                                item_key = f"{description}_{amount}"
                                amount_key = f"{amount}_{order_date}"
                                if item_key in seen_items or amount_key in seen_amounts:
                                    break
                                seen_items.add(item_key)
                                seen_amounts.add(amount_key)
                                
                                category = self._categorize_amazon_item(description)
                                
                                expense = {
                                    'expenseId': self.generate_expense_id(order_date or str(datetime.now().date()), 
                                                                        str(amount), description),
                                    'userId': self.user_id,
                                    'documentId': self.document_id,
                                    'date': order_date or str(datetime.now().date()),
                                    'description': description,
                                    'vendor': self._get_amazon_vendor_category(description),
                                    'amount': str(amount),
                                    'category': category,
                                    'bankAccount': 'amazon-receipts',
                                    'orderNumber': order_number,
                                    'status': 'pending',
                                    'confidence': 0.85,
                                    'createdAt': datetime.utcnow().isoformat()
                                }
                                expenses.append(expense)
                                print(f"  ADDED: Multi-line Amazon item: {description} - ${amount}")
                                break
            
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
                        'total' not in prev_line.lower() and  # NEVER use lines with "total" as product names
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
                                    # FINAL CHECK: Never allow any "total" items
                                    if 'total' in product_name.lower():
                                        print(f"    FINAL CHECK: Rejected product with 'total' - '{product_name}'")
                                        break
                                        
                                    # Check for duplicates
                                    item_key = f"{product_name.strip()}_{amount}"
                                    amount_key = f"{amount}_{order_date}"
                                    if item_key in seen_items or amount_key in seen_amounts:
                                        break
                                    seen_items.add(item_key)
                                    seen_amounts.add(amount_key)
                                    
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
                table_expenses = self._parse_amazon_table(block, textract_data, order_date, order_number, seen_items, seen_amounts)
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
                                                'camera', 'tripod', 'light', 'projector', 'equipment',
                                                'speaker', 'audio', 'video', 'recording']):
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
        
        if any(word in desc_lower for word in ['cable', 'adapter', 'laptop', 'monitor', 'keyboard', 
                                               'tripod', 'projector', 'stand', 'equipment', 'camera']):
            return 'Amazon.com - Tech Equipment'
        elif any(word in desc_lower for word in ['paper', 'pen', 'notebook', 'folder']):
            return 'Amazon.com - Office Supplies'
        elif any(word in desc_lower for word in ['software', 'subscription', 'digital']):
            return 'Amazon.com - Software'
        else:
            return 'Amazon.com'
    
    def _parse_amazon_table(self, table_block: Dict, full_data: Dict, order_date: str, order_number: str, seen_items: set, seen_amounts: set) -> List[Dict]:
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
                    # More strict validation for table descriptions
                    desc_lower = description.lower().strip()
                    
                    # NEVER extract any line with "total" - this is critical for tables too
                    if 'total' in desc_lower:
                        print(f"    SKIPPED table item: Contains 'total' - '{description}'")
                        continue
                    
                    # NEVER extract addresses or personal info from tables
                    address_keywords = ['brooklyn', 'ny ', 'new york', 'united states', 'fleet pl', 
                                      'mehdi noori', 'zip code', 'street', 'avenue', 'blvd', 'road']
                    if any(addr in desc_lower for addr in address_keywords):
                        print(f"    SKIPPED table item: Contains address/personal info - '{description}'")
                        continue
                    
                    # Skip summary lines and invalid descriptions
                    summary_keywords = ['subtotal', 'tax', 'shipping', 'refund', 'balance',
                                      'discount', 'promotion', 'coupon', 'fee', 'charge', 'adjustment',
                                      'summary', 'estimated']
                    
                    if (len(description.strip()) > 8 and  # Increased minimum length
                        not any(keyword in desc_lower for keyword in summary_keywords) and
                        not desc_lower.endswith(':') and  # Skip lines ending with colon
                        not re.match(r'^[^a-zA-Z]*$', description.strip()) and  # Must contain letters
                        len([c for c in description if c.isalpha()]) >= 5):  # At least 5 letters
                        
                        # Check for duplicates in table too
                        item_key = f"{description.strip()}_{price}"
                        amount_key = f"{price}_{order_date}"
                        if item_key in seen_items or amount_key in seen_amounts:
                            print(f"    SKIPPED table item: Duplicate - '{description}'")
                            continue
                        seen_items.add(item_key)
                        seen_amounts.add(amount_key)
                        
                        category = self._categorize_amazon_item(description)
                        
                        expense = {
                            'expenseId': self.generate_expense_id(order_date or str(datetime.now().date()), 
                                                                str(price), description),
                            'userId': self.user_id,
                            'documentId': self.document_id,
                            'date': order_date or str(datetime.now().date()),
                            'description': description.strip(),
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
                    else:
                        print(f"    SKIPPED table item: '{description}' - failed validation")
        
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


class GmailReceiptParser(BankStatementParser):
    """Parser for Gmail receipts (various types like Midjourney, Apple, etc.)"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Gmail receipt format"""
        expenses = []
        
        # Extract all text first
        full_text = []
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    full_text.append(text)
        
        text_content = '\n'.join(full_text)
        
        print(f"Gmail receipt - Processing {len(full_text)} lines")
        
        # Debug: Print first few lines to see structure
        print("\n=== First 20 lines of Gmail receipt ===")
        for i, line in enumerate(full_text[:20]):
            print(f"{i}: {line}")
        print("=== End sample ===\n")
        
        # Detect receipt type and extract accordingly
        receipt_type = self._detect_receipt_type(text_content)
        print(f"Detected receipt type: {receipt_type}")
        
        if receipt_type == 'midjourney':
            return self._parse_midjourney_receipt(full_text, text_content)
        elif receipt_type == 'apple':
            return self._parse_apple_receipt(full_text, text_content)
        elif receipt_type == 'generic':
            return self._parse_generic_receipt(full_text, text_content, textract_data)
        
        return expenses
    
    def _detect_receipt_type(self, text_content: str) -> str:
        """Detect the type of Gmail receipt"""
        text_lower = text_content.lower()
        
        if 'midjourney' in text_lower:
            return 'midjourney'
        elif 'apple' in text_lower and ('icloud' in text_lower or 'apple.com' in text_lower):
            return 'apple'
        elif ('meta' in text_lower and 'ads' in text_lower) or 'facebook' in text_lower:
            # Meta ads receipts should use generic parser with enhanced vendor detection
            return 'generic'
        else:
            return 'generic'
    
    def _parse_midjourney_receipt(self, lines: List[str], text_content: str) -> List[Dict]:
        """Parse Midjourney receipt format"""
        expenses = []
        
        # Extract key information
        amount = None
        date = None
        vendor = "Midjourney Inc"
        receipt_number = None
        invoice_number = None
        
        # Look for amount - Midjourney shows like "$10.89"
        amount_match = re.search(r'\$(\d+\.\d{2})', text_content)
        if amount_match:
            amount = Decimal(amount_match.group(1))
            print(f"Found amount: ${amount}")
        
        # Look for date - "Paid November 29, 2024" or similar
        date_patterns = [
            r'Paid\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})'
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, text_content)
            if date_match:
                date_str = date_match.group(1)
                try:
                    # Try different date formats
                    for fmt in ['%B %d, %Y', '%b %d, %Y', '%m/%d/%Y']:
                        try:
                            date_obj = datetime.strptime(date_str, fmt)
                            date = date_obj.strftime('%Y-%m-%d')
                            print(f"Found date: {date}")
                            break
                        except:
                            continue
                except:
                    pass
                if date:
                    break
        
        # Look for receipt number
        receipt_match = re.search(r'Receipt number\s*[:\s]*(\d+-\d+-\d+)', text_content, re.IGNORECASE)
        if receipt_match:
            receipt_number = receipt_match.group(1)
            print(f"Found receipt number: {receipt_number}")
        
        # Look for invoice number
        invoice_match = re.search(r'Invoice number\s*[:\s]*([A-Z0-9-]+)', text_content, re.IGNORECASE)
        if invoice_match:
            invoice_number = invoice_match.group(1)
            print(f"Found invoice number: {invoice_number}")
        
        # Generate intelligent description using Nova Micro
        description = generate_receipt_description(
            text_content,
            vendor=vendor,
            amount=float(amount) if amount else None
        )
        
        print(f"Generated description: {description}")
        
        if amount and date:
            expense = {
                'expenseId': self.generate_expense_id(date, str(amount), description),
                'userId': self.user_id,
                'documentId': self.document_id,
                'date': date,
                'description': description,
                'vendor': vendor,
                'amount': str(amount),
                'category': 'platform_expenses',  # AI/Platform subscription
                'bankAccount': 'gmail-receipts',
                'receiptNumber': receipt_number,
                'invoiceNumber': invoice_number,
                'status': 'pending',
                'confidence': 0.95,
                'createdAt': datetime.utcnow().isoformat()
            }
            expenses.append(expense)
            print(f"Added Midjourney expense: {description} - ${amount} on {date}")
        
        return expenses
    
    def _parse_apple_receipt(self, lines: List[str], text_content: str) -> List[Dict]:
        """Parse Apple receipt format"""
        expenses = []
        
        # Extract key information
        amount = None
        date = None
        vendor = "Apple"
        order_id = None
        
        # Look for amount - Apple shows total like "$9.99"
        amount_match = re.search(r'TOTAL\s*\$(\d+\.\d{2})', text_content, re.IGNORECASE)
        if not amount_match:
            # Try alternative pattern
            amount_match = re.search(r'\$(\d+\.\d{2})', text_content)
        
        if amount_match:
            amount = Decimal(amount_match.group(1))
            print(f"Found amount: ${amount}")
        
        # Look for date
        date_patterns = [
            r'DATE\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'Renews\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})'
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, text_content)
            if date_match:
                date_str = date_match.group(1)
                try:
                    for fmt in ['%B %d, %Y', '%b %d, %Y']:
                        try:
                            date_obj = datetime.strptime(date_str, fmt)
                            date = date_obj.strftime('%Y-%m-%d')
                            print(f"Found date: {date}")
                            break
                        except:
                            continue
                except:
                    pass
                if date:
                    break
        
        # Look for order ID
        order_match = re.search(r'ORDER ID\s*([A-Z0-9]+)', text_content, re.IGNORECASE)
        if order_match:
            order_id = order_match.group(1)
            print(f"Found order ID: {order_id}")
        
        # Generate intelligent description using Nova Micro
        description = generate_receipt_description(
            text_content,
            vendor=vendor,
            amount=float(amount) if amount else None
        )
        
        print(f"Generated description: {description}")
        
        if amount and date:
            expense = {
                'expenseId': self.generate_expense_id(date, str(amount), description),
                'userId': self.user_id,
                'documentId': self.document_id,
                'date': date,
                'description': description,
                'vendor': vendor,
                'amount': str(amount),
                'category': 'platform_expenses',  # Cloud storage/subscription
                'bankAccount': 'gmail-receipts',
                'orderNumber': order_id,
                'status': 'pending',
                'confidence': 0.95,
                'createdAt': datetime.utcnow().isoformat()
            }
            expenses.append(expense)
            print(f"Added Apple expense: {description} - ${amount} on {date}")
        
        return expenses
    
    def _parse_generic_receipt(self, lines: List[str], text_content: str, textract_data: Dict) -> List[Dict]:
        """Parse generic receipt format - extract date, description, and total"""
        expenses = []
        
        # Try to extract key information
        amount = None
        date = None
        description = None
        vendor = None
        
        # Look for total amount - various patterns
        amount_patterns = [
            r'Total[:\s]*\$(\d+\.\d{2})',
            r'Grand Total[:\s]*\$(\d+\.\d{2})',
            r'Amount[:\s]*\$(\d+\.\d{2})',
            r'Total Due[:\s]*\$(\d+\.\d{2})',
            r'Total Paid[:\s]*\$(\d+\.\d{2})',
            r'Payment[:\s]*\$(\d+\.\d{2})',
            r'\$(\d+\.\d{2})\s*(?:USD)?$'  # Standalone amount at end of line
        ]
        
        for pattern in amount_patterns:
            amount_match = re.search(pattern, text_content, re.IGNORECASE | re.MULTILINE)
            if amount_match:
                amount = Decimal(amount_match.group(1))
                print(f"Found amount: ${amount}")
                break
        
        # Look for date - various patterns
        date_patterns = [
            r'Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'Invoice Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'Receipt Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'([A-Za-z]+\s+\d{1,2},\s+\d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})',
            r'(\d{4}-\d{2}-\d{2})'
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, text_content)
            if date_match:
                date_str = date_match.group(1)
                # Try to parse the date
                date = self._parse_date_flexible(date_str)
                if date:
                    print(f"Found date: {date}")
                    break
        
        # Try to extract vendor/company name
        vendor_patterns = [
            r'From[:\s]*([A-Za-z0-9\s&,.-]+)',
            r'Merchant[:\s]*([A-Za-z0-9\s&,.-]+)',
            r'Vendor[:\s]*([A-Za-z0-9\s&,.-]+)',
            r'Company[:\s]*([A-Za-z0-9\s&,.-]+)',
            r'Billed by[:\s]*([A-Za-z0-9\s&,.-]+)',
            r'Payment to[:\s]*([A-Za-z0-9\s&,\(\).-]+)'  # Added parentheses for (SG)
        ]
        
        # First check if this is a known service where we should ignore store names
        text_lower = text_content.lower()
        known_services = ['instacart', 'uber eats', 'doordash', 'grubhub', 'postmates']
        for service in known_services:
            if service in text_lower:
                vendor = service.title().replace(' ', '')  # e.g., "Instacart", "UberEats"
                print(f"Found known delivery service: {vendor}")
                break
        
        # Check for CapCut/PIPO specifically
        if not vendor and ('capcut' in text_lower or 'pipo' in text_lower):
            vendor = "CapCut"
            print(f"Found CapCut/PIPO service")
        
        # If not a known service, try standard patterns
        if not vendor:
            for pattern in vendor_patterns:
                vendor_match = re.search(pattern, text_content, re.IGNORECASE)
                if vendor_match:
                    vendor = vendor_match.group(1).strip()
                    # Clean up vendor - remove newlines and limit length
                    vendor = vendor.split('\n')[0].strip()
                    
                    # Special handling for PIPO -> CapCut
                    if 'pipo' in vendor.lower():
                        vendor = "CapCut"
                    
                    print(f"Found vendor: {vendor}")
                    break
        
        # If no vendor found, try to extract from email or first few lines
        if not vendor:
            # Skip Gmail header lines and look for actual vendor
            for i, line in enumerate(lines):
                # Skip Gmail interface lines
                if i < 2 and 'gmail' in line.lower():
                    continue
                    
                # Look for Meta/Facebook
                if 'meta' in line.lower() or 'facebook' in line.lower():
                    if '@facebookmail.com' in line or '@meta.com' in line:
                        vendor = "Meta"
                        print(f"Found vendor from email: {vendor}")
                        break
                    elif 'meta platforms' in line.lower():
                        vendor = "Meta"
                        print(f"Found vendor from company name: {vendor}")
                        break
                
                # Generic email extraction
                if '@' in line and '.' in line and i < 10:
                    email_match = re.search(r'([a-zA-Z0-9.-]+)@([a-zA-Z0-9.-]+)', line)
                    if email_match:
                        domain = email_match.group(2)
                        # Map common domains to proper vendor names
                        domain_vendor_map = {
                            'facebookmail.com': 'Meta',
                            'meta.com': 'Meta',
                            'apple.com': 'Apple',
                            'google.com': 'Google',
                            'amazon.com': 'Amazon',
                            'microsoft.com': 'Microsoft',
                            'adobe.com': 'Adobe',
                            'spotify.com': 'Spotify',
                            'instacart.com': 'Instacart',
                            'capcut.com': 'CapCut',
                            'pipo.sg': 'CapCut'  # PIPO (SG) PTE LTD is CapCut
                        }
                        
                        if domain in domain_vendor_map:
                            vendor = domain_vendor_map[domain]
                        else:
                            # Extract vendor from domain
                            vendor_name = domain.split('.')[0].title()
                            # Clean up vendor name - remove common suffixes
                            if vendor_name.lower() not in ['gmail', 'mail', 'email', 'noreply']:
                                vendor = vendor_name
                        
                        # Don't use Gmail as vendor
                        if vendor and vendor.lower() != 'gmail':
                            print(f"Found vendor from email domain: {vendor}")
                            break
        
        # Final vendor cleanup - ensure it's not too long
        if vendor and len(vendor) > 50:
            # If vendor is too long, it's probably captured extra text
            vendor = vendor.split('\n')[0].split(',')[0].strip()[:50]
        
        # Generate intelligent description using Nova Micro
        description = generate_receipt_description(
            text_content, 
            vendor=vendor,
            amount=float(amount) if amount else None
        )
        
        print(f"Generated description: {description}")
        
        # If we have amount and date, create the expense
        if amount and date:
            # Try to categorize based on vendor or description
            category = self._categorize_generic_expense(vendor or '', description)
            
            expense = {
                'expenseId': self.generate_expense_id(date, str(amount), description),
                'userId': self.user_id,
                'documentId': self.document_id,
                'date': date,
                'description': description,
                'vendor': vendor or 'Unknown Vendor',
                'amount': str(amount),
                'category': category,
                'bankAccount': 'gmail-receipts',
                'status': 'pending',
                'confidence': 0.8,
                'createdAt': datetime.utcnow().isoformat()
            }
            expenses.append(expense)
            print(f"Added generic expense: {description} - ${amount} on {date}")
        
        return expenses
    
    def _parse_date_flexible(self, date_str: str) -> Optional[str]:
        """Parse date from various formats"""
        # Try different date formats
        formats = [
            '%B %d, %Y',      # January 1, 2024
            '%b %d, %Y',      # Jan 1, 2024
            '%m/%d/%Y',       # 01/01/2024
            '%d/%m/%Y',       # 01/01/2024 (European)
            '%Y-%m-%d',       # 2024-01-01
            '%d-%m-%Y',       # 01-01-2024
            '%m-%d-%Y'        # 01-01-2024
        ]
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(date_str.strip(), fmt)
                return date_obj.strftime('%Y-%m-%d')
            except:
                continue
        
        return None
    
    def _categorize_generic_expense(self, vendor: str, description: str) -> str:
        """Categorize generic expenses based on vendor and description"""
        combined = f"{vendor} {description}".lower()
        
        # Advertising - check this first for Meta/Facebook
        if any(word in combined for word in ['ads', 'advertising', 'marketing', 'promotion',
                                            'facebook', 'meta', 'google', 'instagram', 'tiktok',
                                            'campaign', 'boost', 'results']):
            return 'advertising'
        
        # Platform/Software subscriptions (including video editing)
        elif any(word in combined for word in ['software', 'saas', 'subscription', 'cloud', 'api',
                                            'hosting', 'server', 'platform', 'service', 'storage',
                                            'capcut', 'video edit', 'editor', 'midjourney']):
            return 'platform_expenses'
        
        # Operations/Supplies (including food delivery for office)
        elif any(word in combined for word in ['instacart', 'grocery', 'delivery', 'supplies',
                                            'office supplies', 'food delivery']):
            return 'office_expenses'
        
        # Professional services
        elif any(word in combined for word in ['consulting', 'freelance', 'contractor', 'design',
                                            'development', 'legal', 'accounting']):
            return 'contract_labor'
        
        # Travel
        elif any(word in combined for word in ['travel', 'flight', 'hotel', 'uber', 'lyft',
                                            'airbnb', 'transportation']):
            return 'travel'
        
        # Default
        else:
            return 'other_expenses'


def get_parser(bank_type: str, user_id: str, document_id: str) -> BankStatementParser:
    """Get the appropriate parser for the bank type"""
    parsers = {
        'chase-checking': ChaseStatementParser,
        'chase-freedom': ChaseStatementParser,
        'chase-sapphire': ChaseStatementParser,
        'bilt': BiltStatementParser,
        'amazon-receipts': AmazonReceiptParser,
        'gmail-receipts': GmailReceiptParser,
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