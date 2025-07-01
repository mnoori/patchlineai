# Figma Integration Guide

## Overview

The Patchline AI Figma integration provides seamless synchronization between Figma designs and production code. It supports:

- **Design Token Sync**: Automatically pull colors, typography, spacing, and other design tokens
- **Component Generation**: Convert Figma components to React components with Tailwind CSS
- **Asset Pipeline**: Export and optimize SVGs, images, and icons
- **CI/CD Integration**: Automated syncing via GitHub Actions

## Architecture

```
Figma Design File
      ↓
  Figma API
      ↓
┌─────────────────────────────────────┐
│     Figma Integration Layer         │
├─────────────────────────────────────┤
│ • FigmaClient (API wrapper)         │
│ • TokenTransformer (token mapping)  │
│ • ComponentGenerator (React codegen)│
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│        Brand System                 │
├─────────────────────────────────────┤
│ • /lib/brand/constants.ts           │
│ • /components/brand/*               │
│ • /components/generated/*           │
└─────────────────────────────────────┘
```

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Figma API Access
FIGMA_ACCESS_TOKEN=your_personal_access_token
FIGMA_FILE_ID=your_figma_file_id

# OAuth (for team access)
FIGMA_CLIENT_ID=your_app_client_id
FIGMA_CLIENT_SECRET=your_app_client_secret
```

### 2. Generate Figma Access Token

1. Go to Figma → Account Settings
2. Under "Personal Access Tokens", click "Create new token"
3. Give it a descriptive name (e.g., "Patchline Design Sync")
4. Copy the token immediately (it won't be shown again)

### 3. Find Your Figma File ID

The file ID is in your Figma file URL:
```
https://www.figma.com/file/XXXXXXXXXXXXXXXXXX/Your-Design-System
                           ^^^^^^^^^^^^^^^^^^
                           This is your file ID
```

## Usage

### Manual Token Sync

Run the sync script to update design tokens:

```bash
# One-time sync
pnpm tsx scripts/sync-figma-tokens.ts

# With specific file
FIGMA_FILE_ID=abc123 pnpm tsx scripts/sync-figma-tokens.ts
```

### Programmatic Usage

```typescript
import { createFigmaIntegration } from '@/lib/figma'

const figma = createFigmaIntegration()

// Sync design tokens
const { brandConstants } = await figma.syncDesignTokens('your-file-id')

// Generate components
const components = await figma.generateComponents('your-file-id', [
  'component-id-1',
  'component-id-2'
])

// Export assets
const assets = await figma.exportAssets('your-file-id', [
  'icon-node-id-1',
  'icon-node-id-2'
], 'svg')
```

### API Endpoints

For dynamic integration:

```typescript
// app/api/figma/sync/route.ts
import { NextResponse } from 'next/server'
import { createFigmaIntegration } from '@/lib/figma'

export async function POST(request: Request) {
  const { fileId } = await request.json()
  const figma = createFigmaIntegration()
  
  const result = await figma.syncDesignTokens(fileId)
  return NextResponse.json(result)
}
```

## Design Token Mapping

### Color Tokens

Figma colors are automatically mapped to the brand system:

| Figma Style Name | Maps To | Example |
|------------------|---------|---------|
| Primary/Cyan | `COLORS.primary.cyan` | `#00E6E4` |
| Gradient/Start | `COLORS.gradient.start` | `#00E6E4` |
| UI/Background | `COLORS.ui.background` | `#010102` |
| Semantic/Error | `COLORS.semantic.error` | `#EF4444` |

### Typography Tokens

Text styles are converted to the typography system:

```typescript
// Figma: "Heading/H1"
// Becomes:
TYPOGRAPHY.fontSize['h1'] = '3rem'
TYPOGRAPHY.fontWeight['h1'] = '700'
```

### Spacing Tokens

Auto-layout spacing is extracted:

```typescript
// Figma: 16px spacing
// Becomes:
SPACING.md = '1rem' // 16px
```

## Component Generation

### Basic Example

Given a Figma component "PrimaryButton":

```typescript
// Generated: components/generated/PrimaryButton.tsx
import React from 'react'

interface PrimaryButtonProps {
  variant?: 'default' | 'hover' | 'disabled'
  label?: string
}

export const PrimaryButton = ({ variant = 'default', label = 'Click me' }: PrimaryButtonProps) => {
  return (
    <button className="flex flex-row gap-2 p-4 bg-brand-bright-blue text-white rounded-lg">
      {label}
    </button>
  )
}
```

### Advanced Features

1. **Variant Support**: Component variants become props
2. **Auto Layout**: Converted to Flexbox with gap
3. **Constraints**: Mapped to responsive classes
4. **Effects**: Shadows and blurs preserved

## CI/CD Integration

### GitHub Actions Workflow

The workflow runs automatically:

1. **Daily**: Syncs at 2 AM UTC
2. **On Push**: When Figma config changes
3. **Manual**: Via GitHub Actions UI

```yaml
# .github/workflows/figma-sync.yml
name: Sync Figma Design Tokens

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'
```

### Setup GitHub Secrets

1. Go to Settings → Secrets → Actions
2. Add:
   - `FIGMA_ACCESS_TOKEN`
   - `FIGMA_FILE_ID`

## Best Practices

### 1. Naming Conventions

In Figma:
```
Colors:     Primary/Cyan, UI/Background
Typography: Heading/H1, Body/Regular
Components: Button/Primary, Card/Feature
```

### 2. Component Organization

```
Design System/
├── Colors/
├── Typography/
├── Components/
│   ├── Buttons/
│   ├── Cards/
│   └── Forms/
└── Icons/
```

### 3. Version Control

- Review PR changes before merging
- Keep `figma-sync-report.json` for audit trail
- Tag releases after major design updates

### 4. Performance

- Sync specific components when possible
- Cache frequently used assets
- Use SVG for icons, WebP for images

## Troubleshooting

### Common Issues

1. **"File not found"**
   - Check `FIGMA_FILE_ID` is correct
   - Ensure you have access to the file

2. **"Invalid token"**
   - Regenerate personal access token
   - Check token hasn't expired

3. **"Component not found"**
   - Publish components in Figma first
   - Use correct component IDs

### Debug Mode

Enable verbose logging:

```typescript
const figma = createFigmaIntegration()
figma.enableDebug() // If implemented
```

## Advanced Configuration

### Custom Token Mapping

```typescript
// lib/figma/custom-mapping.ts
export function customColorMapping(figmaColor: string): string {
  // Your custom logic
  return mappedColor
}
```

### Component Templates

```typescript
// lib/figma/templates/button.ts
export const buttonTemplate = (props: any) => `
  <Button variant="${props.variant}" size="${props.size}">
    ${props.label}
  </Button>
`
```

## Migration Guide

### From Manual Updates

1. Run initial sync to capture current state
2. Compare generated vs existing constants
3. Merge carefully, preserving customizations
4. Set up automated workflow

### From Other Tools

- **Figma Tokens Plugin**: Export JSON, transform with our tool
- **Style Dictionary**: Use similar token structure
- **Design Systems Manager**: Map to our format

## Future Enhancements

- [ ] Real-time WebSocket sync
- [ ] Figma plugin for direct export
- [ ] AI-powered component matching
- [ ] Design lint rules
- [ ] Version history tracking

## Resources

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Design Tokens W3C Spec](https://www.w3.org/community/design-tokens/)
- [Patchline Brand Guide](/brand-showcase) 