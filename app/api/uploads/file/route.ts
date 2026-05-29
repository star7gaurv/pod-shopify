import { NextResponse } from "next/server";
import { getFile } from "@/lib/r2";

const ALLOWED_UPLOAD_PREFIXES = [
  "temp-uploads/",
  "design-images/",
  "order-files/",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();

  if (!key || !isAllowedUploadKey(key)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const file = await getFile(key);
    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return new NextResponse(Buffer.from(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType ?? "application/octet-stream",
        "Cache-Control": getUploadProxyCacheControl(file.key, file.cacheControl),
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/file failed", { key, error });
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}

function isAllowedUploadKey(key: string) {
  return ALLOWED_UPLOAD_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function getUploadProxyCacheControl(key: string, fallback: string | null) {
  if (fallback) {
    return fallback;
  }

  if (key.startsWith("temp-uploads/")) {
    return "public, max-age=3600";
  }

  if (key.startsWith("design-images/")) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=86400";
}
