// Optional Redis client with in-memory fallback (no dependency required in dev)
// eslint-disable-next-line @typescript-eslint/no-var-requires
let createClient: any;
let redisAvailable = false;
try {
  // Avoid static bundler resolution when package isn't installed
  // eslint-disable-next-line no-eval
  const req = eval('require');
  ({ createClient } = req('redis'));
  redisAvailable = true;
} catch (_e) {
  console.warn('[redis] Module not found. Falling back to in-memory cache.');
}

// In-memory fallback store with TTL
type MemoryEntry = { value: any; expiresAt: number };
const memoryStore = new Map<string, MemoryEntry>();

function memoryGet(key: string) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: any, ttlSec: number) {
  const expiresAt = ttlSec > 0 ? Date.now() + ttlSec * 1000 : 0;
  memoryStore.set(key, { value, expiresAt });
}

const redisClient: any = redisAvailable
  ? createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
  : {
      isOpen: false,
      connect: async () => {},
      on: () => {},
      async get(_key: string) {
        const val = memoryGet(_key);
        return val != null ? JSON.stringify(val) : null;
      },
      async setEx(_key: string, ttl: number, value: string) {
        try {
          memorySet(_key, JSON.parse(value), ttl);
        } catch {
          memorySet(_key, value, ttl);
        }
      },
      async del(_key: string) {
        memoryStore.delete(_key);
      },
      async exists(_key: string) {
        return memoryGet(_key) != null ? 1 : 0;
      },
    };

if (redisAvailable) {
  redisClient.on('error', (err: any) => {
    console.error('Redis Client Error:', err);
  });
  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });
  if (!redisClient.isOpen) {
    redisClient.connect().catch(console.error);
  }
}

export default redisClient;

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
      if (redisAvailable) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        memorySet(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  async del(key: string) {
    try {
      if (redisAvailable) {
        await redisClient.del(key);
      } else {
        memoryStore.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  async exists(key: string) {
    try {
      if (redisAvailable) {
        return (await redisClient.exists(key)) > 0;
      } else {
        return memoryGet(key) != null;
      }
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  async cacheWithKey(prefix: string, params: any, fn: () => Promise<any>, ttl: number = 3600) {
    const key = `${prefix}:${JSON.stringify(params)}`;
    const cached = await this.get(key);
    if (cached) return cached;
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  },
};