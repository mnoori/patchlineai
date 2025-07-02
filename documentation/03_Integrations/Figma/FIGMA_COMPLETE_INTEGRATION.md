# Complete Figma Integration System

## Overview

This document describes the complete Figma integration system that allows you to:
1. Extract individual layers from any Figma page
2. Convert entire Figma pages to React components
3. Extract and maintain a universal brand system
4. Use Figma as the source of truth for your website design

## System Architecture

```
Figma Design File
      ↓
┌─────────────────────────────────────┐
│     Layer Access System             │
├─────────────────────────────────────┤
│ • LayerExtractor                    │
│ • Individual layer properties       │
│ • Export capabilities               │
│ • CSS generation                    │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│   Page-to-Component Converter       │
├─────────────────────────────────────┤
│ • PageToComponentConverter          │
│ • Automatic React generation        │
│ • Asset management                  │
│ • Responsive scaling                │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│    Universal Brand System           │
├─────────────────────────────────────┤
│ • BrandExtractor                    │
│ • Colors & Gradients                │
│ • Typography                        │
│ • Spacing & Effects                 │
└─────────────────────────────────────┘
```

## Brand Showcase Integration

The Brand Showcase page (`/brand-showcase`) serves as the central hub where all Figma data flows into your application:

### 1. FigmaShowcase Component
- Displays file overview and statistics
- Shows available components, colors, and assets
- Provides export capabilities

### 2. FigmaLayerShowcase Component
- Interactive layer explorer
- Real-time preview of layers
- CSS code generation
- Individual layer export

### 3. Brand System Usage
- All extracted brand elements are available
- Consistent styling across the application
- Single source of truth from Figma

## Usage Workflow

### Step 1: Define Backbone Pages in Figma

Name your Figma pages with clear, distinct names:
- `Homepage`
- `About`
- `Features`
- `Pricing`

### Step 2: Run the Conversion Script

```bash
pnpm tsx scripts/demo-figma-page-conversion.ts
```

This will:
1. Extract the universal brand system
2. Convert specified pages to React components
3. Save everything to your codebase

### Step 3: Use Generated Components

```typescript
import { Homepage } from '@/components/generated-from-figma/Homepage'
import { FIGMA_BRAND } from '@/lib/brand/figma-brand-system'

export default function IndexPage() {
  return <Homepage width={1920} />
}
```

## Individual Layer Access

For fine-grained control, use the FigmaLayerShowcase in brand-showcase:

1. Navigate to `/brand-showcase`
2. Scroll to "Figma Layer Explorer" section
3. Select any page and explore its layers
4. Preview, export, or copy CSS for any layer

### Example: Accessing Layer "74"

```typescript
const extractor = new LayerExtractor(figmaClient)
const layer = await extractor.getLayerDetails(fileId, '113:11')
const imageLayer = extractor.findLayerByName(layer, '74')

// Use the exported image URL
<Image src={imageLayer.exportUrl} alt="Background" fill />
```

## Universal Brand Elements

The system automatically extracts:

### Colors
- Primary colors (cyan, magenta, etc.)
- Secondary colors
- Neutral colors
- Gradients (with actual CSS)

### Typography
- Font families
- Heading styles
- Body text styles
- Special text styles

### Components
- Background styles
- Button styles
- Card styles
- Section styles

### Effects
- Shadows
- Glows
- Blurs

## Best Practices

### 1. Figma Organization
- Use clear, consistent naming
- Publish components you want to sync
- Define color and text styles
- Use auto-layout for spacing extraction

### 2. One-Time Sync Approach
- Run sync when designs are stable
- Commit generated files to version control
- Use generated components as starting points
- Add interactivity and dynamic content in code

### 3. Hybrid Development
- **From Figma**: Layout, colors, spacing, static assets
- **In Code**: Interactions, animations, dynamic content, responsive behavior

### 4. Component Library Pattern
```typescript
// Base component from Figma
import { BrandCard as FigmaBrandCard } from '@/components/generated-from-figma'

// Enhanced with functionality
export function BrandCard({ title, content, onClick }) {
  return (
    <FigmaBrandCard>
      <h3>{title}</h3>
      <p>{content}</p>
      <button onClick={onClick}>Learn More</button>
    </FigmaBrandCard>
  )
}
```

## API Endpoints

### Get Figma Pages
```
GET /api/figma/pages?fileId={fileId}
```

### Get Layer Details
```
GET /api/figma/layers/{nodeId}?fileId={fileId}
```

## Scripts

### Explore Figma File
```bash
pnpm tsx scripts/explore-figma-file.ts
```

### Get Specific Layer Details
```bash
pnpm tsx scripts/get-figma-layers-detailed.ts
```

### Convert Pages to Components
```bash
pnpm tsx scripts/demo-figma-page-conversion.ts
```

## Environment Variables

```env
FIGMA_ACCESS_TOKEN=your_personal_access_token
FIGMA_FILE_ID=your_default_file_id
```

## Troubleshooting

### Issue: Can't see individual layers
**Solution**: Make sure the layer is visible in Figma and has export settings if you want to export it.

### Issue: Gradients show as "Linear"
**Solution**: This is a Figma API limitation. The system extracts actual gradients from the document structure instead.

### Issue: Components not updating
**Solution**: This is a one-time sync system. Re-run the conversion script when you need updates.

## Next Steps

1. **Set up CI/CD**: Automate the sync process in your build pipeline
2. **Add caching**: Cache Figma API responses to reduce API calls
3. **Create templates**: Build template components that use Figma data
4. **Version control**: Track changes to generated components

## Conclusion

This system provides a comprehensive bridge between Figma and your React application, allowing you to:
- Use Figma as the design source of truth
- Automatically generate React components
- Maintain consistent branding
- Access individual layers when needed
- Build a hybrid approach with the best of both worlds

The Brand Showcase page serves as the central hub where all these capabilities come together, making it easy to explore, preview, and utilize your Figma designs in code. 