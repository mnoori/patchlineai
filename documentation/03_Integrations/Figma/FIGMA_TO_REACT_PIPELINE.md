# Figma to React Pipeline - Complete Guide

## 🚀 Overview

We've built a custom Figma to React conversion pipeline that transforms your Figma designs into production-ready React components with Tailwind CSS. This system is optimized for performance and integrates seamlessly with your existing brand system.

## ✅ What's Been Implemented

### 1. **Performance-Optimized Layer Extractor**
- **Lazy loading**: Only fetches layer data when needed
- **Caching**: Reduces redundant API calls
- **Shallow fetching**: Loads only one level at a time
- **Fixed the 2MB+ data issue**: No more timeouts!

### 2. **Sophisticated React Generator**
- Converts Figma layers to clean React components
- Generates Tailwind CSS classes automatically
- Supports Next.js Image optimization
- Includes Framer Motion animations (optional)
- Handles responsive design constraints

### 3. **CLI Tool for Easy Conversion**
- Simple commands to convert designs
- Watch mode for continuous updates
- Batch sync from entire pages
- Asset extraction and optimization

### 4. **Updated UI Components**
- Fixed FigmaLayerShowcase component
- Proper page and layer display
- Interactive layer exploration
- Code preview functionality

## 🛠️ Getting Started

### Prerequisites

Ensure your `.env.local` file has:
```env
FIGMA_ACCESS_TOKEN=figd_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIGMA_FILE_ID=PbzhWQIGJF68IPYo8Bheck
```

### Basic Usage

#### 1. List Available Pages
```bash
pnpm figma:list
```

This shows all pages in your Figma file:
```
Figma File Pages:
  Logo Design - ID: 42:413
  Brand Guide - ID: 113:2
  Social Media - ID: 113:3
```

#### 2. Convert a Single Component
```bash
pnpm figma:convert <nodeId> <ComponentName>

# Example:
pnpm figma:convert 113:12 BrandHero
```

#### 3. Sync an Entire Page
```bash
pnpm figma:sync <pageId>

# Example:
pnpm figma:sync 113:2
```

#### 4. Watch Mode (Auto-sync)
Create a `figma-watch.json` file:
```json
{
  "components": [
    { "nodeId": "113:12", "componentName": "BrandHero" },
    { "nodeId": "113:45", "componentName": "LogoVariant" }
  ]
}
```

Then run:
```bash
pnpm figma:watch
```

## 📁 Output Structure

Generated components are saved to:
```
components/generated/
├── BrandHero.tsx         # React component
├── BrandHero.module.css  # CSS module (if not using Tailwind)
└── ...

public/figma-assets/
├── brandHero.png         # Exported assets
└── ...
```

## 🎨 Generated Component Example

Input: A Figma frame with gradient background and text

Output:
```typescript
import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BrandHeroProps {
  className?: string
}

export function BrandHero({ className }: BrandHeroProps) {
  return (
    <motion.div 
      className={cn(
        "relative w-[1200px] h-[600px] bg-gradient-to-r rounded-xl shadow-lg",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-4xl font-bold">
        Welcome to Patchline
      </h2>
    </motion.div>
  )
}
```

## 🔧 Advanced Features

### Custom Tailwind Classes
The generator maps Figma properties to Tailwind:
- **Fills** → Background colors/gradients
- **Effects** → Shadows, blur
- **Constraints** → Responsive utilities
- **Corner Radius** → Border radius
- **Strokes** → Borders

### Asset Handling
- Automatically detects exportable layers
- Downloads and optimizes images
- Generates proper Next.js Image components
- Supports SVG exports (coming soon)

### Component Properties
Figma component properties are converted to React props:
```typescript
// Figma component with "variant" property
// becomes:
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
}
```

## 🚀 Best Practices

### 1. **Organize Your Figma File**
- Use clear, descriptive layer names
- Group related elements in frames
- Set up proper constraints for responsive design
- Mark exportable assets with export settings

### 2. **Naming Conventions**
- Component names: PascalCase (e.g., "Brand Hero")
- Layer names: Descriptive (e.g., "header-background")
- Avoid special characters in names

### 3. **Performance Tips**
- Use shallow fetching for large designs
- Convert components individually when possible
- Cache frequently used components
- Clean up unused generated components

### 4. **Integration with Brand System**
Generated components automatically use your brand constants:
```typescript
// Automatically uses brand colors from lib/brand/constants.ts
className="bg-primary text-primary-foreground"
```

## 🐛 Troubleshooting

### Layer Names Not Showing
- ✅ Fixed! The new implementation properly displays all layer names

### Slow Performance
- ✅ Fixed! Using lazy loading and shallow fetching

### Missing Assets
- Ensure layers have export settings in Figma
- Check the `public/figma-assets` directory
- Verify file permissions

### API Rate Limits
- The system includes automatic retry logic
- Consider implementing request queuing for large conversions

## 📈 Next Steps

### Planned Improvements
1. **SVG Support**: Direct SVG export and optimization
2. **Style Variables**: Extract and use Figma variables
3. **Component Library**: Auto-generate Storybook stories
4. **Design Tokens**: Sync with your token system
5. **Git Integration**: Auto-commit generated components

### Community Contributions
Feel free to extend the system:
- Add new framework support (Vue, Angular)
- Implement additional CSS frameworks
- Create custom transformers
- Add more animation presets

## 📚 API Reference

### LayerExtractor Methods
```typescript
getLayerInfo(fileId: string, nodeId: string): Promise<EnhancedLayer>
getLayerChildren(fileId: string, nodeId: string): Promise<EnhancedLayer[]>
getExportableAssets(fileId: string, nodeId: string): Promise<Asset[]>
```

### ReactGenerator Options
```typescript
interface GeneratorOptions {
  componentName: string
  useTailwind?: boolean      // default: true
  useTypeScript?: boolean     // default: true
  framework?: 'next' | 'react' // default: 'react'
  includeAnimations?: boolean // default: true
  responsiveBreakpoints?: boolean // default: true
}
```

## 🎉 Success!

You now have a powerful Figma to React pipeline that:
- ✅ Handles large designs efficiently
- ✅ Generates clean, production-ready code
- ✅ Integrates with your brand system
- ✅ Supports modern React patterns
- ✅ Is extensible and customizable

Happy designing and coding! 🚀 