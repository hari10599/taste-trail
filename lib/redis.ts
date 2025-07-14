import { createClient } from 'redis'

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

let isConnected = false

redis.on('error', (err) => {
  console.error('Redis Client Error:', err)
  isConnected = false
})

redis.on('ready', () => {
  console.log('Redis connected successfully')
  isConnected = true
})

// Connect to Redis
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err)
    isConnected = false
  })
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

export default redis