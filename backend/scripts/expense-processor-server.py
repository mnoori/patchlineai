from flask import Flask, request, jsonify
import sys
import os
from pathlib import Path

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
            print(f"Loading environment variables from: {env_path}")
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Remove quotes if present
                        value = value.strip().strip('"').strip("'")
                        os.environ[key.strip()] = value
            print(f"Loaded AWS credentials: AWS_ACCESS_KEY_ID={'*' * 10 if os.environ.get('AWS_ACCESS_KEY_ID') else 'NOT FOUND'}")
            return
    
    print("Warning: No .env.local file found. AWS credentials may not be available.")
    print("Checked paths:", [str(p) for p in possible_paths])

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
        data = request.json
        user_id = data.get('userId', 'default-user')
        document_id = data.get('documentId')
        bank_type = data.get('bankType', 'unknown')
        textract_data = data.get('textractData', {})
        
        print(f"Processing expenses for document {document_id}")
        print(f"Bank type: {bank_type}")
        print(f"Textract blocks: {len(textract_data.get('Blocks', []))}")
        
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
        
        expenses = parser.parse_textract_output(textract_data)
        
        print(f"Extracted {len(expenses)} expenses")
        
        # Return expenses without saving to DynamoDB (that's handled by the TypeScript code)
        return jsonify({
            'success': True,
            'expensesExtracted': len(expenses),
            'expensesSaved': len(expenses),
            'expenses': expenses
        })
        
    except Exception as e:
        import traceback
        print(f"Error processing expenses: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'expense-processor'})

if __name__ == '__main__':
    print("Starting expense processor server on port 8000...")
    app.run(port=8000, debug=True) 