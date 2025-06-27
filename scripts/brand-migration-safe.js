#!/usr/bin/env node

/**
 * Patchline AI Safe Brand Migration Script
 * Only changes colors and CSS classes - preserves all functionality
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// SAFE color migrations - only in className strings
const SAFE_COLOR_MIGRATIONS = {
  // Text colors
  'text-cosmic-teal': 'text-brand-cyan',
  'text-cosmic-pink': 'text-brand-bright-blue',
  'text-cosmic-blue': 'text-brand-bright-blue',
  
  // Background colors
  'bg-cosmic-teal': 'bg-brand-cyan',
  'bg-cosmic-pink': 'bg-brand-bright-blue',
  'bg-cosmic-space': 'bg-brand-black',
  'bg-cosmic-midnight': 'bg-brand-black',
  
  // Border colors
  'border-cosmic-teal': 'border-brand-cyan',
  'border-cosmic-pink': 'border-brand-bright-blue',
  
  // Hover states
  'hover:bg-cosmic-teal': 'hover:bg-brand-cyan',
  'hover:text-cosmic-teal': 'hover:text-brand-cyan',
  'hover:border-cosmic-teal': 'hover:border-brand-cyan',
  
  // Focus states
  'focus:ring-cosmic-teal': 'focus:ring-brand-cyan',
  'focus:border-cosmic-teal': 'focus:border-brand-cyan',
  
  // Gradient classes
  'from-cosmic-teal': 'from-brand-cyan',
  'to-cosmic-teal': 'to-brand-cyan',
  'via-cosmic-teal': 'via-brand-cyan',
  
  // Shadow classes
  'shadow-cosmic-teal': 'shadow-brand-cyan',
  
  // Opacity variants
  'bg-cosmic-teal/10': 'bg-brand-cyan/10',
  'bg-cosmic-teal/20': 'bg-brand-cyan/20',
  'bg-cosmic-teal/30': 'bg-brand-cyan/30',
  'bg-cosmic-teal/50': 'bg-brand-cyan/50',
  'border-cosmic-teal/10': 'border-brand-cyan/10',
  'border-cosmic-teal/20': 'border-brand-cyan/20',
  'border-cosmic-teal/30': 'border-brand-cyan/30',
  'text-cosmic-teal/70': 'text-brand-cyan/70',
}

// Hex color replacements ONLY in style attributes or CSS
const HEX_COLOR_REPLACEMENTS = {
  '#00E5FF': '#00E6E4', // cosmic-teal to brand-cyan
  '#00F0FF': '#00E6E4',
  '#FF00FF': '#0068FF', // cosmic-pink to brand-bright-blue
  '#090030': '#090030', // keep deep blue
  '#000814': '#000814', // keep brand black
}

function migrateFile(filePath, isDryRun = false) {
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  let changeCount = 0
  
  // 1. Replace Tailwind classes safely
  Object.entries(SAFE_COLOR_MIGRATIONS).forEach(([old, replacement]) => {
    // Only replace in className attributes
    const classNameRegex = new RegExp(`(className=["'\`][^"'\`]*\\b)${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b[^"'\`]*["'\`])`, 'g')
    const matches = content.match(classNameRegex)
    if (matches) {
      changeCount += matches.length
      content = content.replace(classNameRegex, `$1${replacement}$2`)
    }
    
    // Also replace in cn() function calls
    const cnRegex = new RegExp(`(cn\\([^)]*\\b)${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b[^)]*\\))`, 'g')
    const cnMatches = content.match(cnRegex)
    if (cnMatches) {
      changeCount += cnMatches.length
      content = content.replace(cnRegex, `$1${replacement}$2`)
    }
  })
  
  // 2. Replace hex colors ONLY in style attributes
  Object.entries(HEX_COLOR_REPLACEMENTS).forEach(([old, replacement]) => {
    // Only in style attributes
    const styleRegex = new RegExp(`(style={{[^}]*['"]?)${old}(['"]?[^}]*}})`, 'g')
    const matches = content.match(styleRegex)
    if (matches) {
      changeCount += matches.length
      content = content.replace(styleRegex, `$1${replacement}$2`)
    }
  })
  
  // 3. DO NOT change imports
  // 4. DO NOT add variant props
  // 5. DO NOT modify component structures
  
  if (changeCount > 0) {
    if (!isDryRun) {
      fs.writeFileSync(filePath, content)
    }
    return changeCount
  }
  
  return 0
}

function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const specificPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1]
  
  console.log('🎨 Patchline AI Safe Brand Migration')
  console.log('====================================')
  console.log(isDryRun ? '🔍 DRY RUN MODE - No files will be modified' : '✨ APPLYING SAFE BRAND COLORS')
  console.log('')
  
  // Target patterns
  const patterns = [
    'app/dashboard/**/*.{tsx,jsx}',
    'components/dashboard/**/*.{tsx,jsx}',
    'components/agents/**/*.{tsx,jsx}',
    'components/insights/**/*.{tsx,jsx}',
  ]
  
  if (specificPath) {
    patterns.length = 0
    patterns.push(`${specificPath}/**/*.{tsx,jsx}`)
  }
  
  let totalFiles = 0
  let totalChanges = 0
  const filesWithChanges = []
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] })
    
    files.forEach(file => {
      const changes = migrateFile(file, isDryRun)
      if (changes > 0) {
        totalFiles++
        totalChanges += changes
        filesWithChanges.push({ file, changes })
        console.log(`📝 ${path.relative(process.cwd(), file)}: ${changes} color changes`)
      }
    })
  })
  
  console.log('')
  console.log('📊 Migration Summary')
  console.log('===================')
  console.log(`Total files processed: ${totalFiles}`)
  console.log(`Total changes: ${totalChanges}`)
  
  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply these changes')
  } else {
    console.log('\n✅ Safe brand migration complete!')
    console.log('🎨 Only colors were changed - all functionality preserved')
  }
}

main() 