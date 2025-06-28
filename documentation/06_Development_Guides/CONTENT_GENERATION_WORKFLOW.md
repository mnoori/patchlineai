# Content Generation Workflow Guide

## Overview

The Patchline content generation workflow allows artists to create personalized marketing content by:
1. Selecting images from Google Drive or uploading new ones
2. Using AI to remove backgrounds
3. Generating personalized environments based on release context
4. Exporting ready-to-post social media content

## Architecture

### Components

1. **Frontend Components**
   - `components/content/personalized-content-workflow.tsx` - Main workflow UI
   - `components/releases/release-marketing-content-modal.tsx` - Release integration

2. **Backend APIs**
   - `/api/nova-canvas/generate-with-subject` - Main generation endpoint
   - `/api/nova-canvas/test-background-removal` - Testing endpoint
   - `/api/upload/user-photos` - Image upload handler

3. **Utilities**
   - `lib/nova-canvas-api.ts` - Nova Canvas client wrapper
   - `lib/s3-upload.ts` - S3 upload functionality
   - `lib/image-utils.ts` - Image processing utilities
   - `lib/client-composite.ts` - Client-side image compositing
   - `lib/aws/s3-config.ts` - Centralized S3 configuration

## Nova Canvas API Reference

### Supported Task Types

Nova Canvas supports the following task types:

| Task Type | Description | Use Case |
|-----------|-------------|----------|
| `TEXT_IMAGE` | Generate image from text prompt | Creating new backgrounds |
| `INPAINTING` | Modify inside masked regions | Replacing objects |
| `OUTPAINTING` | Modify outside masked regions | Extending backgrounds |
| `IMAGE_VARIATION` | Create variations of existing images | Style variations |
| `COLOR_GUIDED_GENERATION` | Generate with specific color palette | Brand-consistent content |
| `BACKGROUND_REMOVAL` | Remove image background | Isolating subjects |

### Common Parameters

```javascript
{
  "imageGenerationConfig": {
    "numberOfImages": 1,      // 1-5 images
    "height": 1024,          // Must be divisible by 64
    "width": 1024,           // Must be divisible by 64
    "quality": "premium",    // "standard" or "premium"
    "cfgScale": 8.0,         // 1.1-10.0 (prompt adherence)
    "seed": 0                // For reproducibility
  }
}
```

### Task-Specific Examples

#### 1. Text-to-Image Generation

```python
body = json.dumps({
    "taskType": "TEXT_IMAGE",
    "textToImageParams": {
        "text": "A photograph of a cup of coffee from the side.",
        "negativeText": "blurry, low quality"  # What to avoid
    },
    "imageGenerationConfig": {
        "numberOfImages": 1,
        "height": 1024,
        "width": 1024,
        "cfgScale": 8.0,
        "seed": 0
    }
})
```

#### 2. Inpainting (Modify Inside Mask)

```python
body = json.dumps({
    "taskType": "INPAINTING",
    "inPaintingParams": {
        "text": "Modernize the windows of the house",
        "negativeText": "bad quality, low res",
        "image": input_image,        # Base64 encoded
        "maskPrompt": "windows"      # Natural language mask
        # OR use "maskImage": mask_image for precise control
    },
    "imageGenerationConfig": {
        "numberOfImages": 1,
        "height": 512,
        "width": 512,
        "cfgScale": 8.0
    }
})
```

#### 3. Outpainting (Extend/Replace Background)

```python
body = json.dumps({
    "taskType": "OUTPAINTING",
    "outPaintingParams": {
        "text": "Draw a chocolate chip cookie",
        "negativeText": "bad quality, low res",
        "image": input_image,        # Base64 encoded
        "maskImage": input_mask_image, # REQUIRED: Black/white mask
        # OR use "maskPrompt": "subject" for auto masking
        "outPaintingMode": "DEFAULT"  # or "PRECISE"
    },
    "imageGenerationConfig": {
        "numberOfImages": 1,
        "height": 512,
        "width": 512,
        "cfgScale": 8.0
    }
})
```

**Important**: Outpainting REQUIRES either `maskImage` or `maskPrompt`. The mask defines what to KEEP (for maskImage: white pixels are kept, black pixels are replaced).

#### 4. Image Variation

```python
body = json.dumps({
    "taskType": "IMAGE_VARIATION",
    "imageVariationParams": {
        "text": "Modernize the house, photo-realistic, 8k, hdr",
        "negativeText": "bad quality, low resolution, cartoon",
        "images": [input_image],      # List of base64 images
        "similarityStrength": 0.7,    # 0.2-1.0 (higher = more similar)
    },
    "imageGenerationConfig": {
        "numberOfImages": 1,
        "height": 512,
        "width": 512,
        "cfgScale": 8.0
    }
})
```

#### 5. Background Removal

```python
body = json.dumps({
    "taskType": "BACKGROUND_REMOVAL",
    "backgroundRemovalParams": {
        "image": input_image  # Base64 encoded
    }
})
```

### Mask Requirements

