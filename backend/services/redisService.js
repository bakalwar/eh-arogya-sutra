const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let client = null;

async function connectRedis() {
  if (client) return client;
  
  client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 2) return new Error('Redis connection failed');
        return 1000;
      }
    }
  });

  client.on('error', (err) => console.warn('[redis] connection error:', err.message));
  client.on('connect', () => console.log('[redis] connected to server'));

  try {
    await client.connect();
  } catch (err) {
    console.warn('[redis] failed to connect:', err.message);
    client = null;
  }
  
  return client;
}

async function getCache(key) {
  if (!client) await connectRedis();
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn(`[redis] get error for ${key}:`, err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 3600) {
  if (!client) await connectRedis();
  if (!client) return false;
  try {
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
    return true;
  } catch (err) {
    console.warn(`[redis] set error for ${key}:`, err.message);
    return false;
  }
}

async function delCache(key) {
  if (!client) await connectRedis();
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.warn(`[redis] del error for ${key}:`, err.message);
    return false;
  }
}

module.exports = {
  connectRedis,
  getCache,
  setCache,
  delCache,
  client
};
