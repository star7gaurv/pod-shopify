// Redis caching is optional. Without Upstash credentials configured,
// all cache operations are no-ops and the app works fine without caching.

export const STUDIO_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
export const STUDIO_TEMP_UPLOAD_TTL_SECONDS = 60 * 60;
export const STUDIO_PRODUCTS_CACHE_KEY = "studio:products";

export function getStudioTemplatesByProductCacheKey(productSlug: string) {
  return `studio:templates:product:${productSlug}`;
}

export function getStudioTempUploadCacheKey(r2Key: string) {
  return `studio:temp-upload:${r2Key}`;
}

export async function getCache<T>(_key: string): Promise<T | null> {
  return null;
}

export async function setCache<T>(_key: string, _value: T, _ttl?: number): Promise<boolean> {
  return false;
}

export async function deleteCache(_key: string): Promise<boolean> {
  return false;
}

export function isRedisAvailable(): boolean {
  return false;
}
