#!/bin/bash

# Create the main documentation directory
mkdir -p documentation

# Create subdirectories
mkdir -p documentation/00_Getting_Started
mkdir -p documentation/01_Deployment
mkdir -p documentation/02_Architecture
mkdir -p documentation/03_Integrations/MCP
mkdir -p documentation/03_Integrations/Revelator
mkdir -p documentation/03_Integrations/Nova_Canvas
mkdir -p documentation/03_Integrations/Soundcharts
mkdir -p documentation/03_Integrations/Spotify
mkdir -p documentation/03_Integrations/Gmail
mkdir -p documentation/04_AWS_and_Bedrock
mkdir -p documentation/05_Web3
mkdir -p documentation/06_Development_Guides
mkdir -p documentation/07_Troubleshooting_and_Fixes
mkdir -p documentation/08_Performance_and_Optimization
mkdir -p documentation/09_Strategy_and_Vision
mkdir -p documentation/10_Archive

# Move files from the root
mv -n README.md documentation/00_Getting_Started/ 2>/dev/null
mv -n DEVELOPMENT.md documentation/00_Getting_Started/ 2>/dev/null
mv -n COMPLETE_SETUP_GUIDE.md documentation/00_Getting_Started/ 2>/dev/null
mv -n setup-local.md documentation/00_Getting_started/ 2>/dev/null
mv -n DEPLOYMENT.md documentation/01_Deployment/ 2>/dev/null
mv -n PRODUCTION_DEPLOYMENT_CHECKLIST.md documentation/01_Deployment/ 2>/dev/null
mv -n amplify.yml documentation/01_Deployment/ 2>/dev/null
mv -n ARCHITECTURE_VISION.md documentation/02_Architecture/ 2>/dev/null
mv -n AI_REBUILDING_AI_ARCHITECTURE.md documentation/02_Architecture/ 2>/dev/null
mv -n MULTI_AGENT_SYSTEM_DOCS.md documentation/02_Architecture/ 2>/dev/null
mv -n AWS_MCP_IMPLEMENTATION_SUMMARY.md documentation/03_Integrations/MCP/ 2>/dev/null
mv -n MCP_IMPLEMENTATION_PLAN.md documentation/03_Integrations/MCP/ 2>/dev/null
mv -n AWS_MCP_ENV_EXAMPLE.md documentation/03_Integrations/MCP/ 2>/dev/null
mv -n REVELATOR_INTEGRATION_SUMMARY.md documentation/03_Integrations/Revelator/ 2>/dev/null
mv -n REVELATOR_IMPLEMENTATION_PLAN.md documentation/03_Integrations/Revelator/ 2>/dev/null
mv -n NOVA_CANVAS_IMPLEMENTATION_SUMMARY.md documentation/03_Integrations/Nova_Canvas/ 2>/dev/null
mv -n NOVA_CANVAS_INTEGRATION_PLAN.md documentation/03_Integrations/Nova_Canvas/ 2>/dev/null
mv -n NOVA_CANVAS_TESTING_GUIDE.md documentation/03_Integrations/Nova_Canvas/ 2>/dev/null
mv -n NOVA_CANVAS_DEMO_INTEGRATION.md documentation/03_Integrations/Nova_Canvas/ 2>/dev/null
mv -n NOVA_CANVAS_COMPLETE_IMPLEMENTATION.md documentation/03_Integrations/Nova_Canvas/ 2>/dev/null
mv -n SOUNDCHARTS_INTEGRATION.md documentation/03_Integrations/Soundcharts/ 2>/dev/null
mv -n SPOTIFY_TOKEN_REFRESH_SUMMARY.md documentation/03_Integrations/Spotify/ 2>/dev/null
mv -n SPOTIFY_PROFILE_FIX_SUMMARY.md documentation/03_Integrations/Spotify/ 2>/dev/null
mv -n SPOTIFY_OAUTH_TROUBLESHOOTING.md documentation/03_Integrations/Spotify/ 2>/dev/null
mv -n CHAT_GMAIL_INTEGRATION_SUMMARY.md documentation/03_Integrations/Gmail/ 2>/dev/null
mv -n bedrock-agent-gmail-integration.md documentation/03_Integrations/Gmail/ 2>/dev/null
mv -n BEDROCK-SETUP.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n BEDROCK_AGENT_SETUP.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n aws-bedrock-integration-guide.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n aws-credentials-setup.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n aws-credential-fix.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n WEB3_IMPLEMENTATION_PLAN.md documentation/05_Web3/ 2>/dev/null
mv -n WEB3_IMPLEMENTATION_STATUS.md documentation/05_Web3/ 2>/dev/null
mv -n WEB3_PORTAL_IMPLEMENTATION.md documentation/05_Web3/ 2>/dev/null
mv -n WEB3_FIXES_SUMMARY.md documentation/05_Web3/ 2>/dev/null
mv -n AGENT_MANAGEMENT_GUIDE.md documentation/06_Development_Guides/ 2>/dev/null
mv -n AGENT_CONFIGURATION.md documentation/06_Development_Guides/ 2>/dev/null
mv -n AGENT_COLLABORATION_STRUCTURE.md documentation/06_Development_Guides/ 2>/dev/null
mv -n AGENT_COLLABORATION_COMPLETE_GUIDE.md documentation/06_Development_Guides/ 2>/dev/null
mv -n PLATFORM_INTEGRATION_GUIDE.md documentation/06_Development_Guides/ 2>/dev/null
mv -n api-integrations.md documentation/06_Development_Guides/ 2>/dev/null
mv -n TROUBLESHOOTING.md documentation/07_Troubleshooting_and_Fixes/ 2>/dev/null
mv -n FIXES_SUMMARY.md documentation/07_Troubleshooting_and_Fixes/ 2>/dev/null
mv -n AGENT_MODE_FIX.md documentation/07_Troubleshooting_and_Fixes/ 2>/dev/null
mv -n EMERGENCY_FIX.md documentation/07_Troubleshooting_and_Fixes/ 2>/dev/null
mv -n BLOCKCHAIN_FIXES_SUMMARY.md documentation/07_Troubleshooting_and_Fixes/ 2>/dev/null
mv -n PERFORMANCE_OPTIMIZATIONS.md documentation/08_Performance_and_Optimization/ 2>/dev/null
mv -n PERFORMANCE_OPTIMIZATIONS_SUMMARY.md documentation/08_Performance_and_Optimization/ 2>/dev/null
mv -n LOCAL_OPTIMIZATION_SUMMARY.md documentation/08_Performance_and_Optimization/ 2>/dev/null
mv -n TURBO_MODE_SETUP.md documentation/08_Performance_and_Optimization/ 2>/dev/null
mv -n SOCIAL_MEDIA_UI_IMPROVEMENTS.md documentation/10_Archive/ 2>/dev/null
mv -n SOCIAL_MEDIA_UI_IMPROVEMENTS_V2.md documentation/10_Archive/ 2>/dev/null
mv -n SOCIAL_MEDIA_CREATOR_FINAL_IMPLEMENTATION.md documentation/10_Archive/ 2>/dev/null
mv -n SOCIAL_MEDIA_USER_JOURNEY_Test.md documentation/10_Archive/ 2>/dev/null

