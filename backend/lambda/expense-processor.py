import json
import os
import re
import hashlib
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
import boto3
import logging
import sys

# Add the backend/scripts directory to the Python path
# This allows us to import the config module directly
scripts_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts')
if scripts_path not in sys.path:
    sys.path.append(scripts_path)

# Import BEDROCK_MODELS at the top level with proper fallback
BEDROCK_MODELS = {}
try:
    from config import BEDROCK_MODELS
    # Use the inference profile ARN specified for 'claude-4-sonnet' in the config
    # This is the correct way to invoke a model with provisioned throughput.
    CLAUDE_4_SONNET_MODEL_ID = BEDROCK_MODELS['claude-4-sonnet']['inference_profile'] or BEDROCK_MODELS['claude-4-sonnet']['id']
    # Expose a single variable that the rest of the module relies on
    MODEL_ID_TO_USE = os.environ.get('BEDROCK_MODEL_ID', CLAUDE_4_SONNET_MODEL_ID)
    logging.info(f"Successfully imported Bedrock model config. Primary model: {MODEL_ID_TO_USE}")
except ImportError as e:
    logging.error(f"Could not import Bedrock config from backend/scripts/config.py: {e}")
    logging.error("Falling back to a hardcoded model ID. This may not be what you want.")
    MODEL_ID_TO_USE = 'amazon.nova-micro-v1:0'
    # Define minimal BEDROCK_MODELS for fallback
    BEDROCK_MODELS = {
        'nova-micro': {'id': 'amazon.nova-micro-v1:0', 'inference_profile': None},
        'nova-premier': {'id': 'amazon.nova-premier-v1:0', 'inference_profile': 'arn:aws:bedrock:us-east-1::inference-profile/us.amazon.nova-premier-v1:0'}
    }

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

# UPDATE: try multiple model IDs for Bedrock → Sonnet
MODEL_CANDIDATES = [
    os.environ.get('BEDROCK_MODEL_ID'),                    # Explicit override
    MODEL_ID_TO_USE,                                       # Preferred model (likely inference profile)
    # Use inference profiles from config when available - PRIORITIZE CLAUDE 4 SONNET
    BEDROCK_MODELS.get('claude-4-sonnet', {}).get('inference_profile'),
    'us.anthropic.claude-sonnet-4-20250514-v1:0',         # Direct Claude 4 Sonnet ID
    'anthropic.claude-sonnet-4-20250514-v1:0',            # Alternative Claude 4 Sonnet ID
    # Then try Claude 3.7 Sonnet as fallback
    BEDROCK_MODELS.get('claude-3-7-sonnet', {}).get('inference_profile'),
    'us.anthropic.claude-3-7-sonnet-20250219-v1:0',       # Direct Claude 3.7 Sonnet ID
    # Then Nova Premier
    BEDROCK_MODELS.get('nova-premier', {}).get('inference_profile'),
    'arn:aws:bedrock:us-east-1::inference-profile/us.amazon.nova-premier-v1:0',
    'amazon.nova-premier-v1:0',
    # Fallback to smaller models
    'amazon.nova-micro-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',              # Usually available with on-demand
]

# Remove Nones and preserve order while dropping duplicates
_seen = set()
MODEL_CANDIDATES = [m for m in MODEL_CANDIDATES if m and (m not in _seen and not _seen.add(m))]

# ---------------------------------------------------------------------------
# Helper – Build request body for Bedrock models (Anthropic vs Amazon)
# ---------------------------------------------------------------------------

def _build_bedrock_request(model_id: str, prompt: str) -> Tuple[dict, str]:
    """Return (body_dict, content_type) for bedrock_runtime.invoke_model.

    Anthropic (Claude) models expect the conversational `messages` schema, whereas
    Amazon Titan/Nova models expect the `inputText` schema. We inspect the model
    ID prefix to choose the correct payload format.
    """
    if "anthropic" in model_id:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "temperature": 0.1,
            "top_p": 0.9
        }
        return body, "application/json"

    # Default – assume Amazon Titan/Nova semantics
    body = {
        "inputText": prompt,
        "textGenerationConfig": {
            "maxTokenCount": 256,
            "temperature": 0.1,
            "topP": 0.9,
            "stopSequences": []
        }
    }
    return body, "application/json"

