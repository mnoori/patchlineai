# File Copy Plan: Patchline → Iran News Project

## 🎯 **Core Files to Copy (Priority 1)**

### **Bedrock & Content Generation**
```bash
# Core Bedrock functionality
cp patchline_v1/lib/bedrock-client.ts irannews/lib/
cp patchline_v1/lib/bedrock-client-direct.ts irannews/lib/
cp patchline_v1/lib/models-config.ts irannews/lib/
cp patchline_v1/lib/config.ts irannews/lib/

# Content generation APIs
cp patchline_v1/app/api/content/route.ts irannews/app/api/content-generate/
cp patchline_v1/app/api/content/generate-text/route.ts irannews/app/api/text-generate/

# Backend configuration
cp patchline_v1/backend/scripts/config.py irannews/backend/scripts/
```

### **Nova Canvas Image Generation**
```bash
# Nova Canvas core
cp patchline_v1/lib/nova-canvas-api.ts irannews/lib/
cp patchline_v1/lib/s3-upload.ts irannews/lib/
cp patchline_v1/app/api/nova-canvas/generate/route.ts irannews/app/api/image-generate/

# Nova Canvas utilities
cp patchline_v1/lib/nova-canvas-utils.ts irannews/lib/
```

### **Lambda Functions & Infrastructure**
```bash
# Debug logging system
cp patchline_v1/backend/lambda/debug_logger.py irannews/backend/lambda/

# Lambda management
cp patchline_v1/backend/scripts/manage-lambda-functions.py irannews/backend/scripts/
cp patchline_v1/backend/lambda/requirements.txt irannews/backend/lambda/

# AWS configuration
cp patchline_v1/lib/aws-config.ts irannews/lib/
```

### **MCP & Social Media Integration**
```bash
# MCP client and tools
cp -r patchline_v1/lib/mcp/ irannews/lib/
cp patchline_v1/app/api/social-media-workflow/route.ts irannews/app/api/social-publish/

# Social media types and templates
cp patchline_v1/lib/social-media-types.ts irannews/lib/
cp patchline_v1/lib/social-media-templates.ts irannews/lib/
```

## 🔧 **Modified Files (Priority 2)**

### **Newsletter System → News Processing**
**Source:** `patchline_v1/components/god-mode/newsletter/dashboard.tsx`
**Target:** `irannews/components/content/news-generator.tsx`
**Modifications:**
- Replace music industry topics with Iran-Israel conflict topics
- Adapt workflow for news processing instead of newsletter generation
- Integrate with CyrusNT webhook data

### **Agent Configuration**
**Source:** `patchline_v1/agents.yaml`
**Target:** `irannews/config/agents.yaml`
**Modifications:**
```yaml
news-analyst:
  name: IranNewsAnalyst
  model: anthropic.claude-sonnet-4-20250514-v1:0
  prompt: prompts/iran-news-analyst.md
  description: "AI agent for analyzing Iran-Israel conflict news and generating political assessments"

content-creator:
  name: SocialContentCreator
  model: amazon.nova-micro-v1:0
  prompt: prompts/social-content-creator.md
  description: "Creates engaging social media content from news analysis"
```

### **Environment Template**
**Source:** `patchline_v1/env-template.txt`
**Target:** `irannews/.env.example`
**Modifications:**
- Remove music industry API keys
- Add news processing configuration
- Add Iran-specific content settings

## 📝 **New Files to Create**

### **News Processing Lambda**
**File:** `irannews/backend/lambda/news-processor.py`
```python
#!/usr/bin/env python3
"""
Iran News Processor Lambda
Processes news from CyrusNT and generates political analysis
"""

import json
import boto3
from debug_logger import get_logger
from datetime import datetime

debug_logger = get_logger('news-processor')

def lambda_handler(event, context):
    """Process incoming news from CyrusNT webhook"""
    try:
        debug_logger.debug("Processing news event", {'event': event})
        
        # Extract news data from CyrusNT
        news_data = parse_cyrusnt_data(event)
        
        # Generate political analysis
        analysis = generate_political_analysis(news_data)
        
        # Store in S3 for content generation
        store_analysis(analysis)
        
        # Trigger content generation
        trigger_content_creation(analysis)
        
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success'})
        }
    except Exception as e:
        debug_logger.error("News processing failed", {'error': str(e)})
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### **Content Generation Lambda**
**File:** `irannews/backend/lambda/content-generator.py`
```python
#!/usr/bin/env python3
"""
Social Media Content Generator
Creates Instagram posts from news analysis
"""

import json
import boto3
from debug_logger import get_logger

debug_logger = get_logger('content-generator')

