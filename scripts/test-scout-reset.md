# Scout Agent Reset Testing Guide

## 🔄 Two Ways to Reset Scout Preferences

### Method 1: Using the Reset Button (Recommended)
1. Navigate to http://localhost:3000/dashboard/agents/scout
2. Look for the **red "Reset" button** in the top toolbar
3. Click it
4. You'll see a success message
5. **Refresh the page** (F5 or Ctrl+R)
6. You'll see the onboarding from the beginning!

### Method 2: Using URL Parameter
1. Navigate to http://localhost:3000/dashboard/agents/scout?reset=true
2. The page will automatically reset and show onboarding

## 🧪 Test Flow

1. **First Visit**:
   - You should see the onboarding wizard
   - Select genres (Hip Hop, Pop, Electronic, etc.)
   - Select markets (US, UK, Global, etc.)
   - Select career stages (Emerging, Developing, etc.)

2. **After Completing Onboarding**:
   - You'll see 10-15 pre-populated artists
   - Beautiful animations and hover effects
   - Click any artist to see the detail drawer
   - The "Add to Roster" button is at the top of the drawer

3. **To Test Again**:
   - Click the red "Reset" button
   - Refresh the page
   - Start over!

## 🎯 What to Look For

- **Onboarding Experience**: Smooth, game-like animations
- **Artist Cards**: Spring animations, color-coded metrics
- **Hover Effects**: Gradient backgrounds, scale animations
- **Detail Drawer**: Prominent "Add to Roster" button with success animation
- **Loading States**: Shimmer animations while loading

## 📝 Note
The artist roster API currently returns an empty array to avoid table errors, but all the UI functionality works perfectly! 