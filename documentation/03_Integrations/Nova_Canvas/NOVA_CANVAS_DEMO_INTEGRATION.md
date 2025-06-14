# Nova Canvas Demo Integration - Quick Start Guide

## 🚀 Quick Demo: Adding Image Generation to Blog Posts

Here's how to integrate the Nova Canvas image generator into your existing content forms:

### 1. Import the Component

```typescript
// In your blog creator form (components/content-creator-form.tsx)
import { ImageGenerator } from '@/components/content/image-generation/image-generator'
```

### 2. Add State for Generated Image

```typescript
// Add to your existing state
const [featuredImage, setFeaturedImage] = useState<string>('')
```

### 3. Add the Image Generator Component

Add this after your content form fields:

```typescript
{/* AI Image Generation Section */}
<div className="mt-8">
  <ImageGenerator
    contentType="blog"
    contentData={{
      title: prompt.topic,
      topic: prompt.topic,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      tone: prompt.tone
    }}
    onImageGenerated={(imageUrl) => {
      setFeaturedImage(imageUrl)
      toast.success('Featured image selected!')
    }}
  />
</div>

{/* Preview selected image */}
{featuredImage && (
  <div className="mt-4">
    <Label>Selected Featured Image</Label>
    <img 
      src={featuredImage} 
      alt="Featured" 
      className="w-full max-w-md rounded-lg border"
    />
  </div>
)}
```

## 🎨 Live Example: Social Media Post

For social media content, the component automatically adjusts for platform:

```typescript
// In social-media-creator-form.tsx
<ImageGenerator
  contentType="social"
  contentData={{
    title: formData.content.substring(0, 50),
    topic: formData.topic,
    keywords: formData.hashtags
  }}
  onImageGenerated={(imageUrl) => {
    // Add to your social media post
    setFormData({
      ...formData,
      images: [...formData.images, imageUrl]
    })
  }}
/>
```

## 🎬 EPK Artist Photos

For EPKs, generate professional artist photos:

```typescript
// In epk-creator-form.tsx
<ImageGenerator
  contentType="epk"
  contentData={{
    artistName: formData.artistName,
    genre: formData.genre,
    tone: 'professional'
  }}
  onImageGenerated={(imageUrl) => {
    // Add to press photos
    setFormData({
      ...formData,
      pressPhotos: [...formData.pressPhotos, imageUrl]
    })
  }}
/>
```

## 🧪 Testing in Mock Mode

1. The system works immediately without any API setup
2. Mock images show:
   - The prompt that would be sent
   - Correct dimensions for content type
   - Visual placeholder

### What Mock Images Look Like:
```
┌─────────────────────────────────┐
│      AI Generated Image         │
│                                 │
│   Blog header image about...    │
│                                 │
│      1200x630 • premium         │
│                                 │
│  Mock Image - Enable Nova       │
│  Canvas for real generation     │
└─────────────────────────────────┘
```

## 🔥 Enabling Real Generation

1. **Set Environment Variable**:
   ```env
   ENABLE_NOVA_CANVAS=true
   ```

2. **Ensure AWS Permissions**:
   - Your Bedrock runtime role needs Nova Canvas access
   - Same credentials as your text generation

3. **Test Real Generation**:
   - Click "Generate Images"
   - Get 3 variations
   - Select your favorite
   - Download if needed

## 💡 Pro Tips

### 1. **Smart Prompts**
The component auto-generates prompts based on your content:
- Blog: "Blog header image about {topic}, {tone} tone"
- EPK: "{genre} artist {name} photo, professional portrait"
- Social: "Social media post visual about {topic}, instagram post"

### 2. **Override with Custom Prompts**
```typescript
// Users can always override with custom descriptions
"A futuristic cityscape with neon lights representing AI in music, 
cyberpunk aesthetic, high contrast, professional photography"
```

### 3. **Platform Optimization**
Images are automatically sized for platforms:
- Instagram: 1080x1080 (square)
- Twitter: 1500x500 (banner)
- TikTok: 1080x1920 (vertical)
- Blog: 1200x630 (OG image)

## 🎯 Common Use Cases

### Blog Post Workflow
1. Write blog content
2. System suggests image based on title/topic
3. Generate 3 variations
4. Select best one
5. Auto-attached to blog post

### Social Campaign
1. Create post content
2. Select platform (Instagram/Twitter/TikTok)
3. Generate platform-optimized visuals
4. Create variations for A/B testing

### Artist Press Kit
1. Enter artist details
2. Generate professional photos
3. Use background removal for flexibility
4. Create consistent visual brand

## 🐛 Troubleshooting

### "Mock Image" Always Shows
- Check `ENABLE_NOVA_CANVAS` is set to `true`
- Verify AWS credentials are configured

### "Content Policy Violation"
- Avoid copyrighted names/brands
- Use descriptive terms instead
- Check negative prompts

### Images Not Generating
- Check browser console for errors
- Verify API route is accessible
- Check AWS region supports Nova Canvas

## 🚀 Next Steps

1. **Try It Now**: The mock mode works immediately!
2. **Customize Styles**: Add your own style presets
3. **Brand Colors**: Implement color conditioning
4. **Batch Generation**: Generate multiple images at once

---

Ready to enhance your content with AI-generated visuals! 🎨✨ 