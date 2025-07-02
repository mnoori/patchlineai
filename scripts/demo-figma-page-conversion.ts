/**
 * Demo: Convert Figma Pages to React Components
 * Shows how to use the page-to-component converter
 */

import { PageToComponentConverter } from '../lib/figma/page-to-component'
import { BrandExtractor, FigmaClient } from '../lib/figma'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function demo() {
  console.log('🎨 Figma Page to Component Demo\n')

  const config = getFigmaConfig()
  const fileId = "PbzhWQIGJF68IPYo8Bheck"
  
  if (!config.accessToken) {
    console.error('❌ Missing FIGMA_ACCESS_TOKEN')
    process.exit(1)
  }

  // 1. Extract universal brand system
  console.log('📊 Extracting brand system...')
  const client = new FigmaClient(config.accessToken)
  const brandExtractor = new BrandExtractor(client)
  const brandSystem = await brandExtractor.extractBrandSystem(fileId)
  
  console.log('✅ Brand colors:', Object.keys(brandSystem.colors.primary).length)
  console.log('✅ Gradients:', Object.keys(brandSystem.colors.gradients).length)
  console.log('✅ Typography:', brandSystem.typography.fontFamilies.join(', '))

  // 2. Convert pages to components
  console.log('\n📄 Converting pages to components...')
  const converter = new PageToComponentConverter(config.accessToken)
  
  // Get all available pages
  const pages = await converter.getAllPages(fileId)
  console.log(`Found ${pages.length} pages:`)
  pages.forEach(page => console.log(`  - ${page.name} (${page.id})`))

  // Define which pages should be website backbone
  const backbonePages = [
    { pageName: 'Brand Guide', componentName: 'BrandGuidePage', route: '/brand-guide' },
    // Add more pages here as needed
  ]

  // Convert each page
  const components = await converter.convertPages(fileId, backbonePages)
  
  // 3. Save generated components
  const outputDir = join(process.cwd(), 'components', 'generated-from-figma')
  mkdirSync(outputDir, { recursive: true })

  components.forEach(component => {
    const filePath = join(outputDir, `${component.name}.tsx`)
    writeFileSync(filePath, component.code)
    console.log(`✅ Generated: ${component.name}.tsx`)
  })

  // 4. Save brand system
  const brandPath = join(process.cwd(), 'lib', 'brand', 'figma-brand-system.ts')
  const brandCode = `/**
 * Brand System extracted from Figma
 * Auto-generated - do not edit directly
 */

export const FIGMA_BRAND = {
  colors: ${JSON.stringify(brandSystem.colors, null, 2)},
  typography: ${JSON.stringify(brandSystem.typography, null, 2)},
  spacing: ${JSON.stringify(brandSystem.spacing, null, 2)},
  effects: ${JSON.stringify(brandSystem.effects, null, 2)}
}

// CSS animations
${Object.entries(brandSystem.animations).map(([name, css]) => `
/* ${name} animation */
${css}`).join('\n')}
`
  
  writeFileSync(brandPath, brandCode)
  console.log('\n✅ Brand system saved to:', brandPath)

  // 5. Show usage example
  console.log('\n📝 Usage Example:')
  console.log(`
import { BrandGuidePage } from '@/components/generated-from-figma/BrandGuidePage'
import { FIGMA_BRAND } from '@/lib/brand/figma-brand-system'

export default function MyPage() {
  return (
    <div style={{ background: FIGMA_BRAND.colors.gradients.primary }}>
      <BrandGuidePage width={1200} />
    </div>
  )
}`)
}

demo().catch(console.error) 