For `maskImage` in inpainting/outpainting:
- Must be pure black (0,0,0) and pure white (255,255,255)
- No grayscale or colored pixels
- Same dimensions as input image
- For JPEG masks, use 100% quality to avoid compression artifacts

### Error Handling

```python
try:
    response = bedrock.invoke_model(body=body, modelId=model_id)
    # Process response
except ClientError as err:
    if err.response['Error']['Code'] == 'ValidationException':
        # Handle input validation errors
        print(f"Invalid input: {err.response['Error']['Message']}")
    elif "content filters" in err.response['Error']['Message']:
        # Handle content policy violations
        print("Content blocked by filters")
```

## Usage Guide

### For End Users

1. **Connect Google Drive**
   - Go to Settings → Platforms
   - Click "Connect Google Drive"
   - Authorize access to your Drive

2. **Generate Content from Release Page**
   - Navigate to Releases
   - Click on a release
   - In Marketing Tasks, click "Generate"
   - Choose between AI generation or upload

3. **Use Personalized Workflow**
   - Go to Content tab
   - Find "Personalized Release Content" section
   - Select image from Drive or upload
   - Click "Generate Content"
   - Download generated variations

### For Developers

#### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Buckets (optional - defaults to existing buckets)
S3_IMAGE_BUCKET=patchline-files-us-east-1  # Default: uses existing bucket
S3_DOCUMENTS_BUCKET=patchline-documents-staging
S3_EMAIL_BUCKET=patchline-email-knowledge-base
S3_AGENT_BUCKET=patchline-agent-schemas

# Nova Canvas
ENABLE_NOVA_CANVAS=true

# Google Drive
NEXT_PUBLIC_GMAIL_CLIENT_ID=your-client-id
NEXT_PUBLIC_GMAIL_CLIENT_SECRET=your-client-secret
```

#### Testing Background Removal

```bash
# Run automated tests
node scripts/test-background-removal.js

# Test via UI
# Navigate to: /dashboard/content/test-background-removal
```

#### API Usage Example

```typescript
// Generate content with background removal
const response = await fetch('/api/nova-canvas/generate-with-subject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjectImageData: base64ImageData,
    prompt: 'Electronic music festival promotional content',
    style: 'vibrant',
    removeBackground: true,
    releaseContext: {
      title: 'Summer Vibes',
      artist: 'Artist Name',
      genre: 'Electronic',
      releaseDate: '2025-07-01'
    }
  })
})

const { imageUrl } = await response.json()
```

## Image Processing Pipeline

1. **Input Processing**
   - Accept base64 encoded images
   - Support for JPG, PNG, WebP formats
   - Maximum size: 5MB recommended

2. **Background Removal**
   - Nova Canvas removes background
   - Returns transparent PNG
   - Preserves subject details

3. **Environment Generation**
   - Creates contextual backgrounds
   - Multiple style variations
   - 1024x1024 resolution

4. **Compositing**
   - Currently returns generated background
   - Future: Implement proper compositing with Sharp/Canvas

## Compositing Methods

The workflow now supports three different compositing methods to integrate your subject with the background:

### 1. Client-Side Compositing (Quick Preview)
- **How it works**: Places the transparent subject on top of the background using Canvas API
- **Pros**: Fast, full control over placement and scaling
- **Cons**: Can look artificial or "sticker-like"
- **Best for**: Quick previews, simple compositions

### 2. Inpainting Method (Natural Blend)
- **How it works**: Uses Nova Canvas's natural language masking to intelligently place the subject
- **Pros**: More natural integration with proper lighting and shadows
- **Cons**: Less control over exact placement
- **Best for**: Professional marketing materials
- **Example**: "Place the artist naturally in the center of the scene"

### 3. Image Variation Method (Transform Style)
- **How it works**: Uses Nova Canvas IMAGE_VARIATION to transform the entire image into a new style
- **Pros**: Most natural-looking results, coherent style transformation
- **Cons**: Changes the entire image, not just the background
- **Best for**: Creating stylized variations of existing photos
- **Note**: Uses the original image (with background) and transforms it based on style prompts

### Implementation Details

```javascript
// Client-side compositing
if (compositeMethod === 'client') {
  // Returns transparent subject + background separately
  // Client combines them using Canvas API
}

// Inpainting for natural placement
else if (compositeMethod === 'inpainting') {
  // Uses INPAINTING task with maskPrompt
  // Blends subject into the generated background
}

