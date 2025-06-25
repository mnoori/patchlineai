from flask import Flask, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lambda.expense_processor import get_parser

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_expenses():
    try:
        data = request.json
        user_id = data.get('userId')
        document_id = data.get('documentId')
        bank_type = data.get('bankType', 'unknown')
        textract_data = data.get('textractData')
        
        # Get the appropriate parser
        parser = get_parser(bank_type, user_id, document_id)
        
        # Parse expenses
        expenses = parser.parse_textract_output(textract_data)
        
        print(f"Extracted {len(expenses)} expenses")
        
        return jsonify({
            'success': True,
            'expensesExtracted': len(expenses),
            'expensesSaved': len(expenses),
            'expenses': expenses
        })
        
    except Exception as e:
        print(f"Error processing expenses: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True) 