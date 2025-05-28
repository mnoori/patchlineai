#!/usr/bin/env python3
"""
Comprehensive Bedrock Agent Testing Script
Tests all components: Lambda, Agent, and integration
"""

import boto3
import json
import os
import sys
from pathlib import Path
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'agent-test-{datetime.now().strftime("%Y%m%d-%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def load_env_file():
    """Load environment variables from .env.local"""
    project_root = Path(__file__).parent.parent.parent
    env_file = project_root / '.env.local'
    
    if env_file.exists():
        logger.info(f"Loading environment from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    # Normalize
    if os.environ.get('REGION_AWS') and not os.environ.get('AWS_REGION'):
        os.environ['AWS_REGION'] = os.environ['REGION_AWS']

def test_lambda_function(lambda_client, function_name, test_payload):
    """Test Lambda function directly"""
    logger.info(f"\n🔧 Testing Lambda function: {function_name}")
    
    try:
        # Get function configuration
        func_info = lambda_client.get_function(FunctionName=function_name)
        config = func_info['Configuration']
        
        logger.info(f"Function ARN: {config['FunctionArn']}")
        logger.info(f"Runtime: {config['Runtime']}")
        logger.info(f"Handler: {config['Handler']}")
        logger.info(f"Last Modified: {config['LastModified']}")
        
        # Check environment variables
        env_vars = config.get('Environment', {}).get('Variables', {})
        logger.info("\nEnvironment Variables:")
        for key, value in env_vars.items():
            if 'SECRET' in key or 'KEY' in key:
                logger.info(f"  {key}: ***REDACTED***")
            else:
                logger.info(f"  {key}: {value}")
        
        # Check resource policy
        try:
            policy = lambda_client.get_policy(FunctionName=function_name)
            policy_doc = json.loads(policy['Policy'])
            logger.info("\nResource Policy Statements:")
            for stmt in policy_doc.get('Statement', []):
                logger.info(f"  - {stmt.get('Sid', 'No SID')}: {stmt.get('Principal', {})}")
        except lambda_client.exceptions.ResourceNotFoundException:
            logger.warning("No resource policy found")
        
        # Test invocation
        logger.info(f"\n📤 Invoking function with test payload...")
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )
        
        status_code = response['StatusCode']
        logger.info(f"Response Status: {status_code}")
        
        # Read response
        response_payload = json.loads(response['Payload'].read())
        logger.info(f"Response: {json.dumps(response_payload, indent=2)}")
        
        # Check for errors
        if 'errorMessage' in response_payload:
            logger.error(f"❌ Lambda Error: {response_payload['errorMessage']}")
            return False
        
        logger.info("✅ Lambda function test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Lambda test failed: {str(e)}")
        return False

def test_agent_configuration(bedrock_agent, agent_id, alias_id):
    """Test agent configuration"""
    logger.info(f"\n🤖 Testing Agent Configuration")
    
    try:
        # Get agent info
        agent_info = bedrock_agent.get_agent(agentId=agent_id)
        agent = agent_info['agent']
        
        logger.info(f"Agent Name: {agent['agentName']}")
        logger.info(f"Status: {agent['agentStatus']}")
        logger.info(f"Model: {agent['foundationModel']}")
        logger.info(f"Updated: {agent.get('updatedAt', 'Unknown')}")
        
        # Check action groups
        action_groups = bedrock_agent.list_agent_action_groups(
            agentId=agent_id,
            agentVersion='DRAFT'
        )
        
        logger.info("\nAction Groups:")
        for ag in action_groups.get('actionGroupSummaries', []):
            logger.info(f"  - {ag['actionGroupName']} ({ag['actionGroupState']})")
        
        # Check alias
        alias_info = bedrock_agent.get_agent_alias(
            agentId=agent_id,
            agentAliasId=alias_id
        )
        alias = alias_info['agentAlias']
        
        logger.info(f"\nAlias Name: {alias['agentAliasName']}")
        logger.info(f"Alias Status: {alias['agentAliasStatus']}")
        logger.info(f"Alias Version: {alias.get('agentVersion', 'Unknown')}")
        
        if agent['agentStatus'] != 'PREPARED':
            logger.error(f"❌ Agent not in PREPARED state: {agent['agentStatus']}")
            return False
            
        if alias['agentAliasStatus'] != 'PREPARED':
            logger.error(f"❌ Alias not in PREPARED state: {alias['agentAliasStatus']}")
            return False
        
        logger.info("✅ Agent configuration test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Agent configuration test failed: {str(e)}")
        return False

