// Simple in-memory cache for API responses during local development
// This will prevent 20-40 second DynamoDB calls

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  if (process.env.NODE_ENV === 'production') return null;
  
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  console.log(`[CACHE HIT] ${key}`);
  return cached.data as T;
}

export function setCached(key: string, data: any): void {
  if (process.env.NODE_ENV === 'production') return;
  
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`[CACHE SET] ${key}`);
}

export function clearCache(): void {
  cache.clear();
  console.log('[CACHE CLEARED]');
} 