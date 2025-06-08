#!/usr/bin/env python3
"""Patchline Legal Contract Analysis Lambda
Analyzes music industry contracts and provides detailed assessments.
"""
import json
import os
import re

def lambda_handler(event, context):
    """Handle contract analysis requests from Bedrock Agent"""
    print("[DEBUG] Incoming event:", json.dumps(event)[:500])
    
    # Get region from environment
    region = os.environ.get('PATCHLINE_AWS_REGION', 'us-east-1')
    
    # Parse the request from Bedrock
    try:
        # Bedrock sends action details in a specific format
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        parameters = event.get('parameters', [])
        request_body = event.get('requestBody', {})
        
        # Extract contract text and context
        contract_text = ""
        user_context = ""
        
        # Try to get from request body first
        if request_body and 'content' in request_body:
            content = request_body['content'].get('application/json', {})
            if 'body' in content:
                body_str = content['body']
                if isinstance(body_str, str):
                    body = json.loads(body_str)
                else:
                    body = body_str
                contract_text = body.get('contractText', '')
                user_context = body.get('context', '')
        
        # Fallback to parameters
        if not contract_text:
            for param in parameters:
                if param.get('name') == 'contractText':
                    contract_text = param.get('value', '')
                elif param.get('name') == 'context':
                    user_context = param.get('value', '')
        
        # Analyze the contract
        analysis = analyze_contract(contract_text, user_context)
        
        # Return Bedrock-formatted response
        response_body = {
            "application/json": {
                "body": json.dumps(analysis)
            }
        }
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": action_group,
                "apiPath": api_path,
                "httpMethod": http_method,
                "httpStatusCode": 200,
                "responseBody": response_body
            }
        }
        
    except Exception as e:
        print(f"[ERROR] Exception in handler: {str(e)}")
        error_response = {
            "summary": "Error analyzing contract",
            "risks": [f"Technical error: {str(e)}"],
            "recommendation": "Please try again or contact support."
        }
        
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": action_group,
                "apiPath": api_path,
                "httpMethod": http_method,
                "httpStatusCode": 500,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps(error_response)
                    }
                }
            }
        }

def analyze_contract(contract_text, context=""):
    """Analyze a music industry contract for key terms and risks"""
    
    # Basic contract analysis logic
    risks = []
    recommendations = []
    key_terms = {}
    
    # Convert to lowercase for analysis
    text_lower = contract_text.lower()
    
    # Check for royalty terms
    if "royalty" in text_lower or "royalties" in text_lower:
        # Look for percentage
        royalty_match = re.search(r'(\d+)%?\s*(?:percent|royalty|royalties)', text_lower)
        if royalty_match:
            key_terms['royalty_rate'] = f"{royalty_match.group(1)}%"
        else:
            risks.append("Royalty percentage not clearly specified")
    else:
        risks.append("No royalty terms found in the contract")
    
    # Check for territory
    if "territory" not in text_lower and "worldwide" not in text_lower:
        risks.append("Territory/geographic scope not specified")
    
    # Check for term duration
    if "term" in text_lower:
        # Look for years
        term_match = re.search(r'(\d+)\s*years?', text_lower)
        if term_match:
            key_terms['term_duration'] = f"{term_match.group(1)} years"
    else:
        risks.append("Contract term/duration not specified")
    
    # Check for exclusivity
    if "exclusive" in text_lower:
        key_terms['exclusivity'] = "Exclusive agreement"
        risks.append("This appears to be an exclusive agreement - ensure this aligns with your other commitments")
    
    # Check for payment terms
    payment_match = re.search(r'\$\s*(\d+(?:,\d+)*(?:\.\d+)?)', contract_text)
    if payment_match:
        key_terms['payment'] = f"${payment_match.group(1)}"
    
    # Check for number of performances/deliverables
    show_match = re.search(r'(\d+)\s*(?:shows?|performances?|concerts?)', text_lower)
    if show_match:
        key_terms['performances'] = f"{show_match.group(1)} performances"
    
    # Generate summary
    summary = "Contract Analysis Summary:\n"
    if key_terms:
        summary += "Key Terms Identified:\n"
        for key, value in key_terms.items():
            summary += f"- {key.replace('_', ' ').title()}: {value}\n"
    
    # Add context-specific analysis
    if "50/50" in contract_text or "50%" in text_lower:
        summary += "\nThis appears to be a 50/50 revenue split agreement."
        recommendations.append("Ensure all revenue streams are clearly defined for the 50/50 split")
    
    # Generate recommendations
    if not risks:
        recommendations.append("Contract appears to have basic terms covered")
    else:
        recommendations.append("Several important terms need clarification")
    
    recommendations.append("Always have a qualified music attorney review any contract before signing")
    
    return {
        "summary": summary.strip(),
        "risks": risks if risks else ["No major risks identified in this basic analysis"],
        "recommendation": ". ".join(recommendations)
    } 