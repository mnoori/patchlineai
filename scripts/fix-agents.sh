#!/bin/bash
# Fix Bedrock Agents - Recreate with correct instructions

echo "🚀 Patchline Agent Fix Script"
echo "============================"
echo ""
echo "This script will:"
echo "1. Delete all existing agents"
echo "2. Recreate each agent with the correct instructions"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will delete and recreate all Bedrock agents!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Navigate to backend scripts directory
cd backend/scripts

echo ""
echo -e "${GREEN}Step 1: Creating Gmail Agent${NC}"
echo "================================"
export PATCHLINE_AGENT_TYPE=GMAIL
python create-bedrock-agent.py

echo ""
echo -e "${GREEN}Step 2: Creating Legal Agent${NC}"
echo "================================"
export PATCHLINE_AGENT_TYPE=LEGAL
python create-bedrock-agent.py

echo ""
echo -e "${GREEN}Step 3: Creating Blockchain Agent${NC}"
echo "===================================="
export PATCHLINE_AGENT_TYPE=BLOCKCHAIN
python create-bedrock-agent.py

echo ""
echo -e "${GREEN}Step 4: Creating Scout Agent${NC}"
echo "================================"
export PATCHLINE_AGENT_TYPE=SCOUT
python create-bedrock-agent.py

echo ""
echo -e "${GREEN}Step 5: Creating Supervisor Agent${NC}"
echo "===================================="
export PATCHLINE_AGENT_TYPE=SUPERVISOR
python create-bedrock-agent.py

echo ""
echo -e "${GREEN}✅ All agents created!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your .env.local with the new agent IDs"
echo "2. For the Supervisor agent, manually add collaborators in AWS Console:"
echo "   - Add Gmail, Legal, Scout, and Blockchain agents as collaborators"
echo "3. Test each agent to ensure they have the correct instructions" 