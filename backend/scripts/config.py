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
        'speed': 'fast',
        'inference_profile': None  # Direct model access works
    },
    'nova-premier': {
        'id': 'amazon.nova-premier-v1:0',
        'name': 'Amazon Nova Premier',
        'description': 'Improved quality Nova model',
        'cost': 'medium',
        'speed': 'medium',
        'inference_profile': 'arn:aws:bedrock:us-east-1::inference-profile/us.amazon.nova-premier-v1:0'
    },
    'claude-haiku': {
        'id': 'anthropic.claude-3-5-haiku-20241022-v1:0',
        'name': 'Claude 3.5 Haiku',
        'description': 'Fast Claude model with good quality',
        'cost': 'medium',
        'speed': 'fast',
        'inference_profile': None  # Not available yet
    },
    'claude-sonnet': {
        'id': 'anthropic.claude-3-sonnet-20240229-v1:0',
        'name': 'Claude 3 Sonnet',
        'description': 'High quality model, higher cost',
        'cost': 'high',
        'speed': 'medium',
        'inference_profile': None  # Not available
    },
    'claude-3-7-sonnet': {
        'id': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
        'name': 'Claude 3.7 Sonnet',
        'description': 'Premium quality model, highest cost',
        'cost': 'highest',
        'speed': 'medium',
        'inference_profile': 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
    },
    'claude-4-sonnet': {
        'id': 'anthropic.claude-sonnet-4-20250514-v1:0',
        'name': 'Claude 4 Sonnet',
        'description': 'Latest Claude Sonnet model',
        'cost': 'highest',
        'speed': 'medium',
        'inference_profile': 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    },
    'claude-4-opus': {
        'id': 'anthropic.claude-opus-4-20250514-v1:0',
        'name': 'Claude 4 Opus',
        'description': 'Most capable Claude model',
        'cost': 'highest',
        'speed': 'slow',
        'inference_profile': 'arn:aws:bedrock:us-east-1::inference-profile/us.anthropic.claude-opus-4-20250514-v1:0'
    }
}

# Default model for Bedrock Agent - using Claude 4 Sonnet for latest capabilities
DEFAULT_FOUNDATION_MODEL = BEDROCK_MODELS['claude-4-sonnet']['inference_profile'] or BEDROCK_MODELS['claude-4-sonnet']['id']

# For agent mode, we're now using Claude 4 Sonnet
# The agent will be configured to use the inference profile ID (preferred if available)
AGENT_FOUNDATION_MODEL = DEFAULT_FOUNDATION_MODEL

# Agent Configuration
AGENT_CONFIG = {
    'name': 'PatchlineEmailAgent',
    'description': 'AI assistant for managing emails and communications',
    'foundation_model': AGENT_FOUNDATION_MODEL,  # Using Claude 4 Sonnet for agent
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
    'oauth_table': 'PlatformConnections-staging'
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
    """Get model ID or inference profile ARN by name"""
    model = get_model_by_name(model_name)
    # Return inference profile if available, otherwise return model ID
    return model.get('inference_profile') or model['id']

def get_available_models_for_chat() -> list:
    """Get models available for chat (have working access)"""
    # Models that work for chat
    available_models = ['nova-micro', 'nova-premier', 'claude-3-7-sonnet', 'claude-4-sonnet', 'claude-4-opus']
    return [
        {
            'name': name,
            'display_name': BEDROCK_MODELS[name]['name'],
            'description': BEDROCK_MODELS[name]['description'],
            'model_id': get_model_id(name)
        }
        for name in available_models
    ]

def list_available_models() -> list:
    """List all available models"""
    return [
        {
            'name': name,
            **config
        }
        for name, config in BEDROCK_MODELS.items()
    ] 