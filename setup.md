# Iran-Israel News Social Media Automation Setup

## Project Overview
Automated social media agency for Iran-Israel conflict news coverage with AI-generated political assessments for Instagram.

## Architecture Components
- **News Processing**: Integration with CyrusNT crawler
- **Content Generation**: AWS Bedrock (Claude 4 Sonnet + Nova Micro)
- **Image Generation**: Amazon Nova Canvas
- **Social Media**: Zapier MCP integration with Buffer/Hootsuite
- **Storage**: S3 for images and content

## Directory Structure
```
irannews/
├── backend/
│   ├── lambda/                 # AWS Lambda functions
│   │   ├── news-processor.py
│   │   ├── content-generator.py
│   │   └── debug_logger.py
│   └── scripts/               # Deployment scripts
│       ├── deploy-lambdas.py
│       └── config.py
├── lib/                       # Core libraries
│   ├── bedrock-client.ts
│   ├── nova-canvas-api.ts
│   ├── models-config.ts
│   └── mcp/
│       ├── client.ts
│       └── social-media-tools.ts
├── components/               # UI components (optional)
│   └── content/
│       └── news-generator/
├── app/                     # API routes
│   └── api/
│       ├── news-process/
│       ├── content-generate/
│       └── social-publish/
└── config/
    ├── agents.yaml
    └── .env.example
```

## Environment Variables Required
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Bedrock Models
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
NOVA_CANVAS_MODEL_ID=amazon.nova-canvas-v1:0

# S3 Storage
S3_CONTENT_BUCKET=irannews-content
S3_IMAGES_BUCKET=irannews-images

# Social Media Integration
ZAPIER_MCP_URL=your_zapier_mcp_endpoint
ZAPIER_API_KEY=your_zapier_api_key

# News Source Integration
CYRUSNT_WEBHOOK_URL=your_cyrusnt_webhook_endpoint
NEWS_PROCESSING_SCHEDULE=0 */6 * * *  # Every 6 hours

# Content Configuration
ENABLE_NOVA_CANVAS=true
ENABLE_S3_UPLOAD=true
DEBUG_MODE=prod
```

## Next Steps
1. Copy core files from Patchline
2. Set up AWS infrastructure
3. Configure news processing pipeline
4. Test content generation
5. Set up social media automation 