def lambda_handler(event, context):
    """Generate social media content from news analysis"""
    try:
        # Get analysis from S3
        analysis = get_news_analysis(event['analysis_id'])
        
        # Generate Instagram post content
        post_content = generate_instagram_content(analysis)
        
        # Generate accompanying image
        image_url = generate_news_image(analysis)
        
        # Schedule via Zapier MCP
        schedule_social_post(post_content, image_url)
        
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'published'})
        }
    except Exception as e:
        debug_logger.error("Content generation failed", {'error': str(e)})
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### **Iran News Analyst Prompt**
**File:** `irannews/prompts/iran-news-analyst.md`
```markdown
# Iran-Israel Conflict News Analyst

You are an expert political analyst specializing in Iran-Israel relations and Middle East geopolitics.

## Your Role
- Analyze breaking news about Iran-Israel conflict
- Provide balanced, factual political assessments
- Identify key implications and developments
- Maintain objectivity while explaining complex dynamics

## Analysis Framework
1. **Event Summary**: What happened?
2. **Political Context**: Historical and current context
3. **Key Players**: Who are the main actors involved?
4. **Implications**: What does this mean for the region?
5. **Next Steps**: What to watch for next

## Content Guidelines
- Use factual, neutral language
- Cite reliable sources when possible
- Avoid inflammatory rhetoric
- Focus on political and strategic implications
- Keep analysis accessible to general audience

## Output Format
Generate analysis in structured format suitable for social media adaptation.
```

## 🚀 **Implementation Commands**

### **Step 1: Create Directory Structure**
```bash
mkdir -p irannews/{backend/{lambda,scripts},lib/mcp,app/api,components/content,config,prompts}
```

### **Step 2: Copy Core Files**
```bash
# Navigate to your code directory
cd /c/Users/mehdi/code

# Copy Bedrock functionality
cp patchline_v1/lib/bedrock-client.ts irannews/lib/
cp patchline_v1/lib/models-config.ts irannews/lib/
cp patchline_v1/lib/config.ts irannews/lib/

# Copy Nova Canvas
cp patchline_v1/lib/nova-canvas-api.ts irannews/lib/
cp patchline_v1/lib/s3-upload.ts irannews/lib/

# Copy Lambda infrastructure
cp patchline_v1/backend/lambda/debug_logger.py irannews/backend/lambda/
cp patchline_v1/backend/scripts/config.py irannews/backend/scripts/

# Copy MCP integration
cp -r patchline_v1/lib/mcp irannews/lib/

# Copy social media tools
cp patchline_v1/lib/social-media-types.ts irannews/lib/
```

### **Step 3: Create Configuration Files**
```bash
# Create environment file
cp patchline_v1/env-template.txt irannews/.env.example

# Create agents configuration
touch irannews/config/agents.yaml

# Create prompts
touch irannews/prompts/iran-news-analyst.md
touch irannews/prompts/social-content-creator.md
```

## 🔄 **Adaptation Strategy**

### **Phase 1: Core Infrastructure (Week 1)**
1. Copy and adapt Bedrock client for political analysis
2. Set up Nova Canvas for news visualization
3. Configure S3 buckets for content storage
4. Test basic content generation

### **Phase 2: News Processing (Week 2)**
1. Create CyrusNT webhook integration
2. Build news analysis pipeline
3. Implement political assessment generation
4. Test with sample news data

### **Phase 3: Social Media Automation (Week 3)**
1. Integrate Zapier MCP for Instagram posting
2. Create automated posting schedules
3. Implement content approval workflows
4. Test end-to-end automation

### **Phase 4: Optimization (Week 4)**
1. Fine-tune prompts for better analysis
2. Optimize image generation for political content
3. Implement monitoring and analytics
4. Deploy production system

## 📊 **Resource Requirements**

### **AWS Services Needed**
- **Lambda**: 2-3 functions for processing
- **S3**: 2 buckets (content + images)
- **Bedrock**: Claude 4 Sonnet + Nova Canvas access
- **CloudWatch**: Logging and monitoring
- **API Gateway**: Webhook endpoints

### **External Integrations**
- **CyrusNT**: News data webhook
- **Zapier**: Social media posting
- **Buffer/Hootsuite**: Content scheduling
- **Instagram Business API**: Direct posting (optional)

### **Estimated Costs (Monthly)**
- **AWS Bedrock**: $50-200 (depending on volume)
- **Lambda**: $5-20
- **S3 Storage**: $5-15
- **Zapier Pro**: $20-50
- **Buffer/Hootsuite**: $15-30

**Total: ~$95-335/month** depending on usage volume. 