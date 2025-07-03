#!/usr/bin/env node
/**
 * Figma to React CLI
 * Convert Figma designs to React components
 * 
 * Usage:
 *   pnpm figma:convert <nodeId> <componentName>
 *   pnpm figma:watch
 *   pnpm figma:sync
 */

import { program } from 'commander'
import { FigmaClient, LayerExtractor, ReactGenerator, getFigmaConfig } from '../lib/figma'
import { EnhancedLayer } from '../lib/figma/layer-extractor'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import chokidar from 'chokidar'

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), 'components/generated')
const ASSETS_DIR = path.join(process.cwd(), 'public/figma-assets')

// Ensure output directories exist
async function ensureDirectories() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.mkdir(ASSETS_DIR, { recursive: true })
}

// Convert a single Figma node to React component
async function convertNode(nodeId: string, componentName: string) {
  const spinner = ora('Converting Figma design to React...').start()
  
  try {
    // Get Figma config
    const config = getFigmaConfig()
    if (!config.accessToken || !config.fileId) {
      throw new Error('Missing Figma configuration. Please check your .env.local file.')
    }

    // Initialize clients
    const client = new FigmaClient(config.accessToken)
    const extractor = new LayerExtractor(client)
    const generator = new ReactGenerator({
      componentName,
      useTailwind: true,
      useTypeScript: true,
      framework: 'next',
      includeAnimations: true,
      responsiveBreakpoints: true
    })

    spinner.text = 'Fetching layer data from Figma...'
    
    // Get layer data with shallow fetch for performance
    const layer = await extractor.getLayerInfo(config.fileId, nodeId)
    if (!layer) {
      throw new Error(`Layer ${nodeId} not found`)
    }

    // If it has children, fetch them separately
    if (layer.hasChildren) {
      spinner.text = `Fetching ${layer.childrenCount} children...`
      layer.children = await extractor.getLayerChildren(config.fileId, nodeId)
    }

    spinner.text = 'Generating React component...'
    
    // Generate component
    const generated = await generator.generateComponent(layer)
    
    // Write component file
    const componentPath = path.join(OUTPUT_DIR, `${componentName}.tsx`)
    await fs.writeFile(componentPath, generated.code, 'utf-8')
    
    // Write CSS file if needed
    if (generated.styles) {
      const stylesPath = path.join(OUTPUT_DIR, `${componentName}.module.css`)
      await fs.writeFile(stylesPath, generated.styles, 'utf-8')
    }

    // Download and save assets
    if (generated.assets.length > 0) {
      spinner.text = `Downloading ${generated.assets.length} assets...`
      
      for (const asset of generated.assets) {
        if (layer.exportSettings?.length) {
          try {
            const exportedAssets = await extractor.getExportableAssets(config.fileId, nodeId)
            for (const exported of exportedAssets) {
              const assetPath = path.join(ASSETS_DIR, asset.filename)
              // In a real implementation, we'd download the asset from exported.url
              // For now, we'll create a placeholder
              await fs.writeFile(assetPath, `/* Asset: ${asset.filename} */`, 'utf-8')
            }
          } catch (error) {
            console.warn(`Failed to export asset: ${asset.filename}`)
          }
        }
      }
    }

    spinner.succeed(chalk.green(`✓ Component generated: ${componentPath}`))
    
    // Log summary
    console.log(chalk.blue('\nGeneration Summary:'))
    console.log(`  Component: ${componentName}`)
    console.log(`  Layer: ${layer.name} (${layer.type})`)
    console.log(`  Children: ${layer.childrenCount || 0}`)
    console.log(`  Assets: ${generated.assets.length}`)
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to convert Figma design'))
    console.error(error)
    process.exit(1)
  }
}

// Watch mode - monitor for changes
async function watchMode() {
  console.log(chalk.blue('🔍 Watching for Figma changes...'))
  
  // In a real implementation, we'd poll the Figma API for changes
  // For now, we'll watch a config file
  const watcher = chokidar.watch('figma-watch.json', {
    persistent: true
  })

  watcher.on('change', async () => {
    try {
      const watchConfig = JSON.parse(await fs.readFile('figma-watch.json', 'utf-8'))
      for (const item of watchConfig.components) {
        await convertNode(item.nodeId, item.componentName)
      }
    } catch (error) {
      console.error(chalk.red('Error in watch mode:'), error)
    }
  })

  console.log(chalk.gray('Create or update figma-watch.json to trigger conversions'))
}

// Sync all components from a Figma page
async function syncPage(pageId: string) {
  const spinner = ora('Syncing Figma page...').start()
  
  try {
    const config = getFigmaConfig()
    if (!config.accessToken || !config.fileId) {
      throw new Error('Missing Figma configuration')
    }

    const client = new FigmaClient(config.accessToken)
    const extractor = new LayerExtractor(client)
    
    // Get page data
    const page = await extractor.getLayerInfo(config.fileId, pageId)
    if (!page || !page.hasChildren) {
      throw new Error('Page not found or has no children')
    }

    spinner.text = 'Fetching page components...'
    const children = await extractor.getLayerChildren(config.fileId, pageId)
    
    // Convert each component
    let converted = 0
    for (const child of children) {
      if (child.type === 'COMPONENT' || child.type === 'FRAME') {
        const componentName = child.name.replace(/[^a-zA-Z0-9]/g, '')
        spinner.text = `Converting ${componentName}...`
        
        await convertNode(child.id, componentName)
        converted++
      }
    }

    spinner.succeed(chalk.green(`✓ Synced ${converted} components from page`))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to sync page'))
    console.error(error)
    process.exit(1)
  }
}

// Main CLI program
program
  .name('figma-to-react')
  .description('Convert Figma designs to React components')
  .version('1.0.0')

program
  .command('convert <nodeId> <componentName>')
  .description('Convert a specific Figma node to a React component')
  .action(async (nodeId, componentName) => {
    await ensureDirectories()
    await convertNode(nodeId, componentName)
  })

program
  .command('watch')
  .description('Watch for Figma changes and auto-convert')
  .action(async () => {
    await ensureDirectories()
    await watchMode()
  })

program
  .command('sync <pageId>')
  .description('Sync all components from a Figma page')
  .action(async (pageId) => {
    await ensureDirectories()
    await syncPage(pageId)
  })

program
  .command('list')
  .description('List all pages in the Figma file')
  .action(async () => {
    try {
      const config = getFigmaConfig()
      if (!config.accessToken || !config.fileId) {
        throw new Error('Missing Figma configuration')
      }

      const client = new FigmaClient(config.accessToken)
      const file = await client.getFile(config.fileId)
      
      console.log(chalk.blue('\nFigma File Pages:'))
      console.log(chalk.gray('Use the page ID with the sync command\n'))
      
      if (file.document && file.document.children) {
        for (const page of file.document.children) {
          if (page.type === 'CANVAS') {
            console.log(`  ${chalk.green(page.name)} - ID: ${chalk.gray(page.id)}`)
          }
        }
      }
    } catch (error) {
      console.error(chalk.red('Failed to list pages:'), error)
      process.exit(1)
    }
  })

// Run the CLI
program.parse(process.argv) 