def test_agent_invocation(bedrock_runtime, agent_id, alias_id, test_query):
    """Test agent invocation"""
    logger.info(f"\n💬 Testing Agent Invocation")
    logger.info(f"Query: {test_query}")
    
    try:
        # Create session
        session_id = f"test-session-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Invoke agent
        response = bedrock_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=session_id,
            inputText=test_query,
            enableTrace=True  # Enable tracing for debugging
        )
        
        # Process response
        event_stream = response.get('completion')
        full_response = ""
        traces = []
        
        for event in event_stream:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    text = chunk['bytes'].decode('utf-8')
                    full_response += text
                    logger.info(f"Chunk: {text}")
            
            if 'trace' in event:
                trace = event['trace']
                traces.append(trace)
                
                # Log trace information
                if 'orchestrationTrace' in trace:
                    orch_trace = trace['orchestrationTrace']
                    if 'modelInvocationInput' in orch_trace:
                        logger.info("Model Input:")
                        logger.info(json.dumps(orch_trace['modelInvocationInput'], indent=2))
                    if 'invocationInput' in orch_trace:
                        logger.info("Invocation Input:")
                        logger.info(json.dumps(orch_trace['invocationInput'], indent=2))
                    if 'observation' in orch_trace:
                        logger.info("Observation:")
                        logger.info(json.dumps(orch_trace['observation'], indent=2))
        
        logger.info(f"\n📝 Full Response: {full_response}")
        
        if not full_response:
            logger.error("❌ No response from agent")
            return False
        
        logger.info("✅ Agent invocation test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Agent invocation failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Main test execution"""
    load_env_file()
    
    # Get configuration
    region = os.environ.get('AWS_REGION', 'us-east-1')
    agent_id = os.environ.get('BEDROCK_AGENT_ID')
    alias_id = os.environ.get('BEDROCK_AGENT_ALIAS_ID')
    
    logger.info(f"\n🌍 Region: {region}")
    logger.info(f"Agent ID: {agent_id or 'NOT SET'}")
    logger.info(f"Alias ID: {alias_id or 'NOT SET'}")
    
    if not agent_id or not alias_id:
        logger.error("❌ Missing BEDROCK_AGENT_ID or BEDROCK_AGENT_ALIAS_ID")
        return
    
    # Initialize clients
    lambda_client = boto3.client('lambda', region_name=region)
    bedrock_agent = boto3.client('bedrock-agent', region_name=region)
    bedrock_runtime = boto3.client('bedrock-agent-runtime', region_name=region)
    
    # Test 1: Lambda Function
    logger.info("\n" + "="*60)
    logger.info("TEST 1: LAMBDA FUNCTION")
    logger.info("="*60)
    
    test_payload = {
        "apiPath": "/searchEmails",
        "httpMethod": "POST",
        "requestBody": {
            "content": {
                "application/json": {
                    "properties": [
                        {
                            "name": "query",
                            "value": "test email"
                        },
                        {
                            "name": "maxResults",
                            "value": "5"
                        }
                    ]
                }
            }
        },
        "sessionAttributes": {
            "userId": "test-user"
        }
    }
    
    lambda_ok = test_lambda_function(lambda_client, 'gmail-action-handler', test_payload)
    
    # Test 2: Agent Configuration
    logger.info("\n" + "="*60)
    logger.info("TEST 2: AGENT CONFIGURATION")
    logger.info("="*60)
    
    agent_ok = test_agent_configuration(bedrock_agent, agent_id, alias_id)
    
    # Test 3: Agent Invocation
    logger.info("\n" + "="*60)
    logger.info("TEST 3: AGENT INVOCATION")
    logger.info("="*60)
    
    test_queries = [
        "Hello, can you help me with emails?",
        "Search for emails from last week",
        "Show me recent important emails"
    ]
    
    invocation_ok = True
    for query in test_queries:
        if not test_agent_invocation(bedrock_runtime, agent_id, alias_id, query):
            invocation_ok = False
            break
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("TEST SUMMARY")
    logger.info("="*60)
    
    logger.info(f"Lambda Function: {'✅ PASS' if lambda_ok else '❌ FAIL'}")
    logger.info(f"Agent Configuration: {'✅ PASS' if agent_ok else '❌ FAIL'}")
    logger.info(f"Agent Invocation: {'✅ PASS' if invocation_ok else '❌ FAIL'}")
    
    if lambda_ok and agent_ok and invocation_ok:
        logger.info("\n🎉 ALL TESTS PASSED!")
    else:
        logger.info("\n❌ SOME TESTS FAILED - Check the logs above")
    
    logger.info(f"\n📄 Log file: agent-test-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log")

if __name__ == '__main__':
    main() 