# Patchline AI Brand Implementation Guide

## Overview

This guide documents the centralized brand system implementation for Patchline AI. The brand system ensures consistency across the application by providing a single source of truth for colors, typography, spacing, and other design tokens.

## Brand System Structure

```
lib/brand/
├── constants.ts    # Brand constants (colors, typography, etc.)
├── utils.ts        # Utility functions for brand system
└── index.ts        # Main export file

components/brand/
├── logo.tsx              # Brand-aware logo component
├── gradient-text.tsx     # Gradient text component
├── logo-showcase.tsx     # Logo usage examples
├── button.tsx            # Brand button component
├── card.tsx              # Brand card system
├── gradient-background.tsx # Gradient backgrounds & orbs
├── feature-card.tsx      # Feature highlight cards
├── hero-section.tsx      # Complete hero section
└── index.ts              # Component exports

app/
├── fonts.css       # Font declarations and loading
└── globals.css     # Global styles with brand CSS variables
```

## Usage Examples

### 1. Using Brand Colors

```tsx
import { COLORS } from '@/lib/brand'

// In CSS-in-JS
const styles = {
  background: COLORS.primary.black,
  color: COLORS.primary.brightBlue,
}

// In Tailwind classes
<div className="bg-brand-black text-brand-bright-blue">
  Content
</div>

// Using CSS variables
<div style={{ color: 'var(--brand-cyan)' }}>
  Content
</div>
```

### 2. Typography

```tsx
import { TYPOGRAPHY } from '@/lib/brand'

// Font families
<div style={{ fontFamily: TYPOGRAPHY.fontFamily.primary }}>
  Body text in Helvetica Neue
</div>

// Font weights (via Tailwind)
<h1 className="font-extrabold">Heading</h1>
<p className="font-regular">Body text</p>
```

### 3. Logo Component

```tsx
import { Logo } from '@/components/brand'

// Basic logo
<Logo />

// Logo with text
<Logo showText={true} />

// Different sizes
<Logo size="sm" />  // 24px
<Logo size="md" />  // 32px (default)
<Logo size="lg" />  // 40px
<Logo size="xl" />  // 48px

// Different variants
<Logo variant="primary" />      // Default logo
<Logo variant="transparent" />  // Transparent background
<Logo variant="icon" />         // Icon only
```

### 4. Gradient Text

```tsx
import { GradientText } from '@/components/brand'

// Default brand gradient
<GradientText>
  Welcome to Patchline AI
</GradientText>

// Different gradient presets
<GradientText gradient="cyan">
  Cyan to Blue gradient
</GradientText>

<GradientText gradient="blue">
  Blue gradient
</GradientText>

// Custom gradient
<GradientText gradient="custom" customColors={['#FF0000', '#00FF00']}>
  Custom gradient
</GradientText>

// Different directions
<GradientText direction="to bottom">
  Vertical gradient
</GradientText>

<GradientText direction={45}>
  45-degree gradient
</GradientText>
```

### 5. Gradient Utilities

```tsx
import { createGradient } from '@/lib/brand'

// Create custom gradients
const myGradient = createGradient('to right', ['#FF0000', '#00FF00', '#0000FF'])

// Use in styles
<div style={{ background: myGradient }}>
  Gradient background
</div>
```

### 6. Brand Buttons

```tsx
import { Button } from '@/components/brand'

// Button variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="gradient">Gradient</Button>
<Button variant="glow">Glow Effect</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Combined props
<Button variant="gradient" size="lg">
  Large Gradient Button
</Button>
```

### 7. Logo Usage Guidelines

The brand guide specifies 4 main logo usage scenarios:

```tsx
import { Logo } from '@/components/brand'

// 01 - White on Gradient
<div style={{ background: 'linear-gradient(...)' }}>
  <Logo background="gradient" showText />
</div>

// 02 - White on Image/Video
<div style={{ backgroundImage: 'url(...)' }}>
  <Logo background="image" showText />
</div>

// 03 - White on Black
<div className="bg-black">
  <Logo background="black" showText />
</div>

// 04 - Color on Neutral
<div className="bg-gray-100">
  <Logo background="neutral" variant="color" showText />
</div>
```

### 8. Brand Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand'

// Card variants
<Card variant="default">Default card</Card>
<Card variant="glass">Glass morphism</Card>
<Card variant="gradient">Gradient border</Card>
<Card variant="outlined">Outlined with glow</Card>
<Card variant="elevated">Elevated shadow</Card>

// With hover effects
<Card variant="outlined" hover="glow">Glowing on hover</Card>
<Card variant="elevated" hover="lift">Lifts on hover</Card>

// Complete card example
<Card variant="glass" hover="glow">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### 9. Gradient Backgrounds

