#!/usr/bin/env python3
"""
Centralized configuration for Patchline Bedrock Agent
"""

# AWS Configuration
DEFAULT_REGION = 'us-east-1'

# Bedrock Models Configuration
BEDROCK_MODELS = {
    'nova-micro': {
        'id': 'amazon.nova-micro-v1:0',
        'name': 'Amazon Nova Micro',
        'description': 'Fast, lightweight model (free tier eligible)',
        'cost': 'low',
        'speed': 'fast'
    },
    'nova-premier': {
        'id': 'amazon.nova-premier-v1:0', 
        'name': 'Amazon Nova Premier',
        'description': 'Improved quality Nova model',
        'cost': 'medium',
        'speed': 'medium'
    },
    'claude-haiku': {
        'id': 'anthropic.claude-3-5-haiku-20241022-v1:0',
        'name': 'Claude 3.5 Haiku',
        'description': 'Fast Claude model with good quality',
        'cost': 'medium',
        'speed': 'fast'
    },
    'claude-sonnet': {
        'id': 'anthropic.claude-3-sonnet-20240229-v1:0',
        'name': 'Claude 3 Sonnet',
        'description': 'High quality model, higher cost',
        'cost': 'high',
        'speed': 'medium'
    },
    'claude-sonnet-new': {
        'id': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
        'name': 'Claude 3.7 Sonnet',
        'description': 'Premium quality model, highest cost',
        'cost': 'highest',
        'speed': 'medium'
    }
}

# Default model for Bedrock Agent
DEFAULT_FOUNDATION_MODEL = BEDROCK_MODELS['nova-micro']['id']

# Agent Configuration
AGENT_CONFIG = {
    'name': 'PatchlineEmailAgent',
    'description': 'AI assistant for managing emails and communications',
    'foundation_model': DEFAULT_FOUNDATION_MODEL,
    'action_group_name': 'GmailActions',
    'knowledge_base_name': 'PatchlineEmailKnowledge',
    'idle_session_ttl': 900  # 15 minutes
}

# S3 Configuration
S3_CONFIG = {
    'schema_bucket': 'patchline-agent-schemas',
    'knowledge_base_bucket': 'patchline-email-knowledge-base'
}

# DynamoDB Configuration
DYNAMODB_CONFIG = {
    'oauth_table': 'patchline-gmail-oauth'
}

# Secrets Manager Configuration
SECRETS_CONFIG = {
    'gmail_oauth': 'patchline/gmail-oauth'
}

# Lambda Configuration
LAMBDA_CONFIG = {
    'runtime': 'python3.11',
    'timeout': 300,
    'memory': 512,
    'functions': {
        'gmail_auth': 'gmail-auth-handler',
        'gmail_action': 'gmail-action-handler'
    }
}

def get_model_by_name(model_name: str) -> dict:
    """Get model configuration by name"""
    if model_name in BEDROCK_MODELS:
        return BEDROCK_MODELS[model_name]
    raise ValueError(f"Unknown model: {model_name}. Available: {list(BEDROCK_MODELS.keys())}")

def get_model_id(model_name: str) -> str:
    """Get model ID by name"""
    return get_model_by_name(model_name)['id']

def list_available_models() -> list:
    """List all available models"""
    return [
        {
            'name': name,
            **config
        }
        for name, config in BEDROCK_MODELS.items()
    ] 