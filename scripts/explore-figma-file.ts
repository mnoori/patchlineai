/**
 * Explore Figma File
 * Comprehensive exploration of what's available in your Figma file
 */

import { FigmaClient } from '../lib/figma/client'
import { getFigmaConfig } from '../lib/figma'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface ExplorationReport {
  fileInfo: any
  documentStructure: any
  components: any[]
  styles: {
    colors: any[]
    typography: any[]
    effects: any[]
    grids: any[]
  }
  pages: any[]
  assets: any[]
  statistics: {
    totalNodes: number
    totalComponents: number
    totalStyles: number
    nodeTypes: Record<string, number>
  }
}

async function exploreFile() {
  try {
    console.log('🔍 Exploring Figma File...\n')
    
    const config = getFigmaConfig()
    
    if (!config.accessToken || !config.fileId) {
      console.error('❌ Missing required environment variables:')
      if (!config.accessToken) console.error('  - FIGMA_ACCESS_TOKEN')
      if (!config.fileId) console.error('  - FIGMA_FILE_ID')
      process.exit(1)
    }
    
    console.log('📋 Configuration:')
    console.log(`   File ID: ${config.fileId}`)
    console.log(`   Has Access Token: ${!!config.accessToken}`)
    console.log(`   Has Client ID: ${!!config.clientId}`)
    console.log(`   Has Client Secret: ${!!config.clientSecret}\n`)
    
    const client = new FigmaClient(config.accessToken!)
    const report: ExplorationReport = {
      fileInfo: {},
      documentStructure: {},
      components: [],
      styles: {
        colors: [],
        typography: [],
        effects: [],
        grids: []
      },
      pages: [],
      assets: [],
      statistics: {
        totalNodes: 0,
        totalComponents: 0,
        totalStyles: 0,
        nodeTypes: {}
      }
    }
    
    // 1. Get file metadata
    console.log('📄 Fetching file metadata...')
    const file = await client.getFile(config.fileId!)
    
    report.fileInfo = {
      name: file.name,
      lastModified: file.lastModified,
      version: file.version,
      thumbnailUrl: file.thumbnailUrl
    }
    
    console.log(`   ✅ File: ${file.name}`)
    console.log(`   📅 Last modified: ${new Date(file.lastModified).toLocaleString()}`)
    console.log(`   🏷️ Version: ${file.version}\n`)
    
    // 2. Analyze document structure
    console.log('🏗️ Analyzing document structure...')
    const documentNode = file.document
    
    // Count all node types
    const countNodes = (node: any, depth = 0) => {
      report.statistics.totalNodes++
      report.statistics.nodeTypes[node.type] = (report.statistics.nodeTypes[node.type] || 0) + 1
      
      if (node.type === 'PAGE') {
        report.pages.push({
          id: node.id,
          name: node.name,
          backgroundColor: node.backgroundColor,
          childCount: node.children?.length || 0
        })
      }
      
      if (node.children) {
        node.children.forEach((child: any) => countNodes(child, depth + 1))
      }
    }
    
    countNodes(documentNode)
    
    console.log(`   📊 Total nodes: ${report.statistics.totalNodes}`)
    console.log(`   📄 Pages: ${report.pages.length}`)
    console.log('   📈 Node type distribution:')
    Object.entries(report.statistics.nodeTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`      - ${type}: ${count}`)
      })
    console.log()
    
    // 3. Get components
    console.log('🧩 Fetching components...')
    try {
      const components = await client.getComponents(config.fileId!)
      report.components = components
      report.statistics.totalComponents = components.length
      
      console.log(`   ✅ Found ${components.length} published components`)
      if (components.length > 0) {
        console.log('   📝 Sample components:')
        components.slice(0, 5).forEach(comp => {
          console.log(`      - ${comp.name} (${comp.key})`)
        })
        if (components.length > 5) {
          console.log(`      ... and ${components.length - 5} more`)
        }
      }
    } catch (error) {
      console.log('   ⚠️ No published components found (this is normal if components haven\'t been published)')
    }
    console.log()
    
    // 4. Extract styles
    console.log('🎨 Extracting styles...')
    if (file.styles) {
      Object.entries(file.styles).forEach(([id, style]: [string, any]) => {
        report.statistics.totalStyles++
        
        switch (style.styleType) {
          case 'FILL':
            report.styles.colors.push({
              id,
              name: style.name,
              description: style.description
            })
            break
          case 'TEXT':
            report.styles.typography.push({
              id,
              name: style.name,
              description: style.description
            })
            break
          case 'EFFECT':
            report.styles.effects.push({
              id,
              name: style.name,
              description: style.description
            })
            break
          case 'GRID':
            report.styles.grids.push({
              id,
              name: style.name,
              description: style.description
            })
            break
        }
      })
    }
    
    console.log(`   🎨 Colors: ${report.styles.colors.length}`)
    console.log(`   📝 Typography: ${report.styles.typography.length}`)
    console.log(`   ✨ Effects: ${report.styles.effects.length}`)
    console.log(`   📐 Grids: ${report.styles.grids.length}`)
    console.log()
    
    // 5. Find interesting nodes (logos, icons, illustrations)
    console.log('🖼️ Finding assets and interesting nodes...')
    const interestingNodes: any[] = []
    
    const findInterestingNodes = (node: any, path: string = '') => {
      const nodePath = path ? `${path} > ${node.name}` : node.name
      
      // Look for potential assets based on naming
      const assetKeywords = ['logo', 'icon', 'illustration', 'brand', 'asset', 'graphic']
      const nameLC = node.name.toLowerCase()
      
      if (assetKeywords.some(keyword => nameLC.includes(keyword))) {
        interestingNodes.push({
          id: node.id,
          name: node.name,
          type: node.type,
          path: nodePath,
          hasExportSettings: !!(node as any).exportSettings?.length
        })
      }
      
      if (node.children) {
        node.children.forEach((child: any) => findInterestingNodes(child, nodePath))
      }
    }
    
    file.document.children.forEach((page: any) => {
      findInterestingNodes(page)
    })
    
    report.assets = interestingNodes
    console.log(`   🎯 Found ${interestingNodes.length} potential assets`)
    if (interestingNodes.length > 0) {
      console.log('   📝 Sample assets:')
      interestingNodes.slice(0, 5).forEach(node => {
        console.log(`      - ${node.name} (${node.type}) ${node.hasExportSettings ? '✅ exportable' : ''}`)
      })
    }
    console.log()
    
    // 6. Generate detailed report
    console.log('📊 Generating detailed report...')
    const outputDir = join(process.cwd(), 'figma-exploration')
    mkdirSync(outputDir, { recursive: true })
    
    // Save full report
    const reportPath = join(outputDir, 'exploration-report.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    // Save human-readable summary
    const summaryPath = join(outputDir, 'exploration-summary.md')
    const summary = generateMarkdownSummary(report, config)
    writeFileSync(summaryPath, summary)
    
    console.log(`   📄 Full report: ${reportPath}`)
    console.log(`   📝 Summary: ${summaryPath}`)
    console.log()
    
    // 7. Save sample data for brand showcase
    const showcaseData = {
      fileInfo: report.fileInfo,
      statistics: report.statistics,
      sampleComponents: report.components.slice(0, 5),
      sampleColors: report.styles.colors.slice(0, 10),
      sampleAssets: report.assets.slice(0, 10)
    }
    
    const showcasePath = join(outputDir, 'showcase-data.json')
    writeFileSync(showcasePath, JSON.stringify(showcaseData, null, 2))
    console.log(`   🎨 Showcase data: ${showcasePath}`)
    
    console.log('\n✅ Exploration complete!')
    console.log('\n💡 Next steps:')
    console.log('   1. Check figma-exploration/exploration-summary.md for a detailed overview')
    console.log('   2. Review figma-exploration/exploration-report.json for raw data')
    console.log('   3. Use showcase-data.json to display on brand showcase page')
    console.log('   4. Identify specific component IDs or node IDs you want to sync/export')
    
  } catch (error: any) {
    console.error('\n❌ Error exploring Figma file:', error.message)
    if (error.message.includes('404')) {
      console.error('\n💡 Tips:')
      console.error('   - Make sure your FIGMA_FILE_ID is correct')
      console.error('   - The file ID should be the alphanumeric string after /file/ in the URL')
      console.error('   - From your URL, it should be: PbzhWQIGJF68IPYo8Bheck')
    }
    process.exit(1)
  }
}

