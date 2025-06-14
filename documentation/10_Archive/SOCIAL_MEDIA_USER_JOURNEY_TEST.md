# Social Media Content Creation - User Journey Test Guide

## 🎯 Overview

This guide walks through the complete user journey for creating social media content with AI-generated text and images in Patchline's Content Studio.

## 📋 Test Scenarios

### Scenario 1: Instagram Music Release Announcement

**User Goal**: Create an Instagram post announcing a new single release

**Test Steps**:

1. **Navigate to Content Studio**
   - Go to `/dashboard/content`
   - Click "Social Media" content type

2. **Choose Content Idea or Write Your Own**
   - Select "New Release Announcement Campaign" OR
   - Click "Write Your Own"

3. **Fill Social Media Form**
   - **Platform**: Instagram
   - **Post Topic**: "Excited to announce my new single 'Midnight Dreams' dropping this Friday!"
   - **Post Tone**: Enthusiastic & Energetic
   - **Target Audience**: "indie pop fans, young adults"
   - **Include Hashtags**: ✅ Enabled
   - **Include Emojis**: ✅ Enabled

4. **Generate Visual Content**
   - Scroll to "AI Image Generation" section (appears after entering topic)
   - **Style**: Instagram (auto-selected)
   - Review auto-generated prompt:
     ```
     Social media post visual about Excited to announce my new single 
     'Midnight Dreams' dropping this Friday!, instagram post, square 
     format, bold design, social media optimized
     ```
   - Click "Generate Images"
   - Wait for 3 variations (mock or real)
   - Select preferred image

5. **Preview Integration**
   - See selected image in Instagram preview mockup
   - Review complete post with image + text + hashtags
   - Verify 1080x1080 square format

6. **Generate Content**
   - Click "Generate & Preview Posts"
   - Review generated variations

### Scenario 2: Twitter Tour Announcement

**User Goal**: Create a Twitter thread announcing tour dates

**Test Steps**:

1. **Start New Content**
   - Platform: Twitter
   - Topic: "TOUR ANNOUNCEMENT! West Coast dates just dropped"
   - Tone: Professional
   - Target Audience: "existing fans, concert-goers"

2. **Image Generation**
   - Style dropdown shows Twitter-specific option
   - Auto-prompt includes "twitter banner, horizontal format"
   - Generated images are 1500x500 (Twitter optimal)

3. **Preview Shows**:
   - Tweet text with character count
   - Attached image in Twitter card format
   - Hashtag suggestions

### Scenario 3: TikTok Behind-the-Scenes

**User Goal**: Create TikTok video description with thumbnail

**Test Steps**:

1. **Platform Selection**: TikTok
2. **Content Details**:
   - Topic: "Studio sessions for the new album - day 3 vibes"
   - Tone: Casual & Friendly
   - Include trending hashtags

3. **Image Generation**:
   - Vertical format (1080x1920)
   - Style: "trendy, gen-z aesthetic"
   - Image becomes video thumbnail/background

4. **Preview Features**:
   - Vertical TikTok format
   - Generated image as background
   - Text overlay with description
   - Trending hashtags

## 🧪 Testing Checklist

### Form Functionality
- [ ] Platform selection updates preview format
- [ ] Topic input enables image generation section
- [ ] Tone selection affects auto-generated prompts
- [ ] Toggle switches work (hashtags, emojis)

### Image Generation
- [ ] Component appears only after topic is entered
- [ ] Auto-prompt reflects content details
- [ ] Platform affects image dimensions:
  - Instagram: 1080x1080
  - Twitter: 1500x500
  - TikTok: 1080x1920
- [ ] Generate 3 variations
- [ ] Selection updates preview
- [ ] Download functionality works

### Platform Previews
- [ ] Instagram shows square post with image
- [ ] Twitter shows card layout with image
- [ ] TikTok shows vertical format with background
- [ ] Generated image integrates correctly
- [ ] Text/hashtags/emojis display properly

### Mock vs Real Mode
- [ ] Mock mode shows informative placeholders
- [ ] Real mode generates actual images (when enabled)
- [ ] Error handling for policy violations
- [ ] Loading states during generation

## 📊 Expected Results

### Mock Mode (Default)
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

### Real Mode (Nova Canvas Enabled)
- High-quality images matching prompts
- Platform-optimized dimensions
- Professional visuals for music content
- Brand-appropriate styling

## 🐛 Edge Cases to Test

1. **No Topic Entered**
   - Image generator should not appear
   - Submit button disabled

2. **Very Long Topic**
   - Truncation in preview
   - Full text in prompt

3. **Platform Switching**
   - Image dimensions update
   - Style options change
   - Preview format updates

4. **Network Errors**
   - Graceful error messages
   - Retry functionality
   - Mock fallback

5. **Content Policy**
   - Test with brand names
   - Appropriate error messages
   - Suggestion for alternatives

## 🚀 Performance Metrics

### Target Performance
- Image generation: < 5 seconds
- Preview updates: Instant
- Form interactions: No lag
- Image loading: Progressive

### User Experience Goals
- Clear visual feedback
- Intuitive platform selection
- Smart defaults reduce work
- Professional results

## 📝 Test Data Examples

### Instagram Posts
```
Topic: "New merch drop! Limited edition vinyl available now"
Audience: "vinyl collectors, indie music fans"
Expected: Product-focused image, shopping tags
```

### Twitter Announcements
```
Topic: "Just won Best New Artist! Thank you for all your support"
Audience: "fans, music industry professionals"
Expected: Celebration imagery, award visuals
```

### TikTok Content
```
Topic: "Day in the life of a touring musician"
Audience: "gen z music fans, aspiring musicians"
Expected: Lifestyle/behind-scenes imagery
```

## ✅ Success Criteria

1. **Functional Success**
   - All form fields work correctly
   - Image generation completes successfully
   - Platform previews update dynamically
   - Generated content matches specifications

2. **Visual Success**
   - Images match platform requirements
   - Consistent quality across generations
   - Appropriate style for content type
   - Professional appearance

3. **User Experience Success**
   - Intuitive workflow
   - Clear feedback at each step
   - Fast generation times
   - Easy selection process

## 🔄 Iteration Testing

After initial content generation:
1. Try regenerating images with same prompt
2. Modify prompt and regenerate
3. Switch platforms and test adaptation
4. Test with different content tones

---

This comprehensive test ensures the social media content creation workflow delivers a professional, efficient experience for music industry users. 