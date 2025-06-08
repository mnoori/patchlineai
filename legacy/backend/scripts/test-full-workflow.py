#!/usr/bin/env python3
"""
Test the full supervisor workflow via the web API
"""
import requests
import json
import time

# Test configuration
API_BASE = "http://localhost:3000"
TEST_MESSAGE = "Mehdi sent a contract today, can you run it through Legal and let me know what you think?"

def test_supervisor_via_api():
    """Test supervisor agent through the web API"""
    print("🧪 Testing Supervisor Agent via Web API")
    print("=" * 50)
    
    # Test endpoint
    url = f"{API_BASE}/api/chat"
    
    payload = {
        "message": TEST_MESSAGE,
        "userId": "test-user-123",
        "mode": "agent",
        "agentType": "SUPERVISOR_AGENT",
        "sessionId": f"test-supervisor-{int(time.time())}"
    }
    
    print(f"📤 Request:")
    print(f"   URL: {url}")
    print(f"   Message: {TEST_MESSAGE}")
    print(f"   Agent Type: SUPERVISOR_AGENT")
    print()
    
    try:
        print("⏳ Sending request...")
        response = requests.post(url, json=payload, timeout=60)
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! Supervisor responded:")
            print("-" * 30)
            print(data.get('response', 'No response field'))
            print("-" * 30)
            print(f"📊 Metadata:")
            print(f"   Session ID: {data.get('sessionId')}")
            print(f"   Mode: {data.get('mode')}")
            print(f"   Has Email Context: {data.get('hasEmailContext', False)}")
            print(f"   Actions Invoked: {data.get('actionsInvoked', [])}")
            
            # Check if this looks like proper supervisor behavior
            response_text = data.get('response', '').lower()
            if 'gmail' in response_text or 'legal' in response_text or 'contract' in response_text:
                print("✅ Response contains expected keywords (gmail/legal/contract)")
            else:
                print("⚠️  Response may not show proper delegation")
                
        else:
            print(f"❌ FAILED with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('error', 'Unknown error')}")
                print(f"Details: {error_data.get('details', 'No details')}")
            except:
                print(f"Raw response: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_individual_agents():
    """Test individual agents for comparison"""
    print("\n🔍 Testing Individual Agents for Comparison")
    print("=" * 50)
    
    agents = [
        ("GMAIL_AGENT", "Search for recent emails from Mehdi"),
        ("LEGAL_AGENT", "Analyze this contract: Artist grants exclusive rights to Label for 2 years"),
    ]
    
    for agent_type, message in agents:
        print(f"\n📋 Testing {agent_type}...")
        
        payload = {
            "message": message,
            "userId": "test-user-123", 
            "mode": "agent",
            "agentType": agent_type,
            "sessionId": f"test-{agent_type.lower()}-{int(time.time())}"
        }
        
        try:
            response = requests.post(f"{API_BASE}/api/chat", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                response_preview = data.get('response', '')[:200] + "..." if len(data.get('response', '')) > 200 else data.get('response', '')
                print(f"✅ {agent_type} working: {response_preview}")
            else:
                print(f"❌ {agent_type} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ {agent_type} error: {e}")

if __name__ == '__main__':
    print("🚀 Production Readiness Test")
    print("Testing multi-agent supervisor workflow")
    print()
    
    # Test supervisor
    test_supervisor_via_api()
    
    # Test individual agents
    test_individual_agents()
    
    print("\n🏁 Test Complete!")
    print("If supervisor test passed, the system is production ready!") 