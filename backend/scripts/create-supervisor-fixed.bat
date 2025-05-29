@echo off
echo Creating Supervisor Agent...
set PATCHLINE_AGENT_TYPE=SUPERVISOR
echo Agent type set to: %PATCHLINE_AGENT_TYPE%
python create-bedrock-agent.py 