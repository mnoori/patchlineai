#!/usr/bin/env python3
"""
Patchline Blockchain Action Handler
Secure Lambda function for handling Solana blockchain operations
"""

import json
import os
import logging
import boto3
import requests
from decimal import Decimal
from typing import Dict, List, Any, Optional
from datetime import datetime
import base58
import hashlib

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
SOLANA_COINBASE_ADDRESS = os.environ.get('SOLANA_COINBASE_ADDRESS')
HELIUS_RPC_URL = os.environ.get('RPC_URL', 'https://api.mainnet-beta.solana.com')
SOLANA_CLUSTER = os.environ.get('SOLANA_CLUSTER', 'mainnet-beta')
COINGECKO_API_KEY = os.environ.get('COINGECKO_API_KEY')

# Security limits
MAX_TRANSACTION_AMOUNT = Decimal('10.0')  # 10 SOL max per transaction
MIN_TRANSACTION_AMOUNT = Decimal('0.001')  # 0.001 SOL minimum

# DynamoDB for transaction logging
dynamodb = boto3.resource('dynamodb')
TRANSACTION_LOG_TABLE = os.environ.get('BLOCKCHAIN_TRANSACTION_LOG_TABLE', 'BlockchainTransactionLog')

def lambda_handler(event, context):
    """Main Lambda handler for Blockchain Agent actions"""
    try:
        logger.info(f"[BLOCKCHAIN] Event: {json.dumps(event)}")
        
        # Extract action details
        action_group = event.get('actionGroup', '')
        api_path = event.get('apiPath', '')
        http_method = event.get('httpMethod', '')
        request_body = event.get('requestBody', {})
        
        # Extract user ID
        user_id = extract_user_id(event)
        if not user_id:
            return create_response(400, {'error': 'User ID not found'}, api_path, http_method)
        
        logger.info(f"[BLOCKCHAIN] Action: {api_path} | Method: {http_method} | User: {user_id}")
        
        # Route to appropriate handler
        if api_path == '/send-sol-payment' and http_method == 'POST':
            return handle_send_sol_payment(user_id, request_body)
        elif api_path == '/check-wallet-balance' and http_method == 'POST':
            return handle_check_wallet_balance(user_id, request_body)
        elif api_path == '/validate-wallet-address' and http_method == 'POST':
            return handle_validate_wallet_address(user_id, request_body)
        elif api_path == '/get-transaction-history' and http_method == 'POST':
            return handle_get_transaction_history(user_id, request_body)
        elif api_path == '/get-network-status' and http_method == 'GET':
            return handle_get_network_status(user_id)
        elif api_path == '/calculate-transaction-fees' and http_method == 'POST':
            return handle_calculate_transaction_fees(user_id, request_body)
        else:
            logger.error(f"[BLOCKCHAIN] Action not found: {api_path} {http_method}")
            return create_response(404, {'error': 'Action not found'}, api_path, http_method)
            
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Lambda handler error: {str(e)}")
        return create_response(500, {'error': str(e)}, api_path or '/unknown', http_method or 'POST')

def extract_user_id(event) -> Optional[str]:
    """Extract user ID from the event"""
    # Try multiple locations for user ID
    user_id = None
    
    # Check session attributes
    session_attributes = event.get('sessionAttributes', {})
    if 'userId' in session_attributes:
        user_id = session_attributes['userId']
    
    # Check agent info
    agent_info = event.get('agent', {})
    if 'userId' in agent_info:
        user_id = agent_info['userId']
    
    # Check parameters
    parameters = event.get('parameters', [])
    for param in parameters:
        if param.get('name') == 'userId':
            user_id = param.get('value')
            break
    
    return user_id

