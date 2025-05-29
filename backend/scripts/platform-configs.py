#!/usr/bin/env python3
"""
Modular Platform Configuration System

This module defines platform-specific configurations for different integrations.
Each platform (Gmail, Slack, Discord, etc.) has its own configuration that
can be easily reused and extended.

Usage:
    from platform_configs import GMAIL_CONFIG, create_platform_lambdas

Example of adding a new platform:
    SLACK_CONFIG = {
        'name': 'slack',
        'auth_handler': 'slack-auth-handler.py',
        'action_handler': 'slack-action-handler.py',
        'secrets_name': 'patchline/slack-oauth',
        'scopes': ['chat:write', 'channels:read', 'users:read'],
        'env_vars': {
            'SLACK_CLIENT_ID': 'SLACK_CLIENT_ID',
            'SLACK_CLIENT_SECRET': 'SLACK_CLIENT_SECRET',
            'SLACK_REDIRECT_URI': 'SLACK_REDIRECT_URI',
        }
    }
"""

import os
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# PLATFORM CONFIGURATIONS
# ---------------------------------------------------------------------------

GMAIL_CONFIG = {
    'name': 'gmail',
    'display_name': 'Gmail',
    'auth_handler': 'gmail-auth-handler.py',
    'action_handler': 'gmail-action-handler.py',
    'secrets_name': 'patchline/gmail-oauth',
    'scopes': [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    'env_vars': {
        'client_id': 'GMAIL_CLIENT_ID',
        'client_secret': 'GMAIL_CLIENT_SECRET',
        'redirect_uri': 'GMAIL_REDIRECT_URI',
    },
    'api_endpoints': {
        'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
        'token_uri': 'https://oauth2.googleapis.com/token',
    },
    'default_values': {
        'redirect_uri': 'https://www.patchline.ai/api/auth/gmail/callback',
        'frontend_url': 'https://www.patchline.ai',
    }
}

# Example configuration for future Slack integration
SLACK_CONFIG = {
    'name': 'slack',
    'display_name': 'Slack',
    'auth_handler': 'slack-auth-handler.py',
    'action_handler': 'slack-action-handler.py',
    'secrets_name': 'patchline/slack-oauth',
    'scopes': [
        'chat:write',
        'channels:read',
        'users:read',
        'files:write'
    ],
    'env_vars': {
        'client_id': 'SLACK_CLIENT_ID',
        'client_secret': 'SLACK_CLIENT_SECRET',
        'redirect_uri': 'SLACK_REDIRECT_URI',
    },
    'api_endpoints': {
        'auth_uri': 'https://slack.com/oauth/v2/authorize',
        'token_uri': 'https://slack.com/api/oauth.v2.access',
    },
    'default_values': {
        'redirect_uri': 'https://www.patchline.ai/api/auth/slack/callback',
        'frontend_url': 'https://www.patchline.ai',
    }
}

# Example configuration for future Discord integration
DISCORD_CONFIG = {
    'name': 'discord',
    'display_name': 'Discord',
    'auth_handler': 'discord-auth-handler.py',
    'action_handler': 'discord-action-handler.py',
    'secrets_name': 'patchline/discord-oauth',
    'scopes': [
        'bot',
        'guilds',
        'messages.read'
    ],
    'env_vars': {
        'client_id': 'DISCORD_CLIENT_ID',
        'client_secret': 'DISCORD_CLIENT_SECRET',
        'redirect_uri': 'DISCORD_REDIRECT_URI',
    },
    'api_endpoints': {
        'auth_uri': 'https://discord.com/api/oauth2/authorize',
        'token_uri': 'https://discord.com/api/oauth2/token',
    },
    'default_values': {
        'redirect_uri': 'https://www.patchline.ai/api/auth/discord/callback',
        'frontend_url': 'https://www.patchline.ai',
    }
}

# Registry of all available platforms
PLATFORM_REGISTRY = {
    'gmail': GMAIL_CONFIG,
    'slack': SLACK_CONFIG,
    'discord': DISCORD_CONFIG,
}

# ---------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------

def get_platform_config(platform_name: str) -> Dict:
    """Get configuration for a specific platform"""
    if platform_name not in PLATFORM_REGISTRY:
        raise ValueError(f"Unknown platform: {platform_name}. Available: {list(PLATFORM_REGISTRY.keys())}")
    return PLATFORM_REGISTRY[platform_name]

def get_platform_env_vars(platform_name: str) -> Dict[str, str]:
    """Get environment variables for a platform from the current environment"""
    config = get_platform_config(platform_name)
    env_vars = {}
    
    # Common environment variables
    env_vars.update({
        'PLATFORM_CONNECTIONS_TABLE': os.environ.get('PLATFORM_CONNECTIONS_TABLE', 'PlatformConnections-staging'),
        'KNOWLEDGE_BASE_BUCKET': os.environ.get('KNOWLEDGE_BASE_BUCKET', 'patchline-email-knowledge-base'),
        'BEDROCK_AGENT_ID': os.environ.get('BEDROCK_AGENT_ID', ''),
        'BEDROCK_AGENT_ALIAS_ID': os.environ.get('BEDROCK_AGENT_ALIAS_ID', ''),
        'FRONTEND_URL': os.environ.get('FRONTEND_URL', config['default_values']['frontend_url']),
    })
    
    # Platform-specific environment variables
    for var_key, env_key in config['env_vars'].items():
        env_vars[env_key] = os.environ.get(env_key, config['default_values'].get(var_key, ''))
    
    # Add secrets name
    env_vars[f'{platform_name.upper()}_SECRETS_NAME'] = config['secrets_name']
    
    return env_vars

def create_oauth_url(platform_name: str, client_id: str, state: str = 'production_test') -> str:
    """Generate OAuth URL for a platform"""
    from urllib.parse import urlencode
    
    config = get_platform_config(platform_name)
    
    params = {
        'client_id': client_id,
        'redirect_uri': config['default_values']['redirect_uri'],
        'response_type': 'code',
        'scope': ' '.join(config['scopes']),
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state
    }
    
    return f"{config['api_endpoints']['auth_uri']}?{urlencode(params)}"

def get_lambda_function_names(platform_name: str) -> tuple:
    """Get the Lambda function names for a platform"""
    config = get_platform_config(platform_name)
    auth_name = f"{platform_name}-auth-handler"
    action_name = f"{platform_name}-action-handler"
    return auth_name, action_name

def create_platform_secret(platform_name: str, secrets_client) -> None:
    """Create secrets manager entry for a platform"""
    import json
    
    config = get_platform_config(platform_name)
    
    # Get credentials from environment
    client_id = os.environ.get(config['env_vars']['client_id'])
    client_secret = os.environ.get(config['env_vars']['client_secret'])
    redirect_uri = os.environ.get(config['env_vars']['redirect_uri'], config['default_values']['redirect_uri'])
    
    if not all([client_id, client_secret]):
        print(f"⚠️  Skipping {config['display_name']} secret creation - credentials not found in environment")
        return
    
    secret_val = {
        'web': {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uris': [redirect_uri],
            'auth_uri': config['api_endpoints']['auth_uri'],
            'token_uri': config['api_endpoints']['token_uri'],
        }
    }
    
    try:
        secrets_client.create_secret(
            Name=config['secrets_name'],
            SecretString=json.dumps(secret_val),
            Description=f'{config["display_name"]} OAuth credentials for Patchline',
        )
        print(f"✅ Created Secrets Manager secret: {config['secrets_name']}")
    except secrets_client.exceptions.ResourceExistsException:
        secrets_client.update_secret(SecretId=config['secrets_name'], SecretString=json.dumps(secret_val))
        print(f"ℹ️  Updated existing secret: {config['secrets_name']}")

# ---------------------------------------------------------------------------
# DEPLOYMENT HELPERS
# ---------------------------------------------------------------------------

def deploy_platform_lambdas(platform_name: str, deploy_lambda_func, role_arn: str) -> Dict[str, str]:
    """Deploy both auth and action handlers for a platform"""
    config = get_platform_config(platform_name)
    env_vars = get_platform_env_vars(platform_name)
    
    auth_name, action_name = get_lambda_function_names(platform_name)
    
    # Deploy auth handler
    auth_arn = deploy_lambda_func(auth_name, config['auth_handler'], role_arn, env_vars)
    
    # Deploy action handler
    action_arn = deploy_lambda_func(action_name, config['action_handler'], role_arn, env_vars)
    
    return {
        'auth_handler': auth_arn,
        'action_handler': action_arn
    }

def print_platform_deployment_summary(platform_name: str, arns: Dict[str, str]) -> None:
    """Print deployment summary for a platform"""
    config = get_platform_config(platform_name)
    print(f"\n🎉 {config['display_name']} Lambda functions deployed successfully!")
    print(f"   • {platform_name}-auth-handler  => {arns['auth_handler']}")
    print(f"   • {platform_name}-action-handler => {arns['action_handler']}")

# ---------------------------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------------------------

def validate_platform_environment(platform_name: str) -> Dict[str, bool]:
    """Validate that all required environment variables are set for a platform"""
    config = get_platform_config(platform_name)
    results = {}
    
    for var_key, env_key in config['env_vars'].items():
        value = os.environ.get(env_key)
        results[env_key] = bool(value)
        
    # Check common variables
    results['BEDROCK_AGENT_ID'] = bool(os.environ.get('BEDROCK_AGENT_ID'))
    results['BEDROCK_AGENT_ALIAS_ID'] = bool(os.environ.get('BEDROCK_AGENT_ALIAS_ID'))
    
    return results

def print_platform_checklist(platform_name: str) -> None:
    """Print deployment checklist for a platform"""
    config = get_platform_config(platform_name)
    
    print(f"\n📝 {config['display_name']} Environment Variables Checklist:")
    print("=" * 50)
    print("Make sure these are set in your Amplify console:")
    
    for var_key, env_key in config['env_vars'].items():
        value = os.environ.get(env_key, '[NOT SET]')
        if 'secret' in var_key.lower():
            display_value = f"{value[:10]}...{value[-10:]}" if len(value) > 20 else value
        else:
            display_value = value
        print(f"   {env_key} = {display_value}")
    
    print("   AWS_REGION = us-east-1")
    print(f"   NEXT_PUBLIC_APP_URL = {config['default_values']['frontend_url']}")
    
    print(f"\n🔧 OAuth Provider Console Checklist:")
    print("=" * 40)
    print("Make sure these redirect URIs are configured:")
    print(f"   ✅ http://localhost:3000/api/auth/{platform_name}/callback (local)")
    print(f"   ✅ {config['default_values']['redirect_uri']} (production)") 