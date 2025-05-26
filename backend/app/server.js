import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({
  logger: true
})

// Register CORS
await fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
  credentials: true
})

// Mock data for development
const mockDashboardData = {
  revenue: 45231.89,
  listeners: 2350412,
  engagement: 3827,
  revenueGrowth: 20.1,
  listenerGrowth: 15.3,
  engagementGrowth: 18.7
}

const mockUsers = {
  'user123': {
    id: 'user123',
    fullName: 'Alex Johnson',
    email: 'alex@example.com',
    company: 'Cosmic Records',
    website: 'https://cosmicrecords.com',
    bio: 'Independent music producer and label owner'
  }
}

const mockPlatforms = {
  'user123': {
    spotify: true,
    apple: false,
    youtube: true,
    soundcloud: true,
    instagram: true,
    twitter: false,
    facebook: false,
    gmail: true,
    calendar: false
  }
}

const mockEmbeds = {
  'user123': [
    {
      id: 'embed1',
      title: 'Neon City - Official Music Video',
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example',
      createdAt: '2024-01-15'
    },
    {
      id: 'embed2',
      title: 'Midnight Dreams - Spotify',
      platform: 'spotify',
      url: 'https://open.spotify.com/track/example',
      createdAt: '2024-01-10'
    }
  ]
}

// Routes
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.get('/dashboard/overview', async (request, reply) => {
  return mockDashboardData
})

// User routes
fastify.get('/user/:userId', async (request, reply) => {
  const { userId } = request.params
  const user = mockUsers[userId]
  if (!user) {
    reply.code(404)
    return { error: 'User not found' }
  }
  return user
})

fastify.post('/user', async (request, reply) => {
  const userData = request.body
  const userId = userData.userId || 'user123'
  mockUsers[userId] = { ...mockUsers[userId], ...userData }
  return mockUsers[userId]
})

fastify.put('/user', async (request, reply) => {
  const userData = request.body
  const userId = userData.userId || 'user123'
  mockUsers[userId] = { ...mockUsers[userId], ...userData }
  return mockUsers[userId]
})

// Platform routes
fastify.get('/platforms/:userId', async (request, reply) => {
  const { userId } = request.params
  return { platforms: mockPlatforms[userId] || {} }
})

fastify.post('/platforms', async (request, reply) => {
  const { userId, platform, connected } = request.body
  if (!mockPlatforms[userId]) {
    mockPlatforms[userId] = {}
  }
  mockPlatforms[userId][platform] = connected
  return { success: true, platforms: mockPlatforms[userId] }
})

// Embed routes
fastify.get('/embeds/:userId', async (request, reply) => {
  const { userId } = request.params
  return { embeds: mockEmbeds[userId] || [] }
})

fastify.post('/embed', async (request, reply) => {
  const embedData = request.body
  const userId = embedData.userId || 'user123'
  if (!mockEmbeds[userId]) {
    mockEmbeds[userId] = []
  }
  const newEmbed = {
    id: `embed${Date.now()}`,
    ...embedData,
    createdAt: new Date().toISOString()
  }
  mockEmbeds[userId].push(newEmbed)
  return newEmbed
})

// Content routes
fastify.get('/content/:userId', async (request, reply) => {
  const { userId } = request.params
  return { 
    drafts: [
      {
        id: 'draft1',
        title: 'New Track Announcement',
        content: 'Excited to share our latest track...',
        status: 'draft',
        createdAt: '2024-01-20'
      }
    ]
  }
})

fastify.post('/content', async (request, reply) => {
  const contentData = request.body
  return {
    id: `content${Date.now()}`,
    ...contentData,
    status: 'generated',
    createdAt: new Date().toISOString()
  }
})

// Blog routes
fastify.get('/blog/:userId', async (request, reply) => {
  const { userId } = request.params
  return {
    posts: [
      {
        id: 'post1',
        title: 'Behind the Music: Creating Neon City',
        content: 'The story behind our latest hit...',
        status: 'published',
        publishedAt: '2024-01-18'
      }
    ]
  }
})

fastify.post('/blog', async (request, reply) => {
  const blogData = request.body
  return {
    id: `blog${Date.now()}`,
    ...blogData,
    status: 'draft',
    createdAt: new Date().toISOString()
  }
})

// Authentication routes
fastify.post('/auth/login', async (request, reply) => {
  const { username, password } = request.body
  
  // Test credentials - replace with your desired username/password
  const validCredentials = {
    'mehdi': 'password123',
    'admin': 'admin123',
    'test@patchline.ai': 'test123'
  }
  
  // Check if credentials are valid
  if (validCredentials[username] && validCredentials[username] === password) {
    return {
      token: 'patchline-auth-token-' + Date.now(),
      user: {
        id: 'user123',
        fullName: 'Mehdi (Test User)',
        email: username.includes('@') ? username : `${username}@patchline.ai`,
        company: 'Patchline AI',
        website: 'https://patchline.ai'
      }
    }
  }
  
  reply.code(401)
  return { error: 'Invalid username or password' }
})

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3003
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 Backend server running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start() 