def handle_send_sol_payment(user_id: str, request_body: Dict) -> Dict:
    """Handle SOL payment requests with enhanced security"""
    try:
        # Parse request body
        body = parse_request_body(request_body)
        
        recipient_address = body.get('recipient_address', '').strip()
        amount_sol = body.get('amount_sol', '0')
        memo = body.get('memo', '')
        
        # Handle "coinbase" keyword
        if recipient_address.lower() in ['coinbase', 'my coinbase', 'coinbase address']:
            if not SOLANA_COINBASE_ADDRESS:
                return create_response(400, {
                    'error': 'Coinbase address not configured',
                    'message': 'SOLANA_COINBASE_ADDRESS environment variable not set'
                }, '/send-sol-payment', 'POST')
            recipient_address = SOLANA_COINBASE_ADDRESS
            memo = memo or 'Transfer to Coinbase'
        
        # Validate inputs
        validation_result = validate_transaction_inputs(recipient_address, amount_sol)
        if not validation_result['valid']:
            return create_response(400, {
                'error': 'Invalid transaction parameters',
                'details': validation_result['errors']
            }, '/send-sol-payment', 'POST')
        
        amount_decimal = Decimal(str(amount_sol))
        
        # Get current SOL price for USD conversion
        sol_price_usd = get_sol_price()
        amount_usd = float(amount_decimal * Decimal(str(sol_price_usd)))
        
        # Log transaction attempt
        log_transaction(user_id, 'PAYMENT_INITIATED', {
            'recipient': recipient_address,
            'amount_sol': str(amount_decimal),
            'amount_usd': amount_usd,
            'memo': memo
        })
        
        # Return transaction preparation data (actual signing happens in frontend)
        response_data = {
            'action': 'prepare_transaction',
            'transaction_data': {
                'recipient': recipient_address,
                'amount_sol': str(amount_decimal),
                'amount_usd': round(amount_usd, 2),
                'memo': memo,
                'estimated_fee_sol': '0.000005',
                'estimated_fee_usd': round(0.000005 * sol_price_usd, 4),
                'sol_price': sol_price_usd
            },
            'security_checks': {
                'address_valid': True,
                'amount_within_limits': True,
                'sufficient_balance_check_required': True
            },
            'confirmation_message': f"""
TRANSACTION REVIEW:
- Recipient: {recipient_address[:8]}...{recipient_address[-8:]} {('(Coinbase Address)' if recipient_address == SOLANA_COINBASE_ADDRESS else '')}
- Amount: {amount_decimal} SOL (~${amount_usd:.2f} USD)
- Network Fee: ~0.000005 SOL (~${0.000005 * sol_price_usd:.4f} USD)
- Purpose: {memo or 'SOL Transfer'}

WARNING: Please confirm you want to proceed with this transaction.
Click "CONFIRM" to execute or "CANCEL" to abort.
"""
        }
        
        return create_response(200, response_data, '/send-sol-payment', 'POST')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Send payment error: {str(e)}")
        log_transaction(user_id, 'PAYMENT_ERROR', {'error': str(e)})
        return create_response(500, {'error': f'Payment processing failed: {str(e)}'}, '/send-sol-payment', 'POST')

