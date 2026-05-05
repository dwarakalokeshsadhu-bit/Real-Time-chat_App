import { env } from './env.js';

const allowedOrigins = new Set(env.CLIENT_URLS);

function isLocalhost(originUrl) {
  return ['localhost', '127.0.0.1'].includes(originUrl.hostname);
}

function isVercelApp(originUrl) {
  return originUrl.hostname.endsWith('.vercel.app');
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    return allowedOrigins.has(origin) || isLocalhost(originUrl) || isVercelApp(originUrl);
  } catch (err) {
    return false;
  }
}

export function corsOrigin(origin, callback) {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin not allowed by CORS: ${origin}`));
}

export const corsOptions = {
  origin: corsOrigin,
  credentials: true
};