def generate_smart_fallback_description(receipt_text: str, vendor: str = None, amount: float = None) -> str:
    """Generate a smart description without using Bedrock"""
    text_lower = receipt_text.lower()
    
    # Extract additional details from receipt
    details = []
    
    # Meta/Facebook ads
    if vendor == "Meta" or 'facebook' in text_lower:
        print(f"\n=== META ADS FALLBACK PROCESSING ===")
        print(f"Receipt text length: {len(receipt_text)}")
        print(f"Full text preview: {receipt_text[:1000]}...")
        
        # Look for account ID
        account_match = re.search(r'Account ID[:\s]*(\d+)', receipt_text, re.IGNORECASE)
        account_id = account_match.group(1) if account_match else None
        print(f"Account ID found: {account_id}")
        
        # Look for campaign name with multiple patterns
        campaign_name = None
        campaign_patterns = [
            r'Campaign[:\s]*([^\n\r]+)',
            r'Campaign Name[:\s]*([^\n\r]+)',
            r'Ad Campaign[:\s]*([^\n\r]+)',
            r'Campaign Title[:\s]*([^\n\r]+)',
            r'For campaign[:\s]*([^\n\r]+)',
            r'campaign[:\s]*"([^"]+)"',
            r'Campaign:\s*([A-Za-z0-9\s\-_]+)'
        ]
        
        for pattern in campaign_patterns:
            campaign_match = re.search(pattern, receipt_text, re.IGNORECASE)
            if campaign_match:
                campaign_name = campaign_match.group(1).strip()
                print(f"Campaign found with pattern '{pattern}': {campaign_name}")
                break
        
        # Look for ad set
        adset_name = None
        adset_patterns = [
            r'Ad Set[:\s]*([^\n\r]+)',
            r'Ad Set Name[:\s]*([^\n\r]+)',
            r'Adset[:\s]*([^\n\r]+)'
        ]
        
        for pattern in adset_patterns:
            adset_match = re.search(pattern, receipt_text, re.IGNORECASE)
            if adset_match:
                adset_name = adset_match.group(1).strip()
                print(f"Ad Set found: {adset_name}")
                break
        
        # Look for objective or campaign type
        objective = None
        objective_patterns = [
            r'Objective[:\s]*([^\n\r]+)',
            r'Campaign Objective[:\s]*([^\n\r]+)',
            r'Goal[:\s]*([^\n\r]+)',
            r'Purpose[:\s]*([^\n\r]+)'
        ]
        
        for pattern in objective_patterns:
            obj_match = re.search(pattern, receipt_text, re.IGNORECASE)
            if obj_match:
                objective = obj_match.group(1).strip()
                print(f"Objective found: {objective}")
                break
        
        # Look for targeting details (but be more careful about extraction)
        targeting_info = []
        if 'location' in text_lower and 'targeting' in text_lower:
            location_match = re.search(r'Location[:\s]*([A-Za-z\s,]+)', receipt_text, re.IGNORECASE)
            if location_match:
                location = location_match.group(1).strip()
                # Only add if it looks like a real location (no email addresses, etc.)
                if '@' not in location and len(location) < 50:
                    targeting_info.append(f"Location: {location}")
        
        if 'age' in text_lower and 'targeting' in text_lower:
            age_match = re.search(r'Age[:\s]*(\d+[-\s]*\d*)', receipt_text, re.IGNORECASE)
            if age_match:
                age = age_match.group(1).strip()
                # Only add if it looks like actual age targeting
                if len(age) < 20 and not '@' in age:
                    targeting_info.append(f"Age: {age}")
        
        # Extract date for billing period
        date_match = re.search(r'Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})', receipt_text, re.IGNORECASE)
        billing_period = ""
        if date_match:
            try:
                date_obj = datetime.strptime(date_match.group(1), '%B %d, %Y')
                billing_period = f" - {date_obj.strftime('%B %Y')}"
            except:
                billing_period = ""
        
        # Build specific description based on actual campaign data
        if campaign_name:
            # Use actual campaign name
            if 'music' in campaign_name.lower():
                base = f"Advertising - Meta Ads - Music Campaign: {campaign_name[:40]}"
            elif 'patchline' in campaign_name.lower() or 'ai' in campaign_name.lower():
                base = f"Advertising - Meta Ads - AI Platform: {campaign_name[:40]}"
            elif 'event' in campaign_name.lower() or 'performance' in campaign_name.lower():
                base = f"Advertising - Meta Ads - Event Marketing: {campaign_name[:40]}"
            else:
                base = f"Advertising - Meta Ads - {campaign_name[:50]}"
        elif objective:
            # Use campaign objective
            base = f"Advertising - Meta Ads - {objective[:50]} Campaign"
        elif adset_name:
            # Use ad set name
            base = f"Advertising - Meta Ads - {adset_name[:50]}"
        else:
            # Create description based on receipt content
            if 'results' in text_lower:
                base = "Advertising - Meta Ads - Performance Marketing Campaign"
            elif 'boost' in text_lower:
                base = "Advertising - Meta Ads - Post Boost Campaign"
            elif 'instagram' in text_lower and 'story' in text_lower:
                base = "Advertising - Instagram Stories - Brand Awareness Campaign"
            elif 'instagram' in text_lower:
                base = "Advertising - Instagram Ads - Business Promotion Campaign"
            elif 'facebook' in text_lower:
                base = "Advertising - Facebook Ads - Business Marketing Campaign"
            else:
                base = "Advertising - Meta Business Platform - Digital Marketing Campaign"
        
        # Add billing period
        base += billing_period
        
        # Add account ID if found (last 6 digits only for brevity)
        if account_id:
            base += f" (Acct: {account_id[-6:]})"
        
        # Add targeting info if available
        if targeting_info:
            base += f" - {', '.join(targeting_info[:2])}"  # Limit to first 2 targeting details
        
        print(f"Final Meta description: {base}")
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
    """Generate a concise description for a receipt using Bedrock LLMs"""
    global MODEL_ID_TO_USE
    
    logging.info("\n[AI] STARTING AI DESCRIPTION GENERATION")
    logging.info(f"[AI] Bedrock client status: {'Available' if bedrock_runtime else 'Not available'}")
    logging.info(f"[AI] Input vendor: {vendor}")
    logging.info(f"[AI] Input amount: ${amount}")
    logging.info(f"[AI] Input text length: {len(receipt_text)} characters")
    
    try:
        logging.info("\n[AI] Preparing Bedrock prompt for description generation ===")
        logging.info(f"[AI] Vendor: {vendor}, Amount: ${amount}")
        logging.info(f"[AI] Text preview (first 200 chars): {receipt_text[:200]}...")
        
        prompt = f"""You are a tax defense attorney creating UNIQUE expense descriptions for IRS audit defense. Extract SPECIFIC details from the receipt to create a DISTINCT description.

RECEIPT CONTENT:
{receipt_text[:2000]}

TRANSACTION INFO:
- Vendor: {vendor or 'Unknown'}
- Amount: ${amount or 0:.2f}

BUSINESS CONTEXT:
- Entity: Algoryx Art & Technology Lab (DBA Patchline AI)
- Industry: AI-powered music technology, creative AI research, audiovisual performances
- Business Activities:
  * Live AI-generated audiovisual performances
  * Creative AI software development (Patchline AI platform)
  * Content creation for professional channels
  * Industry networking and client development
  * Technical demonstrations and showcases
- Location: Professional studio facility in Brooklyn, NY

CRITICAL IRS REQUIREMENTS:
1. ALWAYS position purchases as professional business operations (NOT hobby/personal)
2. Use formal business language - we operate like a $10M technology company
3. Include verifiable identifiers (order numbers, campaign IDs, dates)
4. Connect every expense to revenue-generating activities
5. Be specific but professional - avoid casual language

FORMAT STRICTLY AS:
[Category] - [Business Purpose] - [Specific Item/Service] - [Identifier]

CATEGORY MAPPING:
- Advertising/Marketing = "Advertising - [Purpose]"
- Software/Subscriptions = "Other Expenses - [Service Type]"
- Equipment/Supplies = "Office Expenses - [Business Function]"
- Transportation = "Travel - [Business Purpose]"
- Meals/Entertainment = "Meals - [Business Context]"

BUSINESS PURPOSE EXAMPLES:
- "Client Development Materials" (for event supplies)
- "Studio Infrastructure" (for cables/equipment)
- "Content Production Tools" (for software)
- "Professional Development" (for courses/training)
- "Market Research Operations" (for competitor analysis)
- "Brand Asset Development" (for design tools)
- "Live Performance Materials" (for event/show supplies)

CRITICAL: Read the actual product names carefully. Don't assume "Airloons" is AI-related - it's balloons!

EXTRACT FROM RECEIPT:
1. For Meta/Facebook Ads: Find campaign name, objective, and ID
2. For Amazon: Extract ACTUAL product names (e.g., "Monoprice 16AWG Cable", "LED Light Balloons", NOT generic "Business Supplies")
3. For Software: Specify subscription type and business use
4. For Transportation: Time of day indicates purpose (evening = client event, day = meetings)
5. For Equipment: Connect to studio operations or content production

Generate ONE LINE description. Be SPECIFIC with actual receipt details but PROFESSIONAL in tone.
Maximum 120 characters to avoid truncation.
Think: How would a Fortune 500 company describe this expense?

IMPORTANT: 
- If receipt shows specific products, USE THEM (e.g., "16AWG Audio Cables" not "Business Supplies")
- If multiple similar items, consolidate professionally (e.g., "Studio Lighting Equipment Set" not individual bulbs)
- For Amazon orders, the receipt text includes actual product names - USE THEM!"""

        # -------------------------------------------------------------------
        # Attempt model invocation – iterate over candidate models until one
        # responds without an error. This allows graceful downgrade if the
        # preferred Claude Sonnet 4 model is unavailable in the account.
        # -------------------------------------------------------------------

        candidate_models = [MODEL_ID_TO_USE] + [m for m in MODEL_CANDIDATES if m not in (MODEL_ID_TO_USE, None)]
        logging.info(f"[AI] Candidate models to try (ordered): {candidate_models}")

        description = ""
        last_error = None

        for model_id in candidate_models:
            try:
                logging.info(f"[AI] Attempting Bedrock call with model: {model_id}")
                body, content_type = _build_bedrock_request(model_id, prompt)

                response = bedrock_runtime.invoke_model(
                    modelId=model_id,
                    body=json.dumps(body),
                    contentType=content_type,
                    accept='application/json'
                )

                logging.info(f"[AI] Received response from Bedrock (model {model_id})")

                raw_body = response["body"].read()
                response_json = json.loads(raw_body)

                # Parse response according to provider
                if "anthropic" in model_id:
                    # Claude response format: {"content": [{"text": "...", "type": "text"}]}
                    description = response_json.get('content', [{}])[0].get('text', '').strip()
                else:
                    # Titan / Nova format
                    description = response_json.get('results', [{}])[0].get('outputText', '').strip()

                if description:
                    MODEL_ID_TO_USE = model_id  # cache the working model for next call
                    break  # success – exit loop
            except Exception as ex:
                last_error = ex
                logging.error(f"[AI] Error invoking model {model_id}: {ex}")
                continue  # try next candidate

        # If all models failed or returned empty, raise last error to trigger fallback
        if not description:
            raise RuntimeError(f"All Bedrock model attempts failed. Last error: {last_error}")

        logging.info(f"[AI] AI Generated description: '{description}' (len={len(description)})")
 
        # Clean up the description - extract just the main description line
        # Remove any preamble or explanation text
        lines = description.split('\n')
        clean_description = None
        
        for line in lines:
            line = line.strip()
            # Look for the actual description line (usually starts with a category or contains '-')
            if line and not line.lower().startswith(('based on', 'this description', 'here is', 'the following')):
                # Check if it looks like an expense description
                if any(cat in line for cat in ['Advertising', 'Office Expenses', 'Utilities', 'Professional', 'Contract', 'Travel', 'Meals', 'Other']) or '-' in line:
                    # Remove any markdown formatting
                    clean_description = line.strip('*').strip()
                    break
        
        # Use cleaned description if found, otherwise use original
        if clean_description:
            description = clean_description
            logging.info(f"[AI] Cleaned description: '{description}'")
        
        # Ensure description is not excessively long
        if len(description) > 120:
            description = description[:117] + "..."

        return description
        
    except Exception as e:
        logging.error(f"[AI] CRITICAL ERROR in AI description generation: {e}")
        logging.error(f"[AI] Exception type: {type(e).__name__}")
        import traceback
        logging.error(f"[AI] Full traceback: {traceback.format_exc()}")
        logging.info(f"[AI] Falling back to smart fallback description...")
        # Fallback to smart description
        fallback_desc = generate_smart_fallback_description(receipt_text, vendor, amount)
        logging.info(f"[AI] Fallback description: {fallback_desc}")
        return fallback_desc

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
    """Parser for Amazon receipts - now uses Gmail email prints"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Amazon receipt - redirect to Gmail parser for email prints"""
        logging.info("Amazon Receipt Parser - Redirecting to Gmail parser for email prints")
        
        # Use the Gmail parser since we're processing email prints
        gmail_parser = GmailReceiptParser('gmail-receipts', self.user_id, self.document_id)
        expenses = gmail_parser.parse_textract_output(textract_data)
        
        # Update the bank account to show these came through Amazon receipts category
        for expense in expenses:
            expense['bankAccount'] = 'amazon-receipts'
        
        return expenses


