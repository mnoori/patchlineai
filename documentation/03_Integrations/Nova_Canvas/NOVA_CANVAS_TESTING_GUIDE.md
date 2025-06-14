# Nova Canvas Testing Guide - Complete Implementation

## 🚀 Quick Start

The development server should be running. Access the app at: http://localhost:3000

## 🧪 Test 1: Social Media Content Creation

### Steps:
1. Navigate to **Dashboard** → **Content**
2. Select **"Social Media"** content type
3. Choose **"Write Your Own"** or select a pre-made idea

### Test the Complete Flow:

#### Instagram Post
1. **Platform**: Select Instagram
2. **Post Topic**: "Excited to announce my new single 'Midnight Dreams' dropping this Friday!"
3. **Post Tone**: Enthusiastic & Energetic
4. **Target Audience**: "indie pop fans, young adults"
5. **Include Hashtags**: ✅ Enabled
6. **Include Emojis**: ✅ Enabled

#### What to Verify:
- ✅ Image generator appears after entering topic
- ✅ Auto-generated prompt shows Instagram-specific details
- ✅ Generated images are 1080x1080 (square)
- ✅ Selected image appears in Instagram preview
- ✅ Preview shows complete post with image

### Expected Mock Image:
```
┌─────────────────────────────────┐
│      AI Generated Image         │
│                                 │
│  Social media post visual...    │
│                                 │
│      1080x1080 • premium        │
│                                 │
│  Mock Image - Enable Nova       │
│  Canvas for real generation     │
└─────────────────────────────────┘
```

## 🧪 Test 2: Platform Switching

### Test Different Platforms:
1. **Twitter**: 
   - Verify 1500x500 banner format
   - Check image appears as Twitter card
   
2. **TikTok**:
   - Verify 1080x1920 vertical format
   - Check image as background in preview

## 🧪 Test 3: Blog Post with Featured Image

### Steps:
1. Go to **Content** → **Blog Post**
2. Enter topic: "The Future of AI in Music Production"
3. Select tone: Professional
4. Add keywords: "AI, music, production, technology"

### Verify:
- ✅ Image generator appears below form
- ✅ Professional style preset available
- ✅ 1200x630 dimensions (OG image)
- ✅ Selected image preview shows

## 📊 Features to Test

### Image Generation
- [ ] Click "Generate Images" button
- [ ] Loading state displays
- [ ] 3 image variations appear
- [ ] Can select different images
- [ ] Download button works
- [ ] "Generate More Variations" creates new set

### Platform-Specific Features
- [ ] Instagram: Square format, post preview
- [ ] Twitter: Banner format, card preview
- [ ] TikTok: Vertical format, background preview
- [ ] Blog: OG image format, featured image

### Error Handling
- [ ] Empty topic: Image generator doesn't show
- [ ] No style selected: Uses auto-prompt
- [ ] Network error: Shows error message

## 🔧 Configuration Options

### Enable Real Nova Canvas (Optional)
```bash
# In .env.local
ENABLE_NOVA_CANVAS=true
```

### Enable S3 Upload (Optional)
```bash
# In .env.local
ENABLE_S3_UPLOAD=true
S3_IMAGE_BUCKET=your-bucket-name
```

## 📱 User Journey Checkpoints

### Social Media Creation Flow:
1. **Content Type Selection** ✓
2. **Platform Choice** ✓
3. **Content Details** ✓
4. **Image Generation** ✓
5. **Image Selection** ✓
6. **Preview Update** ✓
7. **Content Generation** ✓

### What's Working:
- ✅ Complete UI integration
- ✅ Platform-aware dimensions
- ✅ Smart prompt generation
- ✅ Live preview updates
- ✅ Mock mode for testing
- ✅ S3 upload ready
- ✅ Error handling

## 🐛 Troubleshooting

### "Cannot see image generator"
- Make sure you've entered a topic
- Check browser console for errors

### "Images not loading"
- Mock mode should always work
- Check network tab for API calls

### "Preview not updating"
- Refresh the page
- Check if image was selected

## 🎯 Success Metrics

1. **Time to First Image**: < 2 seconds (mock mode)
2. **User Actions Required**: Minimal (smart defaults)
3. **Platform Accuracy**: 100% correct dimensions
4. **Error Recovery**: Graceful fallbacks

## 🚀 Next Steps After Testing

1. **Report Issues**: Note any bugs or UX issues
2. **Feature Requests**: What's missing?
3. **Performance**: Any lag or delays?
4. **UI/UX**: Confusing elements?

---

## Quick Links:
- [Social Media Page](http://localhost:3000/dashboard/content) → Select "Social Media"
- [Blog Creation](http://localhost:3000/dashboard/content) → Select "Blog Post"
- [Content Studio](http://localhost:3000/dashboard/content)

Ready to create amazing content with AI-powered visuals! 🎨✨ 