# Move from docs
mv -n docs/soundcharts-api documentation/03_Integrations/Soundcharts/ 2>/dev/null
mv -n docs/* documentation/10_Archive/ 2>/dev/null

# Move from backend
mv -n backend/AGENT_MODEL_MIGRATION.md documentation/10_Archive/ 2>/dev/null
mv -n backend/BEDROCK_AGENT_SETUP.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n backend/bedrock-agent-gmail-integration.md documentation/03_Integrations/Gmail/ 2>/dev/null
mv -n backend/aws-bedrock-integration-guide.md documentation/04_AWS_and_Bedrock/ 2>/dev/null
mv -n backend/DEVELOPER_CONTEXT.md documentation/10_Archive/ 2>/dev/null
mv -n backend/README.md documentation/10_Archive/ 2>/dev/null
mv -n backend/COMPLETE_SETUP_GUIDE.md documentation/00_Getting_Started/ 2>/dev/null
mv -n backend/API_DOCUMENTATION.md documentation/06_Development_Guides/ 2>/dev/null
mv -n backend/AGENT_CONFIGURATION.md documentation/06_Development_Guides/ 2>/dev/null

# Move from backend/docs
mv -n backend/docs/strategy/* documentation/09_Strategy_and_Vision/ 2>/dev/null
mv -n backend/docs/developer\ context/* documentation/10_Archive/ 2>/dev/null
mv -n backend/docs/BACKLOG.md documentation/10_Archive/ 2>/dev/null
mv -n backend/docs/*.md documentation/10_Archive/ 2>/dev/null

# Clean up empty directories if possible
rmdir docs 2>/dev/null
rmdir backend/docs/strategy 2>/dev/null
rmdir backend/docs/developer\ context 2>/dev/null
rmdir backend/docs 2>/dev/null 