/**
 * Content Persistence Service
 * Handles persistent storage of form state and generated images
 * Uses IndexedDB for large data (images) and sessionStorage for lightweight state
 */

interface PersistedFormState {
  platform?: string
  topic?: string
  postTone?: string
  targetAudience?: string
  includeHashtags?: boolean
  includeEmojis?: boolean
  customPrompt?: string
  timestamp?: number
}

interface PersistedImages {
  generated: string[]
  selected: number | null
  timestamp: number
}

class ContentPersistenceService {
  private static instance: ContentPersistenceService
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'patchline-content'
  private readonly DB_VERSION = 1
  private readonly IMAGE_STORE = 'images'
  private readonly SESSION_PREFIX = 'patchline-content-'

  private constructor() {
    this.initDB()
  }

  static getInstance(): ContentPersistenceService {
    if (!ContentPersistenceService.instance) {
      ContentPersistenceService.instance = new ContentPersistenceService()
    }
    return ContentPersistenceService.instance
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB')
      }

      request.onsuccess = () => {
        this.db = request.result
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create image store if it doesn't exist
        if (!db.objectStoreNames.contains(this.IMAGE_STORE)) {
          const store = db.createObjectStore(this.IMAGE_STORE, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('contentType', 'contentType', { unique: false })
        }
      }
    } catch (error) {
      console.error('IndexedDB initialization failed:', error)
    }
  }

  // Save form state to sessionStorage
  async saveFormState(contentType: string, state: PersistedFormState): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const key = `${this.SESSION_PREFIX}${contentType}-form`
      const data = {
        ...state,
        timestamp: Date.now()
      }
      sessionStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save form state:', error)
    }
  }

  // Load form state from sessionStorage
  async loadFormState(contentType: string): Promise<PersistedFormState | null> {
    if (typeof window === 'undefined') return null

    try {
      const key = `${this.SESSION_PREFIX}${contentType}-form`
      const data = sessionStorage.getItem(key)
      
      if (!data) return null
      
      const parsed = JSON.parse(data)
      
      // Check if data is still fresh (within 1 hour)
      if (parsed.timestamp && Date.now() - parsed.timestamp > 3600000) {
        sessionStorage.removeItem(key)
        return null
      }
      
      return parsed
    } catch (error) {
      console.warn('Failed to load form state:', error)
      return null
    }
  }

  // Save images to IndexedDB
  async saveImages(contentType: string, images: string[], selectedIndex: number | null): Promise<void> {
    if (!this.db || typeof window === 'undefined') return

    try {
      const transaction = this.db.transaction([this.IMAGE_STORE], 'readwrite')
      const store = transaction.objectStore(this.IMAGE_STORE)
      
      const data = {
        id: `${contentType}-images`,
        contentType,
        images,
        selectedIndex,
        timestamp: Date.now()
      }
      
      await store.put(data)
    } catch (error) {
      console.error('Failed to save images:', error)
      // Fallback: try to save at least the selected image URL in sessionStorage
      if (selectedIndex !== null && images[selectedIndex]) {
        try {
          const key = `${this.SESSION_PREFIX}${contentType}-selected-image`
          // Only save S3/CDN URLs, not base64
          if (!images[selectedIndex].startsWith('data:')) {
            sessionStorage.setItem(key, images[selectedIndex])
          }
        } catch (e) {
          // Ignore quota errors
        }
      }
    }
  }

  // Load images from IndexedDB
  async loadImages(contentType: string): Promise<PersistedImages | null> {
    if (!this.db || typeof window === 'undefined') return null

    try {
      const transaction = this.db.transaction([this.IMAGE_STORE], 'readonly')
      const store = transaction.objectStore(this.IMAGE_STORE)
      const request = store.get(`${contentType}-images`)
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result
          if (!result) {
            // Try fallback from sessionStorage
            const key = `${this.SESSION_PREFIX}${contentType}-selected-image`
            const selectedImage = sessionStorage.getItem(key)
            if (selectedImage) {
              resolve({
                generated: [selectedImage],
                selected: 0,
                timestamp: Date.now()
              })
            } else {
              resolve(null)
            }
            return
          }
          
          // Check if data is still fresh (within 1 hour)
          if (Date.now() - result.timestamp > 3600000) {
            this.clearImages(contentType)
            resolve(null)
            return
          }
          
          resolve({
            generated: result.images,
            selected: result.selectedIndex,
            timestamp: result.timestamp
          })
        }
        
        request.onerror = () => {
          resolve(null)
        }
      })
    } catch (error) {
      console.error('Failed to load images:', error)
      return null
    }
  }

  // Clear specific content type data
  async clearContent(contentType: string): Promise<void> {
    await this.clearFormState(contentType)
    await this.clearImages(contentType)
  }

  // Clear form state
  private async clearFormState(contentType: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const key = `${this.SESSION_PREFIX}${contentType}-form`
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear form state:', error)
    }
  }

  // Clear images
  private async clearImages(contentType: string): Promise<void> {
    if (!this.db || typeof window === 'undefined') return

    try {
      const transaction = this.db.transaction([this.IMAGE_STORE], 'readwrite')
      const store = transaction.objectStore(this.IMAGE_STORE)
      await store.delete(`${contentType}-images`)
      
      // Also clear fallback
      const key = `${this.SESSION_PREFIX}${contentType}-selected-image`
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to clear images:', error)
    }
  }

  // Clear old data (cleanup)
  async clearOldData(maxAgeMs: number = 86400000): Promise<void> { // Default 24 hours
    if (!this.db || typeof window === 'undefined') return

    try {
      const transaction = this.db.transaction([this.IMAGE_STORE], 'readwrite')
      const store = transaction.objectStore(this.IMAGE_STORE)
      const index = store.index('timestamp')
      const cutoffTime = Date.now() - maxAgeMs
      
      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }
    } catch (error) {
      console.error('Failed to clear old data:', error)
    }
  }
}

export const contentPersistence = ContentPersistenceService.getInstance() 