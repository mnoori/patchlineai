from flask import Flask, request, jsonify
import sys
import os
from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler
from waitress import serve

# --- Setup Logging ---
log_file_path = Path(__file__).parent / 'expense-processor.log'
# Clear log file for a clean debugging session
if log_file_path.exists():
    try:
        os.remove(log_file_path)
    except OSError as e:
        print(f"Error removing log file: {e}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler(log_file_path, encoding='utf-8'),
        logging.StreamHandler(sys.stdout) # Keep logging to console as well
    ]
)
# --- End Logging Setup ---

# Load environment variables from .env.local if it exists
def load_env_file():
    """Load environment variables from .env.local file"""
    # Try multiple possible locations for .env.local
    possible_paths = [
        Path(__file__).parent.parent.parent / '.env.local',  # Project root
        Path(__file__).parent.parent / '.env.local',         # Backend folder
        Path.cwd() / '.env.local'                            # Current directory
    ]
    
    for env_path in possible_paths:
        if env_path.exists():
            logging.info(f"Loading environment variables from: {env_path}")
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Remove quotes if present
                        value = value.strip().strip('"').strip("'")
                        os.environ[key.strip()] = value
            # Check for credentials with fallback logic
            aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID') or os.environ.get('ACCESS_KEY_ID')
            aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY') or os.environ.get('SECRET_ACCESS_KEY')
            
            if aws_access_key and aws_secret_key:
                credential_source = 'AWS_ACCESS_KEY_ID' if os.environ.get('AWS_ACCESS_KEY_ID') else 'ACCESS_KEY_ID'
                logging.info(f"[SUCCESS] Loaded AWS credentials: {credential_source}={'*' * 10}")
                logging.info(f"[SUCCESS] Secret key found: {'*' * 10}")
            else:
                logging.warning(f"[FAILURE] AWS credentials NOT FOUND:")
                logging.warning(f"   AWS_ACCESS_KEY_ID: {'Found' if os.environ.get('AWS_ACCESS_KEY_ID') else 'NOT FOUND'}")
                logging.warning(f"   ACCESS_KEY_ID: {'Found' if os.environ.get('ACCESS_KEY_ID') else 'NOT FOUND'}")
                logging.warning(f"   AWS_SECRET_ACCESS_KEY: {'Found' if os.environ.get('AWS_SECRET_ACCESS_KEY') else 'NOT FOUND'}")
                logging.warning(f"   SECRET_ACCESS_KEY: {'Found' if os.environ.get('SECRET_ACCESS_KEY') else 'NOT FOUND'}")
            return
    
    logging.warning("Warning: No .env.local file found. AWS credentials may not be available.")
    logging.warning(f"Checked paths: {[str(p) for p in possible_paths]}")

# Load environment variables before importing expense processor
load_env_file()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from the lambda directory using a different approach
expense_processor_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'lambda')
sys.path.append(expense_processor_path)

# Import the module with hyphen in filename
import importlib.util
spec = importlib.util.spec_from_file_location("expense_processor", os.path.join(expense_processor_path, "expense-processor.py"))
expense_processor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(expense_processor)
get_parser = expense_processor.get_parser

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_expenses():
    try:
        logging.info("\n========================================")
        logging.info(f"EXPENSE PROCESSOR SERVER - NEW REQUEST")
        logging.info("========================================")
        
        data = request.json
        user_id = data.get('userId', 'default-user')
        document_id = data.get('documentId')
        bank_type = data.get('bankType', 'unknown')
        textract_data = data.get('textractData', {})
        
        logging.info(f"Request Details:")
        logging.info(f"   User ID: {user_id}")
        logging.info(f"   Document ID: {document_id}")
        logging.info(f"   Bank Type: {bank_type}")
        logging.info(f"   Textract Blocks: {len(textract_data.get('Blocks', []))}")
        logging.info(f"   Text Length: {len(textract_data.get('text', ''))}")
        
        if bank_type == 'gmail-receipts':
            logging.info(f"GMAIL RECEIPTS DETECTED - This should trigger AI description generation")
            
        logging.info(f"Starting expense parsing...")
        
        # Get the appropriate parser
        parser = get_parser(bank_type, user_id, document_id)
        
        # Ensure textract_data has Blocks list if parser expects it
        if 'Blocks' not in textract_data:
            synthetic_blocks = []
            # create minimal LINE blocks from text for backwards-compat
            if 'text' in textract_data:
                for idx,line in enumerate(textract_data['text'].split('\n')):
                    if line.strip():
                        synthetic_blocks.append({
                            'BlockType':'LINE',
                            'Text':line.strip(),
                            'Id':f'line_{idx}'
                        })
            # create synthetic TABLE blocks structure if tables present
            if 'tables' in textract_data:
                for tIdx,table in enumerate(textract_data['tables']):
                    table_block = {
                        'BlockType':'TABLE',
                        'Id':f'table_{tIdx}',
                        'Relationships': []
                    }
                    # not fully reconstructing cells; parser may not need it
                    synthetic_blocks.append(table_block)
            textract_data['Blocks'] = synthetic_blocks
        
        logging.info(f"Calling parser.parse_textract_output()...")
        expenses = parser.parse_textract_output(textract_data)
        
        logging.info(f"Parser completed!")
        logging.info(f"Extracted {len(expenses)} expenses")
        
        # Log each expense description to see what was generated
        for i, expense in enumerate(expenses):
            logging.info(f"   Expense {i+1}: {expense.get('description', 'NO DESCRIPTION')}")
            logging.info(f"   Amount: ${expense.get('amount', 'N/A')}")
            logging.info(f"   Vendor: {expense.get('vendor', 'N/A')}")
            logging.info("")
        
        logging.info(f"Returning response to TypeScript layer...")
        
        # Return expenses without saving to DynamoDB (that's handled by the TypeScript code)
        return jsonify({
            'success': True,
            'expensesExtracted': len(expenses),
            'expensesSaved': len(expenses),
            'expenses': expenses
        })
        
    except Exception as e:
        import traceback
        logging.error(f"Error processing expenses: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'expense-processor'})

if __name__ == '__main__':
    logging.info("Starting expense processor server on port 8000 with Waitress...")
    serve(app, host='127.0.0.1', port=8000) 