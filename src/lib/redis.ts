import { Redis } from "@upstash/redis";

const STUDIO_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const STUDIO_TEMP_UPLOAD_TTL_SECONDS = 60 * 60;

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

const redis = getRedisClient();

export const STUDIO_PRODUCTS_CACHE_KEY = "studio:products";

export function getStudioTemplatesByProductCacheKey(productSlug: string) {
  return `studio:templates:product:${productSlug}`;
}

export function getStudioTempUploadCacheKey(r2Key: string) {
  return `studio:temp-upload:${r2Key}`;
}

export async function getCache<T>(key: string) {
  if (!redis) {
    return null;
  }

  try {
    return (await redis.get<T>(key)) ?? null;
  } catch (error) {
    console.error("Redis cache read failed.", { key, error });
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = STUDIO_CACHE_TTL_SECONDS,
) {
  if (!redis) {
    return false;
  }

  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error("Redis cache write failed.", { key, error });
    return false;
  }
}

export async function deleteCache(key: string) {
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis cache delete failed.", { key, error });
    return false;
  }
}

export function isRedisAvailable() {
  return Boolean(redis);
}
