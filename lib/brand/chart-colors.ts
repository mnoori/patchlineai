/**
 * Chart Color System
 * Standardized colors for data visualization using brand palette
 */

import { COLORS } from './constants'

export const CHART_COLORS = {
  // Primary chart colors
  primary: COLORS.primary.cyan,
  secondary: COLORS.primary.brightBlue,
  tertiary: COLORS.gradient.middle,
  quaternary: COLORS.primary.deepBlue,
  
  // Extended palette for multiple data series
  series: [
    COLORS.primary.cyan,         // #00E6E4
    COLORS.primary.brightBlue,    // #0068FF
    COLORS.gradient.middle,       // #0068FF
    COLORS.semantic.success,      // #10B981
    COLORS.semantic.warning,      // #F59E0B
    COLORS.primary.deepBlue,      // #002772
    COLORS.semantic.info,         // #3B82F6
    COLORS.semantic.error,        // #EF4444
  ],
  
  // Grid and axis colors
  grid: {
    line: COLORS.ui.border,       // #262626
    text: COLORS.ui.muted,        // #525252
  },
  
  // Tooltip styling
  tooltip: {
    background: COLORS.ui.card,   // #1A1A1B
    border: COLORS.ui.border,     // #262626
    text: COLORS.ui.foreground,   // #FAFAFA
  },
  
  // Specific chart type colors
  area: {
    fill: `${COLORS.primary.cyan}33`, // 20% opacity
    stroke: COLORS.primary.cyan,
  },
  
  bar: {
    primary: COLORS.primary.cyan,
    hover: COLORS.primary.brightBlue,
  },
  
  pie: {
    colors: [
      COLORS.primary.cyan,
      COLORS.primary.brightBlue,
      COLORS.gradient.middle,
      COLORS.semantic.success,
      COLORS.semantic.warning,
    ],
  },
  
  // Platform-specific colors (maintaining brand consistency)
  platforms: {
    spotify: COLORS.semantic.success,    // Using green for Spotify
    appleMusic: COLORS.semantic.error,   // Using red for Apple Music
    youtube: COLORS.semantic.error,      // Using red for YouTube
    soundcloud: COLORS.semantic.warning, // Using orange for SoundCloud
    other: COLORS.ui.muted,             // Using muted for others
  },
}

// Helper function to get a color from the series by index
export function getChartColor(index: number): string {
  return CHART_COLORS.series[index % CHART_COLORS.series.length]
}

// Helper function to create a gradient for charts
export function createChartGradient(startColor: string, endColor?: string): string {
  const end = endColor || `${startColor}33` // Default to 20% opacity of start color
  return `linear-gradient(180deg, ${startColor}, ${end})`
} 