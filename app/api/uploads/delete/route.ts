import { NextResponse } from "next/server";
import { deleteTempUploadedImage, isTempUploadedImageKey } from "@/lib/studio-uploads";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { r2Key?: string }
      | null;
    const r2Key = body?.r2Key?.trim();

    if (!r2Key) {
      return NextResponse.json(
        { error: "An uploaded image key is required." },
        { status: 400 },
      );
    }

    if (!isTempUploadedImageKey(r2Key)) {
      return NextResponse.json(
        { error: "Only temporary uploaded images can be deleted here." },
        { status: 400 },
      );
    }

    await deleteTempUploadedImage(r2Key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/uploads/delete failed", error);
    return NextResponse.json(
      { error: "Failed to delete uploaded image." },
      { status: 500 },
    );
  }
}
