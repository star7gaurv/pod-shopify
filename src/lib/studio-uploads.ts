import { randomUUID } from "node:crypto";
import { deleteCache, getStudioTempUploadCacheKey, STUDIO_TEMP_UPLOAD_TTL_SECONDS, setCache } from "@/lib/redis";
import { deleteFile, extractR2KeyFromPublicUrl, moveFile } from "@/lib/r2";
import type { UploadedAsset } from "@/store/studioStore";

const TEMP_UPLOAD_PREFIX = "temp-uploads/";
const PERMANENT_DESIGN_IMAGE_PREFIX = "design-images/";
const MAX_UPLOADED_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const SUPPORTED_UPLOADED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export type StudioTempUploadMetadata = {
  r2Key: string;
  publicUrl: string;
  proxyUrl: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type PromoteUploadedImagesInput = {
  canvasJson: object;
  uploadedAssets: UploadedAsset[];
};

type PromoteUploadedImagesResult = {
  canvasJson: object;
  uploadedAssets: UploadedAsset[];
};

export function isSupportedUploadedImageType(mimeType: string) {
  return SUPPORTED_UPLOADED_IMAGE_TYPES.has(mimeType.toLowerCase());
}

export function getMaxUploadedImageSizeBytes() {
  return MAX_UPLOADED_IMAGE_SIZE_BYTES;
}

export function isTempUploadedImageKey(r2Key: string | null | undefined) {
  return typeof r2Key === "string" && r2Key.startsWith(TEMP_UPLOAD_PREFIX);
}

export function isExternalImageUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function buildUploadedImageProxyUrl(r2Key: string) {
  return `/api/uploads/file?key=${encodeURIComponent(r2Key)}`;
}

export function buildTempUploadedImageKey(fileName: string, mimeType: string) {
  const extension = getUploadedImageExtension(fileName, mimeType);
  return `${TEMP_UPLOAD_PREFIX}image-${randomUUID().slice(0, 8)}-${Date.now()}.${extension}`;
}

export function buildPermanentDesignImageKey(
  fileName: string,
  mimeType: string,
) {
  const extension = getUploadedImageExtension(fileName, mimeType);
  return `${PERMANENT_DESIGN_IMAGE_PREFIX}image-${randomUUID().slice(0, 8)}-${Date.now()}.${extension}`;
}

export function getUploadedImageExtension(fileName: string, mimeType: string) {
  const fileExtensionMatch = fileName.toLowerCase().match(/\.([a-z0-9]+)$/i);
  if (fileExtensionMatch?.[1]) {
    const normalized = normalizeUploadedImageExtension(fileExtensionMatch[1]);
    if (normalized) {
      return normalized;
    }
  }

  const normalizedMimeType = mimeType.toLowerCase();
  if (normalizedMimeType === "image/png") {
    return "png";
  }
  if (normalizedMimeType === "image/jpeg") {
    return "jpg";
  }
  if (normalizedMimeType === "image/webp") {
    return "webp";
  }
  if (normalizedMimeType === "image/svg+xml") {
    return "svg";
  }

  return "png";
}

export function resolveUploadedImageR2Key(
  url: string,
  r2Key?: string | null,
) {
  if (r2Key) {
    return r2Key;
  }

  const proxyKey = extractR2KeyFromProxyUrl(url);
  if (proxyKey) {
    return proxyKey;
  }

  return extractR2KeyFromPublicUrl(url);
}

export async function setTempUploadedImageMetadata(
  metadata: StudioTempUploadMetadata,
) {
  return setCache(
    getStudioTempUploadCacheKey(metadata.r2Key),
    metadata,
    STUDIO_TEMP_UPLOAD_TTL_SECONDS,
  );
}

export async function deleteTempUploadedImageMetadata(r2Key: string) {
  return deleteCache(getStudioTempUploadCacheKey(r2Key));
}

export async function deleteTempUploadedImage(r2Key: string) {
  if (!isTempUploadedImageKey(r2Key)) {
    return false;
  }

  await deleteFile(r2Key);
  await deleteTempUploadedImageMetadata(r2Key);
  return true;
}

export async function promoteTempUploadedImages(
  input: PromoteUploadedImagesInput,
): Promise<PromoteUploadedImagesResult> {
  const referencedTempKeys = collectReferencedTempImageKeys(input.canvasJson);
  const replacements = new Map<
    string,
    {
      nextKey: string;
      nextUrl: string;
    }
  >();

  for (const asset of input.uploadedAssets) {
    const assetKey = resolveUploadedImageR2Key(asset.url, asset.r2Key);
    if (
      !assetKey ||
      !isTempUploadedImageKey(assetKey) ||
      !referencedTempKeys.has(assetKey)
    ) {
      continue;
    }

    const temporaryAssetKey = assetKey;

    if (replacements.has(temporaryAssetKey)) {
      continue;
    }

    const nextKey = buildPermanentDesignImageKey(asset.name, asset.type);
    await moveFile(temporaryAssetKey, nextKey);
    const nextUrl = buildUploadedImageProxyUrl(nextKey);
    await deleteTempUploadedImageMetadata(temporaryAssetKey);
    replacements.set(temporaryAssetKey, {
      nextKey,
      nextUrl,
    });
  }

  if (replacements.size === 0) {
    return input;
  }

  const uploadedAssets = input.uploadedAssets.map((asset) => {
    const currentKey = resolveUploadedImageR2Key(asset.url, asset.r2Key);
    const replacement = currentKey ? replacements.get(currentKey) : undefined;
    if (!replacement) {
      return asset;
    }

    return {
      ...asset,
      url: replacement.nextUrl,
      r2Key: replacement.nextKey,
    };
  });

  return {
    canvasJson: replaceImageSourcesInJson(input.canvasJson, replacements) as object,
    uploadedAssets,
  };
}

function replaceImageSourcesInJson(
  value: unknown,
  replacements: Map<string, { nextKey: string; nextUrl: string }>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => replaceImageSourcesInJson(entry, replacements));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const typed = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(typed)) {
    if (key === "src" && typeof entry === "string") {
      const r2Key = resolveUploadedImageR2Key(entry);
      const replacement = r2Key ? replacements.get(r2Key) : undefined;
      next[key] = replacement?.nextUrl ?? entry;
      continue;
    }

    if ((key === "r2Key" || key === "assetR2Key") && typeof entry === "string") {
      const replacement = replacements.get(entry);
      next[key] = replacement?.nextKey ?? entry;
      continue;
    }

    if (key === "assetUrl" && typeof entry === "string") {
      const r2Key = resolveUploadedImageR2Key(entry);
      const replacement = r2Key ? replacements.get(r2Key) : undefined;
      next[key] = replacement?.nextUrl ?? entry;
      continue;
    }

    next[key] = replaceImageSourcesInJson(entry, replacements);
  }

  return next;
}

