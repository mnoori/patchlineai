import json

# Sample BofA table structure from Textract
sample_bofa_table = {
    "rows": [
        {
            "cells": [
                {"text": "07/01"},
                {"text": "07/01"}, 
                {"text": "ELECTRONIC PAYMENT"},
                {"text": "500.00"},
                {"text": "6,123.45"}
            ]
        },
        {
            "cells": [
                {"text": "07/02"},
                {"text": "07/02"},
                {"text": "AMAZON MARKETPLACE"},
                {"text": "123.45"},
                {"text": "5,999.00"}
            ]
        },
        {
            "cells": [
                {"text": "07/05"},
                {"text": "07/05"},
                {"text": "WHOLE FOODS MARKET"},
                {"text": "89.23"},
                {"text": "5,909.77"}
            ]
        }
    ]
}

def test_bofa_extraction():
    print("Testing BofA extraction logic...")
    
    # Test date pattern
    import re
    date_pattern = re.compile(r'^\d{2}\/\d{2}$')
    
    for row in sample_bofa_table["rows"]:
        cells = [c["text"] for c in row["cells"]]
        print(f"\nRow: {cells}")
        
        # Check if first cell is a date
        if date_pattern.match(cells[0]):
            print(f"  Date found: {cells[0]}")
            
            # Description is usually at index 2 (after two date columns)
            desc_index = 2 if date_pattern.match(cells[1]) else 1
            description = cells[desc_index] if desc_index < len(cells) else ""
            print(f"  Description: {description}")
            
            # Amount is usually second to last (before balance)
            if len(cells) >= 4:
                amount = cells[-2]  # Second to last
                print(f"  Amount: {amount}")
                
                # Parse amount
                amount_value = float(amount.replace(",", "").replace("$", ""))
                print(f"  Parsed amount: ${amount_value}")

if __name__ == "__main__":
    test_bofa_extraction()
    
    print("\n\nExpected output for BofA statement:")
    print("- Date column at index 0")
    print("- Posting date at index 1") 
    print("- Description at index 2")
    print("- Amount at index 3")
    print("- Balance at index 4") 