# Component Organization

This document outlines how components are organized in the PatchLine AI codebase.

## Component Structure

All components are stored in the `/components` directory, with the following organization:

### UI Components (`/components/ui`)

These are low-level, reusable UI components that form the building blocks of the application. They are:
- Highly reusable
- Minimally styled (or use a design system)
- Have clear props interfaces
- Generally do not contain business logic

Examples include:
- Buttons
- Inputs
- Modals
- Cards
- Accordions

### Feature Components

These are components specific to certain features or pages of the application. They are organized by feature:

- `/components/pitch-deck` - Components related to the pitch deck feature
- `/components/ai-agent` - Components related to the AI agent functionality

### Page Sections

Components that represent major sections of pages are stored at the root level of the `/components` directory:

- `Hero.tsx`
- `TeamSection.tsx`
- `Contact.tsx`
- `About.tsx`
- etc.

## Component Guidelines

### Naming Conventions

- Use PascalCase for component names
- Be descriptive but concise
- Suffix with the component's role where appropriate (e.g., `TeamHero.tsx`, `ContactForm.tsx`)

### File Structure

Each component should follow this structure:

```tsx
// Imports
import { useState } from 'react'
import { SomeType } from '@/shared/types'

// Types
interface ComponentProps {
  // Props definition
}

// Component
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component implementation
  return (
    // JSX
  )
}
```

### Composition

Prefer composition over inheritance:

- Break down complex components into smaller, reusable parts
- Use props to pass data and callbacks
- Use children prop for flexible composition

## Examples

### UI Component Example

```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({ 
  variant = 'primary',
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Feature Component Example

```tsx
// components/pitch-deck/PitchDeckViewer.tsx
import Button from '../ui/Button'

interface PitchDeckViewerProps {
  slides: Slide[]
  currentSlide: number
  onNext: () => void
  onPrev: () => void
}

export default function PitchDeckViewer({
  slides,
  currentSlide,
  onNext,
  onPrev
}: PitchDeckViewerProps) {
  return (
    <div className="pitch-deck-viewer">
      {/* Slide content */}
      <div className="controls">
        <Button onClick={onPrev}>Previous</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}
```

## Migration Plan

When migrating components from the old structure:

1. Identify component's purpose and category
2. Place it in the appropriate location in the new structure
3. Update imports in files that use the component
4. Test that the component works as expected in its new location 