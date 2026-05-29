import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/r2";
import {
  buildTempUploadedImageKey,
  buildUploadedImageProxyUrl,
  getMaxUploadedImageSizeBytes,
  isSupportedUploadedImageType,
  setTempUploadedImageMetadata,
} from "@/lib/studio-uploads";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedImage = formData.get("file");

    if (!(uploadedImage instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image file to upload." },
        { status: 400 },
      );
    }

    const mimeType = uploadedImage.type.trim().toLowerCase();
    if (!isSupportedUploadedImageType(mimeType)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, WEBP, and SVG image uploads are supported." },
        { status: 400 },
      );
    }

    if (uploadedImage.size > getMaxUploadedImageSizeBytes()) {
      return NextResponse.json(
        { error: "Uploaded images must be 10MB or smaller." },
        { status: 400 },
      );
    }

    const r2Key = buildTempUploadedImageKey(uploadedImage.name, mimeType);
    const publicUrl = await uploadFile({
      body: Buffer.from(await uploadedImage.arrayBuffer()),
      key: r2Key,
      contentType: mimeType,
      cacheControl: "public, max-age=3600",
    });

    const metadata = {
      r2Key,
      publicUrl,
      proxyUrl: buildUploadedImageProxyUrl(r2Key),
      originalFileName: uploadedImage.name,
      mimeType,
      size: uploadedImage.size,
      createdAt: new Date().toISOString(),
    };

    await setTempUploadedImageMetadata(metadata);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("POST /api/uploads/temp failed", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 },
    );
  }
}
