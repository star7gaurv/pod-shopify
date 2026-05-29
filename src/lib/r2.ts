/**
 * Cloudflare R2 storage via AWS S3-compatible SDK.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID        — e.g. 60821f434df3a45fb32e42dbd8df7bb4
 *   R2_ACCESS_KEY_ID     — R2 API token key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET_NAME       — e.g. print-on-demand
 *   R2_PUBLIC_URL        — public base URL for files (custom domain or r2.dev URL)
 *                          e.g. https://assets.pod.star7gaurav.in
 *                          OR   https://pub-XXXX.r2.dev  (if bucket public access is on)
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

export type ListedR2File = {
  key: string;
  lastModified: Date | null;
  size: number;
};

export type RetrievedR2File = {
  key: string;
  body: Uint8Array;
  contentType: string | null;
  cacheControl: string | null;
  size: number | null;
  lastModified: Date | null;
};

type UploadFileInput = {
  body: Buffer | Uint8Array | string;
  key: string;
  contentType?: string;
  cacheControl?: string;
  isBase64?: boolean;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "").replace(/\\/g, "/");
}

// Lazy-init so the app builds without R2 credentials in CI
let _r2Client: S3Client | null = null;
function getR2Client(): S3Client {
  if (!_r2Client) {
    const accountId = getRequiredEnv("R2_ACCOUNT_ID");
    _r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
      },
      forcePathStyle: true, // required for R2
    });
  }
  return _r2Client;
}

function getBucket(): string {
  return getRequiredEnv("R2_BUCKET_NAME");
}

function getPublicBase(): string {
  return (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
}

export function getPublicUrl(key: string): string {
  return `${getPublicBase()}/${normalizeKey(key)}`;
}

export function extractR2KeyFromPublicUrl(url: string): string | null {
  const base = getPublicBase();
  if (!base || !url.startsWith(`${base}/`)) return null;
  return normalizeKey(url.slice(base.length + 1));
}

export async function uploadFile({
  body,
  key,
  contentType,
  cacheControl,
  isBase64 = false,
}: UploadFileInput): Promise<string> {
  const normalizedKey = normalizeKey(key);
  const uploadBody =
    typeof body === "string"
      ? Buffer.from(body, isBase64 ? "base64" : "utf8")
      : body;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: normalizedKey,
      Body: uploadBody,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );

  return getPublicUrl(normalizedKey);
}

export async function deleteFile(key: string): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: normalizeKey(key) }),
  );
}

export async function copyFile(sourceKey: string, destinationKey: string): Promise<string> {
  const src = normalizeKey(sourceKey);
  const dst = normalizeKey(destinationKey);
  await getR2Client().send(
    new CopyObjectCommand({
      Bucket: getBucket(),
      CopySource: `${getBucket()}/${src}`,
      Key: dst,
    }),
  );
  return getPublicUrl(dst);
}

export async function moveFile(sourceKey: string, destinationKey: string): Promise<string> {
  const publicUrl = await copyFile(sourceKey, destinationKey);
  await deleteFile(sourceKey);
  return publicUrl;
}

export async function listFilesByPrefix(prefix: string): Promise<ListedR2File[]> {
  const normalizedPrefix = normalizeKey(prefix);
  const files: ListedR2File[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const entry of response.Contents ?? []) {
      if (!entry.Key) continue;
      files.push({
        key: normalizeKey(entry.Key),
        lastModified: entry.LastModified ?? null,
        size: entry.Size ?? 0,
      });
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return files;
}

export async function getFile(key: string): Promise<RetrievedR2File | null> {
  const normalizedKey = normalizeKey(key);
  const response = await getR2Client().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: normalizedKey }),
  );
  if (!response.Body) return null;
  return {
    key: normalizedKey,
    body: await bodyToUint8Array(response.Body),
    contentType: response.ContentType ?? null,
    cacheControl: response.CacheControl ?? null,
    size: typeof response.ContentLength === "number" ? response.ContentLength : null,
    lastModified: response.LastModified ?? null,
  };
}

async function bodyToUint8Array(body: unknown): Promise<Uint8Array> {
  if (
    body &&
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray === "function"
  ) {
    return new Uint8Array(
      await (body as { transformToByteArray: () => Promise<Uint8Array | number[]> }).transformToByteArray(),
    );
  }
  if (body instanceof Uint8Array) return body;
  const stream = body as Readable;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(Buffer.from(chunk as Buffer)));
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  return merged;
}
