#!/usr/bin/env node
/**
 * Extract Figma Gradients Script
 * Extracts gradient values from Figma design and updates brand system
 */

import { FigmaClient, getFigmaConfig } from '../lib/figma'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'

interface FigmaGradient {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'
  gradientStops: Array<{
    color: { r: number; g: number; b: number; a: number }
    position: number
  }>
  gradientTransform?: number[][]
}

interface ExtractedGradient {
  name: string
  type: string
  direction: number
  stops: Array<{
    color: string
    position: number
  }>
  cssGradient: string
}

async function extractGradientsFromNode(
  client: FigmaClient,
  fileId: string,
  nodeId: string
): Promise<ExtractedGradient[]> {
  const spinner = ora('Extracting gradients from Figma...').start()
  
  try {
    const nodes = await client.getNodes(fileId, [nodeId])
    const node = nodes[nodeId]
    
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const gradients: ExtractedGradient[] = []
    
    // Extract gradients from fills
    const nodeData = node.document || node
    if (nodeData.fills) {
      nodeData.fills.forEach((fill: any, index: number) => {
        if (fill.type && fill.type.includes('GRADIENT') && fill.gradientStops) {
          const gradient = extractGradientFromFill(fill, `gradient-${index}`)
          if (gradient) {
            gradients.push(gradient)
          }
        }
      })
    }

    // Recursively search children for gradients
    const findGradients = (node: any, path: string = '') => {
      if (node.fills) {
        node.fills.forEach((fill: any, index: number) => {
          if (fill.type && fill.type.includes('GRADIENT') && fill.gradientStops) {
            const gradient = extractGradientFromFill(fill, `${path}-gradient-${index}`)
            if (gradient) {
              gradients.push(gradient)
            }
          }
        })
      }
      
      if (node.children) {
        node.children.forEach((child: any, childIndex: number) => {
          findGradients(child, `${path}-child-${childIndex}`)
        })
      }
    }

    if (nodeData.children) {
      nodeData.children.forEach((child: any, index: number) => {
        findGradients(child, `layer-${index}`)
      })
    }

    spinner.succeed(chalk.green(`Found ${gradients.length} gradients`))
    return gradients

  } catch (error) {
    spinner.fail(chalk.red('Failed to extract gradients'))
    throw error
  }
}

function extractGradientFromFill(fill: FigmaGradient, name: string): ExtractedGradient | null {
  if (!fill.gradientStops || fill.gradientStops.length === 0) {
    return null
  }

  // Convert Figma colors to hex
  const stops = fill.gradientStops.map(stop => ({
    color: figmaColorToHex(stop.color),
    position: Math.round(stop.position * 100)
  }))

  // Calculate gradient direction from transform matrix
  let direction = 0
  if (fill.gradientTransform) {
    // Simplified direction calculation
    const transform = fill.gradientTransform
    direction = Math.atan2(transform[0][1], transform[0][0]) * (180 / Math.PI)
  }

  // Generate CSS gradient
  const cssGradient = generateCSSGradient(fill.type, stops, direction)

  return {
    name,
    type: fill.type,
    direction,
    stops,
    cssGradient
  }
}

function figmaColorToHex(color: { r: number; g: number; b: number; a: number }): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
}

function generateCSSGradient(
  type: string,
  stops: Array<{ color: string; position: number }>,
  direction: number
): string {
  const stopStrings = stops.map(stop => `${stop.color} ${stop.position}%`).join(', ')
  
  switch (type) {
    case 'GRADIENT_LINEAR':
      return `linear-gradient(${direction}deg, ${stopStrings})`
    case 'GRADIENT_RADIAL':
      return `radial-gradient(circle, ${stopStrings})`
    case 'GRADIENT_ANGULAR':
      return `conic-gradient(from ${direction}deg, ${stopStrings})`
    default:
      return `linear-gradient(${direction}deg, ${stopStrings})`
  }
}

