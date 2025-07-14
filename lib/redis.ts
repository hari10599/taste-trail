import { createClient } from 'redis'

// Only initialize Redis in runtime, not during build
const isBuilding = process.env.NODE_ENV === 'production' && !process.env.REDIS_URL

let redis: ReturnType<typeof createClient> | null = null
let isConnected = false

if (!isBuilding) {
  try {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    redis.on('error', (err) => {
      // Silence Redis errors during build/development
      if (process.env.NODE_ENV === 'production') {
        console.error('Redis Client Error:', err)
      }
      isConnected = false
    })

    redis.on('ready', () => {
      console.log('Redis connected successfully')
      isConnected = true
    })

    // Connect to Redis only if not building
    if (!redis.isOpen && process.env.REDIS_URL) {
      redis.connect().catch((err) => {
        if (process.env.NODE_ENV === 'production') {
          console.error('Failed to connect to Redis:', err)
        }
        isConnected = false
      })
    }
  } catch (error) {
    console.log('Redis initialization skipped')
  }
}

// Cache utilities with graceful fallback
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!isConnected) return null
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!isConnected) return
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await redis.setEx(key, ttl, serialized)
      } else {
        await redis.set(key, serialized)
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  },
  
  async del(key: string): Promise<void> {
    if (!isConnected) return
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  },
  
  async invalidatePattern(pattern: string): Promise<void> {
    if (!isConnected) return
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(keys)
      }
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error)
    }
  },
}

export default redis as ReturnType<typeof createClient>