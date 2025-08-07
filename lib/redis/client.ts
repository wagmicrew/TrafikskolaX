import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Connect to Redis
if (!redisClient.isOpen) {
  redisClient.connect().catch(console.error);
}

export default redisClient;

// Cache utility functions
export const cache = {
  async get(key: string) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  async del(key: string) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  async exists(key: string) {
    try {
      return await redisClient.exists(key) > 0;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  // Cache with automatic key generation
  async cacheWithKey(prefix: string, params: any, fn: () => Promise<any>, ttl: number = 3600) {
    const key = `${prefix}:${JSON.stringify(params)}`;
    
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }
    
    // If not in cache, execute function and cache result
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}; 