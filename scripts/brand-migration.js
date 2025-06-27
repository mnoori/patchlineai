#!/usr/bin/env node

/**
 * Patchline AI Brand Migration Script
 * Systematically updates legacy color references to new brand system
 * 
 * Usage: node scripts/brand-migration.js [--dry-run] [--path=specific/path]
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Color migration mapping
const COLOR_MIGRATIONS = {
  // Legacy cosmic colors to brand colors
  'cosmic-teal': 'brand-cyan',
  'cosmic-pink': 'gradient-middle', 
  'cosmic-space': 'brand-black',
  'cosmic-midnight': 'brand-black',
  'cosmic-blue': 'brand-bright-blue',
  
  // Legacy patchy references
  'patchy-button-glow': 'brand-button-glow',
  'patchy-glow': 'brand-glow',
  
  // Hardcoded colors to brand variables
  '#00E5FF': 'var(--brand-cyan)',
  '#0068FF': 'var(--brand-bright-blue)',
  '#002772': 'var(--brand-deep-blue)',
  '#010102': 'var(--brand-black)',
  
  // Text colors
  'text-cosmic-teal': 'text-brand-cyan',
  'text-cosmic-pink': 'text-gradient-middle',
  'text-cosmic-blue': 'text-brand-bright-blue',
  
  // Background colors
  'bg-cosmic-teal': 'bg-brand-cyan',
  'bg-cosmic-pink': 'bg-gradient-middle',
  'bg-cosmic-space': 'bg-brand-black',
  'bg-cosmic-midnight': 'bg-brand-black',
  
  // Border colors
  'border-cosmic-teal': 'border-brand-cyan',
  'border-cosmic-pink': 'border-gradient-middle',
  
  // Hover states
  'hover:text-cosmic-teal': 'hover:text-brand-cyan',
  'hover:bg-cosmic-teal': 'hover:bg-brand-cyan',
  'hover:border-cosmic-teal': 'hover:border-brand-cyan',
}

// Component-specific migrations
const COMPONENT_MIGRATIONS = {
  // Update gradient text usage
  'className="text-cosmic-teal"': 'className="text-brand-cyan"',
  'className="bg-gradient-to-r from-cosmic-teal to-cosmic-pink"': 'className="bg-gradient-to-r from-brand-cyan to-gradient-middle"',
  
  // Update button variants
  'variant="cosmic"': 'variant="brand"',
  'variant="patchy"': 'variant="primary"',
}

// Files to process
const TARGET_PATTERNS = [
  'app/**/*.{tsx,ts,jsx,js}',
  'components/**/*.{tsx,ts,jsx,js}',
  'lib/**/*.{tsx,ts,jsx,js}',
  'hooks/**/*.{tsx,ts,jsx,js}',
  '!node_modules/**',
  '!.next/**',
  '!scripts/**'
]

class BrandMigrator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false
    this.specificPath = options.path
    this.stats = {
      filesProcessed: 0,
      filesChanged: 0,
      replacements: 0,
      errors: 0
    }
  }

  async migrate() {
    console.log('🎨 Starting Patchline AI Brand Migration...')
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`)
    
    const files = await this.getTargetFiles()
    console.log(`📁 Found ${files.length} files to process\n`)

    for (const file of files) {
      await this.processFile(file)
    }

    this.printSummary()
  }

  async getTargetFiles() {
    if (this.specificPath) {
      return glob.sync(this.specificPath)
    }

    const allFiles = []
    for (const pattern of TARGET_PATTERNS) {
      const files = glob.sync(pattern)
      allFiles.push(...files)
    }
    
    return [...new Set(allFiles)] // Remove duplicates
  }

  async processFile(filePath) {
    try {
      this.stats.filesProcessed++
      
      const content = fs.readFileSync(filePath, 'utf8')
      let newContent = content
      let changeCount = 0

      // Apply color migrations
      for (const [oldColor, newColor] of Object.entries(COLOR_MIGRATIONS)) {
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        const matches = newContent.match(regex)
        if (matches) {
          newContent = newContent.replace(regex, newColor)
          changeCount += matches.length
          this.stats.replacements += matches.length
        }
      }

      // Apply component migrations
      for (const [oldPattern, newPattern] of Object.entries(COMPONENT_MIGRATIONS)) {
        const regex = new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        const matches = newContent.match(regex)
        if (matches) {
          newContent = newContent.replace(regex, newPattern)
          changeCount += matches.length
          this.stats.replacements += matches.length
        }
      }

      // Special handling for gradient backgrounds
      newContent = this.migrateGradients(newContent)

      if (changeCount > 0) {
        this.stats.filesChanged++
        
        if (this.dryRun) {
          console.log(`📝 ${filePath}: ${changeCount} changes (DRY RUN)`)
        } else {
          fs.writeFileSync(filePath, newContent, 'utf8')
          console.log(`✅ ${filePath}: ${changeCount} changes applied`)
        }
      }

    } catch (error) {
      this.stats.errors++
      console.error(`❌ Error processing ${filePath}:`, error.message)
    }
  }

  migrateGradients(content) {
    // Update complex gradient patterns
    const gradientPatterns = [
      {
        old: /bg-gradient-to-r from-cosmic-teal via-cosmic-pink to-cosmic-space/g,
        new: 'bg-gradient-to-r from-brand-cyan via-gradient-middle to-brand-black'
      },
      {
        old: /bg-gradient-to-br from-cosmic-teal\/10 to-cosmic-pink\/10/g,
        new: 'bg-gradient-to-br from-brand-cyan/10 to-gradient-middle/10'
      },
      {
        old: /text-transparent bg-clip-text bg-gradient-to-r from-cosmic-teal to-cosmic-pink/g,
        new: 'text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-gradient-middle'
      }
    ]

    let result = content
    for (const pattern of gradientPatterns) {
      result = result.replace(pattern.old, pattern.new)
    }

    return result
  }

  printSummary() {
    console.log('\n🎯 Migration Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📁 Files Processed: ${this.stats.filesProcessed}`)
    console.log(`✨ Files Changed: ${this.stats.filesChanged}`)
    console.log(`🔄 Total Replacements: ${this.stats.replacements}`)
    console.log(`❌ Errors: ${this.stats.errors}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (this.dryRun) {
      console.log('\n💡 This was a DRY RUN. Run without --dry-run to apply changes.')
    } else {
      console.log('\n🎉 Brand migration completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Test the application: npm run dev')
      console.log('2. Check for any visual regressions')
      console.log('3. Run build: npm run build')
      console.log('4. Commit changes: git add . && git commit -m "feat: migrate to new brand system"')
    }
  }
}

// CLI handling
const args = process.argv.slice(2)
const options = {
  dryRun: args.includes('--dry-run'),
  path: args.find(arg => arg.startsWith('--path='))?.split('=')[1]
}

// Run migration
const migrator = new BrandMigrator(options)
migrator.migrate().catch(console.error) 