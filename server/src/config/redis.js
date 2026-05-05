import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({ url: env.REDIS_URL });
redisClient.on('error', err => console.warn('Redis warning:', err.message));

export async function connectRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}
