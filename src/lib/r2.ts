import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

type UploadFileInput = {
  body: Buffer | Uint8Array | string;
  key: string;
  contentType?: string;
  cacheControl?: string;
  isBase64?: boolean;
};

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

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "").replace(/\\/g, "/");
}

function normalizePublicBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

const s3Client = new S3Client({
  region: getRequiredEnv("AWS_REGION"),
  credentials: {
    accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
  },
});

const S3_PUBLIC_BASE = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

export function getPublicUrl(key: string) {
  return `${S3_PUBLIC_BASE}/${normalizeKey(key)}`;
}

export function extractR2KeyFromPublicUrl(url: string) {
  if (!url.startsWith(`${S3_PUBLIC_BASE}/`)) {
    return null;
  }
  return normalizeKey(url.slice(S3_PUBLIC_BASE.length + 1));
}

export async function uploadFile({
  body,
  key,
  contentType,
  cacheControl,
  isBase64 = false,
}: UploadFileInput) {
  const normalizedKey = normalizeKey(key);
  const uploadBody =
    typeof body === "string"
      ? Buffer.from(body, isBase64 ? "base64" : "utf8")
      : body;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: getRequiredEnv("AWS_S3_BUCKET"),
      Key: normalizedKey,
      Body: uploadBody,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );

  return getPublicUrl(normalizedKey);
}

export async function deleteFile(key: string) {
  const normalizedKey = normalizeKey(key);

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: getRequiredEnv("AWS_S3_BUCKET"),
      Key: normalizedKey,
    }),
  );
}

export async function copyFile(sourceKey: string, destinationKey: string) {
  const normalizedSourceKey = normalizeKey(sourceKey);
  const normalizedDestinationKey = normalizeKey(destinationKey);

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: getRequiredEnv("AWS_S3_BUCKET"),
      CopySource: `${getRequiredEnv("AWS_S3_BUCKET")}/${normalizedSourceKey}`,
      Key: normalizedDestinationKey,
    }),
  );

  return getPublicUrl(normalizedDestinationKey);
}

export async function moveFile(sourceKey: string, destinationKey: string) {
  const publicUrl = await copyFile(sourceKey, destinationKey);
  await deleteFile(sourceKey);
  return publicUrl;
}

export async function listFilesByPrefix(prefix: string) {
  const normalizedPrefix = normalizeKey(prefix);
  const files: ListedR2File[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: getRequiredEnv("AWS_S3_BUCKET"),
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const entry of response.Contents ?? []) {
      if (!entry.Key) {
        continue;
      }

      files.push({
        key: normalizeKey(entry.Key),
        lastModified: entry.LastModified ?? null,
        size: entry.Size ?? 0,
      });
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return files;
}

export async function getFile(key: string): Promise<RetrievedR2File | null> {
  const normalizedKey = normalizeKey(key);
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: getRequiredEnv("AWS_S3_BUCKET"),
      Key: normalizedKey,
    }),
  );

  if (!response.Body) {
    return null;
  }

  return {
    key: normalizedKey,
    body: await bodyToUint8Array(response.Body),
    contentType: response.ContentType ?? null,
    cacheControl: response.CacheControl ?? null,
    size:
      typeof response.ContentLength === "number" ? response.ContentLength : null,
    lastModified: response.LastModified ?? null,
  };
}

async function bodyToUint8Array(body: unknown): Promise<Uint8Array> {
  if (
    body &&
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray ===
      "function"
  ) {
    return new Uint8Array(
      await (
        body as {
          transformToByteArray: () => Promise<Uint8Array | number[]>;
        }
      ).transformToByteArray(),
    );
  }

  if (body instanceof Uint8Array) {
    return body;
  }

  const stream = body as Readable;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(
      chunk instanceof Uint8Array ? chunk : new Uint8Array(Buffer.from(chunk)),
    );
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}
