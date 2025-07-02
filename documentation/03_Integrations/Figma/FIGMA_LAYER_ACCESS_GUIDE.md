# Figma Layer Access Guide

## Overview

This guide explains how to access individual layers within Figma designs, including nested elements, image overlays, and gradient fills.

## Enhanced Layer Access

### Problem Solved

Previously, we could only access top-level components and basic style information. Now we can:

1. **Access individual layers** within frames
2. **Extract image references** from image fills
3. **Process gradient data** with actual color stops
4. **Export individual layers** as images
5. **Generate CSS** from layer properties

### Example: PatchlineAI Brand Guide

For the `PatchlineAI_Brand Guide_Simple` frame:

```
📦 PatchlineAI_Brand Guide_Simple (FRAME)
   - Background: #121212
   - Size: 1704 × 958px
   
   📦 74 (RECTANGLE) - Image Overlay
      - Type: IMAGE fill
      - Position: Offset for overlay effect
      - Exportable as PNG
   
   📦 Logo Group (GROUP)
      - White vector graphic
   
   📦 www.patchline.ai (TEXT)
      - White text
```

## Using the Layer Extractor

### 1. Basic Usage

```typescript
import { FigmaClient, LayerExtractor } from '@/lib/figma'

const client = new FigmaClient(process.env.FIGMA_ACCESS_TOKEN!)
const extractor = new LayerExtractor(client)

// Get detailed layer information
const layer = await extractor.getLayerDetails(
  'your-file-id',
  '113:11' // Node ID
)

// Find specific layer by name
const imageLayer = extractor.findLayerByName(layer, '74')
```

### 2. Rendering Layers in React

```typescript
import { FigmaFrameRenderer } from '@/components/figma/figma-layer-renderer'

export function BrandGuidePreview({ layerData }) {
  return (
    <FigmaFrameRenderer 
      frameData={layerData}
      width={800} // Scale to fit
      className="rounded-lg shadow-lg"
    />
  )
}
```

### 3. Extracting Layer Styles

```typescript
// Get all gradient layers
const gradientLayers = layer.children?.filter(child => 
  child.fills?.some(fill => fill.type?.includes('GRADIENT'))
)

// Extract CSS styles
gradientLayers?.forEach(layer => {
  console.log(`Layer: ${layer.name}`)
  console.log(`CSS: ${layer.cssStyles?.background}`)
})
```

## API Endpoints

### Get Layer Details

```typescript
// app/api/figma/layers/[nodeId]/route.ts
export async function GET(request: Request, { params }) {
  const { nodeId } = params
  const fileId = process.env.FIGMA_FILE_ID
  
  const client = new FigmaClient(process.env.FIGMA_ACCESS_TOKEN!)
  const extractor = new LayerExtractor(client)
  
  const layer = await extractor.getLayerDetails(fileId, nodeId)
  
  return NextResponse.json(layer)
}
```

## Layer Properties

### Fill Types

1. **SOLID** - Single color fill
   ```typescript
   {
     type: 'SOLID',
     color: { r: 0.07, g: 0.07, b: 0.07, a: 1 },
     opacity: 1
   }
   ```

2. **IMAGE** - Image fill with reference
   ```typescript
   {
     type: 'IMAGE',
     imageRef: 'eedbd9a7aa6411741ae6493014b0d885a491d097',
     scaleMode: 'FILL'
   }
   ```

3. **GRADIENT_LINEAR** - Linear gradient
   ```typescript
   {
     type: 'GRADIENT_LINEAR',
     gradientStops: [
       { position: 0, color: { r: 0, g: 0.9, b: 0.89, a: 1 } },
       { position: 1, color: { r: 0.53, g: 0, b: 1, a: 1 } }
     ]
   }
   ```

### Blend Modes

- `NORMAL` - Standard rendering
- `PASS_THROUGH` - For groups, inherits parent blend
- `MULTIPLY`, `SCREEN`, `OVERLAY` - Photoshop-like blend modes

## Hybrid Approach Best Practices

### 1. Design Tokens from Figma

Extract and maintain design tokens in code:

```typescript
// lib/brand/figma-tokens.ts
export const FIGMA_TOKENS = {
  colors: {
    background: '#121212',
    primary: '#00E6E4',
    text: '#FFFFFF'
  },
  spacing: {
    frame: { width: 1704, height: 958 }
  }
}
```

### 2. Component Structure from Figma

Use Figma for layout reference but build with React:

```typescript
export function BrandCard() {
  return (
    <div className="relative bg-[#121212] overflow-hidden">
      {/* Image overlay from Figma */}
      <div className="absolute inset-0 scale-110">
        <Image src="/figma-export.png" alt="" fill />
      </div>
      
      {/* Content layer */}
      <div className="relative z-10 p-8">
        {/* Your content */}
      </div>
    </div>
  )
}
```

### 3. Dynamic Asset Loading

Load Figma assets dynamically when needed:

```typescript
const useFigmaAsset = (nodeId: string) => {
  const [assetUrl, setAssetUrl] = useState<string>()
  
  useEffect(() => {
    fetch(`/api/figma/export/${nodeId}`)
      .then(res => res.json())
      .then(data => setAssetUrl(data.url))
  }, [nodeId])
  
  return assetUrl
}
```

## Next Steps

1. **Implement caching** for Figma API responses
2. **Create Figma webhook** for design updates
3. **Build component library** synced with Figma
4. **Add version control** for design changes
5. **Implement A/B testing** with Figma variants

## Limitations

1. **Gradient styles** - Only direct gradient fills are accessible, not style references
2. **Complex effects** - Some effects need manual CSS translation
3. **Performance** - Large files need pagination
4. **Rate limits** - Figma API has request limits

## Resources

- [Figma API Docs](https://www.figma.com/developers/api)
- [Layer Extractor Source](/lib/figma/layer-extractor.ts)
- [Example Implementation](/scripts/get-figma-layers-detailed.ts) 