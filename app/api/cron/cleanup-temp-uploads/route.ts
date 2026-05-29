import { NextResponse } from "next/server";
import { deleteTempUploadedImageMetadata, isTempUploadedImageKey } from "@/lib/studio-uploads";
import { deleteFile, listFilesByPrefix } from "@/lib/r2";

const TEMP_UPLOAD_MAX_AGE_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorizationHeader = request.headers.get("authorization")?.trim();
  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  const expectedAuthorization = cronSecret ? `Bearer ${cronSecret}` : null;

  if (
    !cronSecret ||
    (authorizationHeader !== expectedAuthorization && headerSecret !== cronSecret)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const cutoffTime = Date.now() - TEMP_UPLOAD_MAX_AGE_MS;
    const files = await listFilesByPrefix("temp-uploads/");
    const expiredFiles = files.filter((file) => {
      if (!isTempUploadedImageKey(file.key) || !file.lastModified) {
        return false;
      }

      return file.lastModified.getTime() < cutoffTime;
    });

    for (const file of expiredFiles) {
      await deleteFile(file.key);
      await deleteTempUploadedImageMetadata(file.key);
    }

    return NextResponse.json({
      deleted: expiredFiles.length,
    });
  } catch (error) {
    console.error("GET /api/cron/cleanup-temp-uploads failed", error);
    return NextResponse.json(
      { error: "Failed to clean temporary uploaded images." },
      { status: 500 },
    );
  }
}