async function updateBrandConstants(gradients: ExtractedGradient[]) {
  const spinner = ora('Updating brand constants...').start()
  
  try {
    const constantsPath = path.join(process.cwd(), 'lib/brand/constants.ts')
    let content = await fs.readFile(constantsPath, 'utf-8')

    // Find the main gradient from the background (usually the first/largest one)
    const mainGradient = gradients.find(g => g.stops.length >= 2) || gradients[0]
    
    if (!mainGradient) {
      throw new Error('No suitable gradient found')
    }

    console.log(chalk.blue('\nExtracted Gradient:'))
    console.log(`  Type: ${mainGradient.type}`)
    console.log(`  Direction: ${mainGradient.direction}°`)
    console.log(`  Stops: ${mainGradient.stops.map(s => `${s.color} (${s.position}%)`).join(', ')}`)
    console.log(`  CSS: ${mainGradient.cssGradient}`)

    // Update the gradient colors in constants
    const newGradientColors = {
      start: mainGradient.stops[0]?.color || '#00E6E4',
      middle: mainGradient.stops[Math.floor(mainGradient.stops.length / 2)]?.color || '#0068FF',
      end: mainGradient.stops[mainGradient.stops.length - 1]?.color || '#002772',
      // Add the full CSS gradient
      css: mainGradient.cssGradient,
      direction: mainGradient.direction
    }

    // Replace the gradient section in constants.ts
    const gradientRegex = /gradient: \{[\s\S]*?\}/
    const newGradientSection = `gradient: {
    start: '${newGradientColors.start}',      // From Figma
    middle: '${newGradientColors.middle}',     // From Figma
    end: '${newGradientColors.end}',        // From Figma
    darkStart: '${newGradientColors.end}',  // Reversed for dark backgrounds
    darkMiddle: '${newGradientColors.middle}',
    darkEnd: '${newGradientColors.start}',
    // Full CSS gradient from Figma
    css: '${newGradientColors.css}',
    direction: ${newGradientColors.direction}
  }`

    content = content.replace(gradientRegex, newGradientSection)

    await fs.writeFile(constantsPath, content, 'utf-8')
    spinner.succeed(chalk.green('Brand constants updated!'))

    return newGradientColors

  } catch (error) {
    spinner.fail(chalk.red('Failed to update brand constants'))
    throw error
  }
}

async function updateBrandGuidePage(gradients: ExtractedGradient[]) {
  const spinner = ora('Updating BrandGuidePage component...').start()
  
  try {
    const componentPath = path.join(process.cwd(), 'components/generated-from-figma/BrandGuidePage.tsx')
    const mainGradient = gradients.find(g => g.stops.length >= 2) || gradients[0]
    
    if (!mainGradient) {
      throw new Error('No gradient found')
    }

    const newComponent = `'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { COLORS } from '@/lib/brand/constants'

interface BrandGuidePageProps {
  className?: string
  width?: number
}

export function BrandGuidePage({ className, width }: BrandGuidePageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const actualWidth = width || dimensions.width
  const actualHeight = dimensions.height

  return (
    <div 
      ref={containerRef}
      className={cn(
        "figma-page-container relative overflow-hidden",
        className
      )}
      style={{
        width: actualWidth || '100%',
        height: actualHeight || '100%',
        backgroundColor: '#121212'
      }}
    >
      {/* Gradient Background - Extracted from Figma */}
      <div 
        className="absolute inset-0"
        style={{
          background: '${mainGradient.cssGradient}',
          opacity: 0.9
        }}
      />

      {/* Logo - Centered */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '140px',
        }}
      >
        <Image 
          src="/Brandmark/Brandmark Light.svg" 
          alt="Patchline Logo" 
          width={200}
          height={140}
          style={{objectFit:'contain'}} 
          priority
        />
      </div>

      {/* Website Text */}
      <div 
        className="absolute flex items-center justify-center"
        style={{
          left: '50%',
          bottom: '15%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '40px',
        }}
      >
        <div className="text-white font-medium text-lg tracking-[0.2em]">
          www.patchline.ai
        </div>
      </div>

      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
    </div>
  )
}`

    await fs.writeFile(componentPath, newComponent, 'utf-8')
    spinner.succeed(chalk.green('BrandGuidePage component updated!'))

  } catch (error) {
    spinner.fail(chalk.red('Failed to update component'))
    throw error
  }
}

async function main() {
  try {
    const config = getFigmaConfig()
    if (!config.accessToken || !config.fileId) {
      throw new Error('Missing Figma configuration')
    }

    const client = new FigmaClient(config.accessToken)
    
    // Extract gradients from the Brand Guide page node
    const brandGuideNodeId = '113:2' // Update this to match your Brand Guide page ID
    const gradients = await extractGradientsFromNode(client, config.fileId, brandGuideNodeId)

    if (gradients.length === 0) {
      console.log(chalk.yellow('No gradients found in the specified node'))
      return
    }

    // Update brand constants with extracted gradients
    await updateBrandConstants(gradients)
    
    // Update the BrandGuidePage component
    await updateBrandGuidePage(gradients)

    console.log(chalk.green('\\n✅ Successfully extracted and applied Figma gradients!'))
    console.log(chalk.blue('\\nNext steps:'))
    console.log('1. Review the updated brand constants in lib/brand/constants.ts')
    console.log('2. Check the updated BrandGuidePage component')
    console.log('3. Test the Home2 page to see the new gradient')

  } catch (error) {
    console.error(chalk.red('Error:'), error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { extractGradientsFromNode, updateBrandConstants } 