function collectReferencedTempImageKeys(value: unknown) {
  const keys = new Set<string>();
  collectReferencedTempImageKeysInto(value, keys);
  return keys;
}

function collectReferencedTempImageKeysInto(value: unknown, keys: Set<string>) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectReferencedTempImageKeysInto(entry, keys);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const typed = value as Record<string, unknown>;
  const explicitKey =
    typeof typed.assetR2Key === "string"
      ? typed.assetR2Key
      : typeof typed.r2Key === "string"
        ? typed.r2Key
        : null;
  const resolvedKey =
    explicitKey ??
    (typeof typed.src === "string" ? resolveUploadedImageR2Key(typed.src) : null) ??
    (typeof typed.assetUrl === "string"
      ? resolveUploadedImageR2Key(typed.assetUrl)
      : null);

  if (resolvedKey && isTempUploadedImageKey(resolvedKey)) {
    keys.add(resolvedKey);
  }

  for (const entry of Object.values(typed)) {
    collectReferencedTempImageKeysInto(entry, keys);
  }
}

function extractR2KeyFromProxyUrl(url: string) {
  if (!url.includes("/api/uploads/file")) {
    return null;
  }

  try {
    const parsed = new URL(url, "https://studio.local");
    if (parsed.pathname !== "/api/uploads/file") {
      return null;
    }

    const key = parsed.searchParams.get("key");
    return key && key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

function normalizeUploadedImageExtension(extension: string) {
  const normalized = extension.replace(/^\./, "").toLowerCase();
  if (normalized === "jpeg") {
    return "jpg";
  }
  if (["jpg", "png", "webp", "svg"].includes(normalized)) {
    return normalized;
  }

  return null;
}
