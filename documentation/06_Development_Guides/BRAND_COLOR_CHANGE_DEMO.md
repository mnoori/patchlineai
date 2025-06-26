# How to Change Brand Colors - Single Source of Truth Demo

Now that your entire application uses the brand system, changing colors is incredibly simple!

## Example: Change the Primary Cyan Color

Want to change the cyan color from `#00E6E4` to something else? Just update one line:

### Step 1: Open `/lib/brand/constants.ts`

```typescript
// Current:
primary: {
  cyan: '#00E6E4',  // Current cyan
}

// Change to a different cyan:
primary: {
  cyan: '#00CED1',  // Dark turquoise
}

// Or to a purple:
primary: {
  cyan: '#9333EA',  // Purple
}

// Or to a pink:
primary: {
  cyan: '#EC4899',  // Pink
}
```

### Step 2: That's It! 

This single change will update:
- ✅ All navigation hover states
- ✅ All button accents 
- ✅ All chart primary colors
- ✅ All focus states
- ✅ All badges and highlights
- ✅ All gradient text
- ✅ Notification badges
- ✅ Active states in sidebar
- ✅ Email template accents
- ✅ Loading spinners
- ✅ Progress indicators

## Example: Change Card Background Color

Don't like the current card background? Change it in one place:

```typescript
// In /lib/brand/constants.ts
ui: {
  card: '#1A1A1B',  // Current
  card: '#0F0F0F',  // Darker
  card: '#1F1F23',  // Lighter
}
```

This updates:
- All dashboard cards
- All agent cards
- Modal backgrounds
- Dropdown menus
- Icon backgrounds
- And more!

## Example: Update Chart Colors

Want a different chart color palette? 

```typescript
// In /lib/brand/chart-colors.ts
series: [
  COLORS.primary.cyan,      // Change these
  COLORS.primary.brightBlue,
  COLORS.gradient.middle,
  // Add your own colors
  '#FF6B6B',  // Coral
  '#4ECDC4',  // Teal
  '#45B7D1',  // Sky blue
]
```

All charts instantly update with the new palette!

## Pro Tips

1. **Test in Real-Time**: Run `npm run dev` and change colors - see updates instantly with hot reload
2. **Use Color Theory**: Pick colors that work well together using tools like coolors.co
3. **Maintain Contrast**: Ensure text remains readable on backgrounds
4. **Be Consistent**: Use semantic naming (success, error, warning) for clarity

## Advanced: Create Color Themes

You could even create multiple themes:

```typescript
const THEMES = {
  default: {
    primary: { cyan: '#00E6E4' },
    ui: { background: '#010102' }
  },
  midnight: {
    primary: { cyan: '#7C3AED' },  // Purple theme
    ui: { background: '#0F0F23' }
  },
  ocean: {
    primary: { cyan: '#06B6D4' },  // Ocean theme
    ui: { background: '#0C4A6E' }
  }
}

// Apply theme
export const COLORS = THEMES[currentTheme]
```

## The Power of Single Source of Truth

Before: Had to search and replace colors in 50+ files
Now: Change one file, everything updates!

This is the power of a well-architected brand system. Enjoy your new flexibility! 🎨 