function generateMarkdownSummary(report: ExplorationReport, config: any): string {
  const componentsSection = report.components.length > 0 
    ? [
        '',
        '#### Sample Components',
        ...report.components.slice(0, 10).map(comp => [
          `- ${comp.name}`,
          `  - Key: \`${comp.key}\``,
          `  - Description: ${comp.description || 'No description'}`
        ].join('\n'))
      ].join('\n\n')
    : 'No published components found. To publish components in Figma:\n1. Select a component\n2. Right-click → Publish component\n3. Run this script again'
  
  const colorSection = report.styles.colors.length > 0
    ? [
        '',
        '#### Color Styles',
        ...report.styles.colors.slice(0, 10).map(style => `- ${style.name}`)
      ].join('\n')
    : ''
  
  const typographySection = report.styles.typography.length > 0
    ? [
        '',
        '#### Typography Styles',
        ...report.styles.typography.slice(0, 10).map(style => `- ${style.name}`)
      ].join('\n')
    : ''

  return `# Figma File Exploration Report

## File Information
- **Name**: ${report.fileInfo.name}
- **Last Modified**: ${new Date(report.fileInfo.lastModified).toLocaleString()}
- **Version**: ${report.fileInfo.version}
- **File ID**: ${config.fileId}

## Document Structure
- **Total Nodes**: ${report.statistics.totalNodes}
- **Pages**: ${report.pages.length}

### Pages
${report.pages.map(page => `- ${page.name} (${page.childCount} children)`).join('\n')}

### Node Type Distribution
${Object.entries(report.statistics.nodeTypes)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

## Design System

### Components
- **Total Published Components**: ${report.statistics.totalComponents}
${componentsSection}

### Styles
- **Colors**: ${report.styles.colors.length}
- **Typography**: ${report.styles.typography.length}
- **Effects**: ${report.styles.effects.length}
- **Grids**: ${report.styles.grids.length}
${colorSection}
${typographySection}

### Potential Assets
Found ${report.assets.length} nodes that might be assets (based on naming):

${report.assets.slice(0, 20).map(asset => 
  `- ${asset.name} (${asset.type}) ${asset.hasExportSettings ? '✅' : '❌'} exportable`
).join('\n')}

## Next Steps

1. **To sync design tokens**: Ensure your color and text styles are properly named in Figma
2. **To generate components**: Publish the components you want to sync
3. **To export assets**: Add export settings to the assets you want to export

### Recommended Naming Conventions

For automatic token mapping:
- **Colors**: \`Primary/Cyan\`, \`UI/Background\`, \`Gradient/Start\`
- **Typography**: \`Heading/H1\`, \`Body/Regular\`, \`Caption/Small\`
- **Spacing**: Use Auto Layout with consistent spacing values

### How to Add Export Settings in Figma
1. Select the layer/frame you want to export
2. In the right panel, click the "+" next to "Export"
3. Choose format (SVG for icons, PNG for images)
4. The layer will then be exportable via the API`
}

// Run exploration
exploreFile() 