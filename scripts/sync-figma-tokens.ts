/**
 * Sync Figma Design Tokens
 * Fetches design tokens from Figma and updates brand constants
 */

import { FigmaClient } from '../lib/figma/client'
import { TokenTransformer } from '../lib/figma/token-transformer'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID || ''
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN || ''

if (!FIGMA_FILE_ID || !FIGMA_ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables:')
  if (!FIGMA_FILE_ID) console.error('  - FIGMA_FILE_ID')
  if (!FIGMA_ACCESS_TOKEN) console.error('  - FIGMA_ACCESS_TOKEN')
  console.error('\nPlease add these to your .env.local file')
  process.exit(1)
}

async function syncFigmaTokens() {
  try {
    console.log('🔄 Syncing design tokens from Figma...')
    
    // Initialize Figma client
    const client = new FigmaClient(FIGMA_ACCESS_TOKEN)
    const transformer = new TokenTransformer()
    
    // Fetch Figma file
    console.log('📥 Fetching Figma file...')
    const file = await client.getFile(FIGMA_FILE_ID)
    
    // Extract design tokens
    console.log('🎨 Extracting design tokens...')
    const tokens = transformer.extractTokensFromFile(file)
    
    // Transform to brand constants format
    console.log('🔄 Transforming tokens to brand format...')
    const brandConstants = transformer.transformToBrandConstants(tokens)
    
    // Generate updated constants file
    const constantsPath = join(process.cwd(), 'lib/brand/constants.ts')
    const currentConstants = readFileSync(constantsPath, 'utf-8')
    
    // Create updated constants with preserved structure
    const updatedConstants = generateUpdatedConstants(currentConstants, brandConstants)
    
    // Write back to file
    writeFileSync(constantsPath, updatedConstants)
    console.log('✅ Updated brand constants successfully!')
    
    // Generate report
    generateSyncReport(tokens, brandConstants)
    
  } catch (error) {
    console.error('❌ Error syncing Figma tokens:', error)
    process.exit(1)
  }
}

/**
 * Generate updated constants file preserving existing structure
 */
function generateUpdatedConstants(
  currentContent: string,
  newConstants: any
): string {
  // This is a simplified version - in production, you'd want to use AST parsing
  let updated = currentContent
  
  // Update colors
  const colorsSection = JSON.stringify(newConstants.colors, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes from keys
  
  updated = updated.replace(
    /export const COLORS = \{[\s\S]*?\} as const/,
    `export const COLORS = ${colorsSection} as const`
  )
  
  // Update typography
  const typographySection = JSON.stringify(newConstants.typography, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
  
  updated = updated.replace(
    /export const TYPOGRAPHY = \{[\s\S]*?\} as const/,
    `export const TYPOGRAPHY = ${typographySection} as const`
  )
  
  // Update spacing
  const spacingSection = JSON.stringify(newConstants.spacing, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
  
  updated = updated.replace(
    /export const SPACING = \{[\s\S]*?\} as const/,
    `export const SPACING = ${spacingSection} as const`
  )
  
  // Update radius
  const radiusSection = JSON.stringify(newConstants.radius, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
  
  updated = updated.replace(
    /export const RADIUS = \{[\s\S]*?\} as const/,
    `export const RADIUS = ${radiusSection} as const`
  )
  
  // Update shadows
  const shadowsSection = JSON.stringify(newConstants.shadows, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
  
  updated = updated.replace(
    /export const SHADOWS = \{[\s\S]*?\} as const/,
    `export const SHADOWS = ${shadowsSection} as const`
  )
  
  return updated
}

/**
 * Generate sync report
 */
function generateSyncReport(tokens: any, brandConstants: any) {
  const report = {
    timestamp: new Date().toISOString(),
    tokensExtracted: {
      colors: Object.keys(tokens.colors).length,
      typography: Object.keys(tokens.typography).length,
      spacing: Object.keys(tokens.spacing).length,
      shadows: Object.keys(tokens.shadows || {}).length,
      borderRadius: Object.keys(tokens.borderRadius || {}).length,
    },
    constantsGenerated: {
      colors: {
        primary: Object.keys(brandConstants.colors.primary).length,
        gradient: Object.keys(brandConstants.colors.gradient).length,
        ui: Object.keys(brandConstants.colors.ui).length,
        semantic: Object.keys(brandConstants.colors.semantic).length,
      },
      typography: {
        fontFamily: Object.keys(brandConstants.typography.fontFamily).length,
        fontWeight: Object.keys(brandConstants.typography.fontWeight).length,
        fontSize: Object.keys(brandConstants.typography.fontSize).length,
      },
      spacing: Object.keys(brandConstants.spacing).length,
      radius: Object.keys(brandConstants.radius).length,
      shadows: Object.keys(brandConstants.shadows).length,
    },
  }
  
  const reportPath = join(process.cwd(), 'figma-sync-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('\n📊 Sync Report:')
  console.log(`   Colors: ${report.tokensExtracted.colors} tokens`)
  console.log(`   Typography: ${report.tokensExtracted.typography} tokens`)
  console.log(`   Spacing: ${report.tokensExtracted.spacing} tokens`)
  console.log(`   Shadows: ${report.tokensExtracted.shadows} tokens`)
  console.log(`   Border Radius: ${report.tokensExtracted.borderRadius} tokens`)
  console.log('\n📄 Full report saved to: figma-sync-report.json')
}

// Run sync
syncFigmaTokens() 