```tsx
import { GradientBackground, GradientOrbs } from '@/components/brand'

// Background variants
<GradientBackground variant="hero">
  <h1>Hero content</h1>
</GradientBackground>

<GradientBackground variant="section">
  <div>Section content</div>
</GradientBackground>

// With gradient orbs animation
<div className="relative">
  <GradientOrbs />
  <div className="relative z-10">
    Content above orbs
  </div>
</div>
```

### 10. Feature Cards

```tsx
import { FeatureCard } from '@/components/brand'

<FeatureCard
  title="Feature Title"
  description="Feature description text"
  glowColor="cyan" // or "blue" or "gradient"
/>
```

### 11. Hero Section

```tsx
import { HeroSection } from '@/components/brand'

<HeroSection
  title="Your Hero Title"
  subtitle="Supporting subtitle text"
  features={[
    {
      title: "Feature 1",
      description: "Description of feature 1"
    },
    {
      title: "Feature 2", 
      description: "Description of feature 2"
    },
    {
      title: "Feature 3",
      description: "Description of feature 3"
    }
  ]}
  showLogo={true}
  logoSize="xl"
/>
```

## Brand Colors Reference

### Primary Colors
- **Black**: `#010102` - Primary background
- **Deep Blue**: `#002772` - Secondary accent
- **Bright Blue**: `#0068FF` - Primary accent, CTAs
- **Cyan**: `#00E6E2` - Highlight color

### Gradient Colors
- **Start**: `#70F7EA` - Cyan gradient start
- **Middle**: `#2A09CC` - Blue gradient middle  
- **End**: `#090030` - Dark gradient end

### UI Colors
- **Background**: `#010102` - Main background
- **Foreground**: `#FAFAFA` - Main text
- **Card**: `#1A1A1B` - Card backgrounds
- **Border**: `#262626` - Borders
- **Muted**: `#525252` - Muted text
- **Accent**: `#0068FF` - Accent elements

## CSS Classes

### Gradient Classes
```css
.gradient-text        /* Brand gradient text */
.gradient-border      /* Brand gradient border */
.glass-effect         /* Glass morphism effect */
.brand-button-glow    /* Pulsing brand glow */
```

### Tailwind Classes
```css
/* Colors */
.bg-brand-black
.bg-brand-deep-blue
.bg-brand-bright-blue
.bg-brand-cyan
.text-brand-*

/* Gradients */
.bg-gradient-start
.bg-gradient-middle
.bg-gradient-end
```

## Migration from Old System

### Old → New Mappings

| Old Class/Color | New Class/Color |
|----------------|-----------------|
| cosmic-teal | brand-cyan |
| cosmic-pink | gradient-middle |
| cosmic-space | brand-black |
| cosmic-midnight | brand-black |
| patchy-button-glow | brand-button-glow |

### Component Updates

```tsx
// Old
<span className="text-cosmic-teal">Text</span>

// New
<span className="text-brand-cyan">Text</span>

// Or using GradientText
<GradientText gradient="cyan">Text</GradientText>
```

## Best Practices

1. **Always use brand constants** instead of hardcoded values
2. **Use semantic color names** (e.g., `COLORS.ui.background` instead of `COLORS.primary.black`)
3. **Leverage utility functions** for gradients and color conversions
4. **Use brand components** (Logo, GradientText) for consistency
5. **Follow the typography scale** for consistent sizing
6. **Test in both light and dark modes** (when implemented)

## Future Enhancements

1. **Light Mode Support**: Add light mode color variants
2. **Animation Presets**: More brand-specific animations
3. **Icon System**: Brand-compliant icon components
4. **Component Library**: Extended set of brand components
5. **Figma Integration**: Design tokens sync with Figma

## Implementation Status

### ✅ Completed (Phase 1 & 2)
- Centralized brand configuration
- Color system implementation
- Typography setup with Helvetica Neue
- Logo component with all brand variations
- Gradient text component
- Brand button component
- Brand card system (5 variants)
- Gradient backgrounds & animated orbs
- Feature cards with glow effects
- Complete hero section component
- CSS variables and utilities
- Font loading system
- Comprehensive brand showcase page

### 🚧 In Progress (Phase 3-5)
- Update all existing components to use brand colors
- Replace hardcoded values throughout codebase
- Create additional brand components (cards, forms, etc.)
- Icon system implementation
- Animation presets

### 📋 Not Started
- Light mode support
- Figma design tokens sync
- Component documentation site

## Resources

- Brand Constants: `/lib/brand/constants.ts`
- Brand Utils: `/lib/brand/utils.ts`
- Brand Components: `/components/brand/`
- Font Declarations: `/app/fonts.css`
- Global Styles: `/app/globals.css`
- Tailwind Config: `/tailwind.config.ts`
- Brand Showcase: `/brand-showcase` 