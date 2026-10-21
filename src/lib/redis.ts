import Redis from 'ioredis';

const redisClientSingleton = () => {
  const connectionString = process.env.REDIS_URL;
  if (!connectionString) {
    console.warn('⚠️ REDIS_URL is not configured. Redis caching will be bypassed.');
    return null;
  }

  try {
    const client = new Redis(connectionString, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });

    client.on('connect', () => console.log('🚀 [Redis] Connected to Redis successfully'));
    client.on('error', (err) => console.error('❌ [Redis] Connection error:', err));

    return client;
  } catch (err) {
    console.error('❌ [Redis] Failed to initialize Redis client:', err);
    return null;
  }
};

declare global {
  var redisGlobal: ReturnType<typeof redisClientSingleton> | undefined;
}

export const redis = globalThis.redisGlobal ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.redisGlobal = redis;