def handle_check_wallet_balance(user_id: str, request_body: Dict) -> Dict:
    """Check wallet balance via existing balance API"""
    try:
        body = parse_request_body(request_body)
        wallet_address = body.get('wallet_address', '').strip()
        
        if not wallet_address:
            return create_response(400, {'error': 'Wallet address required'}, '/check-wallet-balance', 'POST')
        
        # Validate address
        if not is_valid_solana_address(wallet_address):
            return create_response(400, {'error': 'Invalid Solana address format'}, '/check-wallet-balance', 'POST')
        
        # Get balance using existing infrastructure
        balance_data = get_wallet_balance(wallet_address)
        
        response_data = {
            'wallet_address': wallet_address,
            'balance_sol': balance_data.get('balance', '0'),
            'balance_usd': balance_data.get('balanceUSD', '0'),
            'sol_price': balance_data.get('solPrice', 0),
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        log_transaction(user_id, 'BALANCE_CHECK', {'wallet': wallet_address, 'balance': balance_data.get('balance', '0')})
        
        return create_response(200, response_data, '/check-wallet-balance', 'POST')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Balance check error: {str(e)}")
        return create_response(500, {'error': f'Balance check failed: {str(e)}'}, '/check-wallet-balance', 'POST')

def handle_validate_wallet_address(user_id: str, request_body: Dict) -> Dict:
    """Validate Solana wallet address"""
    try:
        body = parse_request_body(request_body)
        address = body.get('address', '').strip()
        
        if not address:
            return create_response(400, {'error': 'Address required'}, '/validate-wallet-address', 'POST')
        
        is_valid = is_valid_solana_address(address)
        address_type = 'unknown'
        
        if is_valid:
            if address == SOLANA_COINBASE_ADDRESS:
                address_type = 'coinbase'
            else:
                address_type = 'standard'
        
        response_data = {
            'address': address,
            'is_valid': is_valid,
            'address_type': address_type,
            'validation_timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return create_response(200, response_data, '/validate-wallet-address', 'POST')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Address validation error: {str(e)}")
        return create_response(500, {'error': f'Address validation failed: {str(e)}'}, '/validate-wallet-address', 'POST')

def handle_get_transaction_history(user_id: str, request_body: Dict) -> Dict:
    """Get transaction history for a wallet"""
    try:
        body = parse_request_body(request_body)
        wallet_address = body.get('wallet_address', '').strip()
        limit = int(body.get('limit', 10))
        
        if not wallet_address:
            return create_response(400, {'error': 'Wallet address required'}, '/get-transaction-history', 'POST')
        
        if not is_valid_solana_address(wallet_address):
            return create_response(400, {'error': 'Invalid Solana address'}, '/get-transaction-history', 'POST')
        
        # Get transaction history using Solana RPC
        transactions = get_transaction_history(wallet_address, limit)
        
        response_data = {
            'wallet_address': wallet_address,
            'transactions': transactions,
            'count': len(transactions),
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        return create_response(200, response_data, '/get-transaction-history', 'POST')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Transaction history error: {str(e)}")
        return create_response(500, {'error': f'Transaction history failed: {str(e)}'}, '/get-transaction-history', 'POST')

def handle_get_network_status(user_id: str) -> Dict:
    """Get Solana network status"""
    try:
        # Get network health and fee information
        network_status = get_solana_network_status()
        
        response_data = {
            'network': SOLANA_CLUSTER,
            'rpc_endpoint': HELIUS_RPC_URL,
            'status': network_status,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return create_response(200, response_data, '/get-network-status', 'GET')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Network status error: {str(e)}")
        return create_response(500, {'error': f'Network status check failed: {str(e)}'}, '/get-network-status', 'GET')

def handle_calculate_transaction_fees(user_id: str, request_body: Dict) -> Dict:
    """Calculate transaction fees"""
    try:
        body = parse_request_body(request_body)
        transaction_type = body.get('transaction_type', 'standard')
        priority_level = body.get('priority_level', 'medium')
        
        # Calculate fees based on current network conditions
        fees = calculate_transaction_fees(transaction_type, priority_level)
        sol_price = get_sol_price()
        
        response_data = {
            'transaction_type': transaction_type,
            'priority_level': priority_level,
            'fee_sol': fees['fee_sol'],
            'fee_usd': round(float(fees['fee_sol']) * sol_price, 6),
            'estimated_confirmation_time': fees['confirmation_time'],
            'sol_price': sol_price,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        return create_response(200, response_data, '/calculate-transaction-fees', 'POST')
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Fee calculation error: {str(e)}")
        return create_response(500, {'error': f'Fee calculation failed: {str(e)}'}, '/calculate-transaction-fees', 'POST')

# Helper Functions

def parse_request_body(request_body: Dict) -> Dict:
    """Parse request body from Bedrock Agent format"""
    content = request_body.get('content', {})
    if 'application/json' in content:
        body_str = content['application/json'].get('body', '{}')
        if isinstance(body_str, str):
            return json.loads(body_str)
        return body_str
    return {}

def validate_transaction_inputs(recipient_address: str, amount_sol: str) -> Dict:
    """Validate transaction inputs with security checks"""
    errors = []
    
    # Validate recipient address
    if not recipient_address:
        errors.append('Recipient address is required')
    elif not is_valid_solana_address(recipient_address):
        errors.append('Invalid Solana address format')
    
    # Validate amount
    try:
        amount_decimal = Decimal(str(amount_sol))
        if amount_decimal <= 0:
            errors.append('Amount must be greater than 0')
        elif amount_decimal < MIN_TRANSACTION_AMOUNT:
            errors.append(f'Amount must be at least {MIN_TRANSACTION_AMOUNT} SOL')
        elif amount_decimal > MAX_TRANSACTION_AMOUNT:
            errors.append(f'Amount exceeds maximum limit of {MAX_TRANSACTION_AMOUNT} SOL')
    except (ValueError, TypeError):
        errors.append('Invalid amount format')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def is_valid_solana_address(address: str) -> bool:
    """Validate Solana address format"""
    try:
        if len(address) < 32 or len(address) > 44:
            return False
        
        # Try to decode as base58
        decoded = base58.b58decode(address)
        return len(decoded) == 32
    except:
        return False

def get_sol_price() -> float:
    """Get current SOL price from CoinGecko"""
    try:
        headers = {}
        if COINGECKO_API_KEY:
            headers['x-cg-demo-api-key'] = COINGECKO_API_KEY
        
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data['solana']['usd']
    except Exception as e:
        logger.warning(f"[BLOCKCHAIN] Failed to get SOL price: {str(e)}")
        return 175.0  # Fallback price

def get_wallet_balance(wallet_address: str) -> Dict:
    """Get wallet balance using Solana RPC"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [wallet_address]
        }
        
        response = requests.post(HELIUS_RPC_URL, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if 'result' in data:
            balance_lamports = data['result']['value']
            balance_sol = balance_lamports / 1_000_000_000  # Convert lamports to SOL
            sol_price = get_sol_price()
            balance_usd = balance_sol * sol_price
            
            return {
                'balance': str(balance_sol),
                'balanceUSD': str(round(balance_usd, 2)),
                'solPrice': sol_price
            }
        else:
            raise Exception(f"RPC error: {data.get('error', 'Unknown error')}")
            
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Balance fetch error: {str(e)}")
        raise

def get_transaction_history(wallet_address: str, limit: int) -> List[Dict]:
    """Get transaction history for a wallet"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignaturesForAddress",
            "params": [wallet_address, {"limit": limit}]
        }
        
        response = requests.post(HELIUS_RPC_URL, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if 'result' in data:
            transactions = []
            for tx in data['result']:
                transactions.append({
                    'signature': tx['signature'],
                    'slot': tx['slot'],
                    'block_time': tx.get('blockTime'),
                    'status': 'success' if not tx.get('err') else 'failed',
                    'memo': tx.get('memo', '')
                })
            return transactions
        else:
            raise Exception(f"RPC error: {data.get('error', 'Unknown error')}")
            
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Transaction history error: {str(e)}")
        return []

def get_solana_network_status() -> Dict:
    """Get Solana network status"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getHealth"
        }
        
        response = requests.post(HELIUS_RPC_URL, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            'healthy': 'result' in data and data['result'] == 'ok',
            'rpc_response_time_ms': response.elapsed.total_seconds() * 1000
        }
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Network status error: {str(e)}")
        return {'healthy': False, 'error': str(e)}

def calculate_transaction_fees(transaction_type: str, priority_level: str) -> Dict:
    """Calculate transaction fees based on type and priority"""
    base_fee = 0.000005  # 5000 lamports
    
    priority_multipliers = {
        'low': 1.0,
        'medium': 1.2,
        'high': 1.5,
        'urgent': 2.0
    }
    
    confirmation_times = {
        'low': '30-60 seconds',
        'medium': '15-30 seconds',
        'high': '5-15 seconds',
        'urgent': '1-5 seconds'
    }
    
    multiplier = priority_multipliers.get(priority_level, 1.0)
    fee_sol = base_fee * multiplier
    
    return {
        'fee_sol': str(fee_sol),
        'confirmation_time': confirmation_times.get(priority_level, '15-30 seconds')
    }

def log_transaction(user_id: str, action: str, data: Dict):
    """Log transaction to DynamoDB for audit purposes"""
    try:
        table = dynamodb.Table(TRANSACTION_LOG_TABLE)
        
        item = {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'data': json.dumps(data, default=str),
            'ttl': int((datetime.utcnow().timestamp() + (30 * 24 * 60 * 60)))  # 30 days TTL
        }
        
        table.put_item(Item=item)
        logger.info(f"[BLOCKCHAIN] Logged transaction: {action} for user {user_id}")
        
    except Exception as e:
        logger.error(f"[BLOCKCHAIN] Failed to log transaction: {str(e)}")

def create_response(status_code: int, body: Dict, api_path: str, http_method: str = 'POST') -> Dict:
    """Create response for Bedrock Agent"""
    return {
        'messageVersion': '1.0',
        'response': {
            'actionGroup': 'BlockchainActions',
            'apiPath': api_path,
            'httpMethod': http_method,
            'httpStatusCode': status_code,
            'responseBody': {
                'application/json': {
                    'body': json.dumps(body)
                }
            }
        }
    } 