class GmailReceiptParser(BankStatementParser):
    """Parser for Gmail receipts (various types like Midjourney, Apple, etc.)"""
    
    def parse_textract_output(self, textract_data: Dict) -> List[Dict]:
        """Parse Gmail receipt format"""
        logging.info("\n========================================")
        logging.info(f"GMAIL RECEIPT PARSER - ENTRY POINT")
        logging.info("========================================")
        logging.info(f"Document ID: {self.document_id}")
        logging.info(f"User ID: {self.user_id}")
        
        expenses = []
        
        # Extract all text first
        full_text = []
        for block in textract_data.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                text = block.get('Text', '').strip()
                if text:
                    full_text.append(text)
        
        text_content = '\n'.join(full_text)
        
        logging.info(f"Gmail receipt - Processing {len(full_text)} lines")
        logging.info(f"Total text content length: {len(text_content)} characters")
        
        # Debug: Print first few lines to see structure
        logging.info("\n=== First 20 lines of Gmail receipt ===")
        for i, line in enumerate(full_text[:20]):
            logging.info(f"{i}: {line}")
        logging.info("=== End sample ===\n")
        
        # Detect receipt type and extract accordingly
        receipt_type = self._detect_receipt_type(text_content)
        logging.info(f"Detected receipt type: {receipt_type}")
        
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
        
        # Check if this is an Amazon email receipt
        is_amazon_email = ('amazon.com' in text_content.lower() and 
                          'order confirmation' in text_content.lower())
        
        if is_amazon_email:
            logging.info("Detected Amazon email receipt - looking for multiple orders")
            
            # Find all order sections by looking for "Order Total:" patterns
            order_sections = []
            current_section = []
            in_order_section = False
            
            for i, line in enumerate(lines):
                # Start a new section when we see "Order Confirmation" or similar
                if 'order confirmation' in line.lower() or 'order #' in line.lower():
                    if current_section and in_order_section:
                        order_sections.append(current_section)
                    current_section = [line]
                    in_order_section = True
                elif in_order_section:
                    current_section.append(line)
                    # End section after Order Total
                    if 'order total:' in line.lower() and i + 1 < len(lines):
                        # Include the amount line
                        current_section.append(lines[i + 1])
                        order_sections.append(current_section)
                        current_section = []
                        in_order_section = False
            
            # Don't forget the last section
            if current_section and in_order_section:
                order_sections.append(current_section)
            
            logging.info(f"Found {len(order_sections)} order sections in Amazon email")
            
            # Process each order section
            for section_num, section in enumerate(order_sections, 1):
                section_text = '\n'.join(section)
                logging.info(f"\nProcessing order section {section_num}:")
                logging.info(f"Section preview: {section_text[:200]}...")
                
                # Extract order details from this section
                amount = None
                order_number = None
                date = None
                description_parts = []
                
                # Look for order number
                for line in section:
                    if 'order #' in line.lower() or line.strip().startswith('114-'):
                        order_match = re.search(r'(114-\d+-\d+)', line)
                        if order_match:
                            order_number = order_match.group(1)
                            logging.info(f"Found order number: {order_number}")
                
                # Look for amount (after "Order Total:")
                for i, line in enumerate(section):
                    if 'order total:' in line.lower() and i + 1 < len(section):
                        amount_line = section[i + 1].strip()
                        amount_match = re.search(r'\$(\d+\.\d{2})', amount_line)
                        if amount_match:
                            amount = Decimal(amount_match.group(1))
                            logging.info(f"Found order total: ${amount}")
                
                # Look for product descriptions
                for i, line in enumerate(section):
                    # Skip metadata lines
                    if (line.strip() and 
                        not any(skip in line.lower() for skip in ['order total', 'order #', 'ship to', 
                                                                   'arriving', 'order confirmation',
                                                                   'mehdi', 'brooklyn', 'view or manage']) and
                        not line.strip().startswith('$') and
                        len(line.strip()) > 10):
                        # This might be a product description
                        if ('qty' in line.lower() or 
                            any(word in line.lower() for word in ['kit', 'pack', 'set', 'item', 'product']) or
                            '...' in line):  # Amazon truncates with ...
                            description_parts.append(line.strip())
                            logging.info(f"Found product description: {line.strip()}")
                        # Also check for product names that appear before Qty
                        elif i + 1 < len(section) and 'qty' in section[i + 1].lower():
                            description_parts.append(line.strip())
                            logging.info(f"Found product name before Qty: {line.strip()}")
                
                # Get date from email header if not found
                if not date:
                    date_match = re.search(r'([A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4})', text_content)
                    if date_match:
                        date_str = date_match.group(1)
                        date = self._parse_date_flexible(date_str)
                        logging.info(f"Using email date: {date}")
                
                if amount and order_number:
                    # Build description from parts
                    product_desc = ' & '.join(description_parts) if description_parts else f"Business Supplies"
                    
                    # Generate AI description
                    ai_description = generate_receipt_description(
                        f"Amazon.com email receipt\nOrder: {order_number}\nProducts: {product_desc}\nTotal: ${amount}",
                        vendor="Amazon.com",
                        amount=float(amount)
                    )
                    
                    expense = {
                        'expenseId': self.generate_expense_id(date or str(datetime.now().date()), 
                                                            str(amount), ai_description),
                        'userId': self.user_id,
                        'documentId': self.document_id,
                        'date': date or str(datetime.now().date()),
                        'description': ai_description,
                        'vendor': 'Amazon.com',
                        'amount': str(amount),
                        'category': 'office_expenses',  # Default for Amazon
                        'bankAccount': 'gmail-receipts',
                        'orderNumber': order_number,
                        'status': 'pending',
                        'confidence': 0.95,
                        'createdAt': datetime.utcnow().isoformat()
                    }
                    expenses.append(expense)
                    logging.info(f"Added Amazon order: {ai_description} - ${amount}")
                else:
                    logging.warning(f"Could not extract complete details from order section {section_num}")
            
            return expenses
        
        # Original generic receipt parsing for non-Amazon emails
        # Try to extract key information
        amount = None
        date = None
        description = None
        vendor = None
        
        # Special handling for Beatport receipts
        if 'beatport' in text_content.lower():
            vendor = "Beatport"
            logging.info("Detected Beatport receipt - looking for order total")
        
        # Look for amount - prioritize total amounts over individual items
        # First, try to find the FINAL total (after taxes/fees)
        final_amount_patterns = [
            r'(?:Grand\s+)?Total[:\s]+\$?(\d+\.\d{2})',  # Total: $X.XX or Grand Total: $X.XX
            r'Order\s+Total[:\s]+\$?(\d+\.\d{2})',       # Order Total: $X.XX
            r'Amount\s+(?:Paid|Charged|Due)[:\s]+\$?(\d+\.\d{2})',  # Amount Paid/Charged/Due
            r'Total\s+(?:Paid|Charged|Due)[:\s]+\$?(\d+\.\d{2})',   # Total Paid/Charged/Due
            r'(?:You\s+)?Paid[:\s]+\$?(\d+\.\d{2})',     # Paid: $X.XX or You Paid: $X.XX
            r'Charged[:\s]+\$?(\d+\.\d{2})',             # Charged: $X.XX
        ]
        
        # For receipts with multiple totals, we want the LAST one (usually after taxes)
        all_amounts = []
        for pattern in final_amount_patterns:
            for match in re.finditer(pattern, text_content, re.IGNORECASE):
                amount_value = Decimal(match.group(1))
                position = match.start()
                all_amounts.append((amount_value, position, match.group(0)))
                logging.info(f"Found potential total: {match.group(0)} = ${amount_value} at position {position}")
        
        # If we found total amounts, use the one that appears last in the document
        if all_amounts:
            # Sort by position (latest in document)
            all_amounts.sort(key=lambda x: x[1], reverse=True)
            amount = all_amounts[0][0]
            logging.info(f"Selected final total: ${amount} (appeared last in document)")
        else:
            # Fallback to generic amount patterns if no total found
            amount_patterns = [
                r'\$(\d+\.\d{2})',
                r'Total[:\s]+\$?(\d+\.\d{2})',
                r'Amount[:\s]+\$?(\d+\.\d{2})',
                r'Charged[:\s]+\$?(\d+\.\d{2})'
            ]
            
            # For generic patterns, also prefer amounts that appear later in the document
            for pattern in amount_patterns:
                matches = list(re.finditer(pattern, text_content, re.IGNORECASE))
                if matches:
                    # Use the last match (likely the total)
                    last_match = matches[-1]
                    amount = Decimal(last_match.group(1))
                    logging.info(f"Found amount using fallback pattern: ${amount}")
                    break
        
        if amount:
            print(f"Found amount: ${amount}")
        
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
        known_services = ['instacart', 'uber eats', 'doordash', 'grubhub', 'postmates', 'lyft', 'uber']
        for service in known_services:
            if service in text_lower:
                vendor = service.title().replace(' ', '')  # e.g., "Instacart", "UberEats", "Lyft"
                print(f"Found known service: {vendor}")
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
                            'pipo.sg': 'CapCut',  # PIPO (SG) PTE LTD is CapCut
                            'lyftmail.com': 'Lyft',
                            'uber.com': 'Uber',
                            'beatport.com': 'Beatport',
                            'beatport-em.com': 'Beatport',
                            'virtualdj.com': 'Virtual DJ',
                            'elevenlabs.io': 'Eleven Labs',
                            'midjourney.com': 'Midjourney',
                            'runway.ml': 'Runway',
                            'runwayml.com': 'Runway'
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
        
        # DEBUG: Print the full text content being sent to AI
        logging.info("\n[AI_CALL] ABOUT TO CALL AI DESCRIPTION GENERATION")
        logging.info("====================================================")
        logging.info(f"[AI_CALL] Text length: {len(text_content)} characters")
        logging.info(f"[AI_CALL] Vendor detected: {vendor}")
        logging.info(f"[AI_CALL] Amount detected: {amount}")
        logging.info(f"[AI_CALL] Is Meta receipt: {'meta' in text_content.lower() or 'facebook' in text_content.lower()}")
        logging.info("====================================================")
        
        # Generate intelligent description using Claude Sonnet
        logging.info("[AI_CALL] Calling generate_receipt_description() NOW...")
        description = generate_receipt_description(
            text_content, 
            vendor=vendor,
            amount=float(amount) if amount else None
        )
        
        logging.info(f"[AI_CALL] RETURNED FROM AI: '{description}'")
        
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
            logging.info(f"Added generic expense: {description} - ${amount} on {date}")
        
        return expenses
    
    def _parse_date_flexible(self, date_str: str) -> Optional[str]:
        """Parse date from various formats"""
        # Clean up the date string first
        # Handle "Wed, Dec 25, 2024 at 4:38 AM" format
        if ' at ' in date_str:
            date_str = date_str.split(' at ')[0]  # Remove time portion
        
        # Remove day of week if present (e.g., "Wed, ")
        if ',' in date_str and len(date_str.split(',')) > 2:
            parts = date_str.split(',', 1)
            if len(parts[0]) <= 4:  # Likely a day abbreviation
                date_str = parts[1].strip()
        
        # Try different date formats
        formats = [
            '%B %d, %Y',      # December 25, 2024
            '%b %d, %Y',      # Dec 25, 2024
            '%m/%d/%Y',       # 12/25/2024
            '%d/%m/%Y',       # 25/12/2024 (European)
            '%Y-%m-%d',       # 2024-12-25
            '%d-%m-%Y',       # 25-12-2024
            '%m-%d-%Y'        # 12-25-2024
        ]
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(date_str.strip(), fmt)
                return date_obj.strftime('%Y-%m-%d')
            except:
                continue
        
        logging.warning(f"Could not parse date: '{date_str}'")
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