// Image variation for style transformation
else if (compositeMethod === 'outpainting') {
  // Uses IMAGE_VARIATION task
  // Transforms the original photo into new styles
  // similarityStrength: 0.7 keeps subject recognizable
}
```

## Troubleshooting

### Common Issues

1. **"Failed to process image"**
   - Check AWS credentials
   - Verify Nova Canvas is available in your region
   - Ensure image is valid base64

2. **"Google Drive not connected"**
   - Go to Settings → Platforms
   - Re-authorize Google Drive
   - Check OAuth token expiration

3. **Mock Mode Active**
   - Set `ENABLE_NOVA_CANVAS=true`
   - Verify AWS credentials are configured

### Debug Mode

Enable debug logging:
```javascript
// In your API routes
console.log('Processing step:', stepName)
console.log('Input data:', JSON.stringify(data, null, 2))
```

## Future Enhancements

1. **Proper Image Compositing**
   - Integrate Sharp or Canvas API
   - Blend subject with background
   - Add shadows and lighting effects

2. **Batch Processing**
   - Process multiple images at once
   - Queue system for large batches
   - Progress tracking

3. **Advanced Editing**
   - Manual mask editing
   - Position adjustment
   - Scale and rotation controls

4. **Platform-Specific Formats**
   - Instagram Stories (9:16)
   - Twitter headers (3:1)
   - Facebook covers (820x312)

## API Reference

### POST /api/nova-canvas/generate-with-subject

**Request Body:**
```json
{
  "subjectImageData": "base64_string",
  "prompt": "string",
  "style": "vibrant|cinematic|minimalist",
  "removeBackground": true,
  "releaseContext": {
    "title": "string",
    "artist": "string",
    "genre": "string",
    "releaseDate": "ISO date string"
  }
}
```

**Response:**
```json
{
  "imageUrl": "data:image/png;base64,...",
  "mock": false,
  "s3Enabled": false
}
```

### POST /api/nova-canvas/test-background-removal

**Request Body:**
```json
{
  "releaseTitle": "string",
  "releaseGenre": "string",
  "style": "vibrant|cinematic|minimalist|festival"
}
```

**Response:**
```json
{
  "message": "string",
  "backgroundRemoved": "data:image/png;base64,...",
  "newBackground": "data:image/png;base64,...",
  "composite": "data:image/png;base64,...",
  "s3Urls": {
    "backgroundRemoved": "string",
    "newBackground": "string",
    "composite": "string"
  }
}
```

## Best Practices

1. **Image Quality**
   - Use high-resolution source images
   - Ensure good lighting and contrast
   - Avoid blurry or low-quality inputs

2. **Prompt Engineering**
   - Be specific about style and mood
   - Include genre and context
   - Avoid copyrighted references

3. **Performance**
   - Cache generated content
   - Use CDN for served images
   - Implement progressive loading

4. **User Experience**
   - Show clear progress indicators
   - Provide preview before download
   - Allow style customization

## Security Considerations

1. **API Keys**
   - Never expose AWS credentials client-side
   - Use environment variables
   - Implement rate limiting

2. **File Validation**
   - Validate file types and sizes
   - Scan for malicious content
   - Sanitize filenames

3. **Access Control**
   - Verify user authentication
   - Check subscription limits
   - Log all generation requests

## Current Limitations

### Image Compositing
Currently, the workflow has a limitation with compositing the subject onto the generated background:

1. **Background Removal**: ✅ Working (removes background from uploaded image)
2. **Background Generation**: ✅ Working (creates new AI backgrounds)
3. **Compositing**: ⚠️ Limited (returns only the background without the subject)

**Why?** Nova Canvas doesn't have a direct "composite two images" function. Proper compositing requires:
- **Sharp** (Node.js image processing library)
- **Canvas API** (browser-based solution)
- **ImageMagick** or similar tools

**Current Workaround**: The system uses INPAINTING to try to blend a subject into the scene, but this doesn't use your actual uploaded image.

### Installing Sharp (Recommended)

To enable proper compositing, install Sharp:

```bash
npm install sharp
# or
pnpm add sharp
```

Then update `app/api/nova-canvas/generate-with-subject/route.ts` to use the `createProperComposite` function.

### S3 Upload Region
The S3 bucket must be in the same region as configured. Currently set to `us-east-2`.

## S3 Bucket Setup

### Option 1: Use Existing Bucket (Recommended)
The system is configured to use `patchline-files-us-east-1` by default, which already exists in your AWS account.

### Option 2: Create New Bucket
If you want a dedicated bucket for content images:

```bash
aws s3 mb s3://patchline-content-images --region us-east-1
```

Then set the environment variable:
```bash
S3_IMAGE_BUCKET=patchline-content-images
```

### Bucket Permissions
Your S3 bucket should have "Block all public access" enabled for security. The system works with private buckets.

#### Bucket Policy Example
If you need specific access patterns, use a bucket policy instead of ACLs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### Access Patterns
- **Private Upload**: Files are uploaded privately (no public ACL)
- **Presigned URLs**: Generate temporary URLs for sharing
- **CloudFront**: Use CDN for public distribution (optional)

```javascript
// Example: Generate presigned URL for private content
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { GetObjectCommand } = require('@aws-sdk/client-s3')

const command = new GetObjectCommand({
  Bucket: 'patchline-files-us-east-1',
  Key: 'generated/content/image.jpg'
})

const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
```

### Centralized Configuration
All S3 bucket names and settings are now centralized in `lib/aws/s3-config.ts`. This provides a single source of truth for:
- Bucket names
- Path prefixes
- File size limits
- ACL settings

To change a bucket, update either:
1. The environment variable (e.g., `S3_IMAGE_BUCKET`)
2. The default in `lib/aws/s3-config.ts` 