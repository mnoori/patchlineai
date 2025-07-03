# Figma Layer Names Display Issue - Troubleshooting Guide

## 🐛 Issue Description

**Symptom**: Layer names appeared once in the FigmaLayerShowcase component but then disappeared  
**Component**: `/components/brand/figma-layer-showcase.tsx`  
**Reported**: Layer tree shows structure but names are missing or not persisting

## 🔍 Root Cause Analysis

After reviewing the code, here are the likely causes:

### 1. State Management Issue
The component fetches layer data but might not properly persist it:

```typescript
// Current implementation at line 91-108
fetch(`/api/figma/layers/${selectedPage}?fileId=${fileId}`)
  .then(res => res.json())
  .then(data => {
    setPageData(data.layer) // ← Potential issue here
  })
```

### 2. Missing Environment Variables
The API might be failing silently:
- No `.env.local` file found
- API returns error but UI doesn't show it properly

### 3. Data Structure Mismatch
The layer data structure might not match what the component expects.

## 🛠️ Quick Fix Steps

### Step 1: Verify Environment Setup

```powershell
# Check if .env.local exists
Test-Path .env.local

# If not, create it:
@"
FIGMA_ACCESS_TOKEN=your_personal_access_token_here
FIGMA_FILE_ID=PbzhWQIGJF68IPYo8Bheck
FIGMA_CLIENT_ID=optional_for_now
FIGMA_CLIENT_SECRET=optional_for_now
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

### Step 2: Add Debug Logging

Update `/components/brand/figma-layer-showcase.tsx`:

```typescript
// Add after line 101 in the fetch success handler
.then(data => {
  console.log('Received layer data:', data)
  if (data.error) {
    throw new Error(data.error)
  }
  console.log('Setting page data:', data.layer)
  setPageData(data.layer)
  
  // Debug: Check if layer names exist
  if (data.layer) {
    console.log('Root layer name:', data.layer.name)
    console.log('Has children:', data.layer.children?.length)
  }
})
```

### Step 3: Fix Layer Name Rendering

The issue might be in the `renderLayerTree` function. Check line 152:

```typescript
// Current:
<span className="text-sm flex-1 truncate">{layer.name}</span>

// Add fallback:
<span className="text-sm flex-1 truncate">
  {layer.name || `Unnamed ${layer.type}`}
</span>
```

### Step 4: Verify API Response

Test the API directly:

```powershell
# First, get the page ID
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/figma/pages?fileId=PbzhWQIGJF68IPYo8Bheck"
$response.pages | ConvertTo-Json

# Then test layer endpoint with a page ID
$pageId = $response.pages[0].id
Invoke-RestMethod -Uri "http://localhost:3000/api/figma/layers/$pageId?fileId=PbzhWQIGJF68IPYo8Bheck" | ConvertTo-Json -Depth 10
```

## 🔧 Permanent Fix

### Update the Component State Handling

```typescript
// In figma-layer-showcase.tsx, enhance error handling and data validation:

// Add after imports
interface FigmaPageData {
  layer: FigmaLayer | null
  error?: string
}

// Update state
const [pageData, setPageData] = useState<FigmaLayer | null>(null)
const [dataError, setDataError] = useState<string | null>(null)

// Update fetch handler
useEffect(() => {
  if (!selectedPage) return
  
  setLoading(true)
  setError(null)
  setDataError(null)
  
  fetch(`/api/figma/layers/${selectedPage}?fileId=${fileId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      return res.json()
    })
    .then(data => {
      console.log('API Response:', data) // Debug log
      
      if (data.error) {
        setDataError(data.error)
        return
      }
      
      if (!data.layer) {
        setDataError('No layer data received')
        return
      }
      
      // Validate layer structure
      if (!data.layer.name || !data.layer.id) {
        console.warn('Layer missing required fields:', data.layer)
      }
      
      setPageData(data.layer)
    })
    .catch(err => {
      console.error('Error fetching layers:', err)
      setError(err.message)
    })
    .finally(() => setLoading(false))
}, [selectedPage, fileId])
```

## 🧪 Testing Checklist

1. ✅ Environment variables are set correctly
2. ✅ API endpoints return valid data
3. ✅ Console shows layer names in debug logs
4. ✅ Layer tree displays names persistently
5. ✅ No console errors during navigation

## 🚀 Alternative Solution: Mock Data

If API issues persist, temporarily use mock data:

```typescript
// Add to figma-layer-showcase.tsx for testing
const mockLayerData: FigmaLayer = {
  id: 'mock-1',
  name: 'Test Page',
  type: 'FRAME',
  visible: true,
  children: [
    {
      id: 'mock-2',
      name: 'Header Section',
      type: 'FRAME',
      visible: true,
      children: [
        {
          id: 'mock-3',
          name: 'Logo',
          type: 'GROUP',
          visible: true
        }
      ]
    }
  ]
}

// Use mock data if API fails
.catch(err => {
  console.error('Using mock data due to error:', err)
  setPageData(mockLayerData)
})
```

## 📝 Long-term Improvements

1. **Add retry logic** for failed API calls
2. **Implement caching** to prevent data loss
3. **Add loading skeletons** for better UX
4. **Create error boundaries** for graceful failures
5. **Add unit tests** for layer tree rendering

## 🎯 Quick Test

After implementing fixes, test with:

```powershell
# Start dev server
pnpm dev

# Navigate to brand showcase
Start-Process "http://localhost:3000/brand-showcase"

# Check console for debug logs
# Should see layer names in the Layer Structure panel
```

If layer names still don't appear, check:
1. Browser console for errors
2. Network tab for API response
3. React DevTools for component state

---

**Need more help?** Share the console logs and API response for deeper debugging. 