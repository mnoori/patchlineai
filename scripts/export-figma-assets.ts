#!/usr/bin/env node
/**
 * Export Figma Assets Script
 * Exports and caches assets from Figma at build time
 */

import { FigmaClient, getFigmaConfig } from '../lib/figma'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import fetch from 'node-fetch'

interface AssetConfig {
  nodeId: string
  name: string
  format: 'png' | 'svg' | 'jpg'
  scale?: number
  outputPath: string
}

// Define assets to export
const ASSETS_TO_EXPORT: AssetConfig[] = [
  {
    nodeId: '113:14', // Patchline logo
    name: 'patchline-logo',
    format: 'svg',
    outputPath: 'public/figma-assets/patchline-logo.svg'
  },
  {
    nodeId: '113:14', // Patchline logo PNG version
    name: 'patchline-logo',
    format: 'png',
    scale: 2,
    outputPath: 'public/figma-assets/patchline-logo@2x.png'
  },
  // Add more assets as needed
]

async function downloadAsset(url: string, outputPath: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.statusText}`)
  }
  
  const buffer = await response.buffer()
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(outputPath, buffer)
}

async function exportAssets() {
  const spinner = ora('Exporting Figma assets...').start()
  
  try {
    const config = getFigmaConfig()
    if (!config.accessToken || !config.fileId) {
      throw new Error('Missing Figma configuration')
    }

    const client = new FigmaClient(config.accessToken)
    let exported = 0
    let failed = 0

    for (const asset of ASSETS_TO_EXPORT) {
      try {
        spinner.text = `Exporting ${asset.name} (${asset.format})...`
        
        // Export from Figma
        const images = await client.exportAssets(
          config.fileId,
          [asset.nodeId],
          asset.format,
          asset.scale || 1
        )
        
        const url = images[asset.nodeId]
        if (!url) {
          throw new Error(`No export URL returned for ${asset.nodeId}`)
        }

        // Download and save
        await downloadAsset(url, asset.outputPath)
        exported++
        
        console.log(chalk.green(`  ✓ ${asset.name} → ${asset.outputPath}`))
      } catch (error) {
        failed++
        console.log(chalk.red(`  ✗ ${asset.name}: ${error.message}`))
      }
    }

    spinner.succeed(chalk.green(`Exported ${exported} assets (${failed} failed)`))
    
    // Generate manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      assets: ASSETS_TO_EXPORT.filter((_, i) => i < exported),
      fileId: config.fileId
    }
    
    await fs.writeFile(
      'public/figma-assets/manifest.json',
      JSON.stringify(manifest, null, 2)
    )
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to export assets'))
    console.error(error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  exportAssets()
}

export { exportAssets } 