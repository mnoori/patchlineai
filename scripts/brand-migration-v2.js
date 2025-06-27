#!/usr/bin/env node

/**
 * Patchline AI Brand Migration Script V2
 * Apple-quality systematic brand application
 * 
 * This script applies:
 * 1. Color system migration
 * 2. Component pattern upgrades
 * 3. Glass effect applications
 * 4. Typography enhancements
 * 5. Spacing standardization
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Enhanced color migrations
const COLOR_MIGRATIONS = {
  // Legacy to brand colors
  'cosmic-teal': 'brand-cyan',
  'cosmic-pink': 'brand-bright-blue',
  'cosmic-space': 'brand-black',
  'cosmic-midnight': 'brand-black',
  'cosmic-blue': 'brand-bright-blue',
  
  // Hex to CSS variables
  '#00E5FF': 'brand-cyan',
  '#00F0FF': 'brand-cyan',
  '#00E6E4': 'brand-cyan',
  '#0068FF': 'brand-bright-blue',
  '#090030': 'brand-deep-blue',
  '#000814': 'brand-black',
  
  // Generic colors to brand
  'bg-gray-900': 'bg-brand-black',
  'bg-gray-800': 'bg-brand-black/90',
  'border-gray-700': 'border-brand-cyan/20',
  'border-gray-600': 'border-brand-cyan/10',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
}

// Component pattern upgrades
const COMPONENT_PATTERNS = [
  {
    // Upgrade basic cards to brand cards
    pattern: /className="([^"]*\s)?bg-card(\s[^"]*)?"/g,
    replacement: (match, before = '', after = '') => {
      if (match.includes('glass-effect')) return match
      return `className="${before}bg-card/50 backdrop-blur-xl border-brand-cyan/10${after}"`
    }
  },
  {
    // Add hover effects to interactive elements
    pattern: /className="([^"]*\s)?hover:bg-muted(\s[^"]*)?"/g,
    replacement: 'className="$1hover:bg-brand-cyan/10 transition-all duration-200$2"'
  },
  {
    // Enhance buttons without brand styling
    pattern: /<Button(\s[^>]*)?>/g,
    replacement: (match) => {
      if (match.includes('variant=')) return match
      return match.replace('>', ' variant="outline">')
    }
  }
]

// Typography enhancements
const TYPOGRAPHY_PATTERNS = [
  {
    // Enhance main headings
    pattern: /<h1(\s[^>]*)?className="([^"]*)"/g,
    replacement: (match, attrs = '', classes) => {
      if (classes.includes('gradient')) return match
      return `<h1${attrs}className="${classes} bg-gradient-to-r from-white to-brand-cyan/80 bg-clip-text text-transparent"`
    }
  },
  {
    // Standardize font weights
    pattern: /font-semibold/g,
    replacement: 'font-bold'
  }
]

// Glass effect applications
const GLASS_PATTERNS = [
  {
    // Add glass effect to modals/dialogs
    pattern: /className="([^"]*\s)?bg-background(\s[^"]*)?"/g,
    replacement: (match, before = '', after = '') => {
      if (match.includes('backdrop-blur')) return match
      if (match.includes('DialogContent') || match.includes('modal')) {
        return `className="${before}bg-background/80 backdrop-blur-xl${after}"`
      }
      return match
    }
  }
]

// Dashboard-specific enhancements
const DASHBOARD_PATTERNS = [
  {
    // Enhance dashboard cards
    pattern: /<Card(\s[^>]*)?>/g,
    replacement: (match) => {
      if (match.includes('variant=')) return match
      return match.replace('>', ' variant="gradient" hover="glow">')
    }
  },
  {
    // Update sidebar active states
    pattern: /bg-muted text-foreground/g,
    replacement: 'bg-gradient-to-r from-brand-cyan/20 to-brand-bright-blue/10 text-brand-cyan'
  }
]

function migrateFile(filePath, isDryRun = false) {
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  let changeCount = 0
  
  // Apply color migrations
  Object.entries(COLOR_MIGRATIONS).forEach(([old, replacement]) => {
    const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const matches = content.match(regex)
    if (matches) {
      changeCount += matches.length
      content = content.replace(regex, replacement)
    }
  })
  
  // Apply component patterns
  COMPONENT_PATTERNS.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern)
    if (matches) {
      changeCount += matches.length
      content = content.replace(pattern, replacement)
    }
  })
  
  // Apply typography patterns for .tsx files
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    TYPOGRAPHY_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern)
      if (matches) {
        changeCount += matches.length
        content = content.replace(pattern, replacement)
      }
    })
    
    // Apply glass patterns
    GLASS_PATTERNS.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern)
      if (matches) {
        changeCount += matches.length
        content = content.replace(pattern, replacement)
      }
    })
    
    // Apply dashboard patterns for dashboard files
    if (filePath.includes('dashboard')) {
      DASHBOARD_PATTERNS.forEach(({ pattern, replacement }) => {
        const matches = content.match(pattern)
        if (matches) {
          changeCount += matches.length
          content = content.replace(pattern, replacement)
        }
      })
    }
  }
  
  // Import brand components if needed
  if (changeCount > 0 && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) {
    // Check if we need to add brand imports
    if (!content.includes("from '@/components/brand'") && 
        (content.includes('<Card') || content.includes('<Button'))) {
      const importRegex = /^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)/m
      const lastImport = content.match(importRegex)
      if (lastImport) {
        const brandImport = "import { Card } from '@/components/brand'\n"
        content = content.replace(lastImport[0], lastImport[0] + brandImport)
        changeCount++
      }
    }
  }
  
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
  
  console.log('🎨 Patchline AI Brand Migration V2')
  console.log('==================================')
  console.log(isDryRun ? '🔍 DRY RUN MODE - No files will be modified' : '✨ APPLYING BRAND SYSTEM')
  console.log('')
  
  // Target patterns - focusing on dashboard and key components
  const patterns = [
    'app/dashboard/**/*.{tsx,jsx,ts,js}',
    'components/dashboard/**/*.{tsx,jsx,ts,js}',
    'components/agents/**/*.{tsx,jsx,ts,js}',
    'components/insights/**/*.{tsx,jsx,ts,js}',
    'components/ui/**/*.{tsx,jsx,ts,js}',
  ]
  
  if (specificPath) {
    patterns.length = 0
    patterns.push(`${specificPath}/**/*.{tsx,jsx,ts,js}`)
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
        console.log(`📝 ${path.relative(process.cwd(), file)}: ${changes} changes`)
      }
    })
  })
  
  console.log('')
  console.log('📊 Migration Summary')
  console.log('===================')
  console.log(`Total files processed: ${totalFiles}`)
  console.log(`Total changes: ${totalChanges}`)
  
  if (filesWithChanges.length > 0) {
    console.log('\n🎯 Files with changes:')
    filesWithChanges
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 10)
      .forEach(({ file, changes }) => {
        console.log(`   ${changes} changes: ${path.relative(process.cwd(), file)}`)
      })
  }
  
  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply these changes')
  } else {
    console.log('\n✅ Brand migration complete!')
    console.log('🎨 Your dashboard now has Apple-quality design consistency')
  }
}

main() 