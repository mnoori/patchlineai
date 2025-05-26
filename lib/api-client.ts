/**
 * API Client for PatchlineAI
 * Handles all API calls to both Next.js API routes and the Fastify backend server
 */

// Get the backend API URL from environment variables or use default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003'

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// ===== Backend API Server (Fastify) =====

/**
 * Fetch dashboard overview data from the backend API
 */
export async function fetchDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/overview`)
    return handleResponse(response)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return mock data as fallback when backend is not available
    return {
      revenue: 45231.89,
      listeners: 2350412,
      engagement: 3827,
      revenueGrowth: 20.1,
      listenerGrowth: 15.3,
      engagementGrowth: 18.7
    }
  }
}

// ===== Next.js API Routes =====

/**
 * Health check for AWS connectivity
 */
export async function checkHealth() {
  const response = await fetch('/api/health')
  return handleResponse(response)
}

/**
 * User Management
 */
export const userAPI = {
  async get(userId: string) {
    const response = await fetch(`/api/user?userId=${userId}`)
    return handleResponse(response)
  },

  async create(userData: any) {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  },

  async update(userData: any) {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return handleResponse(response)
  }
}

/**
 * Platform Embeds Management
 */
export const embedAPI = {
  async getAll(userId: string) {
    const response = await fetch(`/api/embed?userId=${userId}`)
    return handleResponse(response)
  },

  async create(embedData: any) {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedData)
    })
    return handleResponse(response)
  }
}

/**
 * Blog Posts Management
 */
export const blogAPI = {
  async getAll(userId: string, status?: string) {
    let url = `/api/blog?userId=${userId}`
    if (status) url += `&status=${status}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  async create(blogData: any) {
    const response = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData)
    })
    return handleResponse(response)
  }
}

/**
 * Content Generation
 */
export const contentAPI = {
  async getDrafts(userId: string, status?: string) {
    let url = `/api/content?userId=${userId}`
    if (status) url += `&status=${status}`
    const response = await fetch(url)
    return handleResponse(response)
  },

  async getDraft(id: string) {
    const response = await fetch(`/api/content?id=${id}`)
    return handleResponse(response)
  },

  async generate(contentData: any) {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    })
    return handleResponse(response)
  },

  async updateDraft(id: string, updateData: any) {
    const response = await fetch(`/api/content?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    return handleResponse(response)
  }
}

/**
 * Platform Connections Management
 */
export const platformsAPI = {
  async get(userId: string) {
    const response = await fetch(`/api/platforms?userId=${userId}`)
    return handleResponse(response)
  },

  async update(data: { userId: string; platform: string; connected: boolean }) {
    const response = await fetch('/api/platforms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(response)
  }
}

/**
 * Authentication
 */
export const authAPI = {
  async login(credentials: { username: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    return handleResponse(response)
  }
} 