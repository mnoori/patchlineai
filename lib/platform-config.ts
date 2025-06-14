/**
 * Unified Platform Configuration
 * 
 * This file serves as the single source of truth for all platform integrations
 * across the application. All components should import platform data from here.
 */

export interface PlatformConfig {
  id: string
  name: string
  displayName: string
  description: string
  icon: string // High-quality SVG icon
  color: string // Brand color
  category: 'music' | 'social' | 'storage' | 'analytics' | 'distribution'
  oauthConfig?: {
    authUrl: string
    tokenUrl: string
    scopes: string[]
    clientId?: string // From environment variables
  }
  features: string[]
  available: boolean
  comingSoon?: boolean
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    displayName: 'Spotify for Artists',
    description: 'Connect your Spotify for Artists account to track streaming analytics and manage your artist profile',
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    color: '#1DB954',
    category: 'music',
    oauthConfig: {
      authUrl: 'https://accounts.spotify.com/authorize',
      tokenUrl: 'https://accounts.spotify.com/api/token',
      scopes: [
        'user-read-private',
        'user-read-email',
        'user-library-read',
        'playlist-read-private',
        'user-top-read'
      ]
    },
    features: [
      'Streaming analytics',
      'Artist profile management',
      'Playlist tracking',
      'Fan insights'
    ],
    available: true
  },
  
  google: {
    id: 'google',
    name: 'Google',
    displayName: 'Google Workspace',
    description: 'Connect your Google account to access Drive, Calendar, and other Google services',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>`,
    color: '#4285F4',
    category: 'storage',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    },
    features: [
      'Google Drive access',
      'Photo storage',
      'Document management',
      'Calendar integration'
    ],
    available: true
  },

  googledrive: {
    id: 'googledrive',
    name: 'Google Drive',
    displayName: 'Google Drive',
    description: 'Access and manage your photos and files stored in Google Drive',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.71 3.5L1.15 15l4.58 7.5h13.12l4.58-7.5L16.87 3.5z" fill="#0066DA"/>
      <path d="M8.44 15l-4.58 7.5h13.12l4.58-7.5z" fill="#00AC47"/>
      <path d="M16.87 3.5H7.71L12.29 12z" fill="#FFBA00"/>
    </svg>`,
    color: '#0066DA',
    category: 'storage',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ]
    },
    features: [
      'Photo access',
      'File management',
      'Folder organization',
      'Secure storage'
    ],
    available: true
  },

  gmail: {
    id: 'gmail',
    name: 'Gmail',
    displayName: 'Gmail',
    description: 'Connect your Gmail account for email management and communication',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
    </svg>`,
    color: '#EA4335',
    category: 'social',
    oauthConfig: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send'
      ]
    },
    features: [
      'Email management',
      'Automated responses',
      'Contact organization',
      'Communication tracking'
    ],
    available: true
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    displayName: 'Instagram',
    description: 'Connect your Instagram account to manage posts and track engagement',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stop-color="#fdf497"/>
        <stop offset="5%" stop-color="#fdf497"/>
        <stop offset="45%" stop-color="#fd5949"/>
        <stop offset="60%" stop-color="#d6249f"/>
        <stop offset="90%" stop-color="#285AEB"/>
      </radialGradient>
      <path fill="url(#ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
    </svg>`,
    color: '#E4405F',
    category: 'social',
    features: [
      'Post management',
      'Story creation',
      'Engagement tracking',
      'Audience insights'
    ],
    available: true
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube',
    description: 'Connect your YouTube channel to manage videos and track performance',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
    </svg>`,
    color: '#FF0000',
    category: 'social',
    features: [
      'Video management',
      'Analytics tracking',
      'Comment moderation',
      'Channel optimization'
    ],
    available: true
  },

  soundcloud: {
    id: 'soundcloud',
    name: 'SoundCloud',
    displayName: 'SoundCloud',
    description: 'Connect your SoundCloud account to manage tracks and engage with fans',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.01-.057-.05-.1-.1-.1zm.73-.191c-.051 0-.092.04-.101.098l-.27 2.346.27 2.306c.008.056.049.098.1.098.05 0 .092-.04.1-.098l.306-2.306-.306-2.346c-.008-.058-.05-.098-.1-.098zm.855-.252c-.051 0-.093.04-.101.098l-.306 2.598.306 2.554c.008.057.05.098.101.098.05 0 .092-.04.1-.098l.346-2.554-.346-2.598c-.008-.057-.05-.098-.1-.098zm.923-.27c-.05 0-.092.04-.101.098l-.343 2.87.343 2.823c.008.056.05.098.1.098.051 0 .092-.04.1-.098l.392-2.823-.392-2.87c-.008-.057-.049-.098-.1-.098zm.994.002c-.05 0-.092.04-.101.098l-.38 3.138.38 3.091c.008.057.05.098.101.098.051 0 .093-.04.101-.098l.43-3.091-.43-3.138c-.008-.057-.05-.098-.101-.098zm1.006-.014c-.051 0-.093.04-.101.098l-.417 3.422.417 3.375c.008.057.05.098.101.098.05 0 .092-.04.1-.098l.467-3.375-.467-3.422c-.008-.057-.05-.098-.1-.098zm1.004-.019c-.05 0-.093.04-.101.098l-.453 3.726.453 3.678c.008.057.05.098.101.098.05 0 .092-.04.1-.098l.503-3.678-.503-3.726c-.008-.057-.05-.098-.1-.098zm1.073.008c-.058 0-.101.04-.11.098l-.49 4.02.49 3.972c.009.057.052.098.11.098.057 0 .101-.04.11-.098l.54-3.972-.54-4.02c-.009-.057-.053-.098-.11-.098zm1.074-.014c-.058 0-.101.04-.11.098l-.526 4.34.526 4.29c.009.058.052.098.11.098.058 0 .102-.04.11-.098l.583-4.29-.583-4.34c-.008-.057-.052-.098-.11-.098zm1.198.015c-.068 0-.125.04-.135.098l-.564 4.68.564 4.632c.01.057.067.098.135.098.067 0 .125-.04.134-.098l.622-4.632-.622-4.68c-.009-.057-.067-.098-.134-.098zm1.188-.022c-.067 0-.125.04-.134.098l-.602 5.03.602 4.982c.009.057.067.098.134.098.068 0 .125-.04.135-.098l.66-4.982-.66-5.03c-.01-.057-.067-.098-.135-.098zm1.276.008c-.077 0-.143.04-.152.098l-.639 5.382.639 5.334c.009.058.075.098.152.098.078 0 .144-.04.153-.098l.699-5.334-.699-5.382c-.009-.057-.075-.098-.153-.098zm1.237-.053c-.077 0-.143.04-.152.098l-.676 5.783.676 5.735c.009.058.075.098.152.098.078 0 .144-.04.153-.098l.736-5.735-.736-5.783c-.009-.057-.075-.098-.153-.098zm1.361.023c-.087 0-.161.04-.17.098l-.713 6.137.713 6.087c.009.058.083.098.17.098.086 0 .16-.04.17-.098l.77-6.087-.77-6.137c-.01-.057-.084-.098-.17-.098zm1.24-.061c-.087 0-.161.04-.17.098l-.75 6.544.75 6.494c.009.058.083.098.17.098.087 0 .161-.04.17-.098l.807-6.494-.807-6.544c-.009-.057-.083-.098-.17-.098zm1.387.015c-.096 0-.179.04-.188.098l-.787 6.948.787 6.898c.009.058.092.098.188.098.096 0 .179-.04.188-.098l.844-6.898-.844-6.948c-.009-.057-.092-.098-.188-.098zm1.36-.045c-.096 0-.179.04-.188.098l-.824 7.394.824 7.344c.009.058.092.098.188.098.096 0 .179-.04.188-.098l.881-7.344-.881-7.394c-.009-.057-.092-.098-.188-.098z" fill="#FF5500"/>
    </svg>`,
    color: '#FF5500',
    category: 'music',
    features: [
      'Track management',
      'Fan engagement',
      'Comment tracking',
      'Play statistics'
    ],
    available: true
  },

  applemusic: {
    id: 'applemusic',
    name: 'Apple Music',
    displayName: 'Apple Music for Artists',
    description: 'Connect your Apple Music for Artists account to track performance',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.078 1.596-.31 2.3-.81a5.384 5.384 0 001.942-2.179c.482-.99.626-2.04.705-3.103.006-.07.01-.14.017-.21V6.124zm-3.954 11.47a.955.955 0 01-.94.94h-5.45a.955.955 0 01-.94-.94v-8.37c0-.52.42-.94.94-.94h5.45c.52 0 .94.42.94.94v8.37z" fill="#FA243C"/>
    </svg>`,
    color: '#FA243C',
    category: 'music',
    features: [
      'Streaming analytics',
      'Shazam data',
      'Playlist placement',
      'Global insights'
    ],
    available: true,
    comingSoon: true
  },

  twitter: {
    id: 'twitter',
    name: 'Twitter',
    displayName: 'Twitter/X',
    description: 'Connect your Twitter account to share updates and engage with fans',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
    </svg>`,
    color: '#000000',
    category: 'social',
    features: [
      'Tweet scheduling',
      'Engagement tracking',
      'Follower analytics',
      'Trend monitoring'
    ],
    available: true,
    comingSoon: true
  },

  facebook: {
    id: 'facebook',
    name: 'Facebook',
    displayName: 'Facebook',
    description: 'Connect your Facebook page to manage posts and track engagement',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>`,
    color: '#1877F2',
    category: 'social',
    features: [
      'Page management',
      'Post scheduling',
      'Audience insights',
      'Ad integration'
    ],
    available: true,
    comingSoon: true
  },

  distrokid: {
    id: 'distrokid',
    name: 'DistroKid',
    displayName: 'DistroKid',
    description: 'Connect your DistroKid account to manage music distribution',
    icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#00D4AA"/>
      <path d="M8 8h8v8H8z" fill="white"/>
    </svg>`,
    color: '#00D4AA',
    category: 'distribution',
    features: [
      'Release management',
      'Earnings tracking',
      'Store status',
      'Distribution analytics'
    ],
    available: true,
    comingSoon: true
  }
}

// Helper functions
export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS[platformId]
}

export function getPlatformsByCategory(category: PlatformConfig['category']): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(platform => platform.category === category)
}

export function getAvailablePlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS).filter(platform => platform.available && !platform.comingSoon)
}

export function getAllPlatforms(): PlatformConfig[] {
  return Object.values(PLATFORM_CONFIGS)
}