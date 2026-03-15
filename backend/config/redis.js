// backend/config/redis.js
// Uses Upstash Redis REST in production.
// Falls back to an in-memory Map for local dev without Upstash.

const { logger } = require('./database');

let redisClient;
let useMemoryFallback = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  logger.info('Redis: Connected to Upstash');
} else {
  useMemoryFallback = true;
  logger.warn('Redis: No Upstash credentials found — using in-memory fallback (not for production!)');

  // In-memory fallback store
  const store = new Map();
  const ttls = new Map();

  const cleanup = (key) => {
    const expiry = ttls.get(key);
    if (expiry && Date.now() > expiry) {
      store.delete(key);
      ttls.delete(key);
      return true;
    }
    return false;
  };

  redisClient = {
    async get(key) {
      cleanup(key);
      const val = store.get(key);
      return val !== undefined ? val : null;
    },
    async set(key, value, options) {
      store.set(key, value);
      if (options && options.ex) {
        ttls.set(key, Date.now() + options.ex * 1000);
      }
      return 'OK';
    },
    async del(key) {
      store.delete(key);
      ttls.delete(key);
      return 1;
    },
    async exists(key) {
      cleanup(key);
      return store.has(key) ? 1 : 0;
    },
    async incr(key) {
      cleanup(key);
      const current = parseInt(store.get(key) || '0', 10);
      const next = current + 1;
      store.set(key, String(next));
      return next;
    },
    async expire(key, seconds) {
      ttls.set(key, Date.now() + seconds * 1000);
      return 1;
    },
  };
}

// Wrapper functions with error handling
const redis = {
  async get(key) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      logger.error(`Redis GET error for key "${key}":`, err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds) {
    try {
      if (ttlSeconds) {
        return await redisClient.set(key, value, { ex: ttlSeconds });
      }
      return await redisClient.set(key, value);
    } catch (err) {
      logger.error(`Redis SET error for key "${key}":`, err.message);
      return null;
    }
  },

  async del(key) {
    try {
      return await redisClient.del(key);
    } catch (err) {
      logger.error(`Redis DEL error for key "${key}":`, err.message);
      return 0;
    }
  },

  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (err) {
      logger.error(`Redis EXISTS error for key "${key}":`, err.message);
      return 0;
    }
  },

  async incr(key) {
    try {
      return await redisClient.incr(key);
    } catch (err) {
      logger.error(`Redis INCR error for key "${key}":`, err.message);
      return 0;
    }
  },

  async expire(key, seconds) {
    try {
      return await redisClient.expire(key, seconds);
    } catch (err) {
      logger.error(`Redis EXPIRE error for key "${key}":`, err.message);
      return 0;
    }
  },

  get client() {
    return redisClient;
  },

  get isMemoryFallback() {
    return useMemoryFallback;
  },
};

module.exports = redis;
